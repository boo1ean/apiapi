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

	// It requires proper user-agent to work
	headers: {
		'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.91 Safari/537.36'
	}
});

// will request https://api.github.com/repos/boo1ean/casual/issues?state=closed and return json data
github.issues({ user: 'boo1ean', repo: 'casual', state: 'closed' }).then(console.log);
```

...

## License

MIT
