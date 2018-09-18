'use strict';

const models = require('../models'),
language = require('./language'),
utils = require('./utils'),
sms = require('./sms'),
moment = require('moment'),
crypto = require('crypto');

const otpExpires = 1800,
	otpRetry = 150; //in seconds

exports.sendOtp = req => {
	if(!req.phone_code) req.phone_code = '';
	return generateOtp(req).then(result => {
		return sms.mobilySMS({
			form: {
				numbers: req.phone_code.toString()+req.mobile,
				msg: 'Your Wikicare verification code is '+result.otp
			}
		}).then(data => {
			if(data === '1'){
				return {
					status: true,
					message: language.lang({key: "OTP sent successfully.", lang: req.lang}),
					otpRetry: otpRetry
				};
			} else {
				return {
					status: false,
					message: data === '15' ? language.lang({key: "Mobile number is incorrect.", lang: req.lang}) : language.lang({key: "Something went wrong.", lang: req.lang}), 
				};
			}
		}).catch(error => {
			return {
				status: false,
				message: error === '15' ? language.lang({key: "Mobile number is incorrect.", lang: req.lang}) : language.lang({key: "OTP service not responding, please try again.", lang: req.lang})
			}
		});
		// return {
		// 	status: true,
		// 	message: 'otp sent '+result.otp, 
		// 	otpRetry
		// };
	}).catch(console.log);
};

exports.verifyOtp = req => {
	return models.otpmessage.findOne({
		where: {
			mobile: req.mobile,
			otp: req.otp
		}
	}).then(result => {
		if(result) {
			if(moment().diff(result.createdAt, 'seconds') <= otpExpires) {
				return models.otpmessage.destroy({
					where: {
						id: result.id
					}
				}).then(() => ({status: true}))
			} else {
				return {
					status: false,
					message: language.lang({key: "OTP Expired", lang: req.lang})
				}
			}
		} else {
			return {
				status: false,
				message: language.lang({key: "Invalid OTP", lang: req.lang})
			}
		}
	});
};

function generateOtp(req) {
	let attempt = 1;
	return Promise.all([
		models.otpmessage.findOne({
			where: {
				mobile: req.mobile
			},
			order: [
				['id', 'DESC']
			]
		}),
		(parseInt(crypto.randomBytes(3).toString('hex'), 16) % 9000 + 1000)
	]).then(([data, otp]) => {
		if(data) {
			if(moment().diff(data.createdAt, 'seconds') <= otpExpires) {
				attempt = (data.attempt+attempt);
				return models.otpmessage.update({
					attempt: attempt
				}, {
					where: {
						id: data.id
					}
				}).then(()=> {
					return {
						otp: data.otp,
						attempt
					};
				});
			} else {
				if(req.mobile.length > 15) return {status: false, message: language.lang({key: "Please enter a valid mobile number.", lang: req.lang})};
				return Promise.all([
					models.otpmessage.destroy({
						where: {
							mobile: data.mobile
						}
					}),
					models.otpmessage.create({
						attempt,
						otp,
						mobile: req.mobile
					})
				]).then(() => ({
					otp,
					attempt
				})).catch(console.log);
			}
		} else {
			if(req.mobile.length > 15) return {status: false, message: language.lang({key: "Please enter a valid mobile number.", lang: req.lang})};
			return models.otpmessage.create({
				attempt,
				otp,
				mobile: req.mobile
			}).then(() => {
				return {
					otp,
					attempt
				};
			});
		}
	});
};