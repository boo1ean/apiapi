## Api client for lazy devs

Quickly write up any json api client for your purpose.

You can use both callbacks and promises for api client methods.

## Installation

```bash
npm install apiapi
```

## Example usage

Sample api client for github

```js
var ApiClient = require('apiapi');

var github = new ApiClient({
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

// also you can use custom headers for each request
github.issues({ user: 'boo1ean', repo: 'casual', state: 'closed' }, {headers: { Authentication: "token GITHUB-TOKEN" }}).then(console.log);
```

Call methods passing callbacks

```javascript
// Call method with params
github.issues({ user: 'boo1ean', repo: 'casual', state: 'closed' }, function (err, result) {
	// process result
});

// Call method without params
github.issues(function (err, result) {
	// process result
})
```

## Response parser

You can specify response parse function:

```js
// Will parse all methods responses (global parse)

new ApiClient({
	// ...

	parse: function parseResponse (res, body, requestParams) {
		// res - request's response object
		// body = response body
		// requestParams = object passed to called method
	}
});

// Parse response of specific method

new ApiClient({
	// ...

	methods: {
		issues: 'get /issues'
	}

	parse: {
		issues: function parseIssues (res, body, requestParams) {
			return body.slice(0, 5);
		}
	}
});

```

NOTE: if you use custom response parser you should manually check response status codes for errors

## Request params transformer

You can decorate request params and headers with before hooks.

First way is to mutate input objects:

```js
var client = new ApiClient({
	// params - object passed to method
	// requestBody - object which will go to request body
	// opts - additional request options (e.g. headers)
	before: function transformParams (params, requestBody, opts) {
		if (params.state === 'closed') {
			params.expanded = 'true';
		}

		opts.headers['some-custom-header'] = 'bip-bop';
	}
});

// will request https://api.github.com/repos/boo1ean/casual/issues?state=closed&expanded=true and return json data
github.issues({ user: 'boo1ean', repo: 'casual', state: 'closed' }).then(console.log);
```

Second way is to return override from before transform:

```javascript
var client = new ApiClient({
	before: function transformParams (params, requestBody, opts) {
		// You can return overrides for given objects
		return [params, requestBody, opts];
	}
});
```

Also you can perform method-specific before hook:

```js
new ApiClient({
	before: {
		issues: function transformParams (params) {
			// ...
		}
	}
});
```
...

## Pick specific params for query string

```javascript
var client = new ApiClient({
	methods: {
		issues: 'get /repos/{user}/{repo}/issues'
	},

	query: {
		// Will pick only these params for issues method and omit all others
		issues: ['state']
	}
});

// will request https://api.github.com/repos/boo1ean/casual/issues?state=closed
client.issues({ custom: 'custom param', user: 'boo1ean', repo: 'casual', state: 'closed' });
```

## Pick specific params for request body

```javascript
var client = new ApiClient({
	methods: {
		createSomething: 'post /something'
	},

	body: {
		// Only title will be picked from method params and passed to request body
		createSomething: ['title']
	}
});
```

## License

MIT
