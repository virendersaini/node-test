'use strict';

const
	{inspect} = require('util'),
	language = require('./language');

module.exports = function (req, err) {
	if (req && req.originalUrl) {
		console.error(req.originalUrl, req.headers, req.body);
	} else {
		console.error(JSON.stringify(req));
	}
	console.error(err.stack || err || language.lang({key: "Unknown Error", lang: req.lang}));
	return {
		status: false,
		error: true,
		error_description: language.lang({key: "Internal Error", lang: req.lang}),
		url: true,
		code: 500,
	};
};

const inspectOptions = {
	colors: true,
};

module.exports.inspect = (...args) => {
	if (args.length === 1) {
		console.log(inspect(args[0], inspectOptions));
	}
	for (let i = 1; i < args.length; i++)
		console.log(inspect(args[i], inspectOptions))
	return args[0];
};

module.exports.log = (...args) => {
	if (args.length === 1) {
		console.log(JSON.stringify(args[0], 0, 2));
	}
	for (let i = 1; i < args.length; i++)
		console.log(JSON.stringify(args[i], 0, 2));
	return args[0];
};

