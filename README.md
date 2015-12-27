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

```javascript
// params - object passed to method
// requestBody - object which will go to request body
// opts - additional request options (e.g. headers)
var client = new ApiClient({
	before: function transformParams (params, requestBody, opts) {
		// You can return overrides for given objects
		opts.headers = { 'x-some-header': 'header-value' };
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

## Set error handler

Global error handler

```javascript
var client = new ApiClient({
	errorHandler: function errorHandler (result) {
		console.log('API error response status code %s', result.status);
	}
});
```

method-specific error handlers:

```javascript
var client = new ApiClient({
	errorHandler: {
		getIssues: function handleGetIssuesError(res) {
			console.log('Get issues error response status code %s', result.status);
		}
	}
});
```

## Params validation

You can declare list of required params for methods

```javascript
var client = new ApiClient({
	methods: {
		createIssue: 'post /issues
	},

	required: {
		createIssue: ['name', 'body', 'author_id']
	}
});

// Automatically asserts params object for having required attrs
client.createIssue({...});
```

## Debug

To see debug output just run you script like this:

```
DEBUG=apiapi node script.js
```

Debug output is provided by [debug](https://github.com/visionmedia/debug)

## License

MIT
