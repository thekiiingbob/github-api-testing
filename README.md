# Github API Tests

## Tools used

I decided to use cypress to execute these tests because...

A) I wanted to try it out for API only testing
B) it gives a nice GUI for debugging and executing the tests

These sorta tests can be done with pretty much any http request library (for JS, I'd lean towards Axios and you can see a small example of that [here](https://github.com/thekiiingbob/minimal-api-testing)). There are of course plenty of other tools across languages that could be used for this task.

## Setup and Execution

Developed and tested on OSX, with Node v10.15.3. Did not test on other environments, although it should run fine.

To run, you should have `node` and `npm` installed on your machine

### Github Personal Token

To circumvent some of the rate limiting, I used a [Github personal access token](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line) to authenticate various requests. To do the same, in `cypress/cypress.json' you can update to`github_token` variable to be your own token. Without it, rate limiting may be a factor for you.

Note that some of the tests have some assumptions around the repos that my user account can access/see in Github, so there may be failures with your own token as you would have different permissions. Ideally, in an actual testing setup, we would have control over the accounts we would use.

### Installation and running tests

Clone down this repo and `npm install` to install dependencies. You can then do 'npm test' to execute the tests.

Alternatively, you could do `npm run cypress:open` to open up cypress and run test files individually to see all the output in the cypress test runner.

## Bells and whistles

I added support for mochawesome HTML reports for viewing results, to use that run `npm run test:report` and in the created `results` folder there should be a HTML file inside `mochawesome-report` directory. To view report, open up that file in your browser.

## Notes on tests

### search_spec.js

This covers a fair swath of functonality based around what I saw [here](https://help.github.com/en/articles/searching-for-repositories#search-within-a-users-or-organizations-repositories).

Notable gaps currently would be variations on queries such as using <=, >=, <, and > for all supported queries. There are also no negative tests to ensure if the data set did not have the included data. To circumvent this with the public Github API I could setup a "demo" repo with all the expected data I needed, but decided against it due to time constraints. I'm also not really leveraging many combinations of queries which is another area that should be expanded. That said, this suite should give a rough estimation of "is it working".

I'm also not doing a ton of verifications across the entire contents of the repo responses. If we had a concrete data set we could compare the entirety of the response to ensure data integrity, but for this example I grabbed just the bits that I felt indicated that the results returned were what we expected (for example, if I requested private repos, all of the repos should be private). Lastly, I'm only checking the default maximum 30 repos that get returned in the responses for simplicity. I would not be far fetched to leverage the code in the `pagination_spec.js` to verify all of the pages of repos.

Given I don't have fine tune control over the data in Github, I feel that some of the tests may be brittle based on changes in what is actually in Github. Ideally, I'd working with a data set under my control and could be more specific around my testing

### pagination_spec.js

So this spec I feel is a bit "clever" (e.g. possibly confusing) as it's dealing with recursion to handle the navigation around the various pages. That said, I think it's a fairly clean way to do this. With a known data set, you could know ahead of time how many pages you expect to crawl and loop over the pages very directly, but this current approach should handle most cases.

The first set of tests in the file has to do around ensuring that the various link headers are there based on querying for first, last, or middle pages. Additional checks could be around things like is the URL correct and hitting those URLs and asserting the results are what we expect.

### rate_limiting_spec.js

For this suite I just grabbed a few things around rate limiting, with one leveraging conditional requests.

## General notes
