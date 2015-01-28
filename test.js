require('should');
var sinon = require('sinon');
var ApiClient = require('./');

describe('ApiClient', function () {
	var client = new ApiClient({
		baseUrl: 'http://example.com',
		methods: {
			'test1': 'get /test1/{param1}/stuff/{param2}',
			'test2': 'post /test2/{param}'
		}
	});

	it('Should make get request to correct url', function (done) {
		var expectedOpts = {
			method: 'GET',
			url: 'http://example.com/test1/1/stuff/2'
		};

		client.request = function (opts) {
			opts.should.eql(expectedOpts);
			done();
			return { spread: function () {} }
		}

		client.test1({ param1: 1, param2: 2 });
	});

	it('It should prepare proper query string', function (done) {
		var expectedOpts = {
			method: 'GET',
			url: 'http://example.com/test1/1/stuff/2?k=v&t=b'
		};

		client.request = function (opts) {
			opts.should.eql(expectedOpts);
			done();
			return { spread: function () {} }
		}

		client.test1({ param1: 1, param2: 2, k: 'v', t: 'b' });
	});

	it('It should prepare proper post request options', function (done) {
		var expectedOpts = {
			method: 'POST',
			json: true,
			url: 'http://example.com/test2/value',
			body: { a: 1, b: 2 }
		};

		client.request = function (opts) {
			opts.should.eql(expectedOpts);
			done();
			return { spread: function () {} }
		}

		client.test2({ param: 'value', a: 1, b: 2 });
	});
});
