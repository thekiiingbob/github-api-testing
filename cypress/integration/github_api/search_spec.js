describe('Github API Repository Search: ', () => {

    function searchRepos(query) {
        cy.request({
            method: 'GET',
            url: `/search/repositories?q=${query}`,
            headers: {
                // Being authorized ups the amount of rate limiting
                Authorization: `token ${Cypress.env('github_token')}`,
                // Required to see topics
                Accept: "application/vnd.github.mercy-preview+json"
            }
        }).as('response')

        return cy.get('@response').then(repos => {
            // General assertions for every request
            expect(repos.status).to.equal(200)
            expect(repos.body).not.to.be.null
            expect(repos.body.items).not.to.be.null

            // Wrap/return the repos request so we have it
            // for additional assertions based on the test
            cy.wrap(repos.body.items)
        })
    }

    afterEach(() => {
        // this is BAD, but trying to get around rate limiting
        cy.wait(1000)
    })

    // By default, these queries will return 30 repositories in the results
    // I am just checking data within those 30, we can of course navigate
    // through the pages to verify ALL results as necessary, although
    // this seems like a good starting point.

    it('can search by repository name', () => {
        searchRepos('zebra-static+in:name').then(repos => {
            expect(repos[0].name).to.equal('zebranedane-static')
            expect(repos[1].name).to.equal('zebra-web-side-static')
            expect(repos[2].name).to.equal('zebra-static-boilerplate')
        })
    })

    it('can search by description', () => {
        searchRepos('shmest+in:description').then(repos => {
            expect(repos).to.have.length(1)
            expect(repos[0].name).to.equal('shmest')
            expect(repos[0].html_url).to.equal('https://github.com/thekiiingbob/shmest')
        })
    })

    it('can search by contents of the README file', () => {
        searchRepos('npm install shmest+in:readme').then(repos => {
            expect(repos).to.have.length(1)
            expect(repos[0].name).to.equal('shmest')
            expect(repos[0].html_url).to.equal('https://github.com/thekiiingbob/shmest')
        })

    })

    it(`can search within a user's repositories`, () => {
        searchRepos('user:titusfortner').then(repos => {
            expect(repos).to.have.length(20)
        })
    })

    it(`can search within organization's repositories`, () => {
        searchRepos('org:insurancezebra').then(repos => {
            expect(repos).to.have.length(5)
        })
    })

    it('can search by repository size', () => {
        // Query uses kb, 90000000 = 900 GB
        searchRepos('size:>=90000000').then(repos => {
            repos.forEach(item => {
                expect(item.size).to.be.at.least(90000000)
            })
        })
    })

    it('can search by number of followers', () => {
        searchRepos('followers:>=50000').then(repos => {
            repos.forEach(item => {
                expect(item.watchers).to.be.at.least(50000)
            })
        })
    })

    it('can search by number of forks', () => {
        searchRepos('=forks:>=10000').then(repos => {
            repos.forEach(item => {
                expect(item.watchers).to.be.at.least(10000)
            })
        })
    })

    it('can search by number of stars', () => {
        searchRepos('stars:>=100000').then(repos => {
            repos.forEach(item => {
                expect(item.watchers).to.be.at.least(100000)
            })
        })
    })

    it('can search by when a repository was created', () => {
        searchRepos('created:<2007-11-01').then(repos => {
            expect(repos).to.have.length(1)
            expect(repos[0].created_at).to.equal('2007-10-29T14:37:16Z')
        })
    })

    it('can search by when a repository was last updated', () => {
        const date = '2018-11-01'
        const dateInMs = Date.parse(date)

        searchRepos(`pushed:${date}`).then(repos => {
            repos.forEach(item => {
                const pushedAtMs = Date.parse(item.pushed_at)
                expect(pushedAtMs).to.be.above(dateInMs)
            })
        })
    })

    it('can search by language', () => {
        searchRepos('language:elixir').then(repos => {
            repos.forEach(item => {
                expect(item.language).to.equal('Elixir')
            })
        })
    })

    it('can search by topic', () => {
        searchRepos('topic:cypress').then(repos => {
            repos.forEach(item => {
                expect(item.topics).to.include('cypress')
            })
        })
    })

    it('can search by number of topics', () => {
        searchRepos('topics:>=10').then(repos => {
            repos.forEach(item => {
                expect(item.topics).to.have.length.at.least(10)
            })
        })
    })

    it('can search by license', () => {
        searchRepos('license:apache-2.0').then(repos => {
            expect(repos).to.have.length.above(0)

            repos.forEach(item => {
                const license = {
                    key: "apache-2.0",
                    name: "Apache License 2.0",
                    node_id: "MDc6TGljZW5zZTI=",
                    spdx_id: "Apache-2.0",
                    url: "https://api.github.com/licenses/apache-2.0"
                }

                expect(item.license).to.eql(license)
            })
        })
    })

    it('can search by private repository', () => {
        searchRepos('is:private').then(repos => {
            repos.forEach(item => {
                expect(item.private).to.be.true
            })
        })
    })

    it('can search by public repository', () => {
        searchRepos('is:public').then(repos => {
            repos.forEach(item => {
                expect(item.private).to.be.false
            })
        })
    })

    it('can search based on whether a repository is a mirror', () => {
        searchRepos('mirror:true').then(repos => {
            repos.forEach(item => {
                expect(item.mirror_url).not.to.be.null
            })
        })
    })

    it('can search based on whether a repository is not a mirror', () => {
        searchRepos('mirror:false').then(repos => {
            repos.forEach(item => {
                expect(item.mirror_url).to.be.null
            })
        })
    })

    it('can search based on whether a repository is archived', () => {
        searchRepos('archived:true').then(repos => {
            repos.forEach(item => {
                expect(item.archived).to.be.true
            })
        })
    })

    it('can search based on whether a repository is not archived', () => {
        searchRepos('archived:false').then(repos => {
            repos.forEach(item => {
                expect(item.archived).to.be.false
            })
        })
    })

    it('can search based on number of issues with help wanted labels', () => {
        // Search for repositories that have more than 10 issues labeled with "help wanted"
        // targeting a specific user's repos to narrow down dataset
        const amountOfIssues = 10;

        searchRepos(`user:webdriverio+help-wanted-issues:>${amountOfIssues}`).then(repos => {
            expect(repos).to.have.length.greaterThan(0)
            repos.forEach(item => {
                // for each repo, get the first 100 issues
                // in this case, for this repo there should be < 100
                cy.request(item.url + '/issues?per_page=100').then(repos => {
                    // Collect only the help wanted issues
                    const helpWantedIssues = repos.body.reduce((issues, issue) => {
                        const labelNames = issue.labels.map(label => {
                            return label.name
                        })

                        if (labelNames.includes('help wanted')) {
                            issues.push(issue)
                        }

                        return issues
                    }, [])

                    // Finally assert that our collection of help wanted issues 
                    // is greater than our intended search amount
                    expect(helpWantedIssues).to.have.length.greaterThan(amountOfIssues)
                })
            })
        })
    })

})