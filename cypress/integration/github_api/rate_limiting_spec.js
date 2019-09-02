describe('rate limiting', () => {
    it('unauthorized should have limit of 60 requests', () => {
        cy.request('/meta').then(resp => {
            expect(parseInt(resp.headers['x-ratelimit-limit'])).to.equal(60)
            expect(parseInt(resp.headers['x-ratelimit-remaining'])).to.below(60)

            const todayUTCSeconds = Math.floor(Date.now() / 1000)
            expect(resp.headers['x-ratelimit-reset']).to.be.above(todayUTCSeconds)
        })
    })

    it('authorized should have limit of 5000 requests', () => {
        return cy.request({
            method: 'GET',
            url: '/meta',
            headers: {
                // Being authorized ups the amount of rate limiting
                Authorization: `token ${Cypress.env('github_token')}`,
            }
        }).then(resp => {
            expect(parseInt(resp.headers['x-ratelimit-limit'])).to.equal(5000)
            expect(parseInt(resp.headers['x-ratelimit-remaining'])).to.below(5000)

            const todayUTCSeconds = Math.floor(Date.now() / 1000)
            expect(resp.headers['x-ratelimit-reset']).to.be.above(todayUTCSeconds)
        })
    })


    it('conditional request does not decrease rate limiting', () => {
        // Make initial request to grab the etag
        const path = '/meta'

        cy.request(path).then(resp => {
            expect(resp.headers.etag).to.not.be.null
            const etag = resp.headers.etag
            const remainingLimit = resp.headers['x-ratelimit-remaining']

            cy.request({
                method: 'GET',
                url: path,
                headers: { 'If-None-Match': etag }
            }).then(respWithEtag => {
                expect(respWithEtag.status).to.equal(304)
                expect(respWithEtag.headers['x-ratelimit-remaining']).to.equal(remainingLimit)
            })
        })
    })
})
