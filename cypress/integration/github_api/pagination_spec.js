describe('Github Repository Pagination', () => {
    // Note that there seems to be a package or two that can handle 
    // parsing the link headers, but doing it by hand for this example
    function parseLinkHeaders(linkHeaders) {
        if (linkHeaders.length == 0) {
            throw new Error('Link headers had no length.')
        }

        const links = {}

        linkHeaders.split(',').forEach(link => {
            const urlRegex = /<(.+)>/
            const nameRegex = /rel="(.*)"/
            const url = link.match(urlRegex)[1].trim()
            const name = link.match(nameRegex)[1].trim()

            links[name] = url
        })

        return links
    }

    function repoRequest(url) {
        return cy.request({
            method: 'GET',
            url,
            headers: {
                // Being authorized ups the amount of rate limiting
                Authorization: `token ${Cypress.env('github_token')}`,
            }
        })
    }

    function navigatePages(url, reposSeen = 0, pagesNavigated = 0) {
        return repoRequest(url).then(resp => {
            cy.log(`Verifying url - ${url}`)
            expect(resp.status).to.equal(200)
            expect(resp.body).to.have.length.above(0)

            resp.body.forEach(repo => {
                expect(repo.name).to.not.be.null
                expect(repo.id).to.not.be.null
            })

            // Increase our results
            pagesNavigated += 1
            reposSeen += resp.body.length

            const { next } = parseLinkHeaders(resp.headers.link)

            if (!next) {
                // if we don't have a next, return the total repo count
                return cy.wrap({ reposSeen, pagesNavigated })
            }

            navigatePages(next, reposSeen, pagesNavigated)
        })
    }

    describe('link headers', () => {
        it('for first page includes links to next and last page', () => {
            repoRequest('/orgs/insurancezebra/repos?page=1&per_page=5').then(resp => {
                const links = parseLinkHeaders(resp.headers.link)
                expect(links.next).to.not.be.undefined
                expect(links.last).to.not.be.undefined
                expect(links.first).to.be.undefined
                expect(links.prev).to.be.undefined
            })
        })

        it('for last page includes links for previous page and first page', () => {
            repoRequest('/orgs/insurancezebra/repos?page=10&per_page=5').then(resp => {
                const links = parseLinkHeaders(resp.headers.link)
                expect(links.next).to.be.undefined
                expect(links.last).to.be.undefined
                expect(links.first).to.not.be.undefined
                expect(links.prev).to.not.be.undefined
            })
        })

        it('for middle page includes links to prev, next, first, and last', () => {
            repoRequest('/orgs/insurancezebra/repos?page=5&per_page=5').then(resp => {
                const links = parseLinkHeaders(resp.headers.link)
                expect(links.next).to.not.be.undefined
                expect(links.last).to.not.be.undefined
                expect(links.first).to.not.be.undefined
                expect(links.prev).to.not.be.undefined
            })
        })
    })

    // As of writing, insurancezebra returns me a total of 47 repos
    // may fail if you add more :)

    it('can navigate pagination to view all repositories for an organization', () => {
        navigatePages('/orgs/insurancezebra/repos?per_page=5').then(results => {
            expect(results.pagesNavigated).to.equal(10)
            expect(results.reposSeen).to.equal(47)
        })
    })

    it('can navigate pagination starting on a specific page', () => {
        navigatePages('/orgs/insurancezebra/repos?page=5&per_page=5').then(results => {
            expect(results.pagesNavigated).to.equal(6)
            expect(results.reposSeen).to.equal(27)
        })
    })

    it('can navigate pagination with different per_page amount', () => {
        navigatePages('/orgs/insurancezebra/repos?per_page=10').then(results => {
            expect(results.pagesNavigated).to.equal(5)
            expect(results.reposSeen).to.equal(47)
        })
    })

})