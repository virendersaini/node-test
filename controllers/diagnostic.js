var async = require('async');
const models = require('../models');
var language = require('./language');
var users = require('./users');
var oauth = require('./oauth');
var country = require('./country');
var state = require('./state');
var city = require('./city');
var tagtype = require('./tagtype');
var mongo = require('../config/mongo');
var utils = require('./utils');
var freeqa = require('./freeqa');
var NodeGeocoder = require('node-geocoder')
var moment = require('moment');
var notification=require('./notification');
function diagnostic() {
	/*
	 * Get all countries
	 */
	this.getAllCountry = function(req, res) {
		country.getAllCountry(req, function(countries) {
			res({
				countries: countries
			});
		});
	}

	this.listDoctor = function(req, res) {

		let isWhere = {};

		//models.doctorprofile.hasMany(models.doctorprofiledetail, {as: 'doctorprofiledetails'});

		models.doctorprofile.hasMany(models.doctorprofiledetail);

		isWhere.doctorprofiledetail = language.buildLanguageQuery(
			{}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'
		);


		models.doctorprofile.findAll({
			include: [{
				model: models.doctorprofiledetail,
				where: isWhere.doctorprofiledetail,
				//attributes : ["name", "address_line_1"],
				//required: true
			}, ],
			where: isWhere.doctorprofile,
			order: [
				['id', 'DESC']
			],
			distinct: true,
		}).then(function(result) {
			res({
				data: result
			});
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
	}

	/*
	 * Get list
	 */
	this.list = function(req, res) {
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
			async.forEach(Object.keys(req.query), function(item, callback) {
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
			}, function() {
				isWhere = responseData;
			});
		}

		orderBy = 'id DESC';

		if (typeof isWhere.contactinformation === "undefined") {
			isWhere.contactinformation = {
				type: 'email',
				is_primary: 1,
				model: 'doctorprofile'
			}
		} else {
			isWhere.contactinformation.type = 'email';
			isWhere.contactinformation.is_primary = 1;
			isWhere.contactinformation.model = 'doctorprofile';
		}

		models.doctorprofile.hasMany(models.doctorprofiledetail);

		isWhere.doctorprofiledetail = language.buildLanguageQuery(isWhere.doctorprofiledetail, reqData.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId');

		models.doctorprofile.belongsTo(models.user)
		models.user.hasMany(models.userdetail)

		models.doctorprofile.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

		models.doctorprofile.findAndCountAll({
			include: [{
					model: models.doctorprofiledetail,
					where: isWhere.doctorprofiledetail
				},
				{
					model: models.user,
					include: [{
						model: models.userdetail,
						where: language.buildLanguageQuery({}, reqData.langId, '`user`.`id`', models.userdetail, 'userId'),
						required: false
					}],
					required: false
				},
				{
					model: models.contactinformation,
					where: isWhere.contactinformation,
				},
			],
			where: isWhere.doctorprofile,
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag, //subQuery: false
		}).then(function(result) {
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);
			res({
				data: result.rows,
				totalData: totalData,
				pageCount: pageCount,
				pageLimit: setPage,
				currentPage: currentPage
			});
		}).catch(() => res({
			status: false,
			error: true,
			error_description: language.lang({
				key: "Internal Error",
				lang: reqData.lang
			}),
			url: true
		}));
	};

	/*
	 * save
	 */
	this.saveBasicDetails = function(req, res) {
		if (typeof req.is_active === 'undefined') {
			req.is_active = 0;
		}

		req.diagnostic_details = JSON.parse(req.diagnostic_details)
		let contact_infos = JSON.parse(req.contact_informations)
		let contact_emails = contact_infos.emails,
			contact_mobiles = contact_infos.mobiles;
		req.contact_informations = contact_infos.emails.concat(contact_infos.mobiles)

		var DiagnosticHasOne = models.diagnostic.hasOne(models.diagnosticdetail, {
			as: 'diagnostic_details'
		});
		req.diagnostic_details.languageId = req.langId;
		var diagnostic = models.diagnostic.build(req);
		var diagnosticDetails = models.diagnosticdetail.build(req.diagnostic_details);

		var errors = [];
		async.parallel([
			function(callback) {
				diagnostic.validate().then(function(err) {
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
			function(callback) {
				diagnosticDetails.validate().then(function(err) {
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
			function(callback) {
				async.forEachOf(contact_emails, function(values, key, callback) {
					let fieldType = values.type;
					var contactInfo = models.contactinformation.build(values);
					contactInfo.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = fieldType + '___' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},
			function(callback) {
				async.forEachOf(contact_mobiles, function(values, key, callback) {
					let fieldType = values.type;
					var contactInfo = models.contactinformation.build(values);
					contactInfo.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = fieldType + '___' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			}
		], function(err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				if (typeof req.id !== 'undefined' && req.id !== '') {


					//json object update in mongodb
					if (typeof req.profile_pic == 'undefined') {
						models.diagnostic.find({
							attributes: ['profile_pic'],
							where: {
								id: req.id
							}
						}).then(function(profile_pic) {

							req.profile_pic = profile_pic.profile_pic;
						})
					}
					req.diagnostic_details.diagnosticId = req.id;
					models.diagnostic.update(req, {
						where: {
							id: req.id
						},
						individualHooks: true
					}).then(function(data) {

						models.diagnosticdetail.find({
							where: {
								diagnosticId: req.id,
								languageId: req.langId
							}
						}).then(function(resultData) {
							if (resultData !== null) {
								req.diagnostic_details.id = resultData.id;
								console.log(req.diagnostic_details)
								models.diagnosticdetail.update(req.diagnostic_details, {
									where: {
										id: resultData.id,
										diagnosticId: req.id,
										languageId: req.langId
									},
									individualHooks: true
								}).then(function() {
									models.contactinformation.destroy({
										where: {
											key: req.id,
											model: 'doctorprofile'
										}
									}).then(function(CIDeleteStatus) {
										models.contactinformation.bulkCreate(req.contact_informations).then(function(CIStatus) {
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
								delete req.diagnostic_details.id;
								models.diagnosticdetail.create(req.diagnostic_details).then(function() {
									models.contactinformation.destroy({
										where: {
											key: req.id,
											model: 'doctorprofile'
										}
									}).then(function(CIDeleteStatus) {
										models.contactinformation.bulkCreate(req.contact_informations).then(function(CIStatus) {
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
					var langId = parseInt(req.diagnostic_details.languageId);
					req.is_complete = 0, req.is_live = 0;
					models.diagnostic.create(req, {
						include: [DiagnosticHasOne]
					}).then(function(data) {


						let contactsInfoData = []
						async.forEachOf(req.contact_informations, function(civalues, cikey, CICallback) {
							let setCIData = civalues;
							setCIData.key = data.id;
							contactsInfoData.push(setCIData)
							CICallback()
						}, function(err) {
							if (err) {
								res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error",
										lang: req.lang
									}),
									url: true
								})
							} else {
								models.contactinformation.bulkCreate(contactsInfoData).then(function(CIStatus) {
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
										req.diagnostic_details.diagnosticId = data.id;
										req.diagnostic_details.languageId = 1;
										models.diagnosticdetail.create(req.diagnostic_details).then(function() {
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
							}
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
		});
	};

	/*
	 * for superadmin 
	 */
	this.saveAdditionalInfo = function(req, res) {
		//console.log('===========save data info==========');
		//console.log(req)
		let doctorEducations = JSON.parse(req.doctorEducations),
			doctorExperiences = JSON.parse(req.doctorExperiences),
			doctorRegistrations = JSON.parse(req.doctorRegistrations),
			doctorAwards = JSON.parse(req.doctorAwards),
			doctortags = JSON.parse(req.doctor_tags);

		async.forEachOf(doctorEducations, function(values, key) {
			if ("undefined" === typeof req['edu_proof___' + key]) {
				doctorEducations[key]['edu_proof'] = values.edu_proof;
				doctorEducations[key]['edu_proof_file_name'] = values.edu_proof_file_name;
			} else {
				doctorEducations[key]['edu_proof'] = req['edu_proof___' + key];
				doctorEducations[key]['edu_proof_file_name'] = req['edu_proof___' + key + '___original_name'];
			}
		});

		async.forEachOf(doctorRegistrations, function(values, key) {
			if ("undefined" === typeof req['reg_proof___' + key]) {
				doctorRegistrations[key]['reg_proof'] = values.reg_proof;
				doctorRegistrations[key]['reg_proof_file_name'] = values.reg_proof_file_name;
			} else {
				doctorRegistrations[key]['reg_proof'] = req['reg_proof___' + key];
				doctorRegistrations[key]['reg_proof_file_name'] = req['reg_proof___' + key + '___original_name'];
			}
		});

		var errors = []
		async.parallel([
			function(callback) {
				async.forEachOf(doctorEducations, function(values, key, callback) {
					var doctorEducationBuild = models.doctoreducation.build(values);
					doctorEducationBuild.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = errObj.path + '_' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},
			function(callback) {
				async.forEachOf(doctorExperiences, function(values, key, callback) {
					var doctordoctorExperienceBuild = models.doctorexperience.build(values);
					doctordoctorExperienceBuild.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = errObj.path + '_' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},
			function(callback) {
				async.forEachOf(doctorRegistrations, function(values, key, callback) {
					var doctorRegistrationBuild = models.doctorregistration.build(values);
					doctorRegistrationBuild.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = errObj.path + '_' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},
			function(callback) {
				async.forEachOf(doctorAwards, function(values, key, callback) {
					var doctorAwardBuild = models.doctoraward.build(values);
					doctorAwardBuild.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = errObj.path + '_' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},
		], function(err, errors) {

			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				async.parallel([
					function(callback) {
						models.doctortags.destroy({
							where: {
								doctorProfileId: req.id
							}
						}).then((data) => {
							callback(null, true);
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
					function(callback) {
						models.doctoreducation.hasMany(models.doctoreducationdetail);
						models.doctoreducation.findAll({
							include: [{
								model: models.doctoreducationdetail,
								where: language.buildLanguageQuery({}, req.langId, '`doctor_educations`.`id`', models.doctoreducationdetail, 'doctorEducationId')
							}, ],
							where: {
								doctorProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.doctoreducationdetail.destroy({
										where: {
											doctorEducationId: values.id
										}
									}).then((idata) => {
										models.doctoreducation.destroy({
											where: {
												id: values.id
											}
										}).then((data) => {
											icallback(null)
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
								}, function(innErrr) {
									callback(null, true);
								});
							} else {
								callback(null, true);
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
					function(callback) {
						models.doctorexperience.hasMany(models.doctorexperiencedetail);
						models.doctorexperience.findAll({
							include: [{
								model: models.doctorexperiencedetail,
								where: language.buildLanguageQuery({}, req.langId, '`doctor_experiences`.`id`', models.doctorexperiencedetail, 'doctorExperienceId')
							}, ],
							where: {
								doctorProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.doctorexperiencedetail.destroy({
										where: {
											doctorExperienceId: values.id
										}
									}).then((idata) => {
										models.doctorexperience.destroy({
											where: {
												id: values.id
											}
										}).then((data) => {
											icallback(null)
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
								}, function(innErrr) {
									callback(null, true);
								});
							} else {
								callback(null, true);
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
					function(callback) {
						models.doctorregistration.hasMany(models.doctorregistrationdetail);
						models.doctorregistration.findAll({
							include: [{
								model: models.doctorregistrationdetail,
								where: language.buildLanguageQuery({}, req.langId, '`doctor_registrations`.`id`', models.doctorregistrationdetail, 'doctorRegistrationId')
							}, ],
							where: {
								doctorProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.doctorregistrationdetail.destroy({
										where: {
											doctorRegistrationId: values.id
										}
									}).then((idata) => {
										models.doctorregistration.destroy({
											where: {
												id: values.id
											}
										}).then((data) => {
											icallback(null)
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
								}, function(innErrr) {
									callback(null, true);
								});
							} else {
								callback(null, true);
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
					function(callback) {
						models.doctoraward.hasMany(models.doctorawarddetail);
						models.doctoraward.findAll({
							include: [{
								model: models.doctorawarddetail,
								where: language.buildLanguageQuery({}, req.langId, '`doctor_awards`.`id`', models.doctorawarddetail, 'doctorAwardId')
							}, ],
							where: {
								doctorProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.doctorawarddetail.destroy({
										where: {
											doctorAwardId: values.id
										}
									}).then((idata) => {
										models.doctoraward.destroy({
											where: {
												id: values.id
											}
										}).then((data) => {
											icallback(null)
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
								}, function(innErrr) {
									callback(null, true);
								});
							} else {
								callback(null, true);
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
				], function(err) {
					if (err) {
						res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						})
					} else {
						async.parallel([
							function(callback) {
								async.forEach(doctorEducations, function(values, edu_callback) {
									var doctorEducationHasOne = models.doctoreducation.hasOne(models.doctoreducationdetail, {
										as: 'doctor_education_details'
									});
									values.doctor_education_details = {
										college_name: values.college_name,
										languageId: req.langId
									};
									models.doctoreducation.create(values, {
										include: [doctorEducationHasOne]
									}).then(function(data) {
										edu_callback(null)
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true)
								});
							},
							function(callback) {
								async.forEach(doctorExperiences, function(values, edu_callback) {
									var doctorExperienceHasOne = models.doctorexperience.hasOne(models.doctorexperiencedetail, {
										as: 'doctor_experience_details'
									});
									values.doctor_experience_details = {
										clinic_hospital_name: values.clinic_hospital_name,
										city_name: values.city_name,
										languageId: req.langId
									};
									models.doctorexperience.create(values, {
										include: [doctorExperienceHasOne]
									}).then(function(data) {
										edu_callback(null)
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true)
								});
							},
							function(callback) {
								async.forEach(doctorRegistrations, function(values, edu_callback) {
									var doctorRegistrationHasOne = models.doctorregistration.hasOne(models.doctorregistrationdetail, {
										as: 'doctor_registration_details'
									});
									values.doctor_registration_details = {
										council_name: values.council_name,
										languageId: req.langId
									};
									models.doctorregistration.create(values, {
										include: [doctorRegistrationHasOne]
									}).then(function(data) {
										edu_callback(null)
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true)
								});
							},
							function(callback) {
								async.forEach(doctorAwards, function(values, edu_callback) {
									var doctorAwardHasOne = models.doctoraward.hasOne(models.doctorawarddetail, {
										as: 'doctor_award_details'
									});
									values.doctor_award_details = {
										award_gratitude_title: values.award_gratitude_title,
										languageId: req.langId
									};
									models.doctoraward.create(values, {
										include: [doctorAwardHasOne]
									}).then(function(data) {
										edu_callback(null)
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true)
								});
							},
							function(callback) {
								models.doctortags.bulkCreate(doctortags).then(function(data) {
									callback(null, true)
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
						], function(err) {
							if (err) {
								res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error",
										lang: req.lang
									}),
									url: true
								})
							} else {
								module.exports.updateProfileStatusWhileUpdate({
									id: req.id,
									langId: req.langId
								}, function(resp) {
									if (resp.status) {
										res({
											status: true,
											message: language.lang({
												key: "addedSuccessfully",
												lang: req.lang
											}),
											data: resp.data
										});
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
								})
							}
						})
					}
				})
			} else {
				language.errors({
					errors: uniqueError,
					lang: req.lang
				}, function(errors) {
					var newArr = {};
					newArr.message = language.lang({
						key: "validationFailed",
						lang: req.lang
					});
					newArr.errors = errors;
					res(newArr);
				});
			}
		});
	}



this.saveDoctorRegistration = (req,res) =>{
	var errors=[];
	models.doctorregistration.build(req);
	var doctorRegistrationHasOne = models.doctorregistration.hasOne(models.doctorregistrationdetail);
	models.doctorregistration.build(req);

		req.doctorregistrationdetail = {
			council_name: req.council_name,
			languageId: req.langId
		};
	if(typeof req.id !== 'undefined' && req.id!==''){
		models.doctorregistration.update(
			req,
			{
				returning: true,
				where:{id:req.id}
			}).then(function(data){
				models.doctorregistrationdetail.find({
					where: {
						doctorRegistrationId: req.id,
						languageId: req.langId
					}
					}).then(function(resultData) {
						if (resultData !== null) {
									doctorregistrationdetail = {
									council_name: req.council_name,
									doctorRegistrationId: req.id
								};
							models.doctorregistrationdetail.update(doctorregistrationdetail, {
								where: {
									id: resultData.id,
								},
								individualHooks: true
							}).then(udatedata =>{
								models.doctorregistration.hasMany(models.doctorregistrationdetail);
						models.doctorregistration.findOne({
							where:{id:req.id},
							include:[
								{		
									model: models.doctorregistrationdetail,attributes:['council_name'],
									required:false,
									where: language.buildLanguageQuery({}, req.langId, '.doctorregistration.id', models.doctorregistrationdetail, 'doctorRegistrationId')
								}
							]

						}).then(data1 =>{
							res({
								status: true,
								message: language.lang({
									key: "updatedSuccessfully",
									lang: req.lang
								}),
								data: data1
							});
						})
							})
						}else{
							req.doctorregistrationdetail.doctorRegistrationId=req.id
							models.doctorregistrationdetail.create(req.doctorregistrationdetail).then((data)=>{

				models.doctorregistration.hasMany(models.doctorregistrationdetail);
						models.doctorregistration.findOne({
							where:{id:req.id},
							include:[
								{		
									model: models.doctorregistrationdetail,attributes:['council_name'],
									required:false,
									where: language.buildLanguageQuery({}, req.langId, '.doctorregistration.id', models.doctorregistrationdetail, 'doctorRegistrationId')
								}
							]

						}).then(data1 =>{
							res({
								status: true,
								message: language.lang({
									key: "updatedSuccessfully",
									lang: req.lang
								}),
								data: data1
							});
						})


							})
						}
						
					})

	}).catch((err) =>{
		if (err != null) {
		async.forEach(err.errors, function(errObj, inner_callback) {
		errObj.path = errObj.path;
		errors = errors.concat(errObj);
	});
		var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			res({errors:uniqueError,status:false,message:'Validation errors'})
	}
		
	})
	}else{
	models.doctorregistration.create(req,{include:[doctorRegistrationHasOne]}).then((data)=>{
		models.doctorregistration.hasMany(models.doctorregistrationdetail);
						models.doctorregistration.findOne({
							where:{id:data.id},
							include:[
								{		
									model: models.doctorregistrationdetail,attributes:['council_name'],
									required:false,
									where: language.buildLanguageQuery({}, req.langId, '.doctorregistration.id', models.doctorregistrationdetail, 'doctorRegistrationId')
								}
							]

				}).then(data1 =>{
					res({
						status: true,
						message: language.lang({
							key: "updatedSuccessfully",
							lang: req.lang
						}),
						data: data1
					});
				})
	}).catch((err) =>{
		if (err != null) {
		async.forEach(err.errors, function(errObj, inner_callback) {
		errObj.path = errObj.path;
		errors = errors.concat(errObj);
	});
		var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			res({errors:uniqueError,status:false,message:'Validation errors'})
	}
	})
}
}




this.saveDoctorEducation = (req,res) =>{
	var errors=[];
	var doctorEducationHasOne = models.doctoreducation.hasOne(models.doctoreducationdetail, {as: 'doctor_education_details'});
	models.doctoreducation.build(req);

		req.doctor_education_details = {
			college_name: req.college_name,
			languageId: req.langId
		};

	models.doctoreducation.create(req,{include: [doctorEducationHasOne]}).then((data)=>{

		models.doctoreducation.belongsTo(models.tag,{'foreignKey':'tagtypeId'});
		models.doctoreducation.hasMany(models.doctoreducationdetail);
		models.tag.hasMany(models.tagdetail);
		models.doctoreducation.findAll({
			where:{doctorProfileId:req.doctorProfileId},
			include:[
			{
					model: models.doctoreducationdetail,attributes:['college_name'],
					required:false,
					where: language.buildLanguageQuery({}, req.langId, '.doctoreducation.id', models.doctoreducationdetail, 'doctorEducationId')
			},
			{
				model: models.tag,attributes:['id'],
				required:false,

			include:[
				{
					model: models.tagdetail,attributes:['title'],
					required:false,
					where: language.buildLanguageQuery({}, req.langId, '.tag.id', models.tagdetail, 'tagId')
				}
			]
		}
		]

		}).then(data1 =>{

			res({
			status: true,
			message: language.lang({
				key: "addedSuccessfully",
				lang: req.lang
			}),
			data: data1
		});
		})
	}).catch((err) =>{
		if (err != null) {
		async.forEach(err.errors, function(errObj, inner_callback) {
		errObj.path = errObj.path;
		errors = errors.concat(errObj);
	});
		var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			res({errors:uniqueError,status:false,message:'Validation errors'})
	}
	})
}

this.deleteEducationRecord = (req,res) =>{

		models.doctoreducation.destroy({
			where:{id:req.doctor_edu_id}
		}).then(data =>{
			models.doctoreducationdetail.destroy({
				where:{doctorEducationId:req.doctor_edu_id,languageId:req.langId}
			}).then(() => {
				res({
						status: true,
						message: language.lang({
							key: "deletedSuccessfully",
							lang: req.lang
						}),
					});
			})
		})
}
/*
	 * for superadmin 
	 */
	this.saveAdditionalInfoApi = function(req, res) {
		console.log('===============request data========================')
		let doctorAwards = (typeof req.doctorAwards!=='undefined') ? JSON.parse(req.doctorAwards) : [],
		   doctorExperiences = (typeof req.doctorExperiences!=='undefined') ? JSON.parse(req.doctorExperiences) : [],
			doctortags = (typeof req.doctor_tags!=='undefined') ? JSON.parse(req.doctor_tags) : [];
			/*doctorEducations = JSON.parse(req.doctorEducations),
			doctorRegistrations = JSON.parse(req.doctorRegistrations),*/

		/*async.forEachOf(doctorEducations, function(values, key) {
			if ("undefined" === typeof req['edu_proof___' + key]) {
				doctorEducations[key]['edu_proof'] = values.edu_proof;
				doctorEducations[key]['edu_proof_file_name'] = values.edu_proof_file_name;
			} else {
				doctorEducations[key]['edu_proof'] = req['edu_proof___' + key];
				doctorEducations[key]['edu_proof_file_name'] = req['edu_proof___' + key + '___original_name'];
			}
		});

		async.forEachOf(doctorRegistrations, function(values, key) {
			if ("undefined" === typeof req['reg_proof___' + key]) {
				doctorRegistrations[key]['reg_proof'] = values.reg_proof;
				doctorRegistrations[key]['reg_proof_file_name'] = values.reg_proof_file_name;
			} else {
				doctorRegistrations[key]['reg_proof'] = req['reg_proof___' + key];
				doctorRegistrations[key]['reg_proof_file_name'] = req['reg_proof___' + key + '___original_name'];
			}
		});*/
		doctorfiles={}
		if(req.identity_proff!=undefined){
		doctorfiles = {doctor_files:req.identity_proff, original_name: req.identity_proff___original_name, file_type:'image',document_type:'identity',doctorProfileId:req.id}
		}
		console.log(doctorfiles);
		//process.exit();
		var errors = []
		async.parallel([
			/*function(callback) {
				async.forEachOf(doctorEducations, function(values, key, callback) {
					var doctorEducationBuild = models.doctoreducation.build(values);
					doctorEducationBuild.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = errObj.path + '_' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},*/
		
			/*function(callback) {
				async.forEachOf(doctorExperiences, function(values, key, callback) {
					var doctordoctorExperienceBuild = models.doctorexperience.build(values);
					doctordoctorExperienceBuild.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = errObj.path + '_' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error1",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},*/
			/*function(callback) {
				async.forEachOf(doctorRegistrations, function(values, key, callback) {
					var doctorRegistrationBuild = models.doctorregistration.build(values);
					doctorRegistrationBuild.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = errObj.path + '_' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error2",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},*/
			/*function(callback) {
				async.forEachOf(doctorAwards, function(values, key, callback) {
					var doctorAwardBuild = models.doctoraward.build(values);
					doctorAwardBuild.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = errObj.path + '_' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error3",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},*/
		], function(err, errors) {

			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				async.parallel([
					function(callback) {
						models.doctortags.destroy({
							where: {
								doctorProfileId: req.id
							}
						}).then((data) => {
							callback(null, true);
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error4",
								lang: req.lang
							}),
							url: true
						}));
					},
					/*function(callback) {
						models.doctoreducation.hasMany(models.doctoreducationdetail);
						models.doctoreducation.findAll({
							include: [{
								model: models.doctoreducationdetail,
								where: language.buildLanguageQuery({}, req.langId, '`doctor_educations`.`id`', models.doctoreducationdetail, 'doctorEducationId')
							}, ],
							where: {
								doctorProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.doctoreducationdetail.destroy({
										where: {
											doctorEducationId: values.id
										}
									}).then((idata) => {
										models.doctoreducation.destroy({
											where: {
												id: values.id
											}
										}).then((data) => {
											icallback(null)
										}).catch(() => res({
											status: false,
											error: true,
											error_description: language.lang({
												key: "Internal Error5",
												lang: req.lang
											}),
											url: true
										}));
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error6",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true);
								});
							} else {
								callback(null, true);
							}
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error7",
								lang: req.lang
							}),
							url: true
						}));
					},*/
					function(callback) {
						models.doctorexperience.hasMany(models.doctorexperiencedetail);
						models.doctorexperience.findAll({
							include: [{
								model: models.doctorexperiencedetail,
								where: language.buildLanguageQuery({}, req.langId, '`doctor_experiences`.`id`', models.doctorexperiencedetail, 'doctorExperienceId')
							}, ],
							where: {
								doctorProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.doctorexperiencedetail.destroy({
										where: {
											doctorExperienceId: values.id
										}
									}).then((idata) => {
										models.doctorexperience.destroy({
											where: {
												id: values.id
											}
										}).then((data) => {
											icallback(null)
										}).catch(() => res({
											status: false,
											error: true,
											error_description: language.lang({
												key: "Internal Error8",
												lang: req.lang
											}),
											url: true
										}));
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error9",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true);
								});
							} else {
								callback(null, true);
							}
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error10",
								lang: req.lang
							}),
							url: true
						}));
					},
					/*function(callback) {
						models.doctorregistration.hasMany(models.doctorregistrationdetail);
						models.doctorregistration.findAll({
							include: [{
								model: models.doctorregistrationdetail,
								where: language.buildLanguageQuery({}, req.langId, '`doctor_registrations`.`id`', models.doctorregistrationdetail, 'doctorRegistrationId')
							}, ],
							where: {
								doctorProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.doctorregistrationdetail.destroy({
										where: {
											doctorRegistrationId: values.id
										}
									}).then((idata) => {
										models.doctorregistration.destroy({
											where: {
												id: values.id
											}
										}).then((data) => {
											icallback(null)
										}).catch(() => res({
											status: false,
											error: true,
											error_description: language.lang({
												key: "Internal Error11",
												lang: req.lang
											}),
											url: true
										}));
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error12",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true);
								});
							} else {
								callback(null, true);
							}
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error13",
								lang: req.lang
							}),
							url: true
						}));
					},*/
					function(callback) {
						models.doctoraward.hasMany(models.doctorawarddetail);
						models.doctoraward.findAll({
							include: [{
								model: models.doctorawarddetail,
								where: language.buildLanguageQuery({}, req.langId, '`doctor_awards`.`id`', models.doctorawarddetail, 'doctorAwardId')
							}, ],
							where: {
								doctorProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.doctorawarddetail.destroy({
										where: {
											doctorAwardId: values.id
										}
									}).then((idata) => {
										models.doctoraward.destroy({
											where: {
												id: values.id
											}
										}).then((data) => {
											icallback(null)
										}).catch(() => res({
											status: false,
											error: true,
											error_description: language.lang({
												key: "Internal Error14",
												lang: req.lang
											}),
											url: true
										}));
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error15",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true);
								});
							} else {
								callback(null, true);
							}
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error16",
								lang: req.lang
							}),
							url: true
						}));
					}
				], function(err) {
					if (err) {
						res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error17",
								lang: req.lang
							}),
							url: true
						})
					} else {
						async.parallel([
							/*function(callback) {
								async.forEach(doctorEducations, function(values, edu_callback) {
									var doctorEducationHasOne = models.doctoreducation.hasOne(models.doctoreducationdetail, {
										as: 'doctor_education_details'
									});
									values.doctor_education_details = {
										college_name: values.college_name,
										languageId: req.langId
									};
									models.doctoreducation.create(values, {
										include: [doctorEducationHasOne]
									}).then(function(data) {
										edu_callback(null)
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error18",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true)
								});
							},*/
							function(callback) {
								async.forEach(doctorExperiences, function(values, edu_callback) {
									var doctorExperienceHasOne = models.doctorexperience.hasOne(models.doctorexperiencedetail, {
										as: 'doctor_experience_details'
									});
									values.doctor_experience_details = {
										clinic_hospital_name: values.clinic_hospital_name,
										city_name: values.city_name,
										languageId: req.langId
									};
									models.doctorexperience.create(values, {
										include: [doctorExperienceHasOne]
									}).then(function(data) {
										edu_callback(null)
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error19",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true)
								});
							},
							/*function(callback) {
								async.forEach(doctorRegistrations, function(values, edu_callback) {
									var doctorRegistrationHasOne = models.doctorregistration.hasOne(models.doctorregistrationdetail, {
										as: 'doctor_registration_details'
									});
									values.doctor_registration_details = {
										council_name: values.council_name,
										languageId: req.langId
									};
									models.doctorregistration.create(values, {
										include: [doctorRegistrationHasOne]
									}).then(function(data) {
										edu_callback(null)
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error20",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true)
								});
							},*/
							function(callback) {
								async.forEach(doctorAwards, function(values, edu_callback) {
									var doctorAwardHasOne = models.doctoraward.hasOne(models.doctorawarddetail, {
										as: 'doctor_award_details'
									});
									values.doctor_award_details = {
										award_gratitude_title: values.award_gratitude_title,
										languageId: req.langId
									};
									models.doctoraward.create(values, {
										include: [doctorAwardHasOne]
									}).then(function(data) {
										edu_callback(null)
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error21",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true)
								});
							},
							function(callback) {
								if(doctortags.length>0){
									models.doctortags.bulkCreate(doctortags).then(function(data) {
										callback(null, true)
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error22",
											lang: req.lang
										}),
										url: true
									}));
								}else{
									callback(null, true)
								}
							},
							function(callback) {
								if(Object.keys(doctorfiles).length>0 && typeof req.file_id!=='undefined' && req.file_id!=''){
								models.doctorfile.update(doctorfiles,{where:{id:req.file_id}}).then(function(data) {
									callback(null, true)
								}).catch(() => res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error1212",
										lang: req.lang
									}),
									url: true
								}));
							}else if(Object.keys(doctorfiles).length>0){
								models.doctorfile.create(doctorfiles).then(function(data) {
									callback(null, true)
								}).catch(() => res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error1212",
										lang: req.lang
									}),
									url: true
								}));
							}else{
								callback(null, true)
							}
							},
							
						], function(err) {
							if (err) {
								res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error23",
										lang: req.lang
									}),
									url: true
								})
							} else {
								module.exports.updateProfileStatusWhileUpdate({
									id: req.id,
									langId: req.langId
								}, function(resp) {
									if (resp.status) {
										res({
											status: true,
											message: language.lang({
												key: "Saved Successfully",
												lang: req.lang
											}),
											data: resp.data
										});
									} else {
										res({
											status: false,
											error: true,
											error_description: language.lang({
												key: "Internal Error24",
												lang: req.lang
											}),
											url: true
										})
									}
								})
							}
						})
					}
				})
			} else {
				language.errors({
					errors: uniqueError,
					lang: req.lang
				}, function(errors) {
					var newArr = {};
					newArr.message = language.lang({
						key: "validationFailed",
						lang: req.lang
					});
					newArr.errors = errors;
					res(newArr);
				});
			}
		});
	}

















	/*
	 * status update
	 */
	this.status = function(req, res) {

		models.doctorprofile.update(req, {
			where: {
				id: req.id
			},
			individualHooks: true
		}).then(function(data) {
		
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
	};

	this.checkLiveHospital = function(req, res) {

		models.sequelize.query(
			'SELECT count(*) as live_hospital from hospital_doctors left join hospitals on(hospital_doctors.hospitalId = hospitals.id) where hospital_doctors.doctorProfileId=' + req.id + ' and hospitals.is_active=1 and hospitals.is_live=1', {
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {
			res(data);
		})
	}

	/*
	 * get By ID
	 */
	this.getById = function(req, res) {
		models.doctorprofile.hasMany(models.doctorprofiledetail);

		models.doctorprofile.hasMany(models.doctortags);
		models.doctorprofile.belongsTo(models.country);
		models.country.hasMany(models.countrydetail);
		models.doctorprofile.belongsTo(models.state);
		models.state.hasMany(models.statedetail);
		models.doctorprofile.belongsTo(models.city);
		models.city.hasMany(models.citydetail);

		models.doctorprofile.hasMany(models.doctoreducation);
		models.doctoreducation.hasMany(models.doctoreducationdetail)

		models.doctorprofile.hasMany(models.doctorexperience);
		models.doctorexperience.hasMany(models.doctorexperiencedetail)

		models.doctorprofile.hasMany(models.doctorregistration);
		models.doctorregistration.hasMany(models.doctorregistrationdetail)

		models.doctorprofile.hasMany(models.doctoraward);
		models.doctoraward.hasMany(models.doctorawarddetail)

		models.doctorprofile.hasMany(models.doctorfile);
		models.doctorprofile.hasMany(models.hospital_doctors, {foreignKey: 'doctorProfileId', sourceKey: 'id'});
		models.hospital_doctors.belongsTo(models.hospital);
		models.hospital_doctors.hasMany(models.hospital_doctor_timings, {
			foreignKey: 'hospitalDoctorId',
			sourceKey: 'id'
		});
		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});
		models.doctorprofile.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

		models.doctorprofile.find({
			include: [
				{
					model: models.doctorprofiledetail,
					where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
				},
				{
					model: models.doctortags,
					attributes: ['tagId', 'tagtypeId'],
					required: false
				},
				{
					model: models.doctoreducation,
					include: [{
						model: models.doctoreducationdetail,
						where: language.buildLanguageQuery({}, req.langId, '`doctoreducations`.`id`', models.doctoreducationdetail, 'doctorEducationId'),
						required: false
					}],
					required: false
				},
				{
					model: models.doctorexperience,
					include: [{
						model: models.doctorexperiencedetail,
						where: language.buildLanguageQuery({}, req.langId, '`doctorexperiences`.`id`', models.doctorexperiencedetail, 'doctorExperienceId'),
						required: false
					}],
					required: false
				},
				{
					model: models.doctorregistration,
					include: [{
						model: models.doctorregistrationdetail,
						where: language.buildLanguageQuery({}, req.langId, '`doctorregistrations`.`id`', models.doctorregistrationdetail, 'doctorRegistrationId'),
						required: false
					}],
					required: false
				},
				{
					model: models.doctoraward,
					include: [{
						model: models.doctorawarddetail,
						where: language.buildLanguageQuery({}, req.langId, '`doctorawards`.`id`', models.doctorawarddetail, 'doctorAwardId'),
						required: false
					}],
					required: false
				},
				{
					model: models.doctorfile,
					required: false
				},
				{
					model: models.country,
					include: [{
						model: models.countrydetail,
						where: language.buildLanguageQuery({}, req.langId, '`country`.`id`', models.countrydetail, 'countryId'),
						required: false
					}],
					required: false
				},
				{
					model: models.state,
					include: [{
						model: models.statedetail,
						where: language.buildLanguageQuery({}, req.langId, '`state`.`id`', models.statedetail, 'stateId'),
						required: false
					}],
					required: false
				},
				{
					model: models.city,
					include: [{
						model: models.citydetail,
						where: language.buildLanguageQuery({}, req.langId, '`city`.`id`', models.citydetail, 'cityId'),
						required: false
					}],
					required: false
				},
				{
					model: models.contactinformation,
					where: {
						model: 'doctorprofile'
					},
					required: false
				},
			],
			where: {
				id: req.id
			},
			order: [
				['id', 'DESC'],
			]
		}).then(function(data) {
			async.parallel({
				countries: function(callback) {
					country.getAllCountry(req, function(data) {
						callback(null, data);
					});
				},
				states: function(callback) {
					req.countryId = data.countryId;
					state.getAllState(req, function(data) {
						callback(null, data.data);
					});
				},
				cities: function(callback) {
					req.stateId = data.stateId;
					city.getAllCity(req, function(data) {
						callback(null, data.data);
					});
				},
				service_tags: function(callback) {
					tagtype.listByType({
						body: {
							id: utils.getAllTagTypeId()['ServiceTagId']
						}
					}, function(data) {
						callback(null, data);
					});
				},
				qualification_tags: function(callback) {
					tagtype.listByType({
						body: {
							id: utils.getAllTagTypeId()['EducationQualificationTagId']
						}
					}, function(data) {
						callback(null, data);
					});
				},
				specialization_tags: function(callback) {
					tagtype.listByType({
						body: {
							id: utils.getAllTagTypeId()['SpecializationTagId']
						}
					}, function(data) {
						callback(null, data);
					});
				},
				membership_tags: function(callback) {
					tagtype.listByType({
						body: {
							id: utils.getAllTagTypeId()['MembershipsTagId']
						}
					}, function(data) {
						callback(null, data);
					});
				},
				hospital_doctors: function(callback) {
					models.hospital_doctors.findAll({
						where: {doctorProfileId: data.id},
						include: [
							{
								model: models.hospital,
								include: [
									{
										model: models.hospitaldetail,
										where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'),
										required: false
									},
									{
										model: models.contactinformation,
										where: {
											model: 'hospital'
										},
										required: false,
										attributes: ["type", "value"]
									}
								],
								required: false
							},
							{
								model: models.hospital_doctor_timings,
								required: false,
								attributes: ["days", "id", "shift_1_from_time", "shift_1_to_time", "shift_2_from_time", "shift_2_to_time"]
							},
						]
					}).then(function(data) {
						callback(null, data)
					})
				}
			}, function(err, result) {
				data.dataValues.hospital_doctors = result.hospital_doctors;
				res({
					data: data,
					countries: result.countries,
					states: result.states,
					cities: result.cities,
					service_tags: result.service_tags,
					qualification_tags: result.qualification_tags,
					specialization_tags: result.specialization_tags,
					membership_tags: result.membership_tags
				})
			});
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
	};

	/*
	 * doctor get By ID
	 */
	this.doctorById = function(req, res) {
		if ('undefined' == typeof req.patientId) {
			req.patientId = 0;
		}
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.doctorprofile.hasMany(models.doctoreducation);
		models.doctoreducation.hasMany(models.doctoreducationdetail);
		models.doctorprofile.hasMany(models.doctorfile);

		models.doctorfeedback.belongsTo(models.patient, {
			foreignKey: 'patientId'
		});
		models.patient.belongsTo(models.user);
		models.user.hasMany(models.userdetail);

		models.hospital_doctors.belongsTo(models.hospital);
		models.hospital_doctors.hasMany(models.hospital_doctor_timings);
		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});
		models.doctorprofile.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

		Promise.all([
			models.doctorprofile.find({
				attributes: [
					'id',
					'userId',
					'mobile',
					'email',
					'salutation',
					'doctor_profile_pic',
					'latitude',
					'longitude', [models.sequelize.literal('(SELECT SUM(duration_to-duration_from) FROM doctor_experiences WHERE doctor_experiences.doctorProfileId = doctorprofile.id)'), 'total_exp'],
					[models.sequelize.literal('(SELECT ROUND(AVG(doctor_feedbacks.rating)) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id)'), 'avg_rating'],
					[models.sequelize.literal('(SELECT COUNT(*) FROM favourite_doctors LEFT JOIN doctor_profiles on(favourite_doctors.doctorProfileId = doctor_profiles.id) where favourite_doctors.patientId=' + req.patientId + ' AND favourite_doctors.doctorProfileId=' + req.id + ')'), 'is_favourite'],
				],
				include: [{
					model: models.doctorprofiledetail,
					where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
				}, {
					model: models.doctoreducation,
					attributes: ['tagtypeId'],
					required: false
				}, {
					model: models.doctorfile,
					attributes: ['document_type', 'doctor_files', 'original_name', 'file_type'],
					where:{
						is_active:1,
						document_type:'public_photos'
					},
					required: false
				}, {
					model: models.contactinformation,
					where: {
						model: 'doctorprofile'
					},
					required: false
				}],
				where: {
					id: req.id,
					is_active: 1,
					is_live: 1
				}
			}),
			models.doctorfeedback.findOne({
				attributes: ['id', 'patientId', 'feedback', 'rating', 'createdAt'],
				include: [{
					model: models.patient,
					attributes: ['id'],
					include: [{
						model: models.user,
						attributes: ['id'],
						include: [{
							model: models.userdetail,
							attributes: ['id', 'fullname'],
							where: language.buildLanguageQuery({}, req.langId, '`patient.user`.`id`', models.userdetail, 'userId'),
						}]
					}]
				}],
				order: [
					['createdAt', "DESC"]
				],
				where: {
					is_approved: 1,
					doctorProfileId: req.id
				}
			}),
			models.doctortags.findAll({
				attributes: ['tagId'],
				where: {
					doctorProfileId: req.id
				}
			}),
			models.hospital_doctors.findAll({
				include: [{
					model: models.hospital_doctor_timings,
					attributes: [
						[
							models.sequelize.fn(
								'DATE_FORMAT', models.sequelize.fn(
									'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
								), "%h:%i %p"
							),
							'shift_1_from_time'
						],
						[
							models.sequelize.fn(
								'DATE_FORMAT', models.sequelize.fn(
									'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
								), "%h:%i %p"
							), 'shift_1_to_time'
						],
						[
							models.sequelize.fn(
								'DATE_FORMAT', models.sequelize.fn(
									'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
								), "%h:%i %p"
							),
							'shift_2_from_time'
						],
						[
							models.sequelize.fn(
								'DATE_FORMAT', models.sequelize.fn(
									'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
								), "%h:%i %p"
							),
							'shift_2_to_time'
						],
						'days'
					],
					required: false
				}, {
					model: models.hospital,
					attributes:{
					include:[[models.sequelize.literal('(SELECT ROUND(AVG(doctor_feedbacks.rating)) FROM doctor_feedbacks WHERE doctor_feedbacks.hospitalId = hospital.id)'), 'avg_rating']],
					},
					include: [{
						model: models.hospitaldetail
					}, {
						model: models.contactinformation,
						where: {
							model: 'hospital'
						},
						required: false,
						attributes: ["type", "value"]
					}],
					required: true,
					where:{is_active:1,is_live:1}
				}],
				required: false,
				where: {
					doctorProfileId: req.id
				},
				order:[['id','DESC']]
			})
		]).then(([doctorprofile, doctorfeedback, doctortags, hospital_doctors]) => {
			let data = [],
				arrtag = doctortags.map(item => item.tagId),
				doctorEduTags = [];
			if (doctorprofile) {
				data = JSON.parse(JSON.stringify(doctorprofile));
				doctorEduTags = doctorprofile.doctoreducations.map(item => item.tagtypeId);
			}
			data.doctorfeedback = doctorfeedback;
			data.hospital_doctors = hospital_doctors;
			models.article.hasMany(models.articledetail);
			models.article.hasMany(models.articlelike);
			models.article.hasMany(models.starredarticle, {
				foreignKey: 'articleId',
				sourceKey: 'id'
			});
			Promise.all([
				tagtype.listByTypeAndTagsNew({
					body: {
						id: utils.getAllTagTypeId()['ServiceTagId'],
						tagIDS: arrtag
					}
				}),
				tagtype.listByTypeAndTagsNew({
					body: {
						id: utils.getAllTagTypeId()['EducationQualificationTagId'],
						tagIDS: doctorEduTags
					}
				}),
				tagtype.listByTypeAndTagsNew({
					body: {
						id: utils.getAllTagTypeId()['SpecializationTagId'],
						tagIDS: arrtag
					}
				}),
				tagtype.listByTypeAndTagsNew({
					body: {
						id: utils.getAllTagTypeId()['MembershipsTagId'],
						tagIDS: arrtag
					}
				}),
				models.article.findOne({
					attributes: [
						"id",
						"createdAt",
						"article_image", [models.sequelize.literal(
							'(SELECT COUNT(article_likes.id) FROM article_likes WHERE article_likes.articleId = article.id)'), 'total_likes']

					],
					where: {
						keyId: req.id,
						status: 1, is_active: 1
					},
					include: [{
							model: models.articledetail,
							attributes: ["title", "body"],
							where: language.buildLanguageQuery({}, req.langId, '`article`.`id`', models.articledetail, 'articleId')
						},
						{
							model: models.articlelike,
							attributes: ["id"],
							where: {
								keyId: req.patientId
							},
							required: false
						}, {
							model: models.starredarticle,
							attributes: ["id"],
							where: {
								keyId: req.patientId
							},
							required: false
						}
					],
					order: [
						["id", "DESC"]
					]
				}),
				freeqa.consult_qa(req)
			]).then(([service_tags, qualification_tags, specialization_tags, membership_tags, articles, consult_qa]) => {
				data.articles = articles ? [articles]:[];
				res({
					data,
					service_tags: {data: service_tags},
					qualification_tags: {data: qualification_tags},
					specialization_tags: {data: specialization_tags},
					membership_tags: {data: membership_tags},
					consult_qa
				});
			}).catch(console.log);
		}).catch(console.log);
	};

	/*
	 * doctor get By ID
	 */
	this.doctorDasboard = function(req, res) {

		models.doctorprofile.hasMany(models.doctorprofiledetail);

		models.doctorprofile.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});
		models.doctorprofile.hasMany(models.article, {
			foreignKey: 'keyId',
			sourceKey: 'id'
		});
		models.article.hasMany(models.articledetail);
		isWhere = {}
		models.doctorprofile.find({
			attributes: [
				'id',
				'userId',
				'mobile',
				'email',
				'salutation',
				'doctor_profile_pic',
				'latitude',
				'longitude',
				//[models.sequelize.literal(
				//'(SELECT COUNT(article_likes.id) FROM article_likes WHERE article_likes.articleId = article.id)'), 'total_likes']
			],
			include: [{
					model: models.doctorprofiledetail,
					required: false,
					where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
				},
				{
					model: models.contactinformation,
					where: {
						model: 'doctorprofile'
					},
					required: false
				},
				{
					model: models.article,
					attributes: [
						'id',
						'article_image',
						'createdAt', 
						[models.sequelize.literal(
							'(SELECT COUNT(article_likes.id) FROM article_likes WHERE article_likes.articleId = articles.id)'), 'total_likes']
					],
					where:{is_active: 1, status: 1},
					required: false,
					include: [{
						model: models.articledetail,
						where: language.buildLanguageQuery(isWhere.articledetail, req.langId, '`articles`.`id`', models.articledetail, 'articleId'),
						required: false
					}, ]
				},
			],
			where: {
				id: req.id,
			},
			order: [
				['id', 'DESC'],
				[models.article, 'id', 'DESC']
			]
		}).then(function(data) {


			promis = new Promise(resolve => users.getAssociateProfile({
				id: data.userId,
				user_type: 'doctor',
				lang: data.default_lang
			}, (associatedProfileData) => {
				return resolve(associatedProfileData);
			}))
				promis.then(function(associativeddd){
					

					res({
						status:true,
						message:'Doctor profile data',
						data: data,
						associatedProfileData : associativeddd.data
					})
				});

		}) //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	/*
	 * doctor get By ID
	 */
	this.doctorByDoctorId = function(req, res) {
		models.doctorprofile.hasMany(models.doctorprofiledetail);

		models.doctorprofile.hasMany(models.doctortags);
		models.doctorprofile.hasMany(models.doctoreducation);
		models.doctoreducation.hasMany(models.doctoreducationdetail)

		models.doctoreducation.belongsTo(models.tag, {
			foreignKey: 'tagtypeId',
			targetKey: 'id'
		});
		models.tag.hasMany(models.tagdetail);

		models.doctorprofile.hasMany(models.doctorexperience);
		models.doctorexperience.hasMany(models.doctorexperiencedetail)

		models.doctorprofile.hasMany(models.doctoraward);
		models.doctoraward.hasMany(models.doctorawarddetail)

		models.doctorprofile.hasMany(models.doctorregistration);
		models.doctorregistration.hasMany(models.doctorregistrationdetail)

		models.doctorprofile.hasMany(models.doctorfile);



		models.doctorprofile.hasMany(models.hospital_doctors);

		models.doctorprofile.belongsTo(models.country);
		models.doctorprofile.belongsTo(models.state);
		models.doctorprofile.belongsTo(models.city);

		models.country.hasMany(models.countrydetail);
		models.state.hasMany(models.statedetail);
		models.city.hasMany(models.citydetail);

		models.doctorprofile.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});
		isCountry ={};
		isState ={};
		isCity ={};
		isCountry.countrydetail = language.buildLanguageQuery(isCountry.countrydetail, req.langId, '`country`.`id`', models.countrydetail, 'countryId');
		isState.statedetail = language.buildLanguageQuery(isState.statedetail, req.langId, '`state`.`id`', models.statedetail, 'stateId');
		isCity.citydetail = language.buildLanguageQuery(isCity.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId');



		models.hospital_doctors.belongsTo(models.hospital);
		models.hospital_doctors.hasMany(models.hospital_doctor_timings);
		models.hospital.hasMany(models.hospitaldetail);
		

		isWhere = {};
		isWhere.userdetail = language.buildLanguageQuery(isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId');

		models.doctorprofile.find({
			attributes: [
				'id',
				'userId',
				'mobile',
				'email',
				'gender',
				'postal_code',
				'salutation',
				'doctor_profile_pic',
				'latitude',
				'is_active',
				'longitude', [models.sequelize.literal('(SELECT SUM(duration_to-duration_from) FROM doctor_experiences WHERE doctor_experiences.doctorProfileId = doctorprofile.id)'), 'total_exp']
			],
			include: [
				{model: models.country,attributes:['id'],include:[
					{model: models.countrydetail,attributes:['name'],where:language.buildLanguageQuery({}, req.langId, '`country`.`id`', models.countrydetail, 'countryId')}
				]},
				{model: models.state,attributes:['id'],include:[
					{model: models.statedetail,attributes:['name'],where:language.buildLanguageQuery({}, req.langId, '`state`.`id`', models.statedetail, 'stateId')}
				]},
				{model: models.city,attributes:['id'],include:[
					{model: models.citydetail,attributes:['name'],where:language.buildLanguageQuery({}, req.langId, '`city`.`id`', models.citydetail, 'cityId')}
				]},
				{
					model: models.doctorprofiledetail,
					where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
				},
				{
					model: models.doctortags,
					attributes: [
						'tagId',
						// [models.sequelize.fn('GROUP_CONCAT', models.sequelize.literal("tagId SEPARATOR ','")), 'tagIdsA'],
					],
					required: false
				},

				{
					model: models.doctoreducation,
					include: [{
							model: models.tag,
							attributes: ['id'],
							include: [{
								model: models.tagdetail,
								attributes: ['title'],
								required: false,
								where: language.buildLanguageQuery({}, req.langId, '`doctoreducations.tag`.`id`', models.tagdetail, 'tagId')
							}],
							required: false
						},
						{
							model: models.doctoreducationdetail,
							where: language.buildLanguageQuery({}, req.langId, '`doctoreducations`.`id`', models.doctoreducationdetail, 'doctorEducationId'),
							required: false
						}
					],
					required: false
				},
				{
					model: models.doctorexperience,
					include: [{
						model: models.doctorexperiencedetail,
						where: language.buildLanguageQuery({}, req.langId, '`doctorexperiences`.`id`', models.doctorexperiencedetail, 'doctorExperienceId'),
						required: false
					}],
					required: false
				},
				{
					model: models.doctoraward,
					attributes: ['id', 'award_year'],
					include: [{
						model: models.doctorawarddetail,
						attributes: ['award_gratitude_title'],
						where: language.buildLanguageQuery({}, req.langId, '`doctorawards`.`id`', models.doctorawarddetail, 'doctorAwardId'),
						required: false
					}],
					required: false
				},
				{
					model: models.doctorregistration,
					attributes: ['id','council_registration_number', 'year_of_registration', 'reg_proof'],
					include: [{
						model: models.doctorregistrationdetail,
						attributes: ['council_name'],
						where: language.buildLanguageQuery({}, req.langId, '`doctorregistrations`.`id`', models.doctorregistrationdetail, 'doctorRegistrationId'),
						required: false
					}],
					required: false
				},
				{
					model: models.doctorfile,
					where: {
						file_type: 'image',
					},
					//order:['id','desc'],
					required: false
				},
				{
					model: models.contactinformation,
					attributes:['type','value','is_primary'],
					where: {
						model: 'doctorprofile'
					},
					required: false
				},


				{
					model: models.hospital_doctors,
					attributes: ['id', 'consultation_charge', 'appointment_duration', 'createdAt'],
					include: [{
							model: models.hospital_doctor_timings,
							attributes: [
								[models.sequelize.fn(
									'DATE_FORMAT', models.sequelize.fn(
										'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
									), "%h:%i %p"
								), 'shift_1_from_time'],
								[models.sequelize.fn(
									'DATE_FORMAT', models.sequelize.fn(
										'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
									), "%h:%i %p"
								), 'shift_1_to_time'],

								[models.sequelize.fn(
									'DATE_FORMAT', models.sequelize.fn(
										'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
									), "%h:%i %p"
								), 'shift_2_from_time'],

								[models.sequelize.fn(
									'DATE_FORMAT', models.sequelize.fn(
										'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
									), "%h:%i %p"
								), 'shift_2_to_time'],
								'days'
							],
							required: false
						},
						{
							model: models.hospital,
							attributes: ['id', 'hospital_logo'],
							include: [{
								model: models.hospitaldetail,
								attributes: ['id', 'hospital_name', 'address'],
								required: false
							}, ],
							required: false
						}
					],
					required: false
				},
			],
			where: {
				id: req.id
			},
			order:'doctorfiles.id desc'
		}).then(function(data) {
			arr = data.doctortags;
			doctorArray = data.doctoreducations;
			doctorTag = [];
			async.map(doctorArray, function(e, r) {
				doctorTag.push(e.tagtypeId);
			});

			arrtag = [];
			arr = async.map(arr, function(e, r) {
				arrtag.push(e.tagId);
			});
			async.parallel({

				service_tags: function(callback) {

					tagtype.listByTypeAndTags({
						body: {
							id: utils.getAllTagTypeId()['ServiceTagId'],
							tagIDS: arrtag,
							lang: req.lang,
							langId: req.langId
						}
					}, function(data) {
						if (Object.keys(data.data).length === 0) {
							data.data = null;
						}
						callback(null, data);
					});
				},
				/*  qualification_tags: function (callback) {
					  tagtype.listByTypeAndTags({body: {id: 3,tagIDS:doctorTag}}, function(data){
						  callback(null, data);
					  });
				  },*/
				specialization_tags: function(callback) {
					tagtype.listByTypeAndTags({
						body: {
							id: utils.getAllTagTypeId()['SpecializationTagId'],
							tagIDS: arrtag
						}
					}, function(data) {
						if (data === null || Object.keys(data.data).length === 0) {
							data.data = null;
						}
						callback(null, data);
					});
				},
				membership_tags: function(callback) {
					tagtype.listByTypeAndTags({
						body: {
							id: utils.getAllTagTypeId()['MembershipsTagId'],
							tagIDS: arrtag
						}
					}, function(data) {
						if (data === null || Object.keys(data.data).length === 0) {
							data.data = null;
						}
						callback(null, data);
					});
				},
			}, function(err, result) {
				data.dataValues.articles = result.articles === null ? [] : result.articles;
				res({
					data: data,
					service_tags: result.service_tags,
					//    / qualification_tags: result.qualification_tags,
					specialization_tags: result.specialization_tags,
					membership_tags: result.membership_tags
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
	};

	/*
	 * get add form data
	 */
	this.getAddData = function(req, res) {
		async.parallel({
			countries: function(callback) {
				country.getAllCountry(req, function(data) {
					callback(null, data);
				});
			},
			service_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['ServiceTagId']
					},
					where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
				}, function(data) {
					callback(null, data);
				});
			},
			qualification_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['EducationQualificationTagId']
					},
					where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
				}, function(data) {
					callback(null, data);
				});
			},
			specialization_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['SpecializationTagId']
					}
				}, function(data) {
					callback(null, data);
				});
			},
			membership_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['MembershipsTagId']
					},
					where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
				}, function(data) {
					callback(null, data);
				});
			}
		}, function(err, result) {
			res(result);
		});
	}

	this.getAllProfiles = function(req, res) {

		models.doctorprofile.filterDoctorsForNotClaimed(req, function(response) {
			res(response);
		})
	}

	this.getMetaDataForSearch = function(req, res) {
		async.parallel({
			cities: function(callback) {
				city.getAllCityAtOnce(req, function(data) {
					callback(null, data);
				});
			},
			specialization_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['SpecializationTagId']
					}
				}, function(data) {
					callback(null, data);
				});
			}
		}, function(err, result) {
			res(result);
		});
	}

	this.checkProfile = function(req, res) {

		models.diagnostic.hasMany(models.diagnosticdetail);
		models.diagnostic.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

		models.diagnostic.findOne({
				include: [{
					model: models.diagnosticdetail,
					where: language.buildLanguageQuery(
						{}, req.langId, '`diagnostic`.`id`', models.diagnosticdetail, 'diagnosticId'
					)
				}, {
					model: models.contactinformation,
					where: {
						model: 'diagnostic'
					},
					required: false
				}
				],
				where: {
					userId: req.userId
				}
		}).then(data => {
				if(data){
				data = JSON.parse(JSON.stringify(data));
				req.countryId = data.countryId;
				req.stateId = data.stateId;
				Promise.all([
					new Promise((resolve) => country.getAllCountry(req, (result) => resolve(result))),
					new Promise((resolve) => state.getAllState(req, (result) => resolve(result.data))),
					new Promise((resolve) => city.getAllCity(req, (result) => resolve(result.data)))
				]).then(
					([countries, states, cities]) =>
					{
						res({
							data,
							countries,
							states,
							cities,
						}
					)
				})
			}else{
				Promise.all([
					new Promise((resolve) => city.getAllCity(req, (result) => resolve(result)))
				]).then(
					([cities]) =>
					{
						res({
							data,
							cities,
						}
					)
				})
			}
		})
	};

	this.metaDataForNewProfile = function(req, res) {
		module.exports.getAddData(req, function(response) {
			res(response);
		})
	}

	this.saveEducationSpecializationInfo = function(req, res) {
		let doctorEducations = JSON.parse(req.doctorEducations),
			doctortags = JSON.parse(req.doctor_tags);
		async.forEachOf(doctorEducations, function(values, key) {
			if ("undefined" === typeof req['edu_proof___' + key]) {
				doctorEducations[key]['edu_proof'] = values.edu_proof;
				doctorEducations[key]['edu_proof_file_name'] = values.edu_proof_file_name;
			} else {
				doctorEducations[key]['edu_proof'] = req['edu_proof___' + key];
				doctorEducations[key]['edu_proof_file_name'] = req['edu_proof___' + key + '___original_name'];
			}
		});

		var errors = [];
		async.parallel([
			function(callback) {
				async.forEachOf(doctorEducations, function(values, key, callback) {
					var doctorEducationBuild = models.doctoreducation.build(values);
					doctorEducationBuild.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = errObj.path + '_' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},
			function(callback) {
				if (0 === doctortags.length) {
					errors = errors.concat({
						path: "specializations",
						message: "At least one required"
					});
					callback(null, errors);
				} else {
					callback(null, errors);
				}
			}
		], function(err, errors) {

			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				async.parallel([
					function(callback) {
						var tagtypeId = doctortags[0].tagtypeId;
						models.doctortags.destroy({
							where: {
								doctorProfileId: req.id,
								tagtypeId: tagtypeId
							}
						}).then((data) => {
							callback(null, true);
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
					function(callback) {
						models.doctoreducation.hasMany(models.doctoreducationdetail);
						models.doctoreducation.findAll({
							include: [{
								model: models.doctoreducationdetail,
								where: language.buildLanguageQuery({}, req.langId, '`doctor_educations`.`id`', models.doctoreducationdetail, 'doctorEducationId')
							}, ],
							where: {
								doctorProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.doctoreducationdetail.destroy({
										where: {
											doctorEducationId: values.id
										}
									}).then((idata) => {
										models.doctoreducation.destroy({
											where: {
												id: values.id
											}
										}).then((data) => {
											icallback(null)
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
								}, function(innErrr) {
									callback(null, true);
								});
							} else {
								callback(null, true);
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
				], function(err) {
					if (err) {
						res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						})
					} else {
						async.parallel([
							function(callback) {
								async.forEach(doctorEducations, function(values, edu_callback) {
									var doctorEducationHasOne = models.doctoreducation.hasOne(models.doctoreducationdetail, {
										as: 'doctor_education_details'
									});
									values.doctor_education_details = {
										college_name: values.college_name,
										languageId: req.langId
									};
									models.doctoreducation.create(values, {
										include: [doctorEducationHasOne]
									}).then(function(data) {
										edu_callback(null)
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true)
								});
							},
							function(callback) {
								models.doctortags.bulkCreate(doctortags).then(function(data) {
									callback(null, true)
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
						], function(err) {
							if (err) {
								res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error",
										lang: req.lang
									}),
									url: true
								})
							} else {
								module.exports.updateProfileStatusWhileUpdate({
									id: req.id,
									langId: req.langId
								}, function(resp) {
									if (resp.status) {
										res({
											status: true,
											message: language.lang({
												key: "updatedSuccessfully",
												lang: req.lang
											}),
											data: []
										});
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
								})
							}
						})
					}
				})
			} else {
				language.errors({
					errors: uniqueError,
					lang: req.lang
				}, function(errors) {
					var newArr = {};
					newArr.message = language.lang({
						key: "validationFailed",
						lang: req.lang
					});
					newArr.errors = errors;
					res(newArr);
				});
			}
		});
	}

	this.saveRegistrationsInfo = function(req, res) {
		let doctorRegistrations = JSON.parse(req.doctorRegistrations);

		async.forEachOf(doctorRegistrations, function(values, key) {
			if ("undefined" === typeof req['reg_proof___' + key]) {
				doctorRegistrations[key]['reg_proof'] = values.reg_proof;
				doctorRegistrations[key]['reg_proof_file_name'] = values.reg_proof_file_name;
			} else {
				doctorRegistrations[key]['reg_proof'] = req['reg_proof___' + key];
				doctorRegistrations[key]['reg_proof_file_name'] = req['reg_proof___' + key + '___original_name'];
			}
		});
		var errors = []
		async.parallel([
			function(callback) {
				async.forEachOf(doctorRegistrations, function(values, key, callback) {
					var doctorRegistrationBuild = models.doctorregistration.build(values);
					doctorRegistrationBuild.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = errObj.path + '_' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},
		], function(err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});

			if (uniqueError.length === 0) {
				async.parallel([
					function(callback) {
						models.doctorregistration.hasMany(models.doctorregistrationdetail);
						models.doctorregistration.findAll({
							include: [{
								model: models.doctorregistrationdetail,
								where: language.buildLanguageQuery({}, req.langId, '`doctor_registrations`.`id`', models.doctorregistrationdetail, 'doctorRegistrationId')
							}, ],
							where: {
								doctorProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.doctorregistrationdetail.destroy({
										where: {
											doctorRegistrationId: values.id
										}
									}).then((idata) => {
										models.doctorregistration.destroy({
											where: {
												id: values.id
											}
										}).then((data) => {
											icallback(null)
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
								}, function(innErrr) {
									callback(null, true);
								});
							} else {
								callback(null, true);
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
				], function(err) {
					if (err) {
						res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						})
					} else {
						async.parallel([
							function(callback) {
								async.forEach(doctorRegistrations, function(values, edu_callback) {
									var doctorRegistrationHasOne = models.doctorregistration.hasOne(models.doctorregistrationdetail, {
										as: 'doctor_registration_details'
									});
									values.doctor_registration_details = {
										council_name: values.council_name,
										languageId: req.langId
									};
									models.doctorregistration.create(values, {
										include: [doctorRegistrationHasOne]
									}).then(function(data) {
										edu_callback(null)
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true)
								});
							},
						], function(err) {
							if (err) {
								res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error",
										lang: req.lang
									}),
									url: true
								})
							} else {
								module.exports.updateProfileStatusWhileUpdate({
									id: req.id,
									langId: req.langId
								}, function(resp) {
									if (resp.status) {
										res({
											status: true,
											message: language.lang({
												key: "addedSuccessfully",
												lang: req.lang
											}),
											data: []
										});
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
								})
							}
						})
					}
				})
			} else {
				language.errors({
					errors: uniqueError,
					lang: req.lang
				}, function(errors) {
					var newArr = {};
					newArr.message = language.lang({
						key: "validationFailed",
						lang: req.lang
					});
					newArr.errors = errors;
					res(newArr);
				});
			}
		});
	}

	this.saveServiceExperienceInfo = function(req, res) {
		let doctorExperiences = JSON.parse(req.doctorExperiences),
			doctortags = JSON.parse(req.doctor_tags);

		var errors = []
		async.parallel([
			function(callback) {
				async.forEachOf(doctorExperiences, function(values, key, callback) {
					var doctordoctorExperienceBuild = models.doctorexperience.build(values);
					doctordoctorExperienceBuild.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = errObj.path + '_' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},
			function(callback) {
				if (0 === doctortags.length) {
					errors = errors.concat({
						path: "services",
						message: "At least one required"
					});
					callback(null, errors);
				} else {
					callback(null, errors);
				}
			}
		], function(err, errors) {

			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				async.parallel([
					function(callback) {
						var tagtypeId = doctortags[0].tagtypeId;
						models.doctortags.destroy({
							where: {
								doctorProfileId: req.id,
								tagtypeId: tagtypeId
							}
						}).then((data) => {
							callback(null, true);
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
					function(callback) {
						models.doctorexperience.hasMany(models.doctorexperiencedetail);
						models.doctorexperience.findAll({
							include: [{
								model: models.doctorexperiencedetail,
								where: language.buildLanguageQuery({}, req.langId, '`doctor_experiences`.`id`', models.doctorexperiencedetail, 'doctorExperienceId')
							}, ],
							where: {
								doctorProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.doctorexperiencedetail.destroy({
										where: {
											doctorExperienceId: values.id
										}
									}).then((idata) => {
										models.doctorexperience.destroy({
											where: {
												id: values.id
											}
										}).then((data) => {
											icallback(null)
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
								}, function(innErrr) {
									callback(null, true);
								});
							} else {
								callback(null, true);
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
				], function(err) {
					if (err) {
						res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						})
					} else {
						async.parallel([
							function(callback) {
								async.forEach(doctorExperiences, function(values, edu_callback) {
									var doctorExperienceHasOne = models.doctorexperience.hasOne(models.doctorexperiencedetail, {
										as: 'doctor_experience_details'
									});
									values.doctor_experience_details = {
										clinic_hospital_name: values.clinic_hospital_name,
										city_name: values.city_name,
										languageId: req.langId
									};
									models.doctorexperience.create(values, {
										include: [doctorExperienceHasOne]
									}).then(function(data) {
										edu_callback(null)
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true)
								});
							},
							function(callback) {
								models.doctortags.bulkCreate(doctortags).then(function(data) {
									callback(null, true)
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
						], function(err) {
							if (err) {
								res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error",
										lang: req.lang
									}),
									url: true
								})
							} else {
								module.exports.updateProfileStatusWhileUpdate({
									id: req.id,
									langId: req.langId
								}, function(resp) {
									if (resp.status) {
										res({
											status: true,
											message: language.lang({
												key: "addedSuccessfully",
												lang: req.lang
											}),
											data: []
										});
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
								})
							}
						})
					}
				})
			} else {
				language.errors({
					errors: uniqueError,
					lang: req.lang
				}, function(errors) {
					var newArr = {};
					newArr.message = language.lang({
						key: "validationFailed",
						lang: req.lang
					});
					newArr.errors = errors;
					res(newArr);
				});
			}
		});
	}

	this.saveAwardmembershipInfo = function(req, res) {
		let doctorAwards = req.doctorAwards,
			doctortags = req.doctor_tags;

		var errors = []
		async.parallel([
			function(callback) {
				async.forEachOf(doctorAwards, function(values, key, callback) {
					var doctorAwardBuild = models.doctoraward.build(values);
					doctorAwardBuild.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = errObj.path + '_' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},
		], function(err, errors) {

			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				async.parallel([
					function(callback) {
						if (doctortags.length > 0) {
							var tagtypeId = doctortags[0].tagtypeId;
							models.doctortags.destroy({
								where: {
									doctorProfileId: req.id,
									tagtypeId: tagtypeId
								}
							}).then((data) => {
								callback(null, true);
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
							callback(null, true);
						}
					},
					function(callback) {
						models.doctoraward.hasMany(models.doctorawarddetail);
						models.doctoraward.findAll({
							include: [{
								model: models.doctorawarddetail,
								where: language.buildLanguageQuery({}, req.langId, '`doctor_awards`.`id`', models.doctorawarddetail, 'doctorAwardId')
							}, ],
							where: {
								doctorProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.doctorawarddetail.destroy({
										where: {
											doctorAwardId: values.id
										}
									}).then((idata) => {
										models.doctoraward.destroy({
											where: {
												id: values.id
											}
										}).then((data) => {
											icallback(null)
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
								}, function(innErrr) {
									callback(null, true);
								});
							} else {
								callback(null, true);
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
				], function(err) {
					if (err) {
						res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error",
								lang: req.lang
							}),
							url: true
						})
					} else {
						async.parallel([
							function(callback) {
								async.forEach(doctorAwards, function(values, edu_callback) {
									var doctorAwardHasOne = models.doctoraward.hasOne(models.doctorawarddetail, {
										as: 'doctor_award_details'
									});
									values.doctor_award_details = {
										award_gratitude_title: values.award_gratitude_title,
										languageId: req.langId
									};
									models.doctoraward.create(values, {
										include: [doctorAwardHasOne]
									}).then(function(data) {
										edu_callback(null)
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									}));
								}, function(innErrr) {
									callback(null, true)
								});
							},
							function(callback) {
								models.doctortags.bulkCreate(doctortags).then(function(data) {
									callback(null, true)
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
						], function(err) {
							if (err) {
								res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error",
										lang: req.lang
									}),
									url: true
								})
							} else {
								module.exports.updateProfileStatusWhileUpdate({
									id: req.id,
									langId: req.langId
								}, function(resp) {
									if (resp.status) {
										res({
											status: true,
											message: language.lang({
												key: "addedSuccessfully",
												lang: req.lang
											}),
											data: []
										});
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
								})
							}
						})
					}
				})
			} else {
				language.errors({
					errors: uniqueError,
					lang: req.lang
				}, function(errors) {
					var newArr = {};
					newArr.message = language.lang({
						key: "validationFailed",
						lang: req.lang
					});
					newArr.errors = errors;
					res(newArr);
				});
			}
		});
	}

	this.updateProfileStatusWhileUpdate = function(req, res) {
		models.doctorprofile.hasMany(models.doctorprofiledetail);

		models.doctorprofile.hasMany(models.doctortags);

		models.doctorprofile.hasMany(models.doctoreducation);
		models.doctoreducation.hasMany(models.doctoreducationdetail)

		models.doctorprofile.hasMany(models.doctorexperience);
		models.doctorexperience.hasMany(models.doctorexperiencedetail)

		models.doctorprofile.hasMany(models.doctorregistration);
		models.doctorregistration.hasMany(models.doctorregistrationdetail)

		models.doctorprofile.hasMany(models.doctoraward);
		models.doctoraward.hasMany(models.doctorawarddetail)

		models.doctorprofile.hasMany(models.doctorfile);

		models.doctorprofile.findOne({
			where: {
				id: req.id
			},
			include: [{
					model: models.doctorprofiledetail,
					where: language.buildLanguageQuery({}, req.langId, '`doctor_profiles`.`id`', models.doctorprofiledetail, 'doctorProfileId')
				},
				{
					model: models.doctortags,
					attributes: ['tagId', 'tagtypeId'],
					required: false
				},
				{
					model: models.doctoreducation,
					include: [{
						model: models.doctoreducationdetail,
						where: language.buildLanguageQuery({}, req.langId, '`doctoreducation`.`id`', models.doctoreducationdetail, 'doctorEducationId'),
						required: false
					}],
					required: false
				},
				{
					model: models.doctorexperience,
					include: [{
						model: models.doctorexperiencedetail,
						where: language.buildLanguageQuery({}, req.langId, '`doctorexperience`.`id`', models.doctorexperiencedetail, 'doctorExperienceId'),
						required: false
					}],
					required: false
				},
				{
					model: models.doctorregistration,
					include: [{
						model: models.doctorregistrationdetail,
						where: language.buildLanguageQuery({}, req.langId, '`doctorregistration`.`id`', models.doctorregistrationdetail, 'doctorRegistrationId'),
						required: false
					}],
					required: false
				},
				{
					model: models.doctoraward,
					include: [{
						model: models.doctorawarddetail,
						where: language.buildLanguageQuery({}, req.langId, '`doctoraward`.`id`', models.doctorawarddetail, 'doctorAwardId'),
						required: false
					}],
					required: false
				},
				{
					model: models.doctorfile,
					required: false
				},
			],
		}).then(function(result) {
			if (result != null) {
				let educationsStatus = result.doctoreducations.length > 0;
				let registrationsStatus = result.doctorregistrations.length > 0;
				let servicesTagStatus = result.doctortags.some((item) => {
					return item.tagtypeId == 1
				})
				let specializationTagStatus = result.doctortags.some((item) => {
					return item.tagtypeId == 2
				})
				let filesStatus = result.doctorfiles.some((item) => {
					return item.document_type === 'identity'
				})

				let profileCompletionStatus = educationsStatus && registrationsStatus && servicesTagStatus && specializationTagStatus && filesStatus;

				var hospitalDoctorsQuery = "select count(id) as totalHos from hospital_doctors where doctorProfileId = ?"
				models.sequelize.query(hospitalDoctorsQuery, { replacements: [req.id],
					type: models.sequelize.QueryTypes.SELECT
				}).then(function(hosdoctors) {
					profileCompletionStatus = profileCompletionStatus && hosdoctors[0].totalHos > 0
					if (!profileCompletionStatus) {
						models.doctorprofile.update({
							is_complete: 0,
							is_live: 0,
							verified_status: 'incomplete-profile'
						}, {
							where: {
								id: req.id
							},
							individualHooks: true
						}).then(function(updateStatus) {
							res({
								status: true,
								data: result
							});
						}).catch(() => res({
							status: false
						}));
					} else {
						if ("verified" === result.verified_status && result.is_live === 1) {
							res({
								status: true,
								data: result
							});
						} else {
							models.doctorprofile.update({
								is_complete: 1,
								is_live: 0,
								verified_status: 'pending'
							}, {
								where: {
									id: req.id
								},
								individualHooks: true
							}).then(function(updateStatus) {
								res({
									status: true,
									data: result
								});
							}).catch(() => res({
								status: false
							}));
						}
					}
				})
			}
		})
	}

	this.verifystatus = function(req, res) {
		if (req.id) {
			models.doctorprofile.belongsTo(models.user)
			models.doctorprofile.hasMany(models.doctorprofiledetail);
			models.doctorprofile.findOne({
				include: [
			{ model: models.user },
				{
					model: models.doctorprofiledetail,
					where: language.buildLanguageQuery({}, req.langId, '`doctor_profiles`.`id`', models.doctorprofiledetail, 'doctorProfileId'),
					attributes: ['name', 'about_doctor', 'languageId']
				}],
				where: {
					id: req.id
				}
			}).then(function(data) {
				if (data) {
					//save_json_data_in_mongodb
					var checkStatus = 1 === data.is_complete && ("approved" === data.claim_status || "user-created" === data.claim_status);
					if (checkStatus) {
						module.exports.checkLiveHospital({
							id: req.id
						}, function(hospitaldata) {
							
							if (hospitaldata[0].live_hospital > 0) {
								models.doctorprofile.update({
									verified_status: 'verified',
									is_live: 1,
									live_from: moment().format('YYYY-MM-DD hh:mm:ss')
								}, {
									where: {
										id: req.id
									},
									individualHooks: true
								}).then(function(response) {
									//verify status send notificaton to doctor
									claim_message="Congrats, your profile has been verified and live now and now it is searchable for patients.";
   									notification.send([{
                                        id: data.id, 
                                        device_id: data.user.device_id,
                                        is_notification: data.user.is_notification
                                    }],
                                     'front/notification/claim_status/status',
                                    {
                                        lang:req.lang,
                                        claim_message: claim_message,
                                    }, {
                                        senderId: 1,
                                        data:{type:'claim_status'}
                                    });
   									//verify status send notificaton to doctor

									res({
										status: true,
										message: language.lang({
											key: "updatedSuccessfully",
											lang: req.lang
										})
									});
								})/*.catch(() => res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error",
										lang: req.lang
									}),
									url: true
								}));*/
							} else {
								res({
									status: false,
									message: language.lang({
										key: "There are no hospitals live on this doctor profile. You couldn't live doctor until hospital is being live.",
										lang: req.lang
									})
								});
							}
						})
					}
				} else {
					res({
						status: false,
						message: language.lang({
							key: "invalidRecord",
							lang: req.lang
						}),
						data: []
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
		} else {
			res({
				status: false,
				message: language.lang({
					key: "invalidRequest",
					lang: req.lang
				}),
				data: []
			});
		}
	}

	this.liveStatus = function(req, res) {
		if (req.id) {
			models.doctorprofile.hasMany(models.doctorprofiledetail);
			models.doctorprofile.findOne({
				include: [{
					model: models.doctorprofiledetail,
					where: language.buildLanguageQuery({}, req.langId, '`doctor_profiles`.`id`', models.doctorprofiledetail, 'doctorProfileId'),
					attributes: ['name', 'about_doctor', 'languageId']
				}],
				where: {
					id: req.id
				}
			}).then(function(data) {
				if (data) {
					var checkStatus = 1 === data.is_complete && "verified" === data.verified_status && ("approved" === data.claim_status || "user-created" === data.claim_status);
					if (checkStatus) {
						models.doctorprofile.update({
							is_live: req.status
						}, {
							where: {
								id: req.id
							},
							individualHooks: true
						}).then(function(response) {
							res({
								status: true,
								message: language.lang({
									key: "updatedSuccessfully",
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
				} else {
					res({
						status: false,
						message: language.lang({
							key: "invalidRecord",
							lang: req.lang
						}),
						data: []
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
		} else {
			res({
				status: false,
				message: language.lang({
					key: "invalidRequest",
					lang: req.lang
				}),
				data: []
			});
		}
	}

	this.getProfileHelperData = function(req, res) {
		models.doctorprofile.findOne({
			where: {
				userId: req.userId
			},
		}).then(function(result) {
			if (result !== null) {
				async.parallel({
					countries: function(icallback) {
						country.getAllCountry(req, function(data) {
							icallback(null, data);
						});
					},
					states: function(icallback) {
						req.countryId = result.countryId;
						state.getAllState(req, function(data) {
							icallback(null, data.data);
						});
					},
					cities: function(icallback) {
						req.stateId = result.stateId;
						city.getAllCity(req, function(data) {
							icallback(null, data.data);
						});
					},
					service_tags: function(icallback) {
						tagtype.listByType({
							body: {
								id: utils.getAllTagTypeId()['ServiceTagId']
							},
							where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
						}, function(data) {
							icallback(null, data);
						});
					},
					qualification_tags: function(icallback) {
						tagtype.listByType({
							body: {
								id: utils.getAllTagTypeId()['EducationQualificationTagId']
							},
							where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
						}, function(data) {
							icallback(null, data);
						});
					},
					specialization_tags: function(icallback) {
						tagtype.listByType({
							body: {
								id: utils.getAllTagTypeId()['SpecializationTagId']
							}
						}, function(data) {
							icallback(null, data);
						});
					},
					membership_tags: function(icallback) {
						tagtype.listByType({
							body: {
								id: utils.getAllTagTypeId()['MembershipsTagId']
							},
							where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}
						}, function(data) {
							icallback(null, data);
						});
					}
				}, function(err, metaData) {
					res({
						isClaimed: true,
						countries: metaData.countries,
						states: metaData.states,
						cities: metaData.cities,
						service_tags: metaData.service_tags,
						qualification_tags: metaData.qualification_tags,
						specialization_tags: metaData.specialization_tags,
						membership_tags: metaData.membership_tags
					})
				});
			} else {
				async.parallel({
					cities: function(callback) {
						city.getAllCityAtOnce(req, function(data) {
							callback(null, data);
						});
					},
					specialization_tags: function(callback) {
						tagtype.listByType({
							body: {
								id: utils.getAllTagTypeId()['SpecializationTagId']
							}
						}, function(data) {
							callback(null, data);
						});
					},
					claimed_profile: function(callback) {
						models.claimrequest.belongsTo(models.doctorprofile, {
							foreignKey: 'keyId'
						});
						models.doctorprofile.hasMany(models.doctorprofiledetail);
						models.claimrequest.findOne({
							where: {
								userId: req.userId,
								status: 'pending',
								model: 'doctorprofile'
							},
							include: [{
								model: models.doctorprofile,
								attributes: ['id', 'email', 'mobile', 'doctor_profile_pic'],
								include: [{
									model: models.doctorprofiledetail,
									where: language.buildLanguageQuery({}, req.langId, '`doctor_profiles`.`id`', models.doctorprofiledetail, 'doctorProfileId'),
									attributes: ['name', 'about_doctor']
								}, ]
							}]
						}).then(function(data) {
							callback(null, data);
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
				}, function(err, result) {
					let is_any_claim_request_pending = result.claimed_profile ? true : false;
					let profile_data = result.claimed_profile ? result.claimed_profile.doctorprofile : [];
					res({
						isClaimed: false,
						cities: result.cities,
						specialization_tags: result.specialization_tags,
						is_any_claim_request_pending: is_any_claim_request_pending,
						doctor_profile_data: profile_data
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

	this.fiterHospitalForDoctor = function(req, res) {
		var setPage = req.app.locals.site.page;
		var currentPage = 1;
		var pag = 1;

		var reqData = req.body;
		if (typeof req.body.data !== 'undefined') {
			reqData = JSON.parse(req.body.data);
		}

		if (typeof reqData.page !== 'undefined') {
			currentPage = +reqData.page;
			pag = (currentPage - 1) * setPage;
			delete reqData.page;
		} else {
			pag = 0;
		}

		isWhere = {}
		isWhere.hospital = { is_active: 1, is_freeze: 1 }

		if (typeof reqData.is_clinic_owner !== undefined && reqData.is_clinic_owner == 1) {
			isWhere.hospital.claim_status = 'non-claimed';
			delete isWhere.hospital.is_freeze;
		}

		isWhere.hospitaldetail = {
			hospital_name: {
				'$like': '%' + reqData.name + '%'
			}
		}

		isWhere.contactinformation = {
			'$or': [{
				value: {
					'$like': '%' + reqData.mobile + '%'
				}
			}, {
				value: {
					'$like': '%' + reqData.email + '%'
				}
			}, ],
			is_primary: 1,
			model: 'hospital'
		}


		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

		models.hospital.belongsTo(models.city);
		models.city.hasMany(models.citydetail);

		models.hospital.hasMany(models.hospitalservice);
		models.hospitalservice.hasMany(models.tagdetail, {
			foreignKey: 'tagId',
			sourceKey: 'tagId'
		})

		models.hospital.hasMany(models.hospital_timings, {foreignKey: 'hospitalId', sourceKey: 'id'});

		models.hospital_doctors.findAll({
			attributes: [[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('hospitalId')), 'hos_ids']], 
			where: {doctorProfileId: reqData.logged_doctorprofile_id }, raw: true
		}).then(function(mappedHospitals) {
			if(mappedHospitals[0].hos_ids != null) isWhere.hospital.id = {'$notIn': mappedHospitals[0].hos_ids.split(",")};
			models.hospital.findAndCountAll({
				attributes: ["id", "hospital_logo", "shift_24X7", "is_freeze"],
				where: isWhere.hospital,
				include: [{
					model: models.hospitaldetail,
					attributes: ["hospital_name", "address"],
					where: language.buildLanguageQuery(isWhere.hospitaldetail, reqData.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
				}, {
					model: models.contactinformation,
					where: isWhere.contactinformation,
					required: false,
					attributes: ["type", "value"]
				}, {
					attributes: ["tagId", "tagtypeId"],
					model: models.hospitalservice,
					required: false,
					include: [{
						model: models.tagdetail,
						required: false,
						attributes: ["title"],
						where: language.buildLanguageQuery({}, reqData.langId, '`hospitalservice`.`tagId`', models.tagdetail, 'tagId')
					}],
					where: {
						tagtypeId: utils.getAllTagTypeId()['SpecializationTagId']
					}
				}, {
					model: models.city,
					attributes: ["id"],
					include: [{
						model: models.citydetail,
						attributes: ["name"],
						where: language.buildLanguageQuery({}, reqData.langId, '`hospital`.`cityId`', models.citydetail, 'cityId')
					}]
				}, {
					model: models.hospital_timings, required: false
				}],
				distinct: true,
				limit: setPage,
				offset: pag
			}).then(function(data) {
				var totalData = data.count;
				var pageCount = Math.ceil(totalData / setPage);
				res({
					filtered_hospital_list: data.rows,
					totalData: totalData,
					pageCount: pageCount,
					pageLimit: setPage,
					currentPage: currentPage
				})
			})
		})
	}

	this.myClinics = function(req, res) {
		models.hospital.hasMany(models.hospitaldetail)
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});
		models.hospital.hasMany(models.hospitalservice);
		models.hospital.hasMany(models.hospitalfile);
		models.hospital.findAll({
			attributes: ["id", "userId", "headId", "is_complete", "is_live", "claim_status", "verified_status", "hospital_logo", "is_active"],
			include: [
				{
					model: models.hospitaldetail,
					attributes: ["hospital_name", "address"],
					where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
				}, {
					model: models.contactinformation,
					attributes: ["type", "value"],
					where: {
						model: 'hospital',
						is_primary: 1
					}
				}, {
					model: models.hospitalservice,
					attributes: ['tagId', 'tagtypeId'],
					required: false
				}, {
					model: models.hospitalfile,
					required: false
				},
			],
			where: {
				userId: req.userId
			}
		}).then(function(result) {
			models.claimrequest.belongsTo(models.hospital, {
				foreignKey: 'keyId'
			});
			models.claimrequest.findOne({
				include: [{
					model: models.hospital,
					attributes: ['id', 'hospital_logo'],
					include: [{
							model: models.hospitaldetail,
							where: language.buildLanguageQuery({}, req.langId, '`hospitals`.`id`', models.hospitaldetail, 'hospitalId'),
							attributes: ['hospital_name', 'address']
						},
						{
							model: models.contactinformation,
							attributes: ["type", "value"],
							where: {
								model: 'hospital',
								is_primary: 1
							}
						}
					]
				}],
				where: {
					status: 'pending',
					model: 'hospital',
					userId: req.userId
				}
			}).then(function(claimRequestedProfile) {
				res({
					data: result,
					pendingClaimedProfile: claimRequestedProfile
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

	/*
	 *@api
	 * save doctor profile basic data
	 */


	 this.getLatLong = function(req,res){

	models.city.hasMany(models.citydetail)
		models.city.belongsTo(models.state)
		models.city.belongsTo(models.country)
		models.state.hasMany(models.statedetail)
		models.country.hasMany(models.countrydetail)
		models.city.find({
			attributes:['id'],
			include:[
			{
				model:models.citydetail,attributes:['name']
			},
			{
				model:models.state,include:[{
					model:models.statedetail,attributes:['name']
				}]
			},
			{
				model:models.country,include:[{
					model:models.countrydetail,attributes:['name']
				}]
			}
			],
			where:{id:req.cityId,is_active:1}
		}).then(function(cityResult){
			req.doctor_profile_details = JSON.parse(req.doctor_profile_details)
			full_address = req.doctor_profile_details.address_line_1+','+cityResult.citydetails[0].name+','+cityResult.state.statedetails[0].name+','+cityResult.country.countrydetails[0].name;
			

 	var options = {
            provider: 'google',
           
            // Optional depending on the providers
            httpAdapter: 'https', // Default
            apiKey: 'AIzaSyAlNp9k6nA5z03BiEYi9djp3yZpMg5asVk', // for Mapquest, OpenCage, Google Premier
            formatter: null         // 'gpx', 'string', ...
          };
            var geocoder = NodeGeocoder(options); 

			geocoder.geocode(full_address, function(err, response) {
                       if(response.length>0){
                        req.latitude = response[0].latitude || '';
                        req.longitude = response[0].longitude || '';
                       }else{
                       	req.latitude = '';
                        req.longitude ='';
                       }
                       res({latitude:req.latitude,longitude:req.longitude})
                })
		})



	 }

	this.saveBasicDetailsApi = function(req, res) {
		if (typeof req.is_active === 'undefined') {
			req.is_active = 0;
		}
		

		// console.log(req.contact_informations);process.exit();
		req.diagnostic_details = JSON.parse(req.diagnostic_details)
		let contact_infos = JSON.parse(req.contact_informations)
		let contact_emails = contact_infos.emails,
			contact_mobiles = contact_infos.mobiles;
		req.contact_informations = contact_infos.emails.concat(contact_infos.mobiles)

		var DiagnosticProfileHasOne = models.diagnostic.hasOne(models.diagnosticdetail, {
			as: 'diagnostic_details'
		});
		req.diagnostic_details.languageId = req.langId;
		var diagnostic = models.diagnostic.build(req);
		var diagnosticDetails = models.diagnosticdetail.build(req.diagnostic_details);

		var errors = [];
		async.parallel([
			function(callback) {
				diagnostic.validate().then(function(err) {
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
			function(callback) {
				diagnosticDetails.validate().then(function(err) {
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
			function(callback) {
				async.forEachOf(contact_emails, function(values, key, callback) {
					let fieldType = values.type;
					var contactInfo = models.contactinformation.build(values);
					contactInfo.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = fieldType + '___' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			},
			function(callback) {
				async.forEachOf(contact_mobiles, function(values, key, callback) {
					let fieldType = values.type;
					var contactInfo = models.contactinformation.build(values);
					contactInfo.validate().then(function(err) {
						if (err != null) {
							async.forEach(err.errors, function(errObj, inner_callback) {
								errObj.path = fieldType + '___' + key;
								errors = errors.concat(errObj);
							});
						}
						callback(null, errors);

					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error",
							lang: req.lang
						}),
						url: true
					}));
				}, function(err) {
					callback(null, errors);
				});
			}
		], function(err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				if (typeof req.id !== 'undefined' && req.id !== '') {


					//json object update in mongodb
					if (typeof req.profile_pic == 'undefined') {
						models.diagnostic.find({
							attributes: ['doctor_profile_pic'],
							where: {
								id: req.id
							}
						}).then(function(profile_pic) {

							req.profile_pic = profile_pic.profile_pic;
						})
					}

					req.diagnostic_details.diagnosticId = req.id;
					models.diagnostic.update(req, {
						where: {
							id: req.id
						},
						individualHooks: true
					}).then(function(data) {
						models.diagnostic.find({
							where: {
								id: req.id
							}
						}).then(function(data) {
						models.diagnosticdetail.find({
							where: {
								diagnosticId: req.id,
								languageId: req.langId
							}
						}).then(function(resultData) {
							if (resultData !== null) {
								req.diagnostic_details.id = resultData.id;
								models.diagnosticdetail.update(req.diagnostic_details, {
									where: {
										id: resultData.id,
										diagnosticId: req.id,
										languageId: req.langId
									},
									individualHooks: true
								}).then(function() {
									models.contactinformation.destroy({
										where: {
											key: req.id,
											model: 'doctorprofile'
										}
									}).then(function(CIDeleteStatus) {
										models.contactinformation.bulkCreate(req.contact_informations).then(function(CIStatus) {
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
								delete req.diagnostic_details.id;
								models.diagnosticdetail.create(req.diagnostic_details).then(function() {
									models.contactinformation.destroy({
										where: {
											key: req.id,
											model: 'doctorprofile'
										}
									}).then(function(CIDeleteStatus) {
										models.contactinformation.bulkCreate(req.contact_informations).then(function(CIStatus) {
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
					var langId = parseInt(req.diagnostic_details.languageId);
					req.is_complete = 0, req.is_live = 0;
					models.diagnostic.create(req, {
						include: [DiagnosticHasOne]
					}).then(function(data) {



						let contactsInfoData = []
						async.forEachOf(req.contact_informations, function(civalues, cikey, CICallback) {
							let setCIData = civalues;
							setCIData.key = data.id;
							contactsInfoData.push(setCIData)
							CICallback()
						}, function(err) {
							if (err) {
								res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error",
										lang: req.lang
									}),
									url: true
								})
							} else {
								models.contactinformation.bulkCreate(contactsInfoData).then(function(CIStatus) {
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
										req.diagnostic_details.diagnosticId = data.id;
										req.diagnostic_details.languageId = 1;
										models.diagnosticdetail.create(req.diagnostic_details).then(function() {
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
							}
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
		});
	};

	this.addHospitalDoctorTiming = function(req, res) {
		console.log(req);
		models.sequelize.query('SELECT hospital_doctor_timings.* FROM hospital_doctors INNER JOIN hospital_doctor_timings ON(hospital_doctor_timings.hospitalDoctorId=hospital_doctors.id) WHERE doctorProfileId=15')
			.then(function(data) {
				console.log(data)
			})
	}

	this.pendingHospitalClaimedprofiles = function(req, res) {
		models.claimrequest.belongsTo(models.hospital, {
			foreignKey: 'keyId'
		});
		models.hospital.hasMany(models.hospitaldetail)
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});
		models.claimrequest.findOne({
			include: [{
				model: models.hospital,
				attributes: ['id', 'hospital_logo'],
				include: [{
						model: models.hospitaldetail,
						where: language.buildLanguageQuery({}, req.langId, '`hospitals`.`id`', models.hospitaldetail, 'hospitalId'),
						attributes: ['hospital_name', 'address']
					},
					{
						model: models.contactinformation,
						attributes: ["type", "value"],
						where: {
							model: 'hospital',
							is_primary: 1
						}
					}
				]
			}],
			where: {
				status: 'pending',
				model: 'hospital',
				userId: req.userId
			}
		}).then(function(claimRequestedProfile) {
			res({
				claimRequestedProfile: claimRequestedProfile ? claimRequestedProfile.hospital : null
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
	}

	this.getAllSearchProfiles = function(req, res) {
		req.langId = req.languageId;
		let pageSize = 10,
			page = undefined === req.page ? 1 : req.page,
			includeObj = [],
			cityCond = {},
			nameFilter = {},
			whereDoctorProfileDetailCond = {
				languageId: req.langId
			};

		if (req.name && req.selected_specialization && req.selected_city) {
			let emailMobileCond = [req.email, req.mobile];
			emailMobileCond = emailMobileCond.filter(function(e) {
				return e
			});
			let whereCond = "";
			whereCond += " (doctorprofiledetails.name like '%" + req.name + "%'";
			if (emailMobileCond.length) {
				whereCond += " or (contactinformations.value in ('" + emailMobileCond.join("','") + "') and contactinformations.model = 'doctorprofile') "
			}
			whereCond += " ) and ";
			whereCond += " (doctorprofile.cityId = " + req.selected_city;
			whereCond += " or doctortags.tagId = " + req.selected_specialization;
			whereCond += " ) ";
			whereCond += " and doctorprofile.claim_status = 'non-claimed' and doctorprofile.is_active = 1";

			models.doctorprofile.hasMany(models.doctorprofiledetail);
			models.doctorprofile.hasMany(models.contactinformation, {
				foreignKey: 'key',
				sourceKey: 'id'
			});
			models.doctorprofile.hasMany(models.doctortags);
			models.doctortags.belongsTo(models.tag)
			models.tag.hasMany(models.tagdetail)
			models.doctorprofile.belongsTo(models.country);
			models.country.hasMany(models.countrydetail);
			models.doctorprofile.belongsTo(models.state);
			models.state.hasMany(models.statedetail);
			models.doctorprofile.belongsTo(models.city);
			models.city.hasMany(models.citydetail);

			models.doctorprofile.hasMany(models.doctorexperience);

			models.doctorprofile.hasMany(models.doctoreducation);
			models.doctoreducation.belongsTo(models.tag, {foreignKey: 'tagtypeId', targetKey: 'id'})
			
			models.doctorprofile.hasMany(models.hospital_doctors);
			models.hospital_doctors.belongsTo(models.hospital);
			models.hospital.hasMany(models.hospitaldetail);

			models.doctorprofile.findAndCountAll({
				attributes: [
					"id",
					"doctor_profile_pic",
					"salutation",
					[
						models.sequelize.literal(getMappedHospitalInfo('hospital_name', req.langId)),'h_hospital_name'
					],
					[
						models.sequelize.literal(getMappedHospitalInfo('about_hospital', req.langId)),'h_about_hospital'
					],
					[
						models.sequelize.literal(getMappedHospitalInfo('address', req.langId)),'h_address'
					],
					[
						models.sequelize.literal(getMappedHospitalCount('id',req.langId)),'total_hospital'
					]
				],
				include: [{
						model: models.doctorprofiledetail,
						attributes: ["name", "address_line_1"],
						where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
					},
					{
						model: models.contactinformation,
						attributes: ["type", "value"],
						where: {
							model: 'doctorprofile',
							is_primary: 1
						}
					},
					{
						model: models.doctortags,
						required: false,
						attributes: ["tagtypeId"],
						include: [
							{
								model: models.tag,
								required: false,
								attributes: ["id"],
								include: [
									{
										model: models.tagdetail, required: false,
										where: language.buildLanguageQuery({}, req.langId, '`doctortags.tag`.`id`', models.tagdetail, 'tagId'),
										attributes: ["title"]
									}
								]
							}
						]
					},
					{
						model: models.country,
						attributes: ["id"],
						include: [{
							model: models.countrydetail,
							where: language.buildLanguageQuery({}, req.langId, '`country`.`id`', models.countrydetail, 'countryId'),
							attributes: ["name"]
						}]
					},
					{
						model: models.state,
						attributes: ["id"],
						include: [{
							model: models.statedetail,
							where: language.buildLanguageQuery({}, req.langId, '`state`.`id`', models.statedetail, 'stateId'),
							attributes: ["name"]
						}]
					},
					{
						model: models.city,
						attributes: ["id"],
						include: [{
							model: models.citydetail,
							where: language.buildLanguageQuery({}, req.langId, '`city`.`id`', models.citydetail, 'cityId'),
							attributes: ["name"]
						}]
					},
					{
						model: models.doctorexperience,
						attributes: ["designation", "duration_from", "duration_to"],
						required: false
					},
					{
						model: models.doctoreducation,
						attributes: ["tagtypeId"],
						include: [
							{
								model: models.tag,
								required: false,
								attributes: ["id"],
								include: [
									{
										model: models.tagdetail, required: false,
										where: language.buildLanguageQuery({}, req.langId, '`doctoreducations.tag`.`id`', models.tagdetail, 'tagId'),
										attributes: ["title"]
									}
								]
							}
						],
						required: false
					},
				],
				where: {
					whereCondition: models.sequelize.literal(whereCond)
				},
				distinct: true,
				limit: 10,
				offset: (page - 1) * pageSize,
				subQuery: false
			}).then(function(result) {
				res({
					status: true,
					filtered_doctor_list: result.rows,
					totalData: result.count,
					pageCount: Math.ceil(result.count / pageSize),
					pageLimit: pageSize,
					currentPage: page
				})
			})//.catch(console.log);
		} else {
			res({
				status: false,
				message: language.lang({
					key: "Missing required parameters",
					lang: req.lang
				})
			});
		}
	}

	this.DoctorBasicAndSpecInfo = function(req, res) {
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.doctorprofile.hasMany(models.doctortags);
		models.doctortags.belongsTo(models.tag)
		models.tag.hasMany(models.tagdetail)
		
		models.doctorprofile.find({
			attributes: [
				"id",
				"doctor_profile_pic",
				"salutation"
			],
			include: [{
					model: models.doctorprofiledetail,
					attributes: ["name", "address_line_1"],
					where: language.buildLanguageQuery({}, req.body.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
				},
				{
					model: models.doctortags,
					required: false,
					attributes: ["tagtypeId"],
					where: {tagtypeId: utils.getAllTagTypeId()['SpecializationTagId']},
					include: [
						{
							model: models.tag,
							required: false,
							attributes: ["id"],
							include: [
								{
									model: models.tagdetail, required: false,
									where: language.buildLanguageQuery({}, req.body.langId, '`doctortags.tag`.`id`', models.tagdetail, 'tagId'),
									attributes: ["title"]
								}
							]
						}
					]
				}
			],
			where: {
				id: req.body.doctorProfileId
			}
		}).then(function(result) {
			res({
				data: result
			})
		})//.catch(console.log);
	}

	this.exportData = function(req, res) {

		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.doctorprofile.belongsTo(models.country);
		models.doctorprofile.belongsTo(models.city);
		models.doctorprofile.belongsTo(models.state);
		models.country.hasMany(models.countrydetail);
		models.city.hasMany(models.citydetail);
		models.state.hasMany(models.statedetail);
		models.doctorprofile.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.doctorprofile.hasMany(models.contactinformation, {foreignKey: 'key', sourceKey: 'id'});

		models.doctorprofile.findAll({
			attributes: ["id", "gender"],
			include: [
				{
					model: models.doctorprofiledetail, 
					attributes: ["name"],
					where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
				},
				{
					model: models.user,
					attributes: ["id", "email", "mobile"],
					include: [{
						model: models.userdetail,
						attributes: ["fullname"],
						where: language.buildLanguageQuery({}, req.langId, '`user`.`id`', models.userdetail, 'userId'),
						required: false
					}],
					required: false
				}, {
				  	model: models.country,
				  	attributes: ["id"],
				  	include: [{
				      	model: models.countrydetail,
				      	where: language.buildLanguageQuery({},
				          	req.langId,
				          	"`country`.`id`",
				          	models.countrydetail,
				          	"countryId"
				      	),
				      	attributes: ["name"]
				  	}]
				}, {
				  	model: models.city,
				  	attributes: ["id"],
				  	include: [{
				      	model: models.citydetail,
				      	where: language.buildLanguageQuery({},
				          	req.langId,
				          	"`city`.`id`",
				          	models.citydetail,
				          	"cityId"
				      	),
				      	attributes: ["name"]
				  	}]
				}, {
				  	model: models.state,
				  	attributes: ["id"],
				  	include: [{
				      	model: models.statedetail,
				      	where: language.buildLanguageQuery({},
				          	req.langId,
				          	"`state`.`id`",
				          	models.statedetail,
				          	"stateId"
				      	),
				      	attributes: ["name"]
				  	}]
				}, {
					model: models.contactinformation,
					attributes: ["type", "value"],
					where: {model: 'doctorprofile'},
					required: false
				}
			]
		}).then(function(data) {
			res({status: true, doctors: data})
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
}
function getMappedHospitalCount(column,langId){
	return '(SELECT count(`hospital_doctors`.`id`) as count from `hospital_doctors`'
	+'INNER JOIN `hospitals`'
	+'ON `hospitals`.id = `hospital_doctors`.`hospitalId`'
	+'WHERE `hospital_doctors`.`doctorProfileId` = `doctorprofile`.`id`'
	+'AND `hospitals`.`is_live`=1 AND `hospitals`.`is_active`=1 LIMIT 1)';
}
function getMappedHospitalInfo(column, langId){
	return '(SELECT `'+column+'` FROM `hospital_details` INNER JOIN `hospital_doctors`'
	+' ON `hospital_doctors`.`hospitalId` = `hospital_details`.`hospitalId`'
	+' WHERE `hospital_doctors`.`doctorProfileId` = `doctorprofile`.`id`'
	+' AND `hospital_details`.`languageId`= IFNULL((SELECT `languageId` FROM `hospital_details`'
	+' WHERE `hospital_doctors`.`hospitalId` = `hospital_details`.`hospitalId`'
	+' AND `hospital_details`.`languageId`='+langId+'),1) LIMIT 1)';
};
module.exports = new diagnostic();