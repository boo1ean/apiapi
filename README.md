## Api client for lazy devs

Quickly write up any json api client for your purpose

## Installation

```bash
npm install apiapi
```

## Example usage

Sample api client for github

```js
var ApiClient = require('apiapi');

var github = new Apiclient({
	baseUrl: 'https://api.github.com',

	// Define api methods
	methods: {
		issues: 'get /repos/{user}/{repo}/issues'
	},

	// Github api requires proper user-agent to work
	headers: {
		'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.91 Safari/537.36'
	}
});

// will request https://api.github.com/repos/boo1ean/casual/issues?state=closed and return json data
github.issues({ user: 'boo1ean', repo: 'casual', state: 'closed' }).then(console.log);
```

## Response parsers

You can specify response parse function:

```js
// Will parse all methods responses (global parse)

new ApiClient({
	// ...

	parse: function parseResponse (res, body) {
		// res - request's response object
		// body = response body
	}
});

// Parse response of specific method

new ApiClient({
	// ...

	methods: {
		issues: 'get /issues'
	}

	parse: {
		issues: function parseIssues (res, body) {
			return body.slice(0, 5);
		}
	}
});

NOTE: if you use custom response parser you should manually check response status codes for errors

```

...

## License

MIT
