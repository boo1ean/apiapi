var Promise = require('bluebird');
var request = require('axios');
var _ = require('lodash');
var parseQuerString = require('shitty-qs');

if (!global.Promise) {
	global.Promise = Promise;
}

_.templateSettings.interpolate = /{([\s\S]+?)}/g;

function ApiClient (opts) {
	assertOptions(opts);

	this.request = request;
	this.baseUrl = opts.baseUrl || '';
	this.headers = opts.headers || {};
	this.parse = opts.parse;
	this.before = opts.before;
	this.query = opts.query || {};
	this.body = opts.body || {};

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
			throw new Error('Parse must be object or function');
		}

		if (opts.before && (!_.isObject(opts.before) && !_.isFunction(opts.before))) {
			throw new Error('Before must be object or function');
		}

		if (opts.query && (!_.isObject(opts.query))) {
			throw new Error('Query params pick options should be an object');
		}

		if (opts.body && (!_.isObject(opts.body))) {
			throw new Error('Body params pick options should be an object');
		}
	}
};

ApiClient.prototype._composeMethod = function _composeMethod (config, methodName) {
	var requestOptions = this._getRequestOptions(config, methodName);
	var self = this;

	return function apiMethod (requestParams, additionalRequestOptions) {
		requestParams = _.extend({}, requestParams);
		requestBody = getRequestBody(requestOptions, requestParams);
		additionalRequestOptions = _.extend({}, additionalRequestOptions);

		var originalRequestParams = _.cloneDeep(requestParams);
		var transformed = self._getBeforeTransformer(methodName).call(self, requestParams, requestBody, additionalRequestOptions);

		if (_.isArray(transformed)) {
			requestParams = transformed[0];
			requestBody = transformed[1];
			additionalRequestOptions = transformed[2];
		}

		var opts = {
			method: requestOptions.httpMethod,
			url: requestOptions.baseUrl + getUri(requestOptions, requestParams),
			responseType: 'json'
		};

		if (requestOptions.headers) {
			opts.headers = requestOptions.headers;
		}

		if (additionalRequestOptions.headers) {
			opts.headers = _.extend({}, opts.headers, additionalRequestOptions.headers);
		}

		// Check on post/put/patch/delete methods
		if (['POST', 'PATCH', 'PUT', 'DELETE'].indexOf(opts.method) > -1) {
			opts.data = requestBody;
		}

		return self.request(opts).then(function execResponseParser (res) {
			return self._getResponseParser(methodName).call(self, res, originalRequestParams, requestParams);
		});
	};

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

				// Filter out path params
				var queryParams = _.omit(params, requestOptions.uriSchema.pathParams);

				// Apply default query params
				queryParams = _.defaults(queryParams, requestOptions.uriSchema.query);

				if (_.isArray(requestOptions.queryParamsPick)) {
					queryParams = _.pick(queryParams, requestOptions.queryParamsPick);
				}

				return stringifyQuery(queryParams);
			}

			return stringifyQuery(_.extend(requestOptions.uriSchema.query, _.pick(params, requestOptions.uriSchema.queryParams)));

			function stringifyQuery (query) {
				return _.values(_.map(query, stringifyParam)).join('&');

				function stringifyParam (val, key) {
					return encodeURIComponent(key) + '=' + encodeURIComponent(val);
				}
			}
		}
	}

	function getRequestBody (requestOptions, params) {
		var requestBody = _.omit(params, requestOptions.uriSchema.pathParams);

		if (_.isArray(requestOptions.bodyParamsPick)) {
			requestBody = _.pick(requestBody, requestOptions.bodyParamsPick);
		}

		return requestBody;
	}
};

ApiClient.prototype._getBeforeTransformer = function _getBeforeTransformer (methodName) {
	switch (true) {
		case _.isFunction(this.before):
			return this.before;
		case _.isObject(this.before) && _.isFunction(this.before[methodName]):
			return this.before[methodName];
		default:
			return returnSame;
	}

	function returnSame (params) {
		return params;
	}
};

ApiClient.prototype._getResponseParser = function _getResponseParser (methodName) {
	switch (true) {
		case _.isFunction(this.parse):
			return this.parse;
		case _.isObject(this.parse) && _.isFunction(this.parse[methodName]):
			return this.parse[methodName];
		default:
			return returnBody;
	}

	function returnBody (res) {
		if (_.inRange(res.status, 200, 300) || _.inRange(res.status, 400, 500)) {
			return res.data;
		}

		throw new Error('Server response status: ' + res.status);
	}
};

ApiClient.prototype._getRequestOptions = function _getRequestOptions (config, methodName) {
	var configTokens = config.split(' ');

	if (configTokens.length != 2) {
		throw new Error('Invalid rest endpoint declaration - ' + config);
	}

	var requestOptions = {
		baseUrl: this.baseUrl,
		httpMethod: configTokens[0].toUpperCase(),
		uriSchema: parseUri(configTokens[1]),
		queryParamsPick: this.query[methodName],
		bodyParamsPick: this.body[methodName]
	};

	if (this.headers) {
		requestOptions.headers = this.headers;
	}

	return requestOptions;

	function parseUri (uri) {
		var uriTokens = uri.split('?');

		return {
			path: uriTokens[0],
			pathParams: extractParams(uriTokens[0]),
			query: uriTokens.length > 1 ? parseQuerString(uriTokens[1]) : {},
			queryParams: uriTokens.length > 1 ? extractParams(uriTokens[1]) : {}
		};

		function extractParams (path) {
			var matches = path.match(/{([\s\S]+?)}/g) || [];
			return matches.map(slice);

			function slice (param) {
				return param.slice(1, -1);
			}
		}
	}
};

module.exports = ApiClient;
