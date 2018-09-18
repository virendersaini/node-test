const config = require('../config/config')[process.env.NODE_ENV || 'development'],
	request = require('request'),
	extend = require('extend');

let options = {
	method: 'POST',
	url: 'http://172.98.90.110/api/msgSend.php',
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded'
	},
	form: {
		apiKey: '6aa17c985d492456a409ef7b990d4e01',
		sender: 'WikiCare',
		Method: 'msgSend',
		lang: '3',
		applicationType: '68'
	}
};

exports.mobilySMS = reqOptions => {
	if(reqOptions.headers){
		extend(options.headers, reqOptions.headers);
	}
	if(reqOptions.form){
		extend(options.form, reqOptions.form);
	}
	if(reqOptions.url){
		options.url = reqOptions.url;
	}
	return new Promise((resolve, reject)=>{
		request(options, (error, response, body) => {
			if(error)
				return reject(error);
			else
				return resolve(body);
		});
	})
};
