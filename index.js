var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var _ = require('lodash');
var parseQuerString = require('shitty-qs');

_.templateSettings.interpolate = /{([\s\S]+?)}/g;

function ApiClient (opts) {
	assertOptions(opts);

	this.request = request;
	this.baseUrl = opts.baseUrl;
	this.headers = opts.headers;
	this.parse = opts.parse;

	for (var methodName in opts.methods) {
		this[methodName] = this._composeMethod(opts.methods[methodName], methodName);
	}

	function assertOptions (opts) {
		if (!opts.baseUrl) {
			throw new Error('Missng baseUrl option');
		}

		if (!opts.methods || !_.isObject(opts.methods)) {
			throw new Error('Invalid methods list');
		}

		if (opts.headers && !_.isObject(opts.headers)) {
			throw new Error('Headers must be object');
		}

		if (opts.parse && (!_.isObject(opts.parse) && !_.isFunction(opts.parse))) {
			throw Error('Parse must be object or function');
		}
	}
}

ApiClient.prototype._composeMethod = function _composeMethod (config, methodName) {
	var requestOptions = this._getRequestOptions(config);
	var self = this;

	return function apiMethod (params) {
		requestOptions = _.clone(requestOptions);

		var opts = {
			method: requestOptions.httpMethod,
			url: requestOptions.baseUrl + getUri(requestOptions, params)
		};

		if (requestOptions.headers) {
			opts.headers = requestOptions.headers;
		}

		if (opts.method === 'POST') {
			opts.json = true;
			opts.body = getRequestBody(requestOptions.uriSchema, params);
		}

		return self.request(opts).spread(self._getResponseParser(methodName));
	}

	function getUri (requestOptions, params) {
		var uri = getPath(); 
		var query = getQuery();

		if (query) {
			return uri + '?' + query;
		}

		return uri;

		function getPath () {
			return _.template(requestOptions.uriSchema.path)(_.pick(params, requestOptions.uriSchema.pathParams));
		}

		function getQuery () {
			if (requestOptions.httpMethod === 'GET') {
				return stringifyQuery(_.extend(requestOptions.uriSchema.query, _.omit(params, requestOptions.uriSchema.pathParams)));
			}

			return stringifyQuery(requestOptions.uriSchema.query);

			function stringifyQuery (query) {
				return _.values(_.map(query, stringifyParam)).join('&');

				function stringifyParam (val, key) {
					return encodeURIComponent(key) + '=' + encodeURIComponent(val);
				}
			}
		}
	}

	function getRequestBody (uriSchema, params) {
		return _.omit(params, uriSchema.pathParams);
	}
}

ApiClient.prototype._getResponseParser = function _getResponseParser (methodName) {
	switch (true) {
		case _.isFunction(this.parse):
			return this.parse;
		case _.isObject(this.parse) && _.isFunction(this.parse[methodName]):
			return this.parse[methodName];
		default:
			return returnBody;
	}

	function returnBody (res, body) {
		return body;
	}
}

ApiClient.prototype._getRequestOptions = function _getRequestOptions (config) {
	var configTokens = config.split(' ');

	if (configTokens.length != 2) {
		throw new Error('Invalid rest endpoint declaration - ' + config);
	}

	var requestOptions = {
		baseUrl: this.baseUrl,
		httpMethod: configTokens[0].toUpperCase(),
		uriSchema: parseUri(configTokens[1])
	};

	if (this.headers) {
		requestOptions.headers = this.headers;
	}

	return requestOptions;

	function parseUri (uri) {
		var uriTokens = uri.split('?');

		return {
			path: uriTokens[0],
			pathParams: extractPathParams(uriTokens[0]),
			query: uriTokens.length > 1 ? parseQuerString(uriTokens[1]) : {}
		}

		function extractPathParams (path) {
			var matches = path.match(/{([\s\S]+?)}/g) || [];
			return matches.map(slice);

			function slice (param) {
				return param.slice(1, -1);
			}
		}
	}
}

module.exports = ApiClient;
