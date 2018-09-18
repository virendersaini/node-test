var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var mail = require('./mail');
var bcrypt = require('bcrypt-nodejs');
var randomstring = require("randomstring");
var moment = require('moment');
var utils = require('./utils');
var crypto = require('crypto');
var roles = require('./role');
var subscription = require('./subscription');
var otpmessage = require('./otpmessage');

function myController() {

	this.userupdate = function (req, res) {
		req.user_detail = {}
		var UserHasOne = models.user.hasOne(models.userdetail, {
			as: 'user_detail'
		});
		req.user_detail.languageId = req.langId;
		req.user_detail.fullname = req.name;
		var user = models.user.build(req);

		var userDetails = models.userdetail.build(req.user_detail);
		var errors = [];
		// an example using an object instead of an array
		async.parallel([
			function (callback) {
				user.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({
					status: false,
					error: true,
					error_description: language.lang({
						key: "Internal Error",
						lang: req.lang
					}),
					url: true
				}));
			},

			function (callback) {
				userDetails.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({
					status: false,
					error: true,
					error_description: language.lang({
						key: "Internal Error",
						lang: req.lang
					}),
					url: true
				}));
			}
		], function (err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function (elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {

				if (typeof req.id !== 'undefined' && req.id !== '') {

					req.user_detail.userId = req.id;
					models.user.update(req, {
						where: {
							id: req.id
						},
						individualHooks: true
					}).then(function (data) {
						models.userdetail.find({
							where: {
								userId: req.id,
								languageId: req.langId
							}
						}).then(function (resultData) {
							if (resultData !== null) {
								req.user_detail.id = resultData.id;
								models.userdetail.update(req.user_detail, {
									where: {
										id: resultData.id,
										userId: req.id,
										languageId: req.langId
									}
								}).then(function () {
									res({
										status: true,
										message: language.lang({
											key: "updatedSuccessfully",
											lang: req.lang
										}),
										data: data
									});
								}).catch(() => res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error",
										lang: req.lang
									}),
									url: true
								}));
							} else {
								delete req.user_detail.id;
								models.userdetail.create(req.user_detail).then(function () {
									res({
										status: true,
										message: language.lang({
											key: "updatedSuccessfully",
											lang: req.lang
										}),
										data: data
									});
								}).catch(() => res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error",
										lang: req.lang
									}),
									url: true
								}));
							}
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						}));
					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				} else {
					var langId = parseInt(req.user_detail.languageId);
					module.exports.createUserName({
						fullname: req.user_detail.fullname
					}, function (username) {
						req.user_name = username;
						models.user.create(req, {
							include: [UserHasOne],
							individualHooks: true
						}).then(function (data) {
							if (langId === 1) {
								res({
									status: true,
									message: language.lang({
										key: "addedSuccessfully",
										lang: req.lang
									}),
									data: data
								});
							} else {
								req.user_detail.userId = data.id;
								req.user_detail.languageId = 1;
								models.userdetail.create(req.user_detail).then(function () {
									res({
										status: true,
										message: language.lang({
											key: "addedSuccessfully",
											lang: req.lang
										}),
										data: data
									});
								}).catch(() => res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error",
										lang: req.lang
									}),
									url: true
								}));
							}
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						}));
					});
				}
			} else {
				language.errors({
					errors: uniqueError,
					lang: req.lang
				}, function (errors) {



					errors = errors[0].message;
					var newArr = {
						status: false,
						message: errors,
						data: ''
					};
					res(newArr);

				});
			}
		});
	};

	this.update_profile = function (req, res) {
		var user = models.user.build(req);
		var errors = [];
		// an example using an object instead of an array
		async.parallel([
			function (callback) {
				user.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({
					status: false,
					error: true,
					error_description: language.lang({
						key: "Internal Error",
						lang: req.lang
					}),
					url: true
				}));
			}
		], function (err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function (elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {

				if (typeof req.id !== 'undefined' && req.id !== '') {
					models.user.update(req, {
						where: {
							id: req.id
						},
						individualHooks: true
					}).then(function (data) {
						module.exports.patientInfo({
							id: req.id,
							languageId: req.langId
						}, function (userInfo) {
							res({
								status: true,
								message: language.lang({
									key: "updatedSuccessfully",
									lang: req.lang
								}),
								data: userInfo
							});
						})

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				} else {
					res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					})
				}
			} else {
				language.errors({
					errors: uniqueError,
					lang: req.lang
				}, function (errors) {
					var newArr = {};
					newArr.errors = errors;
					res(newArr);
				});
			}
		});
	};

	/*
	 * list of all
	 */
	this.list = function (req, res) {
		//var data = JSON.parse(req.body.data);

		var setPage = req.app.locals.site.page;
		var currentPage = 1;
		var pag = 1;
		if (typeof req.query.page !== 'undefined') {
			currentPage = +req.query.page;
			pag = (currentPage - 1) * setPage;
			delete req.query.page;
		} else {
			pag = 0;
		}
		/*
		 * for  filltering
		 */
		var reqData = req.body;
		if (typeof req.body.data !== 'undefined') {
			reqData = JSON.parse(req.body.data);
		}
		var isWhere = {};
		var orderBy = '';
		if (req.query) {
			var responseData = {};
			if (reqData.masterId !== 1) {
				// responseData.user = {
				// 	masterId: reqData.masterId
				// };
				responseData.user = {
					id: {$ne: 1}
				};
				//responseData.user.user_type = 'admin';
			} else {
				responseData.user = {
					id: {
						$ne: 1
					}
				};
				//responseData.user.user_type = 'admin';
			}
			async.forEach(Object.keys(req.query), function (item, callback) {
				if (req.query[item] !== '') {
					var modelKey = item.split('__');
					if (typeof responseData[modelKey[0]] == 'undefined') {
						var col = {};
						col[modelKey[1]] = {
							$like: '%' + req.query[item] + '%'
						};
						responseData[modelKey[0]] = col;
					} else {
						responseData[modelKey[0]][modelKey[1]] = {
							$like: '%' + req.query[item] + '%'
						};
					}
				}
				callback();
			}, function () {
				isWhere = responseData;
			});
		}
		//isWhere['delete'] = 1;
		orderBy = 'id DESC';

		models.user.hasMany(models.userdetail);
		models.user.belongsTo(models.role);
		models.role.hasMany(models.roledetail);

		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, reqData.langId, '`user`.`id`', models.userdetail, 'userId'
		);
		isWhere.roledetail = language.buildLanguageQuery(
			isWhere.roledetail, reqData.langId, '`role`.`id`', models.roledetail, 'roleId'
		);

		models.user.findAndCountAll({
				include: [{
						model: models.userdetail,
						where: isWhere.userdetail
					},
					{
						model: models.role,
						include: [{
							model: models.roledetail,
							where: isWhere.roledetail
						}]
					}
				],
				where: isWhere.user,
				order: [
					['id', 'DESC']
				],
				distinct: true,
				limit: setPage,
				offset: pag,
				subQuery: false
			}).then(function (result) {
				var totalData = result.count;
				var pageCount = Math.ceil(totalData / setPage);
				res({
					data: result.rows,
					totalData: totalData,
					pageCount: pageCount,
					pageLimit: setPage,
					currentPage: currentPage
				});
			})
			.catch(() => res({
				status: false,
				error: true,
				error_description: language.lang({
					key: "Internal Error",
					lang: reqData.lang
				}),
				url: true
			}))
	};

	/*
	 * get By ID
	 */
	this.getById = function (req, res) {
		var isWhere = {};
		isWhere = language.buildLanguageQuery(
			isWhere, req.langId, '`user`.`id`', models.userdetail, 'userId'
		);
		models.user.hasMany(models.userdetail);
		models.user.find({
				include: [{
					model: models.userdetail,
					where: isWhere
				}],
				where: {
					id: req.id
				}
			}).then(function (data) {
				res(data);
			})
			.catch(() => res({
				status: false,
				error: true,
				error_description: language.lang({
					key: "Internal Error",
					lang: req.lang
				}),
				url: true
			}));
	};

	/*
	 * status update
	 */
	this.status = function (req, res) {
		models.user.update(req, {
			where: {
				id: req.id
			}
		}).then(function (data) {
			oauth.removeToken(req, function (result) {
				res({
					status: true,
					message: language.lang({
						key: "updatedSuccessfully",
						lang: req.lang
					}),
					data: data
				});
			});
		}).catch(() => res({
			status: false,
			error: true,
			error_description: language.lang({
				key: "Internal Error",
				lang: req.lang
			}),
			url: true
		}));
	};

	this.patientInfo = function (req, res) {
		var userInfo = {};
		var isWhere = {};
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, req.languageId, '`user`.`id`', models.userdetail, 'userId'
		);
		models.user.hasMany(models.userdetail);
		models.user.find({
			include: [{
				model: models.userdetail,
				where: isWhere.userdetail
			}],
			where: {
				id: req.id
			},
			attributes: ['id', 'default_lang', 'user_image', 'user_type', 'mobile', 'email', 'user_name']
		}).then(function (userData) {
			userInfo.userId = userData.id;
			userInfo.user_image = userData.user_image;
			userInfo.fullname = userData.userdetails[0].fullname;
			res(userInfo);

		}).catch(() => res({
			status: false,
			error: true,
			error_description: language.lang({
				key: "Internal Error",
				lang: req.lang
			}),
			url: true
		}));
	};

	/*
	 * function forgotpassword
	 */
	this.forgotpassword = function (req, res) {
		var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (req.email === '') {
			res({
				status: false,
				errors: [{
					path: "email",
					message: "This is a required field."
				}]
			});
		} else if (!re.test(req.email)) {
			res({
				status: false,
				errors: [{
					path: "email",
					message: language.lang({
						key: "isEmail",
						lang: req.lang
					})
				}]
			});
		} else {
			models.user.hasMany(models.userdetail);
			models.user.find({
				where: {
					email: req.email,
					user_type: {
						$in: ['doctor', 'hospital', 'doctor_clinic_both', 'admin']
					}
				},
				include: [{
					model: models.userdetail,
					attributes: ['fullname'],
					where: language.buildLanguageQuery({}, req.langId, '`user`.`id`', models.userdetail, 'userId')
				}]
			}).then(function (userData) {
				if (!userData) {
					res({
						status: false,
						message: language.lang({
							key: "Email Id does not exist in our database.",
							lang: req.lang
						})
					});
				} else {
					var rstPswrdToken = randomstring.generate();
					var rstPswrdVrfUrl = req.resetPassUrl + rstPswrdToken;
					models.user.update({
						reset_password_token: rstPswrdToken
					}, {
						where: {
							id: userData.id
						}
					}).then(function () {
						var mailData = {
							email: userData.email,
							subject: language.lang({
								key: "Reset Password Request",
								lang: req.lang
							}),
							list: {
								username: req.email,
								link: rstPswrdVrfUrl,
								fullname: userData.userdetails[0].fullname
							}
						};
						mail.sendResetPasswordMail(mailData, req.lang);
						res({
							status: true,
							message: language.lang({
								key: "Reset password link has been sent to your email.",
								lang: req.lang
							})
						});
					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}
			}).catch(() => res({
				status: false,
				error: true,
				error_description: language.lang({
					key: "Internal Error",
					lang: req.lang
				}),
				url: true
			}));
		}
	};

	/*
	 * function resetpassword
	 */
	this.resetpassword = function (req, res) {
		var usr = models.user.build(req);
		usr.validate().then(function (err) {
			if (err !== null) {
				language.errors({
					errors: err.errors,
					lang: req.lang
				}, function (errors) {
					err.errors = errors;
					res(err);
				});
			} else {
				models.user.find({
					where: {
						reset_password_token: req.reset_password_token
					}
				}).then(function (userData) {
					if (userData !== null) {
						var newPassword = bcrypt.hashSync(req.password, null, null);
						models.user.update({
							reset_password_token: '',
							password: newPassword
						}, {
							where: {
								reset_password_token: req.reset_password_token
							}
						}).then(function () {
							res({
								status: true,
								message: language.lang({
									key: "updatedPasswordSuccess",
									lang: req.lang
								})
							});
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						}));
					} else {
						res({
							status: false,
							message: language.lang({
								key: "Token has been expired.",
								lang: req.lang
							})
						});
					}
				}).catch(() => res({
					status: false,
					error: true,
					error_description: language.lang({
						key: "Internal Error",
						lang: req.lang
					}),
					url: true
				}));
			}
		}).catch(() => res({
			status: false,
			error: true,
			error_description: language.lang({
				key: "Internal Error",
				lang: req.lang
			}),
			url: true
		}));
	};

	this.getSignUpMetaData = function (req, res) {
		roles.getSignupRoles(req, function (roles) {
			res({
				roles: roles
			});
		});
	}

	this.checkClaimStatus = function (req, res) {
		models.claimrequest.findOne({
			attributes: ['keyId', 'status'],
			where: {
				userId: req,
				model: 'doctorprofile',
				status: {
					$in: ['pending', 'approved']
				}
			},
		}).then(function (data) {
			res({
				data
			});
		})
	}

	this.verifyLoginOTP = req => {
		return otpmessage.verifyOtp({
			mobile: req.mobile,
			otp: req.otp,
			lang: req.lang
		}).then(result => {
			if (!result.status) return result;

			return models.user.findOne({
				where: {
					mobile: req.mobile
				},
				attributes: [
					'id',
					'email',
					'password',
					'user_name',
					'user_type',
					'secondary_lang',
					'roleId',
					'default_lang',
					'createdAt',
					'is_active',
					'is_email_verified'
				]
			}).then(userData => {
				req.userData = userData;
				return module.exports.loginInfo(req)
			});
		});
	};

	this.login = req => {

		let whereCondition = {
			user_type: {
				$in: ['doctor', 'hospital', 'doctor_clinic_both', 'Patient', 'fitness_center', 'home_healthcare']
			}
		};

		if (req.deviceType == 'DESKTOP') {
			whereCondition.user_type = {
				$in: ['doctor', 'hospital', 'doctor_clinic_both', 'Patient', 'admin', 'home_healthcare', 'fitness_center']
			};
		}

		if (!req.is_otp && !req.userpassword) {
			req.userpassword = '';
		}

		if(req.is_mobile){
			whereCondition.phone_code = req.phone_code;
			whereCondition.mobile = req.username;
		} else {
			whereCondition.email = req.username;
		}

		

		return Promise.all([
			models.user.build(req).validate()
		])
		.then(err => {
			if (err[0]) {
				return err[0].errors;
			} else {
				return null;
			}
		})
		.then(errors => {

			if (errors) {
				return new Promise((resolve) => {
					language.errors({
						errors,
						lang: req.lang
					}, errors => resolve({
						errors
					}));
				});
			}

			return models.user.findOne({
				where: whereCondition,
				attributes: [
					'id',
					'email',
					'password',
					'user_name',
					'phone_code',
					'user_type',
					'secondary_lang',
					'roleId',
					'default_lang',
					'createdAt',
					'is_active',
					'is_email_verified'
				],
			}).then(userData => {

				let validateErr = (req.is_mobile ? "Invalid Mobile Number.":"Invalid Email Id.");
				
				if (!userData) {
					return {
						status: false,
						errors: [{
							path: "username",
							message: language.lang({
								key: validateErr,
								lang: req.lang
							})
						}]
					}
				} else if (req.is_otp && userData.email === req.username) {
					return {
						status: false,
						errors: [{
							path: "username",
							message: language.lang({
								key: "OTP login is not possible through email.",
								lang: req.lang
							})
						}]
					}
				} else if (userData.user_type !== 'admin' && userData.email === req.username && userData.is_email_verified === 0 && !req.is_patient && userData.user_type !== 'Patient') {
					return {
						status: false,
						errors: [{
							path: "username",
							message: language.lang({
								key: "Your account email is not verified. To enable login using email, please verify your email id or login using mobile.",
								lang: req.lang
							})
						}]
					}
				} else if(req.is_patient && userData.user_type !== 'Patient') {
					return {
						status: false,
						errors: [{
							path: "username",
							message: language.lang({
								key: req.is_mobile ? "This number is registered as Provider.":"This Email is registered as Provider.",
								lang: req.lang
							})
						}]
					}
				} else if(!req.is_patient && userData.user_type === 'Patient') {
					return {
						status: false,
						errors: [{
							path: "username",
							message: language.lang({
								key: req.is_mobile ? "This number is registered as user.":"This Email is registered as user.",
								lang: req.lang
							})
						}]
					}
				} else if (req.is_otp) {
					return otpmessage.sendOtp({
						phone_code: userData.phone_code,
						mobile: req.username,
						lang: req.lang
					});
				} else {
					if (userData.is_active === 1) {
						if (!bcrypt.compareSync(req.userpassword, userData.password)) {
							return {
								status: false,
								errors: [{
									path: "userpassword",
									message: language.lang({
										key: "Incorrect password please try again.",
										lang: req.lang
									})
								}]
							};
						} else {
							req.userData = userData;
							return module.exports.loginInfo(req)
						}
					} else {
						return {
							status: false,
							message: language.lang({
								key: "Account Deactivated.",
								lang: req.lang
							})
						};
					}
				}
			});
		}).catch(console.log);
	};

	this.loginInfo = req => {
		let userData = req.userData,
			device_type = (typeof req.device_type === 'undefined') ? 'web' : req.device_type,
			deviceType = (req.deviceType == 'DESKTOP') ? 'web' : device_type,
			deviceId = (typeof req.deviceId === 'undefined') ? '' : req.deviceId;
		return Promise.all([
			new Promise(resolve => language.getUserLanguages(userData, (langData) => resolve(langData))),
			new Promise(resolve => language.geLanguageById({
				id: userData.default_lang
			}, (primaryLang) => resolve(primaryLang))),
			new Promise(resolve => module.exports.getProfileById({
				userId: userData.id,
				langId: userData.default_lang
			}, (userInfo) => {
				if (!req.is_patient) delete userInfo.data.patient;
				return resolve(userInfo);
			})),
			new Promise(resolve => module.exports.useInfo({
				id: userData.id,
				languageId: userData.default_lang
			}, (userDetails) => {
				return resolve(userDetails);
			})),
			req.is_patient ?
			new Promise(resolve => resolve(true)) :
			new Promise(resolve => module.exports.getAssociateProfile({
				id: userData.id,
				user_type: userData.user_type,
				lang: userData.default_lang
			}, (associatedProfileData) => {
				return resolve(associatedProfileData);
			})),
			new Promise(resolve => module.exports.checkClaimStatus(
				userData.id
			, (claimRsult) => {
				return resolve(claimRsult);
			})),
			deviceType != 'web' && models.user.update({
				device_id: deviceId,
				device_type: deviceType
			}, {
				where: {
					id: userData.id
				}
			}),
		]).then(([langData, primaryLang, userInfo, userDetails,associatedProfileData,claimRsult]) => {
			
			 	if(claimRsult.data != null) {
                    userInfo.data.check_claim_status = 1;
                } else {
                    userInfo.data.check_claim_status = 0;
                }

                if(associatedProfileData.data != null) {
                    userInfo.data.user_image = associatedProfileData.data.doctor_profile_pic;
                }
			let data = {
				status: true,
				message: language.lang({
					key: "success",
					lang: req.lang
				}),
				primaryLang: {
					code: primaryLang.code,
					name: primaryLang.name,
					direction: primaryLang.direction
				},
				languages: langData,
				servicePath: global.image_url,
				data: userInfo.data,
				userdetails: userDetails,
				currency: '$'
			};
			if (!req.is_patient) {
				data.associatedProfileData = associatedProfileData.data;
				data.allHospitalProfiles = associatedProfileData.allHospitalProfiles;
			}
			return data;
		}).catch(console.log);
	}

	this.getSession = req => {
		return models.user.findOne({
			where: {id: req.id},
			attributes: [
				'id',
				'email',
				'password',
				'user_name',
				'phone_code',
				'user_type',
				'secondary_lang',
				'roleId',
				'default_lang',
				'createdAt',
				'is_active',
				'is_email_verified'
			],
		}).then(userData => {

			let device_type = (typeof req.device_type === 'undefined') ? 'web' : req.device_type,
				deviceType = (req.deviceType == 'DESKTOP') ? 'web' : device_type,
				deviceId = (typeof req.deviceId === 'undefined') ? '' : req.deviceId;
			return Promise.all([
				new Promise(resolve => language.getUserLanguages(userData, (langData) => resolve(langData))),
				new Promise(resolve => language.geLanguageById({
					id: userData.default_lang
				}, (primaryLang) => resolve(primaryLang))),
				new Promise(resolve => module.exports.getProfileById({
					userId: userData.id,
					langId: req.langId
				}, (userInfo) => {
					if (!req.is_patient) delete userInfo.data.patient;
					return resolve(userInfo);
				})),
				new Promise(resolve => module.exports.useInfo({
					id: userData.id,
					languageId: req.langId
				}, (userDetails) => {
					return resolve(userDetails);
				})),
				req.is_patient ?
				new Promise(resolve => resolve(true)) :
				new Promise(resolve => module.exports.getAssociateProfile({
					id: userData.id,
					user_type: userData.user_type,
					lang: req.lang
				}, (associatedProfileData) => {
					return resolve(associatedProfileData);
				})),
				new Promise(resolve => module.exports.checkClaimStatus(
					userData.id
				, (claimRsult) => {
					return resolve(claimRsult);
				})),
				deviceType != 'web' && models.user.update({
					device_id: deviceId,
					device_type: deviceType
				}, {
					where: {
						id: userData.id
					}
				}),
			]).then(([langData, primaryLang, userInfo, userDetails,associatedProfileData,claimRsult]) => {
				
				 	if(claimRsult.data != null) {
	                    userInfo.data.check_claim_status = 1;
	                } else {
	                    userInfo.data.check_claim_status = 0;
	                }

	                if(associatedProfileData.data != null) {
	                    userInfo.data.user_image = associatedProfileData.data.doctor_profile_pic;
	                }
				let data = {
					status: true,
					message: language.lang({
						key: "success",
						lang: req.lang
					}),
					primaryLang: {
						code: primaryLang.code,
						name: primaryLang.name,
						direction: primaryLang.direction
					},
					languages: langData,
					servicePath: global.image_url,
					data: userInfo.data,
					userdetails: userDetails,
					currency: '$'
				};
				if (!req.is_patient) {
					data.associatedProfileData = associatedProfileData.data;
					data.allHospitalProfiles = associatedProfileData.allHospitalProfiles;
				}
				return data;
			}).catch(console.log);
		});
	}

	this.getAssociateProfile = function (req, res) {
		//{user_type, id}
		if (req.user_type === 'admin') {
			res({
				data: null
			});
		} else {
			let getModel;
			(req.user_type === 'doctor' || req.user_type === 'doctor_clinic_both') && (getModel = 'doctorprofile');
			req.user_type === 'hospital' && (getModel = 'hospital');
			req.user_type === 'home_healthcare' && (getModel = 'healthcareprofile');

			if (req.user_type === 'doctor' || req.user_type === 'doctor_clinic_both') {
				models.doctorprofile.findOne({
					attributes: ["id", "claim_status", "is_active", "is_complete", "is_live", "verified_status","doctor_profile_pic"],
					where: {
						userId: req.id
					}
				}).then(function (data) {
					if (req.user_type === 'doctor_clinic_both') {
						//to find all hospital profiles of user
						models.hospital.hasMany(models.hospitaldetail);
						models.hospital.findAll({
							attributes: ["id", "claim_status", "is_active", "is_complete", "is_live", "verified_status"],
							include: [{
								model: models.hospitaldetail,
								attributes: ["hospital_name"],
								where: language.buildLanguageQuery({}, req.lang, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
							}],
							where: {
								userId: req.id
							}
						}).then(function (allProfiles) {
							res({
								data: data,
								allHospitalProfiles: allProfiles
							});
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						}));
					} else {
						res({
							data: data,
							allHospitalProfiles: null
						});
					}
				}).catch(() => res({
					status: false,
					error: true,
					error_description: language.lang({
						key: "Internal Error",
						lang: req.lang
					}),
					url: true
				}));
			} else if (req.user_type === 'hospital') {
				models.hospital.findOne({
					attributes: ["id", "claim_status", "is_active", "is_complete", "is_live", "verified_status"],
					where: {
						userId: req.id,
						headId: null
					}
				}).then(function (data) {
					//to find all hospital profiles of user
					models.hospital.hasMany(models.hospitaldetail);
					models.hospital.findAll({
						attributes: ["id", "claim_status", "is_active", "is_complete", "is_live", "verified_status"],
						include: [{
							model: models.hospitaldetail,
							attributes: ["hospital_name"],
							where: language.buildLanguageQuery({}, req.lang, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
						}],
						where: {
							userId: req.id
						}
					}).then(function (allProfiles) {
						res({
							data: data,
							allHospitalProfiles: allProfiles
						});
					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}).catch(() => res({
					status: false,
					error: true,
					error_description: language.lang({
						key: "Internal Error",
						lang: req.lang
					}),
					url: true
				}));
			} else if (req.user_type === 'home_healthcare') {
				models.healthcareprofile.findOne({
					attributes: ["id", "is_active", "is_complete", "is_live"],
					where: {
						userId: req.id
					}
				}).then(function (data) {
					res({
						data: data,
						allHospitalProfiles: null
					});
				}).catch(() => res({
					status: false,
					error: true,
					error_description: language.lang({
						key: "Internal Error",
						lang: req.lang
					}),
					url: true
				}));
			} else if (req.user_type === 'fitness_center') {
				models.fitnesscenter.findOne({
					where: {
						userId: req.id,
					},
					attributes: ['is_live'],
				})
					.then(data => res({data}))
			} else {
				res({
					data: null,
					allHospitalProfiles: null
				});
			}
		}
	}

	this.useInfo = function (req, res) {
		var userInfo = {};
		var isWhere = {};
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, req.languageId, '`user`.`id`', models.userdetail, 'userId'
		);

		models.user.hasMany(models.userdetail);

		models.user.find({
			include: [{
				model: models.userdetail,
				where: isWhere.userdetail
			}],
			where: {
				id: req.id
			},
			attributes: ['id', 'email', 'password', 'user_name', 'user_type', 'secondary_lang', 'roleId', 'default_lang', 'createdAt', 'is_active']
		}).then(function (userData) {


			userInfo.userId = userData.id;
			userInfo.fullname = userData.userdetails[0].fullname;
			res(userInfo);

		}).catch(() => res({
			status: false,
			error: true,
			error_description: language.lang({
				key: "Internal Error",
				lang: req.lang
			}),
			url: true
		}));
	};

	/*
	 * get patient profile data
	 */
	this.getProfileById = function (req, res) {
		models.user.hasMany(models.userdetail);
		models.user.hasOne(models.patient, {
			foreignKey: 'userId'
		});
		models.patient.hasMany(models.patientdetail);
		models.patient.belongsTo(models.country);
		models.patient.belongsTo(models.state);
		models.patient.belongsTo(models.city);
		models.country.hasMany(models.countrydetail);
		models.state.hasMany(models.statedetail);
		models.city.hasMany(models.citydetail);
		models.patient.hasMany(models.patienttag);
		models.patienttag.belongsTo(models.tag);
		models.tag.hasMany(models.tagdetail);

		var isWhere = {};
		isWhere.userdetail = language.buildLanguageQuery(
			isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId'
		);
		isWhere.patientdetail = language.buildLanguageQuery(
			isWhere.patientdetail, req.langId, '`patient`.`id`', models.patientdetail, 'patientId'
		);
		isWhere.countrydetail = language.buildLanguageQuery(
			isWhere.countrydetail, req.langId, '`patient.country`.`id`', models.countrydetail, 'countryId'
		);
		isWhere.statedetail = language.buildLanguageQuery(
			isWhere.statedetail, req.langId, '`patient.state`.`id`', models.statedetail, 'stateId'
		);
		isWhere.citydetail = language.buildLanguageQuery(
			isWhere.citydetail, req.langId, '`patient.city`.`id`', models.citydetail, 'cityId'
		);

		Promise.all([
			models.user.find({
				include: [{
					model: models.userdetail,
					where: isWhere.userdetail,
					required: false
				}, {
					model: models.patient,
					include: [{
						model: models.patientdetail,
						where: isWhere.patientdetail,
						required: false
					}, {
						model: models.patienttag,
						include: [{
							model: models.tag,
							include: [{
								model: models.tagdetail,
								required: false
							}],
							required: false
						}],
						required: false
					}, {
						model: models.country,
						include: [{
							model: models.countrydetail,
							where: isWhere.countrydetail,
							required: false
						}],
						required: false
					}, {
						model: models.state,
						include: [{
							model: models.statedetail,
							where: isWhere.statedetail,
							required: false
						}],
						required: false
					}, {
						model: models.city,
						include: [{
							model: models.citydetail,
							where: isWhere.citydetail,
							required: false
						}],
						required: false
					}],
					required: false,
				}],
				where: {
					id: req.userId
				}
			}),
			models.subscriber.findOne({
				attributes: ['end_date'],
				where: {
					userId: req.userId,
					payment_status: 'success'
				},
				order: [
					['id', 'DESC']
				]
			})
		]).then(([data, subscriber]) => {
			data = JSON.parse(JSON.stringify(data));
			let subscription = false;
			if (subscriber) {
				subscription = moment(subscriber.end_date).isSameOrAfter(new Date());
			}
			data.subscription = subscription;
			res({
				status: true,
				message: 'Patient profile data',
				data: data
			});
		});
	};

	this.register = req => {

		if (typeof req.is_active === 'undefined') {
			req.is_active = 1;
		}

		if(req.phone_code) {
			req.phone_code = req.phone_code.toString().replace('+', '');
		}

		req.user_detail = {};
		req.user_detail.languageId = req.langId;
		req.user_detail.fullname = req.name;

		let passwordForMail = req.password;

		models.user.hasMany(models.userdetail);

		return Promise.all([
			models.user.build(req).validate(),
			models.userdetail.build(req.user_detail).validate()
		])
		.then(err => {
			if (err[0]) {
				if (err[1])
					return err[0].errors.concat(err[1].errors);
				else
					return err[0].errors;
			} else {
				if (err[1])
					return err[1].errors;
				else
					return null;
			}
		})
		.then(errors => {

			if (errors) {
				return new Promise((resolve) => {
					language.errors({
						errors,
						lang: req.lang
					}, errors => resolve({
						errors,
						status: false
					}));
				});
			}

			if (typeof req.password !== 'undefined') {
				req.password = bcrypt.hashSync(req.password, null, null);
			}
			delete req.confirm_password;

			if(req.otp && req.otp !==''){
				return otpmessage.verifyOtp({
					mobile: req.mobile,
					otp: req.otp,
					lang: req.lang
				}).then(result => {
					if (!result.status) return result;
					let token = randomstring.generate();

					req.reset_password_token = token;
					req.userdetails = [req.user_detail];

					if (req.langId != 1) {
						let userdetails = JSON.parse(JSON.stringify(req.user_detail));
						userdetails.languageId = 1;
						req.userdetails.push(userdetails);
					}
					return models.user.create(req, {
						include: [{
							model: models.userdetail
						}]
					}).then(user => {
						return ((req.user_type === 'fitness_center' || req.user_type === 'home_healthcare') ?
						Promise.resolve(null) : subscription.createTrialPlan({
								userId: user.id
						})).then(() => {
							let mailData = {
								email: req.email,
								verificationUrl: typeof req.verificationUrl !== 'undefined' ? req.verificationUrl+token : "https://providers.wikicare.co/email-verification/"+token,
								fullname: req.name,
								mobile: req.mobile,
								password: passwordForMail,
								lang: req.lang || 'en',
								langId: req.langId,
								user_type: req.user_type
							};
							mail.welcomeEmail(mailData);
							return models.user.findOne({
								where: {
									id: user.id
								},
								attributes: [
									'id',
									'email',
									'password',
									'user_name',
									'user_type',
									'secondary_lang',
									'roleId',
									'default_lang',
									'createdAt',
									'is_active'
								]
							}).then(userData => {
								req.userData = userData;
								return module.exports.loginInfo(req).then(result => {
									result.message = language.lang({
										key: "Registration Successfully.",
										lang: req.lang
									});

									return result;
								})
							}).catch(() => ({
								status: false,
								error: true,
								error_description: language.lang({
									key: "Internal Error",
									lang: req.lang
								}),
								url: true
							}));
						});
					}).catch(() => ({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				});
			} else {
				return otpmessage.sendOtp({
					phone_code: req.phone_code,
					mobile: req.mobile,
					lang: req.lang
				});
			}

		}).catch(console.log);
	};

	this.registerPatient = req => {

		if (typeof req.is_active === 'undefined') {
			req.is_active = 1;
		}

		if(req.phone_code) {
			req.phone_code = req.phone_code.toString().replace('+', '');
		}

		req.user_detail = {};
		req.user_detail.languageId = req.langId;
		req.user_detail.fullname = req.name;
		req.roleId = 2;

		let passwordForMail = req.password;

		models.user.hasMany(models.userdetail);
		models.patient.hasMany(models.patientdetail);

		return Promise.all([
			models.user.build(req).validate(),
			models.userdetail.build(req.user_detail).validate()
		])
		.then(err => {
			if (err[0]) {
				if (err[1])
					return err[0].errors.concat(err[1].errors);
				else
					return err[0].errors;
			} else {
				if (err[1])
					return err[1].errors;
				else
					return null;
			}
		})
		.then(errors => {

			if (errors) {
				return new Promise((resolve) => {
					language.errors({
						errors,
						lang: req.lang
					}, errors => resolve({
						errors
					}));
				});
			}

			if (typeof req.password !== 'undefined') {
				req.password = bcrypt.hashSync(req.password, null, null);
			}
			delete req.confirm_password;

			if(req.otp && req.otp !==''){
				return otpmessage.verifyOtp({
					mobile: req.mobile,
					otp: req.otp,
					lang: req.lang
				}).then(result => {
					if (!result.status) return result;

					let token = randomstring.generate();

					req.reset_password_token = token;
					req.userdetails = [req.user_detail];
					req.patientdetails = [{
						languageId: req.langId
					}];

					if (req.langId != 1) {
						let userdetails = JSON.parse(JSON.stringify(req.user_detail)),
							patientdetails = JSON.parse(JSON.stringify(req.patientdetails[0]));
						userdetails.languageId = 1;
						patientdetails.languageId = 1;
						req.userdetails.push(userdetails);
						req.patientdetails.push(patientdetails);
					}

					console.log(req.patientdetails)

					return models.user.create(req, {
						include: [{
							model: models.userdetail
						}]
					}).then(user => {

						let patient = {
							userId: user.id,
							patientdetails: req.patientdetails
						};

						return models.patient.create(patient, {
							include: [{
								model: models.patientdetail
							}]
						}).then(patientData => {

							let mailData = {
								email: req.email,
								verificationUrl: req.verificationUrl+token,
								fullname: req.name,
								mobile: req.mobile,
								password: passwordForMail,
								lang: req.lang || 'en',
								langId: req.langId,
								user_type: req.user_type
							};
							mail.welcomeEmail(mailData);

							return models.user.findOne({
								where: {
									id: user.id
								},
								attributes: [
									'id',
									'email',
									'password',
									'user_name',
									'user_type',
									'secondary_lang',
									'roleId',
									'default_lang',
									'createdAt',
									'is_active'
								]
							}).then(userData => {
								req.userData = userData;
								req.is_patient = true;
								return module.exports.loginInfo(req)
							}).catch(() => ({
								status: false,
								error: true,
								error_description: language.lang({
									key: "Internal Error",
									lang: req.lang
								}),
								url: true
							}));
						}).catch(() => ({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						}));
					}).catch(() => ({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				});
			} else {
				return otpmessage.sendOtp({
					phone_code: req.phone_code,
					mobile: req.mobile,
					lang: req.lang
				});
			}

		}).catch(console.log);
	};

	this.resetpasswordOtp = req => {
		let user_type = {$ne: 'Patient'};
		if(req.isPatient) {
			user_type = 'Patient';
		}
		return models.user.findOne({
			where: {
				phone_code: req.phone_code,
				mobile: req.mobile,
				user_type: user_type
			}
		}).then(userData => {
			if (!userData) {
				return {
					status: false,
					errors: [{
						path: "mobile",
						message: language.lang({
							key: 'Invalid Mobile Number.',
							lang: req.lang
						})
					}]
				}
			} else {
				if(req.otp && req.otp !==''){

					return Promise.all([
						models.user.build({
							password: req.password,
							confirm_password: req.confirm_password
						}).validate()
					])
					.then(err => {
						if (err[0]) {
							return err[0].errors;
						} else {
							return null;
						}
					})
					.then(errors => {

						if (errors) {
							return new Promise((resolve) => {
								language.errors({
									errors,
									lang: req.lang
								}, errors => resolve({
									errors
								}));
							});
						}

						return otpmessage.verifyOtp({
							mobile: req.mobile,
							otp: req.otp,
							lang: req.lang
						}).then(result => {

							if (!result.status) return result;

							return models.user.update({
								password: bcrypt.hashSync(req.password, null, null)
							}, {
								where: {
									id: userData.id
								}
							}).then(() => ({
								status: true,
								message: language.lang({
									key: 'updatedSuccessfully',
									lang: req.lang
								})
							})).catch(() => ({
								status: false,
								error: true,
								error_description: language.lang({
									key: "Internal Error",
									lang: req.lang
								}),
								url: true
							}));
						});
					});

				} else {
					return otpmessage.sendOtp({
						phone_code: userData.phone_code,
						mobile: req.mobile,
						lang: req.lang
					});
				}
			}
		});
	};

	this.updatePassword = function(req, res) {
		models.user.findOne({
			where: {id: req.id}
		}).then(userData => {
			if (!userData) {
				res({
					status: false,
					errors: [{
						path: "Invalid User.",
						message: language.lang({
							key: 'Invalid User.',
							lang: req.lang
						})
					}]
				})
			} else {
				var errors = [];
				var user = models.user.build(req);
				async.parallel([
			        function (callback) {
			        	user.validate().then(function (err) {
			                if (err !== null) {
			                    errors = errors.concat(err.errors);
			                    callback(null, errors);
			                } else {
			                    callback(null, errors);
			                }

			            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			        }
			    ], function (err, errors) {
			    	var merged = [].concat.apply([], errors);
					var uniqueError = merged.filter(function(elem, pos) {
						return merged.indexOf(elem) == pos;
					});
					if (uniqueError.length === 0) {
						models.user.update({
							password: bcrypt.hashSync(req.new_password, null, null)
						}, {
							where: {
								id: userData.id
							}
						}).then(function() {
							let mailData = {
								email: userData.email,
								password: req.new_password,
								lang: req.lang || 'en'
							};
							mail.adminResetPassword(mailData);

							res({
								status: true,
								message: language.lang({
									key: 'updatedSuccessfully',
									lang: req.lang
								})	
							})
						})
						// .catch(() => res({
						// 	status: false,
						// 	error: true,
						// 	error_description: language.lang({
						// 		key: "Internal Error",
						// 		lang: req.lang
						// 	}),
						// 	url: true
						// }));
					} else {
						language.errors({
							errors: uniqueError,
							lang: req.lang
						}, function(errors) {
							var newArr = {};
							newArr.errors = errors;
							res(newArr);
						});
					}
			    })
			}
		})
	}

	this.logout = (id, device_id) =>
		models.user.update(
			{
				device_id: null
			},
			{
				where: {id, device_id},
			}
		);

	this.updateDeviceId = (id, device_id) =>
		models.user.update(
			{
				device_id,
			},
			{
				where: {id},
			}
		);
}
module.exports = new myController();