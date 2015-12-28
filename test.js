require('should');
var sinon = require('sinon');
var ApiClient = require('./');
var Promise = require('bluebird');

describe('ApiClient', function () {
	var response = { status: 200, data: 'body' };

	var client = new ApiClient({
		baseUrl: 'http://example.com',
		methods: {
			test1: 'get /test1/{param1}/stuff/{param2}',
			test2: 'post /test2/{param}',
			test3: 'post /test3/haha',
			test4: 'get /test4'
		},
		transformResponse: {
			test3: function (res) {
				res.should.be.equal(response);
				res.data.should.be.equal('body');

				return 'parsed body';
			}
		},
		headers: {
			'user-agent': 'User-agent header'
		}
	});

	it('Should make get request to correct url', function (done) {
		var expectedOpts = {
			method: 'GET',
			url: 'http://example.com/test1/1/stuff/2',
			responseType: 'json',
			headers: {
				'user-agent': 'User-agent header'
			}
		};

		client.request = function (opts) {
			opts.should.eql(expectedOpts);
			done();
			return Promise.resolve({});
		};

		client.test1({ param1: 1, param2: 2 });
	});

	it('It should prepare proper query string', function (done) {
		var expectedOpts = {
			method: 'GET',
			url: 'http://example.com/test1/1/stuff/2?k=v&t=b',
			responseType: 'json',
			headers: {
				'user-agent': 'User-agent header'
			}
		};

		client.request = function (opts) {
			opts.should.eql(expectedOpts);
			done();
			return Promise.resolve({});
		};

		client.test1({ param1: 1, param2: 2, k: 'v', t: 'b' });
	});

	it('It should prepare proper post request options', function (done) {
		var expectedOpts = {
			method: 'POST',
			responseType: 'json',
			url: 'http://example.com/test2/value',
			data: { a: 1, b: 2 },
			headers: {
				'user-agent': 'User-agent header'
			}
		};

		client.request = function (opts) {
			opts.should.eql(expectedOpts);
			done();
			return Promise.resolve({});
		};

		client.test2({ param: 'value', a: 1, b: 2 });
	});

	it('Should make request with header passed to constructor', function (done) {
		var expectedHeader = {'user-agent': 'User-agent header'};

		client.request = function (opts) {
			opts.headers.should.eql(expectedHeader);
			done();
			return Promise.resolve({});
		};

		client.test1({ param1: 1, param2: 2 });
	});

	it('Should make request with header passed to api method call', function (done) {
		var requestParams = {
			headers: {
				'some-header': 'some header value'
			}
		};

		var expectedHeader = {
			'user-agent': 'User-agent header',
			'some-header': 'some header value'
		};

		client.request = function (opts) {
			opts.headers.should.eql(expectedHeader);
			done();
			return Promise.resolve({});
		};

		client.test1({ param1: 1, param2: 2 }, requestParams);
	});

	it('Should return response body by default', function (done) {
		client.request = function () {
			return Promise.resolve(response);
		};

		client.test2({ param: 1 }).then(function (body) {
			body.should.be.equal('body');
			done();
		});
	});

	it('It should transformResponse response data', function (done) {
		var expectedOpts = {
			method: 'POST',
			responseType: 'json',
			url: 'http://example.com/test3/haha',
			data: { to_parse: 42 },
			headers: {
				'user-agent': 'User-agent header'
			}
		};

		client.request = function (opts) {
			opts.should.eql(expectedOpts);
			return Promise.resolve(response);
		};

		client.test3({ to_parse: 42 }).then(function (result) {
			result.should.be.equal('parsed body');
			done();
		});
	});

	it('Should use global transformResponse function', function (done) {
		var client = new ApiClient({
			baseUrl: 'http://example.com',
			methods: { m1: 'get /', m2: 'post /' },
			transformResponse: function (res) {
				res.should.be.equal(response);
				return 'result';
			}
		});

		client.request = function () {
			return Promise.resolve(response);
		};

		Promise.all([client.m1(), client.m2()]).spread(function (r1, r2) {
			r1.should.be.equal('result');
			r2.should.be.equal('result');
			done();
		});
	});

	it('Should throw error on non-200 status code', function (done) {
		var client = new ApiClient({
			baseUrl: 'http://example.com',
			methods: { m1: 'get /' }
		});

		client.request = function () {
			return Promise.reject();
		};

		client.m1().catch(function () {
			done();
		});
	});

	it('Should call transformRequest method before request', function (done) {
		var client = new ApiClient({
			baseUrl: 'http://example.com',
			methods: { m1: 'get /' },
			transformRequest: {
				m1: function (params, body, opts) {
					return [{a:'b'}, body, opts];
				}
			}
		});

		client.request = function (opts) {
			opts.url.should.be.equal('http://example.com/?a=b');
			done();
			return Promise.resolve(response);
		};

		client.m1({ c: 1 });
	});

	it('Should call async transformRequest method before request', function (done) {
		var client = new ApiClient({
			baseUrl: 'http://example.com',
			methods: { m1: 'get /' },
			transformRequest: {
				m1: function (params, body, opts) {
					return new Promise(function (res, rej) {
						res([{a:'b'}, body, opts]);
					});
				}
			}
		});

		client.request = function (opts) {
			opts.url.should.be.equal('http://example.com/?a=b');
			done();
			return Promise.resolve(response);
		};

		client.m1({ c: 1 });
	});

	it('Should call transformRequest method before request global', function (done) {
		var client = new ApiClient({
			baseUrl: 'http://example.com',
			methods: { m1: 'get /', m2: 'get /' },
			transformRequest: function (a, b, c) {
				return [{a: 'b'}, b, c];
			}
		});

		client.request = function (opts) {
			opts.url.should.be.equal('http://example.com/?a=b');
			return Promise.resolve(response);
		};

		client.m1({ c: 1 });
		client.m2({ c: 1 });

		done();
	});

	it('Should handle params in query string for non-get methods', function (done) {
		var client = new ApiClient({
			baseUrl: 'http://example.com',
			methods: { m1: 'post /{p1}/{p2}?p3={p3}&p4={p4}'}
		});

		client.request = function (opts) {
			opts.url.should.be.equal('http://example.com/a/b?p3=c&p4=d');
			return Promise.resolve(response);
		};

		client.m1({
			p1: 'a',
			p2: 'b',
			p3: 'c',
			p4: 'd'
		});

		done();
	});

	it('Should ignore placeholders in query string if no params passed', function (done) {
		var client = new ApiClient({
			baseUrl: 'http://example.com',
			methods: { m1: 'post /{p1}/{p2}?p3={p3}&p4={p4}'}
		});

		client.request = function (opts) {
			opts.url.should.be.equal('http://example.com/a/b?p3=%7Bp3%7D&p4=%7Bp4%7D');
			return Promise.resolve(response);
		};

		client.m1({
			p1: 'a',
			p2: 'b'
		});

		done();
	});

	it('Should assert params', function (done) {
		var client = new ApiClient({
			baseUrl: 'http://example.com',
			methods: { m1: 'post /{p1}/{p2}?p3={p3}&p4={p4}'},
			required: {
				m1: ['p1', 'p2']
			}
		});

		client.m1({ p1: 1 }).catch(function (err) {
			err.message.should.be.equal('p2 param is required');
			done();
		});
	})
});
