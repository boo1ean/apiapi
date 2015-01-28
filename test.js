require('should');
var sinon = require('sinon');
var ApiClient = require('./');
var Promise = require('bluebird');

describe('ApiClient', function () {
	var client = new ApiClient({
		baseUrl: 'http://example.com',
		methods: {
			test1: 'get /test1/{param1}/stuff/{param2}',
			test2: 'post /test2/{param}',
			test3: 'post /test3/haha'
		},
		parse: {
			test3: function (res, body) {
				res.should.be.equal('res');
				body.should.be.equal('body');

				return 'parsed body';
			}
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

	it('Should return response body by default', function (done) {
		client.request = function () {
			return Promise.resolve(['res', 'body']);
		}

		client.test2({ param: 1 }).then(function (body) {
			body.should.be.equal('body');
			done();
		});
	});

	it('It should parse response data', function (done) {
		var expectedOpts = {
			method: 'POST',
			json: true,
			url: 'http://example.com/test3/haha',
			body: { to_parse: 42 }
		}

		client.request = function (opts) {
			opts.should.eql(expectedOpts);
			return Promise.resolve(['res', 'body']);
		}

		client.test3({ to_parse: 42 }).then(function (result) {
			result.should.be.equal('parsed body');
			done();
		});
	});

	it('Should use global parse function', function (done) {
		var client = new ApiClient({
			baseUrl: 'http://example.com',
			methods: { m1: 'get /', m2: 'post /' },
			parse: function (res, body) {
				res.should.be.equal('res');
				body.should.be.equal('body');

				return 'result';
			}
		});

		client.request = function () {
			return Promise.resolve(['res', 'body']);
		}

		Promise.all([client.m1(), client.m2()]).spread(function (r1, r2) {
			r1.should.be.equal('result');
			r2.should.be.equal('result');
			done();
		});
	})
});
