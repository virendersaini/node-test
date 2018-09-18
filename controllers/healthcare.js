var async = require('async');
const models = require('../models');
var language = require('./language');
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
var uniqid = require('uniqid');
var braintree = require('braintree'),
config = require('../config/config')[process.env.NODE_ENV || 'development'];
var users = require('./users');

let gateway = braintree.connect({
	accessToken: config.paypal ? config.paypal.accessToken:null
});

function healthcare() {
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
				model: 'home_healthcare'
			}
		} else {
			isWhere.contactinformation.type = 'email';
			isWhere.contactinformation.is_primary = 1;
			isWhere.contactinformation.model = 'home_healthcare';
		}

		models.healthcareprofile.hasMany(models.healthcareprofiledetail);

		isWhere.healthcareprofiledetail = language.buildLanguageQuery(isWhere.healthcareprofiledetail, reqData.langId, '`healthcareprofile`.`id`', models.healthcareprofiledetail, 'healthcareProfileId');

		models.healthcareprofile.belongsTo(models.user)
		models.user.hasMany(models.userdetail)
		models.healthcareprofile.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});  

		models.healthcareprofile.findAndCountAll({
			include: [{
					model: models.healthcareprofiledetail,
					where: isWhere.healthcareprofiledetail
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
			where: isWhere.healthcareprofile,
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

		req.doctor_profile_details = JSON.parse(req.doctor_profile_details)
		let contact_infos = JSON.parse(req.contact_informations)
		let contact_emails = contact_infos.emails,
			contact_mobiles = contact_infos.mobiles;
		req.contact_informations = contact_infos.emails.concat(contact_infos.mobiles)

		var DoctorProfileHasOne = models.healthcareprofile.hasOne(models.healthcareprofiledetail, {
			as: 'doctor_profile_details'
		});
		req.doctor_profile_details.languageId = req.langId;
		var doctorProfile = models.healthcareprofile.build(req);


		req.healthcare_profile_details=req.doctor_profile_details;


		var doctorProfileDetails = models.healthcareprofiledetail.build(req.healthcare_profile_details);

		var errors = [];
		async.parallel([
			function(callback) {
				doctorProfile.validate().then(function(err) {
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
						key: "Internal Error1",
						lang: req.lang
					}),
					url: true
				}));
			},
			function(callback) {
				doctorProfileDetails.validate().then(function(err) {
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
						key: "Internal Error2",
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
							key: "Internal Error3",
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
							key: "Internal Error4",
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
					if (typeof req.doctor_profile_pic == 'undefined') {
						models.healthcareprofile.find({
							attributes: ['doctor_profile_pic'],
							where: {
								id: req.id
							}
						}).then(function(profile_pic) {

							req.doctor_profile_pic = profile_pic.doctor_profile_pic;
						})
					}
					req.doctor_profile_details.healthcareProfileId = req.id;

					req.healthcare_profile_details= req.id;

					models.healthcareprofile.update(req, {
						where: {
							id: req.id
						},
						individualHooks: true
					}).then(function(data) {

						models.healthcareprofiledetail.find({
							where: {
								healthcareProfileId: req.id,
								languageId: req.langId
							}
						}).then(function(resultData) {
							if (resultData !== null) {
								req.doctor_profile_details.id = resultData.id;
								req.healthcare_profile_details = resultData.id;
								
								models.healthcareprofiledetail.update(req.doctor_profile_details, {
									where: {
										id: resultData.id,
										healthcareProfileId: req.id,
										languageId: req.langId
									},
									individualHooks: true
								}).then(function() {
									models.contactinformation.destroy({
										where: {
											key: req.id,
											model: 'home_healthcare'
										}
									}).then(function(CIDeleteStatus) {
										models.contactinformation.bulkCreate(req.contact_informations).then(function(CIStatus) {
										module.exports.checkHealthcareProfileCompleted({healthcareProfileId:req.id});	
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
								})
								// .catch(() => res({
								// 	status: false,
								// 	error: true,
								// 	error_description: language.lang({
								// 		key: "Internal Error7",
								// 		lang: req.lang
								// 	}),
								// 	url: true
								// }));
							} else {
								delete req.healthcare_profile_details.id;
								models.healthcareprofiledetail.create(req.healthcare_profile_details).then(function() {
									models.contactinformation.destroy({
										where: {
											key: req.id,
											model: 'home_healthcare'
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
								}).catch(() => res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error10",
										lang: req.lang
									}),
									url: true
								}));
							}
						})
						// .catch(() => res({
						// 	status: false,
						// 	error: true,
						// 	error_description: language.lang({
						// 		key: "Internal Error11",
						// 		lang: req.lang
						// 	}),
						// 	url: true
						// }));
					}).catch(() => res({
						status: false,
						error: true,
						error_description: language.lang({
							key: "Internal Error12",
							lang: req.lang
						}),
						url: true
					}));
				} else {

					var langId = parseInt(req.healthcare_profile_details.languageId);
					req.is_complete = 0, req.is_live = 0;
					req.verified_status = "incomplete-profile";
					req.claim_status = undefined === typeof req.claim_status && '' == req.claim_status ? 'non-claimed' : req.claim_status;
					models.healthcareprofile.create(req, {
						include: [DoctorProfileHasOne]
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
										key: "Internal Error13",
										lang: req.lang
									}),
									url: true
								})
							} else {
								models.contactinformation.bulkCreate(contactsInfoData).then(function(CIStatus) {
									if (langId === 1) {
										module.exports.checkHealthcareProfileCompleted({healthcareProfileId:req.id});
										res({
											status: true,
											message: language.lang({
												key: "addedSuccessfully",
												lang: req.lang
											}),
											data: data
										});
									} else {
										req.healthcare_profile_details.healthcareProfileId = data.id;
										req.healthcare_profile_details.languageId = 1;
										models.healthcareprofiledetail.create(req.healthcare_profile_details).then(function() {

										module.exports.checkHealthcareProfileCompleted({healthcareProfileId:req.id});
											
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
												key: "Internal Error14",
												lang: req.lang
											}),
											url: true
										}));
									}
								})
								// .catch(() => res({
								// 	status: false,
								// 	error: true,
								// 	error_description: language.lang({
								// 		key: "Internal Error15",
								// 		lang: req.lang
								// 	}),
								// 	url: true
								// }));
							}
						});
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

		console.log(req);
		console.log(req.id);
		var hId=req.id;
		let doctorEducations = JSON.parse(req.doctorEducations),
			doctorExperiences = JSON.parse(req.doctorExperiences),
			//doctorRegistrations = JSON.parse(req.doctorRegistrations),
			doctorRegistrations = [],
			doctorAwards = [],//JSON.parse(req.doctorAwards),
			doctortags = JSON.parse(req.doctor_tags);

		for(var i=0; i<doctortags.length;i++){
			doctortags[i]['healthcareProfileId']=doctortags[i]['doctorProfileId'];
		}	

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
					var doctorEducationBuild = models.healthcareeducation.build(values);
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
					var doctordoctorExperienceBuild = models.healthcareexperience.build(values);
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
			}
		], function(err, errors) {

			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				async.parallel([
					function(callback) {
						models.healthcaretags.destroy({
							where: {
								healthcareProfileId: req.id
							}
						}).then((data) => {
							callback(null, true);
						}).catch(() => res({
							status: false,
							error: true,
							error_description: language.lang({
								key: "Internal Error3",
								lang: req.lang
							}),
							url: true
						}));
					},
					function(callback) {
						models.healthcareeducation.hasMany(models.healthcareeducationdetail);
						models.healthcareeducation.findAll({
							include: [{
								model: models.healthcareeducationdetail,
								where: language.buildLanguageQuery({}, req.langId, '`doctor_educations`.`id`', models.healthcareeducationdetail, 'healthcareEducationId')
							}, ],
							where: {
								healthcareProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.healthcareeducationdetail.destroy({
										where: {
											healthcareEducationId: values.id
										}
									}).then((idata) => {
										models.healthcareeducation.destroy({
											where: {
												id: values.id
											}
										}).then((data) => {
											icallback(null)
										}).catch(() => res({
											status: false,
											error: true,
											error_description: language.lang({
												key: "Internal Error4",
												lang: req.lang
											}),
											url: true
										}));
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error5",
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
								key: "Internal Error6",
								lang: req.lang
							}),
							url: true
						}));
					},
					function(callback) {
						models.healthcareexperience.hasMany(models.healthcareexperiencedetail);
						models.healthcareexperience.findAll({
							include: [{
								model: models.healthcareexperiencedetail,
								where: language.buildLanguageQuery({}, req.langId, '`doctor_experiences`.`id`', models.healthcareexperiencedetail, 'healthcareExperienceId')
							}, ],
							where: {
								healthcareProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.healthcareexperiencedetail.destroy({
										where: {
											healthcareExperienceId: values.id
										}
									}).then((idata) => {
										models.healthcareexperience.destroy({
											where: {
												id: values.id
											}
										}).then((data) => {
											icallback(null)
										}).catch(() => res({
											status: false,
											error: true,
											error_description: language.lang({
												key: "Internal Error7",
												lang: req.lang
											}),
											url: true
										}));
									}).catch(() => res({
										status: false,
										error: true,
										error_description: language.lang({
											key: "Internal Error8",
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
								key: "Internal Error9",
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
								key: "Internal Error16",
								lang: req.lang
							}),
							url: true
						})
					} else {
						async.parallel([
							function(callback) {
								async.forEach(doctorEducations, function(values, edu_callback) {
									var doctorEducationHasOne = models.healthcareeducation.hasOne(models.healthcareeducationdetail, {
										as: 'healthcare_education_details'
									});
									values.healthcare_education_details = {
										college_name: values.college_name,
										languageId: req.langId
									};
									values.healthcareProfileId=values.doctorProfileId;
									models.healthcareeducation.create(values, {
										include: [doctorEducationHasOne]
									}).then(function(data) {
										if (req.langId == 1) {
	                						edu_callback(null)
	              						} else {
	              							values.healthcare_education_details.healthcareEducationId = data.id;
	                						values.healthcare_education_details.languageId = 1;
	                						models.healthcareeducationdetail.create(values.healthcare_education_details).then(function(){
	                  							edu_callback(null)
	                						}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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
								}, function(innErrr) {
									callback(null, true)
								});
							},
							function(callback) {
								async.forEach(doctorExperiences, function(values, edu_callback) {
									var doctorExperienceHasOne = models.healthcareexperience.hasOne(models.healthcareexperiencedetail, {
										as: 'healthcare_experience_details'
									});
									values.healthcare_experience_details = {
										clinic_hospital_name: values.clinic_hospital_name,
										city_name: values.city_name,
										languageId: req.langId
									};
									values.healthcareProfileId=values.doctorProfileId;

									models.healthcareexperience.create(values, {
										include: [doctorExperienceHasOne]
									}).then(function(data) {
										if (req.langId == 1) {
	                						edu_callback(null)
	              						} else {
	              							values.healthcare_experience_details.healthcareExperienceId = data.id;
	                						values.healthcare_experience_details.languageId = 1;
	                						models.healthcareexperiencedetail.create(values.healthcare_experience_details).then(function(){
	                  							edu_callback(null)
	                						}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	              						}
									})
									// .catch(() => res({
									// 	status: false,
									// 	error: true,
									// 	error_description: language.lang({
									// 		key: "Internal Error18",
									// 		lang: req.lang
									// 	}),
									// 	url: true
									// }));
								}, function(innErrr) {
									callback(null, true)
								});
							},
							// function(callback) {
							// 	async.forEach(doctorRegistrations, function(values, edu_callback) {
							// 		var doctorRegistrationHasOne = models.doctorregistration.hasOne(models.doctorregistrationdetail, {
							// 			as: 'doctor_registration_details'
							// 		});
							// 		values.doctor_registration_details = {
							// 			council_name: values.council_name,
							// 			languageId: req.langId
							// 		};
							// 		models.doctorregistration.create(values, {
							// 			include: [doctorRegistrationHasOne]
							// 		}).then(function(data) {
							// 			edu_callback(null)
							// 		}).catch(() => res({
							// 			status: false,
							// 			error: true,
							// 			error_description: language.lang({
							// 				key: "Internal Error19",
							// 				lang: req.lang
							// 			}),
							// 			url: true
							// 		}));
							// 	}, function(innErrr) {
							// 		callback(null, true)
							// 	});
							// },
							// function(callback) {
							// 	async.forEach(doctorAwards, function(values, edu_callback) {
							// 		var doctorAwardHasOne = models.doctoraward.hasOne(models.doctorawarddetail, {
							// 			as: 'doctor_award_details'
							// 		});
							// 		values.doctor_award_details = {
							// 			award_gratitude_title: values.award_gratitude_title,
							// 			languageId: req.langId
							// 		};
							// 		models.doctoraward.create(values, {
							// 			include: [doctorAwardHasOne]
							// 		}).then(function(data) {
							// 			edu_callback(null)
							// 		}).catch(() => res({
							// 			status: false,
							// 			error: true,
							// 			error_description: language.lang({
							// 				key: "Internal Error20",
							// 				lang: req.lang
							// 			}),
							// 			url: true
							// 		}));
							// 	}, function(innErrr) {
							// 		callback(null, true)
							// 	});
							// },
							function(callback) {
								models.healthcaretags.bulkCreate(doctortags).then(function(data) {
									callback(null, true)
								}).catch(() => res({
									status: false,
									error: true,
									error_description: language.lang({
										key: "Internal Error21",
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
										key: "Internal Error22",
										lang: req.lang
									}),
									url: true
								})
							} else {
								// module.exports.updateProfileStatusWhileUpdate({
								// 	id: req.id,
								// 	langId: req.langId
								// }, function(resp) {
									//if (resp.status) {
									if (true) {
										console.log(hId);
										module.exports.checkHealthcareProfileCompleted({healthcareProfileId:hId});	
										res({
											status: true,
											message: language.lang({
												key: "addedSuccessfully",
												lang: req.lang
											}),
											data: {}
										});
									} else {
										res({
											status: false,
											error: true,
											error_description: language.lang({
												key: "Internal Error23",
												lang: req.lang
											}),
											url: true
										})
									}
								//})
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
	 * for superadmin 
	 */
	this.saveAdditionalInfoApi = function(req, res) {
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
		doctorfiles={}
		if(req.identity_proff!=undefined){
		doctorfiles = {doctor_files:req.identity_proff, original_name: req.identity_proff___original_name, file_type:'image',document_type:'identity',healthcareProfileId:req.id}
		}
		
		//var doctorfile = models.doctorfile.build(doctorfiles);
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
								healthcareProfileId: req.id
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
								healthcareProfileId: req.id
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
								healthcareProfileId: req.id
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
								healthcareProfileId: req.id
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
							function(callback) {
								models.doctorfile.create(doctorfiles).then(function(data) {
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


	/*
	 * status update
	 */
	this.status = function(req, res) {

		models.healthcareprofile.update(req, {
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


	this.checkHealthcareProfileCompleted = function(req, res) {

		console.log('checkHealthcareProfileCompleted.................................');
		console.log(req);

		if(req.userId==''){
			req.userId=-1;
		}

		if(req.healthcareProfileId==''){
			req.healthcareProfileId=-1;
		}

		var qry='';
		qry+=' SELECT if(hpd.id is null ,1,0)+if(hexp.id is null ,1,0)+if(hedu.id is null ,1,0)+if(htag.id is null ,1,0)+if(htag2.id is null ,1,0) final '
		qry+=' FROM healthcare_profiles hp left join  healthcare_profile_details hpd on hp.id=hpd.healthcareprofileId '
		qry+=' left join healthcare_timings ht on hpd.healthcareprofileId=ht.healthcareprofileId '
		qry+=' left join healthcare_educations hedu on hpd.healthcareprofileId=hedu.healthcareprofileId '
		qry+=' left join healthcare_experiences hexp on hpd.healthcareprofileId=hexp.healthcareprofileId '
		qry+=' left join healthcare_tags htag on hpd.healthcareprofileId=htag.healthcareprofileId and htag.tagtypeId=23 '
		qry+=' left join healthcare_tags htag2 on hpd.healthcareprofileId=htag2.healthcareprofileId and htag2.tagtypeId=24 '
		qry+=' where hpd.healthcareprofileId=? or hp.userId=?  group by hpd.healthcareprofileId'
		models.sequelize.query(
			qry,
			{
			replacements: [req.healthcareProfileId,req.userId],
			type: models.sequelize.QueryTypes.SELECT
			}).then(function(result) {

			//is_complete
			if(result.length && result[0]['final']==0){
			models.healthcareprofile.update({is_complete:1}, 
			{where:{$or:[{id: req.healthcareProfileId},{userId: req.userId}]}
			});
			}else{
			models.healthcareprofile.update({is_complete:0,is_live:0}, 
			{where:{$or:[{id: req.healthcareProfileId},{userId: req.userId}]}
			});
			}
			//res({});
		});
	}


	this.checkLiveHospital = function(req, res) {

		models.sequelize.query(
			'SELECT count(*) as live_hospital from hospital_doctors left join hospitals on(hospital_doctors.hospitalId = hospitals.id) where hospital_doctors.healthcareProfileId=' + req.id + ' and hospitals.is_active=1 and hospitals.is_live=1', {
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {
				//req.healthcareprofileId
			res(data);
		});
	}

	/*
	 * get By ID
	 */
	this.getById = function(req, res) {

		models.healthcareprofile.hasMany(models.healthcareprofiledetail);
		models.healthcareprofile.hasMany(models.healthcaretags);
		models.healthcareprofile.belongsTo(models.country);
		models.country.hasMany(models.countrydetail);
		models.healthcareprofile.belongsTo(models.state);
		models.state.hasMany(models.statedetail);
		models.healthcareprofile.belongsTo(models.city);
		models.city.hasMany(models.citydetail);

		models.healthcareprofile.hasMany(models.healthcareeducation);
		models.healthcareeducation.hasMany(models.healthcareeducationdetail)

		models.healthcareprofile.hasMany(models.healthcareexperience);
		models.healthcareexperience.hasMany(models.healthcareexperiencedetail)

		//models.healthcareprofile.hasMany(models.doctorregistration);
		//models.healthcareregistration.hasMany(models.doctorregistrationdetail)

		//models.healthcareprofile.hasMany(models.doctoraward);
		//models.healthcareaward.hasMany(models.doctorawarddetail)

		models.healthcareprofile.hasMany(models.healthcarefile);
		models.healthcareprofile.hasMany(models.healthcare_timings);
		//models.healthcareprofile.hasMany(models.hospital_doctors, {foreignKey: 'healthcareProfileId', sourceKey: 'id'});
		//models.hospital_doctors.belongsTo(models.hospital);
		// models.hospital_doctors.hasMany(models.hospital_doctor_timings, {
		// 	foreignKey: 'hospitalDoctorId',
		// 	sourceKey: 'id'
		// });
		// models.hospital.hasMany(models.hospitaldetail);
		// models.hospital.hasMany(models.contactinformation, {
		// 	foreignKey: 'key',
		// 	sourceKey: 'id'
		// });
		models.healthcareprofile.hasMany(models.healthcaretags);
		models.healthcareprofile.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});
		models.healthcareprofile.belongsTo(models.hospital)
		models.hospital.hasMany(models.hospitaldetail)

		models.healthcareprofile.find({
			include: [
				{
					model: models.healthcareprofiledetail,
					where: language.buildLanguageQuery({}, req.langId, '`healthcareprofile`.`id`', models.healthcareprofiledetail, 'healthcareProfileId')
				},
				{
					model: models.healthcaretags,
					attributes: ['tagId', 'tagtypeId'],
					required: false
				},
				{
					model: models.healthcareeducation,
					include: [{
						model: models.healthcareeducationdetail,
						where: language.buildLanguageQuery({}, req.langId, '`healthcareeducations`.`id`', models.healthcareeducationdetail, 'healthcareEducationId'),
						required: false
					}],
					required: false
				},
				{
					model: models.healthcareexperience,
					include: [{
						model: models.healthcareexperiencedetail,
						where: language.buildLanguageQuery({}, req.langId, '`healthcareexperiences`.`id`', models.healthcareexperiencedetail, 'healthcareExperienceId'),
						required: false
					}],
					required: false
				},
				{
					model: models.healthcarefile,
					required: false
				},
				{
					model: models.healthcare_timings,
					required: false
				},
				{
					model: models.hospital,
					required: false,
					include :[
					{
						model:models.hospitaldetail
					},
					{
					model: models.contactinformation,
					where: {
						model: 'hospital'
					},
					required: false
					}
					]
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
						model: 'home_healthcare'
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
							id: utils.getAllTagTypeId()['hhcService']
						}
					}, function(data) {
						callback(null, data);
					});
				},
				qualification_tags: function(callback) {
					tagtype.listByType({
						body: {
							id: utils.getAllTagTypeId()['hhcEducation']
						}
					}, function(data) {
						callback(null, data);
					});
				},
				specialization_tags: function(callback) {
					tagtype.listByType({
						body: {
							id: utils.getAllTagTypeId()['hhcSpecializations']
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
				// hospital_doctors: function(callback) {
				// 	models.hospital_doctors.findAll({
				// 		where: {healthcareProfileId: data.id},
				// 		include: [
				// 			{
				// 				model: models.hospital,
				// 				include: [
				// 					{
				// 						model: models.hospitaldetail,
				// 						where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'),
				// 						required: false
				// 					},
				// 					{
				// 						model: models.contactinformation,
				// 						where: {
				// 							model: 'hospital'
				// 						},
				// 						required: false,
				// 						attributes: ["type", "value"]
				// 					}
				// 				],
				// 				required: false
				// 			},
				// 			{
				// 				model: models.hospital_doctor_timings,
				// 				required: false,
				// 				attributes: ["days", "id", "shift_1_from_time", "shift_1_to_time", "shift_2_from_time", "shift_2_to_time"]
				// 			},
				// 		]
				// 	}).then(function(data) {
				// 		callback(null, data)
				// 	})
				// }
			}, function(err, result) {
				//data.dataValues.hospital_doctors = result.hospital_doctors;
				data.dataValues.hospital_doctors = {};
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


	this.sendClinic = function(req,res){
		req.hospitalId = (req.hospitalId && req.hospitalId !== null && req.hospitalId !== '') ? req.hospitalId : null;
		models.healthcareprofile.update({hospitalId:req.hospitalId}, 
			{where: {userId: req.userId}
		}).then(function(updateStatus) {
		module.exports.checkHealthcareProfileCompleted({healthcareProfileId:'',userId:req.userId});

		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.find({
			where:{id:req.hospitalId},
			include: [{model: models.hospitaldetail}]
		}).then(function(data) {	
			let msg = language.lang({
				key: req.hospitalId ? "Clinic Added Successfully." : "Clinic Removed Successfully.",
				lang: req.lang
			})
			res({status: true, message: msg, data:data});
		});		

		})
		.catch(() => 
		res({status: false
		}));

	}


	this.sendClinicAdmin = function(req,res){

		models.healthcareprofile.update({hospitalId:req.hospitalId}, 
			{where: {id: req.healthcareId}
		}).then(function(updateStatus) {
		res({status: true,data:[]});
		})
		.catch(() => 
		res({status: false
		}));

	}


	this.addTime = function(req, res) {

		var values=req;

		console.log(values);

		var weekDayObj={0:'monday',1:'tuesday',2:'wednesday',3:'thursday',4:'friday',5:'saturday',6:'sunday'}

		var saveArr=[];
		if(values.healthcare.fee_type ==1){

			var saveObj={};
			saveObj['fee']=values.healthcare.fee;
			saveObj['type']=values.healthcare.fee_type;
			saveObj['healthcareprofileId']=values.healthcare.id;

			saveArr.push(saveObj);
			
		}else{


			//moment('12:10:12: PM', 'HH:mm:ss: A').diff(moment().startOf('day'), 'seconds');
			//moment(state.basicDetails.from['from'+i], "h:mm A").format("HH:mm");




			for(var i=0; i<values.healthcare.days_arr.length;i++){


				var from_time_sec='';
				var to_time_sec='';

				var timFor=values.healthcare.days_arr[i];
				if(values.healthcare.fee_type ==3){
				
				var from24=moment(values.healthcare.from['from'+timFor], "h:mm A").format("HH:mm");
				var to24=moment(values.healthcare.to['to'+timFor], "h:mm A").format("HH:mm");

				from24 = from24.split(':');
				var secondsFrom = (+from24[0]) * 60 * 60 + (+from24[1]) * 60 ; 

				to24 = to24.split(':');
				var secondsTo = (+to24[0]) * 60 * 60 + (+to24[1]) * 60; 

				from_time_sec=secondsFrom;
				to_time_sec=secondsTo;
				}

				var saveObj={};
				saveObj['days']=weekDayObj[timFor];
				saveObj['from_time']=values.healthcare.from['from'+timFor];
				saveObj['to_time']=values.healthcare.to['to'+timFor];
				saveObj['from_time_sec']=from_time_sec;
				saveObj['to_time_sec']=to_time_sec;
				saveObj['fee']=values.healthcare.fee;
				saveObj['type']=values.healthcare.fee_type;
				saveObj['avb_on']=values.healthcare.days_time_arr['avb_on'+timFor];
				saveObj['healthcareprofileId']=values.healthcare.id;

				saveArr.push(saveObj);

			}

		}


		models.healthcare_timings.destroy({
		    where: {
		        healthcareprofileId:values.healthcare.id
		    }
		}).then(function(data) {

			models.healthcare_timings.bulkCreate(saveArr).then(function(data) {
				module.exports.checkHealthcareProfileCompleted({healthcareProfileId:values.healthcare.id,userId:''});	
				res({
					status: true,
					message: language.lang({
							key: "addedSuccessfully",
							lang: req.lang
							}),
					data: data
					});

			});

		});

	}

	this.addTimeApi = function(req, res) {

		var values=req;
		values.healthcare = JSON.parse(values.healthcare);
		console.log(values);

		var weekDayObj={0:'monday',1:'tuesday',2:'wednesday',3:'thursday',4:'friday',5:'saturday',6:'sunday'}

		var saveArr=[];
		if(values.healthcare.fee_type ==1){

			var saveObj={};
			saveObj['fee']=values.healthcare.fee;
			saveObj['type']=values.healthcare.fee_type;
			saveObj['healthcareprofileId']=values.healthcare.id;

			saveArr.push(saveObj);
			
		}else{


			//moment('12:10:12: PM', 'HH:mm:ss: A').diff(moment().startOf('day'), 'seconds');
			//moment(state.basicDetails.from['from'+i], "h:mm A").format("HH:mm");




			for(var i=0; i<values.healthcare.days_arr.length;i++){


				var from_time_sec='';
				var to_time_sec='';

				var timFor=values.healthcare.days_arr[i];
				if(values.healthcare.fee_type ==3){
				
				var from24=moment(values.healthcare.from['from'+timFor], "h:mm A").format("HH:mm");
				var to24=moment(values.healthcare.to['to'+timFor], "h:mm A").format("HH:mm");

				from24 = from24.split(':');
				var secondsFrom = (+from24[0]) * 60 * 60 + (+from24[1]) * 60 ; 

				to24 = to24.split(':');
				var secondsTo = (+to24[0]) * 60 * 60 + (+to24[1]) * 60; 

				from_time_sec=secondsFrom;
				to_time_sec=secondsTo;
				}

				var saveObj={};
				saveObj['days']=weekDayObj[timFor];
				saveObj['from_time']=values.healthcare.from['from'+timFor];
				saveObj['to_time']=values.healthcare.to['to'+timFor];
				saveObj['from_time_sec']=from_time_sec;
				saveObj['to_time_sec']=to_time_sec;
				saveObj['fee']=values.healthcare.fee;
				saveObj['type']=values.healthcare.fee_type;
				saveObj['avb_on']=values.healthcare.days_time_arr['avb_on'+timFor];
				saveObj['healthcareprofileId']=values.healthcare.id;

				saveArr.push(saveObj);

			}

		}


		models.healthcare_timings.destroy({
		    where: {
		        healthcareprofileId:values.healthcare.id
		    }
		}).then(function(data) {

			models.healthcare_timings.bulkCreate(saveArr).then(function(data) {
				module.exports.checkHealthcareProfileCompleted({healthcareProfileId:values.healthcare.id,userId:''});	
				res({
					status: true,
					message: language.lang({
							key: "addedSuccessfully",
							lang: req.lang
							}),
					data: data
					});

			});

		});

	}


	this.checkProfile = function(req, res) {

		models.globalcommission.findOne({
			where: {
				type: {$in:['healthcare_consult']}
			}
		}).then(comData => {
			
		models.healthcareprofile.hasMany(models.healthcareprofiledetail);
		//models.hospital_doctors.belongsTo(models.hospital)
		//models.hospital.hasMany(models.hospitaldetail)
		models.healthcareprofile.hasMany(models.healthcaretags);
		models.healthcareprofile.hasMany(models.healthcareeducation);
		models.healthcareeducation.hasMany(models.healthcareeducationdetail)
		models.healthcareprofile.hasMany(models.healthcareexperience);
		models.healthcareexperience.hasMany(models.healthcareexperiencedetail)
		//models.doctorprofile.hasMany(models.doctorregistration);
		//models.doctorregistration.hasMany(models.doctorregistrationdetail)
		//models.doctorprofile.hasMany(models.doctoraward);
		//models.doctoraward.hasMany(models.doctorawarddetail)
		models.healthcareprofile.hasMany(models.healthcarefile);
		models.healthcareprofile.hasMany(models.healthcare_timings);


		models.healthcareprofile.belongsTo(models.hospital)
		models.hospital.hasMany(models.hospitaldetail)
		// models.hospital_doctors.hasMany(models.contactinformation, {
		// 	foreignKey: 'key',
		// 	sourceKey: 'id'
		// });
		// models.hospital_doctors.hasMany(models.hospital_doctor_timings, {
		// 	foreignKey: 'hospitalDoctorId',
		// 	sourceKey: 'id'
		// });
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});


		models.healthcareprofile.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

		models.healthcareprofile.findOne({
				include: [{
					model: models.healthcareprofiledetail,
					where: language.buildLanguageQuery(
						{}, req.langId, '`healthcareprofile`.`id`', models.healthcareprofiledetail, 'healthcareProfileId'
					)
				}, {
					model: models.healthcaretags,
					attributes: ['tagId', 'tagtypeId'],
					required: false
				}, {
					model: models.healthcareeducation,	
					include: [{
						model: models.healthcareeducationdetail,
						where: language.buildLanguageQuery({}, req.langId, '`healthcareeducations`.`id`', models.healthcareeducationdetail, 'healthcareEducationId'),
						required: false
					}],
					required: false
				}, {
					model: models.healthcareexperience,
					include: [{
						model: models.healthcareexperiencedetail,
						where: language.buildLanguageQuery({}, req.langId, '`healthcareexperiences`.`id`', models.healthcareexperiencedetail, 'healthcareExperienceId'),
						required: false
					}],
					required: false
				},
				{
					model: models.healthcare_timings,
					required: false
				},
				{
					model: models.hospital,
					required: false,
					include :[
					{
						model:models.hospitaldetail
					},
					{
					model: models.contactinformation,
					where: {
						model: 'hospital'
					},
					required: false
					}
					]
				},  
				{
					model: models.healthcarefile,
					required: false
				}, {
					model: models.contactinformation,
					where: {
						model: 'home_healthcare'
					},
					required: false
				}],
				where: {
					userId: req.userId
				}
		}).then(data => {
			let allNationalities = utils.getNationalities({lang: req.lang});
			if(data){
				data = JSON.parse(JSON.stringify(data));
				req.countryId = data.countryId;
				req.stateId = data.stateId;
				Promise.all([
					new Promise((resolve) => country.getAllCountry(req, (result) => resolve(result))),
					new Promise((resolve) => state.getAllState(req, (result) => resolve(result.data))),
					new Promise((resolve) => city.getAllCity(req, (result) => resolve(result.data))),
					new Promise((resolve) => tagtype.listByType({body: {id: utils.getAllTagTypeId()['hhcService']}, where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}}, (result) => resolve(result))),
					new Promise((resolve) => tagtype.listByType({body: {id: utils.getAllTagTypeId()['hhcEducation']}, where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}}, (result) => resolve(result))),
					new Promise((resolve) => tagtype.listByType({body: {id: utils.getAllTagTypeId()['hhcSpecializations']},where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]}}, (result) => resolve(result)))
				]).then(
					([countries, states, cities, service_tags, qualification_tags,specialization_tags]) =>
					{
						

						//profile complete percentage
						let specStatus = data.healthcaretags.some((itm) => itm.tagtypeId === utils.getAllTagTypeId()['hhcSpecializations']),
						serviceStatus = data.healthcaretags.some((itm) => itm.tagtypeId === utils.getAllTagTypeId()['hhcService']),
						eduStatus = data.healthcareeducations.length > 0,
						expStatus = data.healthcareexperiences.length > 0;
						timeStatus = data.healthcare_timings.length > 0;
						

						let profileCompletePercentage = 10;
						let remainigInfo = [];

						specStatus ? (profileCompletePercentage+=20) : (remainigInfo.push("specStatus")), 
						serviceStatus ? (profileCompletePercentage+=20) : (remainigInfo.push("serviceStatus")), 
						eduStatus ? (profileCompletePercentage+=20) : (remainigInfo.push("eduStatus")),
						expStatus ? (profileCompletePercentage+=20) : (remainigInfo.push("expStatus")), 
						timeStatus ? (profileCompletePercentage+=10) : (remainigInfo.push("timeStatus")), 


						//data.hospital_doctors = hospital_doctors;
						res({
							
							data:data,
							countries:countries,
							states:states,
							cities:cities,
							service_tags:service_tags,
							qualification_tags:qualification_tags,
							specialization_tags:specialization_tags,
							profileCompletePercentage,
							remainigInfo,
							comAmu:comData['percentage'],
							allNationalities: allNationalities
						}
					)
				})
			} else {
				Promise.all([
					new Promise((resolve) => country.getAllCountry(req, (result) => resolve(result))),
					new Promise((resolve) => tagtype.listByType({body: {id: utils.getAllTagTypeId()['hhcSpecializations']}}, (result) => resolve(result))),
					new Promise((resolve) => tagtype.listByType({body: {id: utils.getAllTagTypeId()['hhcService']}}, (result) => resolve(result))),
					new Promise((resolve) => tagtype.listByType({body: {id: utils.getAllTagTypeId()['hhcEducation']}}, (result) => resolve(result)))
				]).then(([countries, specialization_tags, service_tags, qualification_tags]) => {
					
					res({
						countries: countries,
						specialization_tags:specialization_tags,
						service_tags: service_tags,
						qualification_tags: qualification_tags,
						allNationalities: allNationalities
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
		});
		});
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





	this.getHealthcareById = function(req, res) {

		models.healthcareprofile.hasMany(models.healthcareprofiledetail);
		models.healthcareprofile.hasMany(models.healthcaretags);
		models.healthcareprofile.hasMany(models.healthcareeducation);
		models.healthcareeducation.hasMany(models.healthcareeducationdetail)

		models.healthcareeducation.hasMany(models.tag,{foreignKey:'tagtypeId',sourceKey:'tagId'});
		models.tag.hasMany(models.tagdetail);

		models.healthcareprofile.hasMany(models.healthcareexperience);
		models.healthcareexperience.hasMany(models.healthcareexperiencedetail)
		models.healthcareprofile.hasMany(models.healthcarefile);
		models.healthcareprofile.hasMany(models.healthcare_timings);
		models.healthcareprofile.belongsTo(models.hospital);
		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

		models.healthcareprofile.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

		var Services=models.healthcareprofile.hasMany(models.healthcaretags,{as:'services'});
		models.healthcaretags.belongsTo(models.tag,{foreignKey:'tagId',sourceKey:'tagId'});
		models.tagdetail.hasOne(models.tagdetail,{foreignKey:'tagId',sourceKey:'tagId'});


		var Specialization=models.healthcareprofile.hasMany(models.healthcaretags,{as:'specialization'});
		models.healthcaretags.belongsTo(models.tag,{foreignKey:'tagId',sourceKey:'tagId'});
		models.tagdetail.hasOne(models.tagdetail,{foreignKey:'tagId',sourceKey:'tagId'});


		//models.healthcareprofile.hasOne(models.hospital,{foreignKey:'hospitalId'});
		models.healthcareprofile.belongsTo(models.hospital,{foreignKey:'hospitalId'});


		models.healthcareprofile.hasMany(models.healthcarefeedback,{foreignKey:'healthcareProfileId'});
		models.healthcarefeedback.hasMany(models.healthcarefeedbackdetail);
		models.healthcarefeedback.belongsTo(models.patient, {foreignKey: 'patientId', targetKey: 'id'})
		models.patient.belongsTo(models.user, {foreignKey: 'userId', targetKey: 'id'});
        models.user.hasMany(models.userdetail);
        models.patient.hasMany(models.patientdetail, {foreignKey: 'patientId', targetKey: 'id'});

		//ADD Lang----------------------
		 req.langId = parseInt(req.langId);
		 if (isNaN(req.langId)) req.langId = 1;
		 
		 var whereHd=models.sequelize.fn('IF',models.sequelize.literal('`hospital.hospitaldetails`.`languageid`='+req.langId+','+req.langId+',1'));
		 var whereHpd=models.sequelize.fn('IF',models.sequelize.literal('`healthcareprofiledetails`.`languageId`='+req.langId+','+req.langId+',1'));
		 var whereEdu=models.sequelize.fn('IF',models.sequelize.literal('`healthcareeducations.healthcareeducationdetails`.`languageid`='+req.langId+','+req.langId+',1'));
		 var whereExp=models.sequelize.fn('IF',models.sequelize.literal('`healthcareexperiences.healthcareexperiencedetails`.`languageid`='+req.langId+','+req.langId+',1'));
		 var whereSer=models.sequelize.fn('IF',models.sequelize.literal('`services.tag.tagdetails`.`languageid`='+req.langId+','+req.langId+',1'));
		 var whereSpe=models.sequelize.fn('IF',models.sequelize.literal('`specialization.tag.tagdetails`.`languageid`='+req.langId+','+req.langId+',1'));
		//------------------------------

		models.healthcareprofile.findOne({
				//if(hp.acc_no IS NULL OR hp.acc_no ='',0,1) avb_book
				attributes: ['id','salutation','nationality','doctor_id','healthcare_type','hospitalId','userId','mobile','email','google_address',
				'countryId','stateId','cityId','postal_code','gender','acc_name','acc_no','acc_type','bank_name',
				'bank_city','bank_ifsc','doctor_profile_pic','latitude','longitude','is_active','claim_status',
				'is_complete','is_live','verified_status','live_from','createdAt','updatedAt',
				[models.sequelize.fn('IF',models.sequelize.literal("healthcareprofile.acc_no IS NULL OR healthcareprofile.acc_no ='',0,1")),'avb_book']
				],
				include: [{
					model: models.healthcareprofiledetail,
					where:{languageId:whereHpd}
				}, {
					model: models.healthcaretags,
					attributes: ['tagId', 'tagtypeId'],
					required: false
				}, {
					model: models.healthcareeducation,	
					include: [{
						model: models.healthcareeducationdetail,
						where: {languageId:whereEdu},
						required: false
					},
					{
				    	model: models.tag,
				    	//where:{tagtypeId:1},
				    	include:[
				    	{
				    		model:models.tagdetail,
				    		//where:{languageId:whereSer},
				    		required:false,
				    	}],
						required: true
				    }
					],
					required: false
				}, {
					model: models.healthcareexperience,
					include: [{
						model: models.healthcareexperiencedetail,
						where:{languageId:whereExp},
						required: false
					}],
					required: false
				}
				// ,{
				// 	model: models.healthcare_timings,
				// 	required: false
				// }
				,{
					model: models.hospital,
					required: false,
					include :[
					{
						model:models.hospitaldetail,
						required: false,
						where:{languageId:whereHd,}
					}
					// ,{
					// model: models.contactinformation,
					// where: {
					// 	model: 'hospital'
					// },
					// required: false
					// }
					]
				},  
				{
					model: models.healthcarefile,
					required: false
				}
				,{
					model: models.contactinformation,
					where: {
						model: 'home_healthcare',key:req.healthcareprofileId,type:"mobile",is_primary:1
				},
				required: false
				}
				,
				{
				    association: Services,
				    as: 'services',
				    where:{tagtypeId:24},
				    required: false,
				    include:[
				    	{
				    	model: models.tag,
				    	required: false,
				    	//where:{["`services`.`tagtypeId`"]:24},
				    	include:[
				    	{
				    		model:models.tagdetail,
				    		where:{languageId:whereSer},
				    		required:false,
				    	}],
						required: true
				    	}
				    ]
				},
				{
				    association: Specialization,
				    as: 'services',
				    required: false,
				    where:{tagtypeId:23},
				    include:[
				    	{
				    	model: models.tag,
				    	//where:{tagtypeId:23},
				    	include:[{model:models.tagdetail,where:{languageId:whereSpe},required:false}],
						required: true
				    	}
				    ]
				},
				{
					model: models.healthcarefeedback,
					required: false,
					include:[
					{
                    model: models.patient, 
                    attributes: ["userId"], 
                    required: false,
                    include: [

                        {
                            model: models.user, attributes: ["email", "user_image", "mobile"],
                            required: false,
                            include: [
                                {model: models.userdetail,required: false, attributes: ["fullname"], where: language.buildLanguageQuery({}, req.langId, '`healthcarefeedbacks.patient.user`.`id`', models.userdetail, 'userId')}
                            ]
                        }
                    ]
                	},
					{model:models.healthcarefeedbackdetail,required:false}
					]
				}
				],
				where: {
					id: req.healthcareprofileId
				},
				//raw: true
		}).then(data => {

			if(data){  
				module.exports.getBooking({healthcareprofileId:req.healthcareprofileId,from:req.from,to:req.to},function(booking){
				module.exports.getExtData({healthcareprofileId:req.healthcareprofileId},function(extData){

				models.healthcare_timings.findAll({
					where: {
					 healthcareProfileId: req.healthcareprofileId
					}
				}).then(timeData => {

					//var timeData = timeData.toJSON();
					for(var i=0;i<timeData.length;i++){
						timeData[i] = timeData[i].toJSON();
						timeData[i]['avb_on_txt']='';
						if(timeData[i]['type']==1){
						  timeData[i]['avb_on_txt']="24x7 (Stay at home with Patient)";	
						}else{
						  timeData[i]['avb_on_txt']=timeData[i]['avb_on']==1 ? "Morning hours (8Am to 8Pm)" : "Evening hours (8Pm to 8Am)";
						}
					}


					extData=extData[0];
					data = data.toJSON();
					data['healthcare_timings']=timeData;
					data['booking']=booking;
					data['rating']=extData['rating'];
					data['experience']=extData['experience'];
					data['tags']=extData['tags'];
					res({status:true,message:'',data:data});
				});	
				});
				});
			} else {
				res({status:false,message:'',data:[]});		
			}
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




	this.callApp=function(req, res){

			// Or, with named functions:
			async.waterfall([
			    myFirstFunction,
			    mySecondFunction,
			    myLastFunction,
			], function (err, result) {
				
			    // result now equals 'done'
			});
			function myFirstFunction(callback) {
			    callback(null, 'one', 'two');
			}
			function mySecondFunction(arg1, arg2, callback) {
				
			    // arg1 now equals 'one' and arg2 now equals 'two'
			    callback(null, {obj:'three'});
			}
			function myLastFunction(arg1, callback) {
				
			    // arg1 now equals 'three'
			    callback(null, 'done');
			}

	}


	this.metaDataForNewProfile = function(req, res) {
		module.exports.getAddData(req, function(response) {
			res(response);
		})
	}

	this.saveEducationSpecializationInfo = function(req, res) {

		let doctorEducations = JSON.parse(req.doctorEducations),
			doctortags = JSON.parse(req.doctor_tags);


		for(var i=0; i<doctortags.length;i++){
			doctortags[i]['healthcareProfileId']=doctortags[i]['doctorProfileId'];
		}


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
					var doctorEducationBuild = models.healthcareeducation.build(values);
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
						models.healthcaretags.destroy({
							where: {
								healthcareProfileId: req.id,
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
						models.healthcareeducation.hasMany(models.healthcareeducationdetail);
						models.healthcareeducation.findAll({
							include: [{
								model: models.healthcareeducationdetail,
								where: language.buildLanguageQuery({}, req.langId, '`healthcareeducation`.`id`', models.healthcareeducationdetail, 'healthcareEducationId')
							}, ],
							where: {
								healthcareProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.healthcareeducationdetail.destroy({
										where: {
											healthcareEducationId: values.id
										}
									}).then((idata) => {
										models.healthcareeducation.destroy({
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
									var doctorEducationHasOne = models.healthcareeducation.hasOne(models.healthcareeducationdetail, {
										as: 'healthcare_education_details'
									});
									values.healthcare_education_details = {
										college_name: values.college_name,
										languageId: req.langId
									};


									values['healthcareProfileId']=values.doctorProfileId;

									models.healthcareeducation.create(values, {
										include: [doctorEducationHasOne]
									}).then(function(data) {
										if (req.langId == 1) {
	                						edu_callback(null)
	              						} else {
	              							values.healthcare_education_details.healthcareEducationId = data.id;
	                						values.healthcare_education_details.languageId = 1;
	                						models.healthcareeducationdetail.create(values.healthcare_education_details).then(function(){
	                  							edu_callback(null)
	                						}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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
								}, function(innErrr) {
									callback(null, true)
								});
							},
							function(callback) {
								models.healthcaretags.bulkCreate(doctortags).then(function(data) {
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
								// module.exports.updateProfileStatusWhileUpdate({
								// 	id: req.id,
								// 	langId: req.langId
								// }, function(resp) {
								module.exports.checkHealthcareProfileCompleted({healthcareProfileId:req.id,userId:''});	
									if (1) {
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
								//})
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

	this.saveEducation = function(req, res) {

		let doctorEducations = JSON.parse(req.doctorEducations);

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
					var doctorEducationBuild = models.healthcareeducation.build(values);
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
			}
		], function(err, errors) {

			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				async.parallel([
					function(callback) {
						models.healthcareeducation.hasMany(models.healthcareeducationdetail);
						models.healthcareeducation.findAll({
							include: [{
								model: models.healthcareeducationdetail,
								where: language.buildLanguageQuery({}, req.langId, '`healthcareeducation`.`id`', models.healthcareeducationdetail, 'healthcareEducationId')
							}, ],
							where: {
								healthcareProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.healthcareeducationdetail.destroy({
										where: {
											healthcareEducationId: values.id
										}
									}).then((idata) => {
										models.healthcareeducation.destroy({
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
									var doctorEducationHasOne = models.healthcareeducation.hasOne(models.healthcareeducationdetail, {
										as: 'healthcare_education_details'
									});
									values.healthcare_education_details = {
										college_name: values.college_name,
										languageId: req.langId
									};


									values['healthcareProfileId']=values.doctorProfileId;

									models.healthcareeducation.create(values, {
										include: [doctorEducationHasOne]
									}).then(function(data) {
										if (req.langId == 1) {
	                						edu_callback(null)
	              						} else {
	              							values.healthcare_education_details.healthcareEducationId = data.id;
	                						values.healthcare_education_details.languageId = 1;
	                						models.healthcareeducationdetail.create(values.healthcare_education_details).then(function(){
	                  							edu_callback(null)
	                						}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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
								}, function(innErrr) {
									callback(null, true)
								});
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
								module.exports.checkHealthcareProfileCompleted({healthcareProfileId:req.id,userId:''});	
								if (1) {
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
	this.saveSerSpec = function(req, res) {

		let doctortags = JSON.parse(req.doctor_tags);

		for(var i=0; i<doctortags.length;i++){
			doctortags[i]['healthcareProfileId']=doctortags[i]['doctorProfileId'];
		}

		var errors = [];
		async.parallel([
			function(callback) {
				if (0 === doctortags.length) {
					let setPath = "";
					if(req.tagtype === 'services') setPath = "services";
					if(req.tagtype === 'specializations') setPath = "specializations";
					errors = errors.concat({
						path: setPath,
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
						models.healthcaretags.destroy({
							where: {
								healthcareProfileId: req.id,
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
								models.healthcaretags.bulkCreate(doctortags).then(function(data) {
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
								module.exports.checkHealthcareProfileCompleted({healthcareProfileId:req.id,userId:''});	
								if (1) {
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
	this.saveExperience = function(req, res) {
		let doctorExperiences = JSON.parse(req.doctorExperiences);
		var errors = []
		async.parallel([
			function(callback) {
				async.forEachOf(doctorExperiences, function(values, key, callback) {
					var doctordoctorExperienceBuild = models.healthcareexperience.build(values);
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
			}
		], function(err, errors) {

			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				async.parallel([
					function(callback) {
						models.healthcareexperience.hasMany(models.healthcareexperiencedetail);
						models.healthcareexperience.findAll({
							include: [{
								model: models.healthcareexperiencedetail,
								where: language.buildLanguageQuery({}, req.langId, '`healthcareexperience`.`id`', models.healthcareexperiencedetail, 'healthcareExperienceId')
							}, ],
							where: {
								healthcareProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.healthcareexperiencedetail.destroy({
										where: {
											healthcareExperienceId: values.id
										}
									}).then((idata) => {
										models.healthcareexperience.destroy({
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
									var doctorExperienceHasOne = models.healthcareexperience.hasOne(models.healthcareexperiencedetail, {
										as: 'healthcare_experience_details'
									});
									values.healthcare_experience_details = {
										clinic_hospital_name: values.clinic_hospital_name,
										city_name: values.city_name,
										languageId: req.langId
									};
									values['healthcareProfileId']=values['doctorProfileId'];


									models.healthcareexperience.create(values, {
										include: [doctorExperienceHasOne]
									}).then(function(data) {
										if (req.langId == 1) {
	                						edu_callback(null)
	              						} else {
	              							values.healthcare_experience_details.healthcareExperienceId = data.id;
	                						values.healthcare_experience_details.languageId = 1;
	                						models.healthcareexperiencedetail.create(values.healthcare_experience_details).then(function(){
	                  							edu_callback(null)
	                						}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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
								}, function(innErrr) {
									callback(null, true)
								});
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
								module.exports.checkHealthcareProfileCompleted({healthcareProfileId:req.id,userId:''});	
								if (1) {
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
								healthcareProfileId: req.id
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


		for(var i=0; i<doctortags.length;i++){
			doctortags[i]['healthcareProfileId']=doctortags[i]['doctorProfileId'];
		}	

		var errors = []
		async.parallel([
			function(callback) {
				async.forEachOf(doctorExperiences, function(values, key, callback) {
					var doctordoctorExperienceBuild = models.healthcareexperience.build(values);
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
						models.healthcaretags.destroy({
							where: {
								healthcareProfileId: req.id,
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
						models.healthcareexperience.hasMany(models.healthcareexperiencedetail);
						models.healthcareexperience.findAll({
							include: [{
								model: models.healthcareexperiencedetail,
								where: language.buildLanguageQuery({}, req.langId, '`healthcareexperience`.`id`', models.healthcareexperiencedetail, 'healthcareExperienceId')
							}, ],
							where: {
								healthcareProfileId: req.id
							}
						}).then(function(data) {
							if (data.length) {
								async.forEach(data, function(values, icallback) {
									models.healthcareexperiencedetail.destroy({
										where: {
											healthcareExperienceId: values.id
										}
									}).then((idata) => {
										models.healthcareexperience.destroy({
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
									var doctorExperienceHasOne = models.healthcareexperience.hasOne(models.healthcareexperiencedetail, {
										as: 'healthcare_experience_details'
									});
									values.healthcare_experience_details = {
										clinic_hospital_name: values.clinic_hospital_name,
										city_name: values.city_name,
										languageId: req.langId
									};
									values['healthcareProfileId']=values['doctorProfileId'];


									models.healthcareexperience.create(values, {
										include: [doctorExperienceHasOne]
									}).then(function(data) {
										if (req.langId == 1) {
	                						edu_callback(null)
	              						} else {
	              							values.healthcare_experience_details.healthcareExperienceId = data.id;
	                						values.healthcare_experience_details.languageId = 1;
	                						models.healthcareexperiencedetail.create(values.healthcare_experience_details).then(function(){
	                  							edu_callback(null)
	                						}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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
								}, function(innErrr) {
									callback(null, true)
								});
							},
							function(callback) {
								models.healthcaretags.bulkCreate(doctortags).then(function(data) {
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
								// module.exports.updateProfileStatusWhileUpdate({
								// 	id: req.id,
								// 	langId: req.langId
								// }, function(resp) {
								module.exports.checkHealthcareProfileCompleted({healthcareProfileId:req.id,userId:''});	
	
									if (1) {
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
								//})
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
									healthcareProfileId: req.id,
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
								healthcareProfileId: req.id
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

		res({status:true});

		// models.doctorprofile.hasMany(models.doctorprofiledetail);

		// models.doctorprofile.hasMany(models.doctortags);

		// models.doctorprofile.hasMany(models.doctoreducation);
		// models.doctoreducation.hasMany(models.doctoreducationdetail)

		// models.doctorprofile.hasMany(models.doctorexperience);
		// models.doctorexperience.hasMany(models.doctorexperiencedetail)

		// models.doctorprofile.hasMany(models.doctorregistration);
		// models.doctorregistration.hasMany(models.doctorregistrationdetail)

		// models.doctorprofile.hasMany(models.doctoraward);
		// models.doctoraward.hasMany(models.doctorawarddetail)

		// models.doctorprofile.hasMany(models.doctorfile);

		// models.doctorprofile.findOne({
		// 	where: {
		// 		id: req.id
		// 	},
		// 	include: [{
		// 			model: models.doctorprofiledetail,
		// 			where: language.buildLanguageQuery({}, req.langId, '`doctor_profiles`.`id`', models.doctorprofiledetail, 'healthcareProfileId')
		// 		},
		// 		{
		// 			model: models.doctortags,
		// 			attributes: ['tagId', 'tagtypeId'],
		// 			required: false
		// 		},
		// 		{
		// 			model: models.doctoreducation,
		// 			include: [{
		// 				model: models.doctoreducationdetail,
		// 				where: language.buildLanguageQuery({}, req.langId, '`doctoreducation`.`id`', models.doctoreducationdetail, 'doctorEducationId'),
		// 				required: false
		// 			}],
		// 			required: false
		// 		},
		// 		{
		// 			model: models.doctorexperience,
		// 			include: [{
		// 				model: models.doctorexperiencedetail,
		// 				where: language.buildLanguageQuery({}, req.langId, '`doctorexperience`.`id`', models.doctorexperiencedetail, 'doctorExperienceId'),
		// 				required: false
		// 			}],
		// 			required: false
		// 		},
		// 		{
		// 			model: models.doctorregistration,
		// 			include: [{
		// 				model: models.doctorregistrationdetail,
		// 				where: language.buildLanguageQuery({}, req.langId, '`doctorregistration`.`id`', models.doctorregistrationdetail, 'doctorRegistrationId'),
		// 				required: false
		// 			}],
		// 			required: false
		// 		},
		// 		{
		// 			model: models.doctoraward,
		// 			include: [{
		// 				model: models.doctorawarddetail,
		// 				where: language.buildLanguageQuery({}, req.langId, '`doctoraward`.`id`', models.doctorawarddetail, 'doctorAwardId'),
		// 				required: false
		// 			}],
		// 			required: false
		// 		},
		// 		{
		// 			model: models.doctorfile,
		// 			required: false
		// 		},
		// 	],
		// }).then(function(result) {
		// 	if (result != null) {
		// 		let educationsStatus = result.doctoreducations.length > 0;
		// 		let registrationsStatus = result.doctorregistrations.length > 0;
		// 		let servicesTagStatus = result.doctortags.some((item) => {
		// 			return item.tagtypeId == 1
		// 		})
		// 		let specializationTagStatus = result.doctortags.some((item) => {
		// 			return item.tagtypeId == 2
		// 		})
		// 		let filesStatus = result.doctorfiles.some((item) => {
		// 			return item.document_type === 'identity'
		// 		})

		// 		let profileCompletionStatus = educationsStatus && registrationsStatus && servicesTagStatus && specializationTagStatus && filesStatus;

		// 		var hospitalDoctorsQuery = "select count(id) as totalHos from hospital_doctors where doctorProfileId = ?"
		// 		models.sequelize.query(hospitalDoctorsQuery, { replacements: [req.id],
		// 			type: models.sequelize.QueryTypes.SELECT
		// 		}).then(function(hosdoctors) {
		// 			profileCompletionStatus = profileCompletionStatus && hosdoctors[0].totalHos > 0
		// 			if (!profileCompletionStatus) {
		// 				models.doctorprofile.update({
		// 					is_complete: 0,
		// 					is_live: 0,
		// 					verified_status: 'incomplete-profile'
		// 				}, {
		// 					where: {
		// 						id: req.id
		// 					},
		// 					individualHooks: true
		// 				}).then(function(updateStatus) {
		// 					res({
		// 						status: true,
		// 						data: result
		// 					});
		// 				}).catch(() => res({
		// 					status: false
		// 				}));
		// 			} else {
		// 				if ("verified" === result.verified_status && result.is_live === 1) {
		// 					res({
		// 						status: true,
		// 						data: result
		// 					});
		// 				} else {
		// 					models.doctorprofile.update({
		// 						is_complete: 1,
		// 						is_live: 0,
		// 						verified_status: 'pending'
		// 					}, {
		// 						where: {
		// 							id: req.id
		// 						},
		// 						individualHooks: true
		// 					}).then(function(updateStatus) {
		// 						res({
		// 							status: true,
		// 							data: result
		// 						});
		// 					}).catch(() => res({
		// 						status: false
		// 					}));
		// 				}
		// 			}
		// 		})
		// 	}
		// })
	}

	this.verifystatus = function(req, res) {

		if (req.id) {
			models.healthcareprofile.belongsTo(models.user)
			models.healthcareprofile.hasMany(models.doctorprofiledetail);
			models.healthcareprofile.findOne({
				include: [
			{ model: models.user },
				{
					model: models.healthcareprofiledetail,
					where: language.buildLanguageQuery({}, req.langId, '`doctor_profiles`.`id`', models.healthcareprofiledetail, 'healthcareProfileId'),
					attributes: ['name', 'about_doctor', 'languageId']
				}],
				where: {
					id: req.id
				}
			}).then(function(data) {

				if (data) {

					models.healthcareprofile.update({
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
   									// notification.send([{
            //                             id: data.id, 
            //                             device_id: data.user.device_id,
            //                             is_notification: data.user.is_notification
            //                         }],
            //                          'front/notification/claim_status/status',
            //                         {
            //                             lang:req.lang,
            //                             claim_message: claim_message,
            //                         }, {
            //                             senderId: 1,
            //                             data:{type:'claim_status'}
            //                         });
   									//verify status send notificaton to doctor

									res({
										status: true,
										message: language.lang({
											key: "updatedSuccessfully",
											lang: req.lang
										})
									});
					});



					//save_json_data_in_mongodb
					// var checkStatus = 1 === data.is_complete && ("approved" === data.claim_status || "user-created" === data.claim_status);
					// if (checkStatus) {
					// 	module.exports.checkLiveHospital({
					// 		id: req.id
					// 	}, function(hospitaldata) {
							
					// 		if (hospitaldata[0].live_hospital > 0) {
					// 			models.healthcareprofile.update({
					// 				verified_status: 'verified',
					// 				is_live: 1,
					// 				live_from: moment().format('YYYY-MM-DD hh:mm:ss')
					// 			}, {
					// 				where: {
					// 					id: req.id
					// 				},
					// 				individualHooks: true
					// 			}).then(function(response) {
					// 				//verify status send notificaton to doctor
					// 				claim_message="Congrats, your profile has been verified and live now and now it is searchable for patients.";

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

	this.fiterHospitalForMap = function(req, res) {
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
		isWhere.hospital = { is_active: 1 }

		isWhere.hospitaldetail = {
			hospital_name: {
				'$like': '%' + reqData.name + '%'
			}
		}

		if(reqData.selected_city) isWhere.hospital.cityId = reqData.selected_city;

		isWhere.contactinformation = {
			'$or': [
				{value: {'$like': '%' + reqData.email + '%'}}, 
				{value: {'$like': '%' + reqData.mobile + '%'}}
			],
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

		models.hospital.findAndCountAll({
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
					where: language.buildLanguageQuery({}, reqData.langId, '`hospitalservices`.`tagId`', models.tagdetail, 'tagId')
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
			}],
			order: [['id', 'DESC']],
			distinct: true,
			limit: setPage,
			offset: pag
		}).then(function(data) {
			var totalData = data.count;
			var pageCount = Math.ceil(totalData / setPage);
			res({
				status: true,
				filtered_hospital_list: data.rows,
				totalData: totalData,
				pageCount: pageCount,
				pageLimit: setPage,
				currentPage: currentPage
			})
		})
	}

	this.myClinics = function(req, res) {
		models.hospital.hasMany(models.hospitaldetail)
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});
		models.hospital.findAll({
			attributes: ["id", "userId", "headId", "is_complete", "is_live", "claim_status", "verified_status", "hospital_logo", "is_active"],
			include: [{
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
			}],
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

	

	this.feecalc=function(req,res){

	
		let feeData={
			fee_amu:100
		}

		function feeType(data){
			this.fee=data;
		}

		feeType.prototype=feeData

		let fee_type = new feeType("2");
		let fee_type2 = new feeType("3");
		console.log(fee_type.fee_amu);
		res({status:true,data:{fee:200}});

	}; 	


	this.reScheduleHealthcare=function(req,res){

		var qry=' select *,min(book_date) min_book_date ';
		qry +=" from healthcare_myschedules where order_token=? group by order_token "

		models.sequelize.query(qry, {
					replacements: [req.order_token],
					type: models.sequelize.QueryTypes.SELECT
		}).then(function(bookData) {
			
			var bookData=bookData[0];
			var dateTime=bookData.min_book_date;			
			var startTime=moment(dateTime, "YYYY-MM-DD");
			var endTime=moment();
			var duration = moment.duration(endTime.diff(startTime));
			var hours = parseInt(duration.asHours());
			var minutes = parseInt(duration.asMinutes())-hours*60;

			//if(minutes < 61){
			if(startTime < endTime){	
				res({status: false, message: language.lang({key: "ReSchedule not possible", lang: req.lang})});
			}else{
				var updateData={};
				updateData['status']=3;
				updateData['status_updated_by']=bookData.patientId;
				if(bookData.pay_status==2){
					updateData['refund_status']=1;
					updateData['refund_amount']=bookData.total_amu;
					updateData['refund_reason']="Service Request cancelled by Patient";
				}
				var msgSend="Schedule Cancelled";
				if(bookData.is_refund){
					updateData['refund_reason']=bookData.refund_reason;
					msgSend="Refund request sent successfully";
				}


				if(bookData){
					var startOn=moment(bookData['min_book_date'],"YYYY-MM-DD").format('YYYY-MM-DD');
					var endTimeRe=moment().format('YYYY-MM-DD');
					if(startOn>endTimeRe){
						updateData['refund_before_start']=1;
					}else{
					  updateData['refund_before_start']=2;	
					}
				}


				models.healthcaremyschedule.update(updateData,{where: {order_token: req.order_token}}).then(function(response) {
					//module.exports.cancle_notify(req, 'patient');
					module.exports.saveBooking(req,function(dataSave){
						msgSend="Appointment Rescheduled successfully";
						res(dataSave);
						//res({status: true, message: language.lang({key:msgSend, lang: req.lang})});
					});
					
				});
			}

		});	   
	}


	
	this.saveBooking=function(req,res){


		var qry='';
		var msgApi='Request has been Booked Successfully.';
		qry +=" select * from global_commissions where type=? "
		models.sequelize.query(qry, {
				replacements:["healthcare_consult"],
				type: models.sequelize.QueryTypes.SELECT
		}).then(function(comsion){

		var comAmu=0;
		var totalComAmu=0;	
		var finalAmu=0;	
		if(comsion.length && req.nonce && req.nonce !=''){
			msgApi='Payment Successful, Request has been booked Successfully.';
			comAmu=parseFloat(comsion[0]['percentage']);
			totalComAmu=(comAmu/100)*parseFloat(req.amount);
			finalAmu=parseFloat(req.amount)-totalComAmu;
		}	

		var time=[];
		if(typeof req.date==='string'){
		 time=JSON.parse(req.date);
		}else{
		 time=req.date;
		}


		var saveArr=[];
		var bookData={};
		var bookDataArr=[];
		var order_id=uniqid();


		var whereIS='';
		var whereArr=[];
		whereArr.push(req.healthcareProfileId);

		if(req.service_type==1 || req.service_type==2){
		  for(var i = 0; i< time.length; i++){
		  	if(i==0){
		  	   whereIS+=" (book_date=? "	
		  	}else{
		  	  whereIS+=" or book_date=? "	
		  	}
		  	whereArr.push(time[i]);		
		  }
		  whereIS= ' and ' + whereIS + ')';
		  
		}

		if(req.service_type==3){
			whereIS=' and 1=0 ';
		}


		// if(req.service_type==3){
		//  for(dateVal in time){
		//  	whereIS+=" (book_date=? or book_time=? or "
		// 	console.log(time[dateVal]);
		// 	var timeArr=time[dateVal];
		// 	for(var i = 0; i< timeArr.length; i++){
		// 	  var from24=moment(timeArr[i], "h:mm A").format("HH:mm");
		// 	}
		//  }
		// }

		var qry='';
		qry +=" select * from healthcare_myschedules where healthcareprofileId=? and status!=3 "+whereIS
		models.sequelize.query(qry, {
				replacements: whereArr,
				type: models.sequelize.QueryTypes.SELECT
		}).then(function(isMatch){

		if(isMatch.length){
			res({status:false,message:language.lang({key: "Schedule already booked",lang: req.lang}),data:[]});
			//return false;
		}else{

			if(req.service_type==1 || req.service_type==2){
				  for(var i = 0; i< time.length; i++){

					bookData={};
					bookData["healthcareProfileId"]=req.healthcareProfileId;
					bookData["book_date"]=time[i];
					bookData["patient_name"]=req.patient_name;
					bookData["patient_mobile"]=req.patient_mobile;
					bookData["patient_email"]=req.patient_email;
					bookData["patientId"]=req.patientId;
					bookData["service_type"]=req.service_type;
					bookData["avb_on"]=req.avb_on;
					bookData["pay"]=req.fee;
					bookData["total_amu"]=req.amount;
					bookData["com_amu"]=totalComAmu;
					bookData["final_amu"]=finalAmu;
					bookData["order_token"]=order_id;
					bookData["pay_status"]=req.nonce && req.nonce !='' ? 2 : 1;
					bookDataArr.push(bookData);
				 }
				}else{
					for(dateVal in time){
						
						var timeArr=time[dateVal];
						for(var i = 0; i< timeArr.length; i++){
								var from24=moment(timeArr[i], "h:mm A").format("HH:mm");
								from24 = from24.split(':');
								var secondsFrom = (+from24[0]) * 60 * 60 + (+from24[1]) * 60 ;
								bookData={};
								bookData["healthcareProfileId"]=req.healthcareProfileId;
								bookData["book_date"]=dateVal;
								bookData["time_sec"]=secondsFrom;
								bookData["from_time"]=timeArr[i];
								bookData["patient_name"]=req.patient_name;
								bookData["patient_mobile"]=req.patient_mobile;
								bookData["patient_email"]=req.patient_email;
								bookData["patientId"]=req.patientId;
								bookData["service_type"]=req.service_type;
								bookData["avb_on"]=req.avb_on;
								bookData["pay"]=req.fee;
								bookData["order_token"]=order_id;
								bookData["total_amu"]=req.amount;
								bookData["com_amu"]=totalComAmu;
								bookData["final_amu"]=finalAmu;
								bookData["pay_status"]=req.nonce && req.nonce !='' ? 2 : 1;
								bookDataArr.push(bookData);
						}
				}
			}

			if(req.nonce && req.nonce !=''){


				let transactionRequest = {
						amount: req.amount,
						paymentMethodNonce: req.nonce,
						options: {
    						submitForSettlement: true
  						}
					};

					console.log(transactionRequest);

					gateway.transaction.sale(transactionRequest, function (err, result) {
						if(err) {
							res({status: false,message: language.lang({key: "Payment failed", lang: req.lang})});
						} else {
							// res({
							// 	status: true,
							// 	data: {
							// 		transactionId: result.transaction.id
							// 	},
							// 	message: language.lang({key: "Payment success", lang: req.lang})
							// });

							//payment_data

							for(var i=0;i<bookDataArr.length;i++){
								bookDataArr[i]['payment_data']=result.transaction.id;
							}

							models.healthcaremyschedule.bulkCreate(bookDataArr).then(function(data) {
							res({status:true,message:language.lang({key:msgApi,lang: req.lang}),data: data});
							});	
						}
					});	


			}else{


				models.healthcaremyschedule.bulkCreate(bookDataArr).then(function(data) {
				res({status:true,message:language.lang({key:msgApi,lang: req.lang}),data: data});
				});	


			}

			


		}	

	});	

	});	

	
	}

	
	this.getExtData=function(req,res){

		var qry=' select';
		qry +=" ifnull((select avg(ifnull(rating,0)) from healthcare_feedbacks where healthcareprofileId=?),0) rating,"
		qry +=" (SELECT max(duration_to)-min(duration_from) FROM healthcare_experiences where healthcareProfileId=?) experience, "
		qry +=" (select group_concat(title SEPARATOR ', ') from healthcare_educations he left join tag_details td on he.tagtypeId=td.tagId where he.healthcareprofileId=?) tags "
		qry +=" from healthcare_profiles limit 1 "
		models.sequelize.query(qry, {
					replacements: [req.healthcareprofileId,req.healthcareprofileId,req.healthcareprofileId],
					type: models.sequelize.QueryTypes.SELECT
		}).then(function(data) {

			res(data);
		
		});		

	}


	this.getBooking=function(req,res){

		//Add lang--------------
		var whereArr=[];
		req.langId = parseInt(req.langId);
  		if (isNaN(req.langId)) req.langId = 1;
		whereArr.push(req.langId,req.langId,req.langId,req.langId,req.langId,req.langId,req.healthcareprofileId);			 
		//----------------------
		var blokDatesArr=[];

		var qry='';
		var qry1='';
		var qry2='';
		var qry_limit='';
		qry1 +=" select ht.avb_on avb_on,(SELECT sum(duration_to-duration_from) FROM healthcare_experiences where healthcareProfileId=hp.id) experience,hpd.healthcareprofileId,ht.fee,ht.type,hpd.name,doctor_profile_pic,avg(ifnull(rating,0)) rating,hp.id healthcareprofileId,count(rating) reviews,GROUP_CONCAT(distinct tagd.title SEPARATOR ', ') tags  "
		qry +=" from healthcare_profiles hp left join healthcare_profile_details hpd on hp.id=hpd.healthcareprofileId and hpd.languageId=if(hpd.languageId=?,?,1) "
		qry +=" left join healthcare_educations hedu on hp.id=hedu.healthcareprofileId "
		qry += " left join healthcare_feedbacks hfed on hp.id=hfed.healthcareprofileId "
		//qry += " left join healthcare_tags htag on hp.id=htag.healthcareprofileId "
		qry += " left join tag_details tagd on hedu.tagtypeId=tagd.tagId and tagd.languageId=if(tagd.languageId=?,?,1) "
		qry +="  left join healthcare_tags htag on hp.id=htag.healthcareprofileId "
		qry += " left join tag_details tagd2 on htag.tagId=tagd2.tagId and tagd2.languageId=if(tagd2.languageId=?,?,1) "
		qry += " left join healthcare_timings ht on hp.id=ht.healthcareprofileId "
		qry += " where 1=1 and hp.id=? "
		qry_limit += " group by hp.id "

		models.sequelize.query(qry1+qry+qry_limit, {
				replacements:whereArr,
				type: models.sequelize.QueryTypes.SELECT
		}).then(function(Healthcaredata) {


		var finalOp=[];
		var bookedArr=[];


		var qryBlok='';
		qryBlok +=" select * from healthcare_block_schedules where healthcareprofileId=? and (((? between from_date and to_date) or (? between from_date and to_date)) or  ((from_date between  ? and ?) or (to_date between ? and ?)))  "

		models.sequelize.query(qryBlok, {
				replacements: [req.healthcareprofileId,req.from,req.to,req.from,req.to,req.to,req.from],
				type: models.sequelize.QueryTypes.SELECT
		}).then(function(blokDates) {


			for(var i=0;i<blokDates.length;i++){	
				var start = new Date(blokDates[i]['from_date']);
				var end = new Date(blokDates[i]['to_date']);
				var loop = new Date(start);
				var counter=0;
				while(loop <= end){   
				   var dayName=loop;
				   var dt = moment(dayName, "YYYY-MM-DD").format('YYYY-MM-DD');
				   blokDatesArr.push(dt);	
				   var newDate = loop.setDate(loop.getDate() + 1);
				   loop = new Date(newDate);
				   counter++;
				}  
			}

		console.log('blokDatesArr----');	
		console.log(blokDatesArr);	
		console.log('blokDatesArr----');

		var qry='';
		qry +=" select * from healthcare_timings where healthcareprofileId=?"

		models.sequelize.query(qry, {
				replacements: [req.healthcareprofileId],
				type: models.sequelize.QueryTypes.SELECT
		}).then(function(data) {


			if(data.length){
			var qry='';
			qry +=" select *,GROUP_CONCAT(from_time) from_time_list from healthcare_myschedules where healthcareprofileId=? and book_date between ? and ? group by book_date "

			models.sequelize.query(qry, {
					replacements: [req.healthcareprofileId,req.from,req.to],
					type: models.sequelize.QueryTypes.SELECT
			}).then(function(booked) {

			var bookedObj={};
			var bookedObjDate={};
			for(var i=0;i<booked.length;i++){
				bookedObj[booked[i]['days']]=booked[i];
				bookedArr.push(moment(booked[i]['book_date'], "YYYY-MM-DD").format('YYYY-MM-DD'));

				if(booked[i]['from_time_list']){
				   bookedObjDate[moment(booked[i]['book_date'], "YYYY-MM-DD").format('YYYY-MM-DD')]=booked[i]['from_time_list'].split(',');
				}else{
					bookedObjDate[moment(booked[i]['book_date'], "YYYY-MM-DD").format('YYYY-MM-DD')]='';
				}
			}	


			var bookObj={};	
			for(var i=0;i<data.length;i++){
				if(data[0]['type']==1){
				 bookObj=data[i];
				}else{
				   bookObj[data[i]['days']]=data[i];	
				}
			}

			var start = new Date(req.from);
			var end = new Date(req.to);
			var loop = new Date(start);
			var counter=0;
			while(loop <= end){   
			   var dayName=loop;
			   var dt = moment(dayName, "YYYY-MM-DD");
			   var day=dt.format('dddd').toLowerCase();

			   if(blokDatesArr.indexOf(moment(dayName, "YYYY-MM-DD").format("YYYY-MM-DD")) ===-1){
			   //if(1){	
			   if(data[0]['type']==3){
			   	//if(bookObj[day] && bookedArr.indexOf(dt.format('YYYY-MM-DD')) ==-1){
			   	if(bookObj[day] && data[counter]){	
			   		bookObj[day]['date']=dt.format('YYYY-MM-DD');

			   		var travelTime;
					var dur = 3600;
					var start_time = data[counter]['from_time_sec'];
					var shift_1_arr = [];

					for (var i = 1; i < 100; i++) {

						var time24Is=moment().startOf('day').seconds(start_time).format('h:mm A');
						var time24IsObj={time:time24Is,is_booked:0};
						if(! bookedObjDate[bookObj[day]['date']]){
						  //time24IsObj['is_booked']=bookedObjDate[bookObj[day]['date']].indexOf(time24Is)===-1 ? 0 :1	
						  shift_1_arr.push(time24Is);	
						}
						else{
						//else if(bookedObjDate[bookObj[day]['date']].indexOf(time24Is)===-1){
							time24IsObj['is_booked']=bookedObjDate[bookObj[day]['date']].indexOf(time24Is)===-1 ? 0 :1
							shift_1_arr.push(time24IsObj);
						}
						// else if(bookedObjDate[bookObj[day]['date']].indexOf(time24Is)===-1){
						// 	shift_1_arr.push(time24Is);
						// }


						travelTime = parseInt(start_time) + parseInt(dur);
						start_time = travelTime;
						if (start_time > data[counter]['to_time_sec']) {
							break;
						}
						
					}

			   		bookObj[day]['time']=shift_1_arr;
			   		finalOp.push(bookObj[day]);
			  	}
			   }else{

				   	if(data[0]['type']==1){
				   	var objPass={};
				   	//if(bookedArr.indexOf(dt.format('YYYY-MM-DD')) ==-1){
				   		var newDate2=dt.format('YYYY-MM-DD');
				   		objPass={};
				   		objPass=Object.assign({},bookObj);
				   		objPass['date']=newDate2;
				   		objPass['avb_on_txt']="24x7 (Stay at home with Patient)";
				   		objPass['is_booked']=bookedArr.indexOf(dt.format('YYYY-MM-DD')) ==-1 ? 0 : 1;
				   		finalOp.push(objPass);
				  	//}
				   	}else{
				   	//if(bookObj[day] && bookedArr.indexOf(dt.format('YYYY-MM-DD')) ==-1){
				   	if(bookObj[day]){	
				   		bookObj[day]['date']=dt.format('YYYY-MM-DD');
				   		bookObj[day]['avb_on_txt']=data[0]['avb_on']==1 ? "Morning hours (8Am to 8Pm)" : "Evening hours (8Pm to 8Am)" 
				   		bookObj[day]['is_booked']=bookObj[day] && bookedArr.indexOf(dt.format('YYYY-MM-DD')) ==-1 ? 0 : 1;
				   		finalOp.push(bookObj[day]);
				  	}
				   	}
			   	

			   	}
			   }
			   var newDate = loop.setDate(loop.getDate() + 1);
			   loop = new Date(newDate);
			   counter++;

			}
		
			res({status:true,message:'',data:{timing:finalOp,healthcaredata:Healthcaredata}});

		  });

		  }else{

			res({status:true,message:'Timing Not Found',data:[]});
		  }	

		});	

		});

		});

	}


	this.getBookingStatus=function(req,res){

		var qry='';
		var qry1='';
		var qry2='';
		var qry_limit='';
		var blokDatesArr=[];
		qry1 +=" select ht.avb_on avb_on,(SELECT sum(duration_to-duration_from) FROM healthcare_experiences where healthcareProfileId=hp.id) experience,hpd.healthcareprofileId,ht.fee,ht.type,hpd.name,doctor_profile_pic,avg(ifnull(rating,0)) rating,hp.id healthcareprofileId,count(distinct rating) reviews,GROUP_CONCAT(distinct tagd.title SEPARATOR ', ') tags,concat(hp.salutation,' ',hpd.name) name "
		qry +=" from healthcare_profiles hp left join healthcare_profile_details hpd on hp.id=hpd.healthcareprofileId "
		qry +=" left join healthcare_educations hedu on hp.id=hedu.healthcareprofileId "
		qry += " left join healthcare_feedbacks hfed on hp.id=hfed.healthcareprofileId "
		//qry += " left join healthcare_tags htag on hp.id=htag.healthcareprofileId "
		qry += " left join tag_details tagd on hedu.tagtypeId=tagd.tagId "
		qry +="  left join healthcare_tags htag on hp.id=htag.healthcareprofileId "
		qry += " left join tag_details tagd2 on htag.tagId=tagd2.tagId "
		qry += " left join healthcare_timings ht on hp.id=ht.healthcareprofileId "
		qry += " where 1=1 and hp.id=? "
		qry_limit += " group by hp.id "

		models.sequelize.query(qry1+qry+qry_limit, {
				replacements:[req.healthcareprofileId],
				type: models.sequelize.QueryTypes.SELECT
		}).then(function(Healthcaredata) {


		var finalOp=[];
		var bookedArr=[];


		var qryBlok='';
		qryBlok +=" select * from healthcare_block_schedules where healthcareprofileId=? and (((? between from_date and to_date) or (? between from_date and to_date)) or  ((from_date between  ? and ?) or (to_date between ? and ?)))  "

		models.sequelize.query(qryBlok, {
				replacements: [req.healthcareprofileId,req.from,req.to,req.from,req.to,req.to,req.from],
				type: models.sequelize.QueryTypes.SELECT
		}).then(function(blokDates) {


			for(var i=0;i<blokDates.length;i++){	
				var start = new Date(blokDates[i]['from_date']);
				var end = new Date(blokDates[i]['to_date']);
				var loop = new Date(start);
				var counter=0;
				while(loop <= end){   
				   var dayName=loop;
				   var dt = moment(dayName, "YYYY-MM-DD").format('YYYY-MM-DD');
				   blokDatesArr.push(dt);	
				   var newDate = loop.setDate(loop.getDate() + 1);
				   loop = new Date(newDate);
				   counter++;
				}  
			}

		var qry='';
		qry +=" select * from healthcare_timings where healthcareprofileId=?"

		models.sequelize.query(qry, {
				replacements: [req.healthcareprofileId],
				type: models.sequelize.QueryTypes.SELECT
		}).then(function(data) {


			if(data.length){
			var qry='';
			qry +=" select *,GROUP_CONCAT(from_time) from_time_list from healthcare_myschedules where healthcareprofileId=? and (book_date between ? and ?) and (status!=3) group by book_date "

			models.sequelize.query(qry, {
					replacements: [req.healthcareprofileId,req.from,req.to],
					type: models.sequelize.QueryTypes.SELECT
			}).then(function(booked) {

			var bookedObj={};
			var bookedObjDate={};
			for(var i=0;i<booked.length;i++){
				bookedObj[booked[i]['days']]=booked[i];
				bookedArr.push(moment(booked[i]['book_date'], "YYYY-MM-DD").format('YYYY-MM-DD'));

				if(booked[i]['from_time_list']){
				   bookedObjDate[moment(booked[i]['book_date'], "YYYY-MM-DD").format('YYYY-MM-DD')]=booked[i]['from_time_list'].split(',');
				}else{
					bookedObjDate[moment(booked[i]['book_date'], "YYYY-MM-DD").format('YYYY-MM-DD')]='';
				}
			}	

			var bookObj={};	
			for(var i=0;i<data.length;i++){
				if(data[0]['type']==1){
				 bookObj=data[i];
				}else{
				   bookObj[data[i]['days']]=data[i];	
				}
			}

			var start = new Date(req.from);
			var end = new Date(req.to);
			var loop = new Date(start);
			var counter=0;
			while(loop <= end){  

			   console.log(loop);	
			   var dayName=loop;
			   var dt = moment(dayName, "YYYY-MM-DD");
			   var day=dt.format('dddd').toLowerCase();
			   
			   console.log(dt);
			   console.log(day);
			   console.log(bookObj[day]); 
			   console.log(bookedObjDate);
			   if(blokDatesArr.indexOf(moment(dayName, "YYYY-MM-DD").format("YYYY-MM-DD")) ===-1){
			   	
			   if(data[0]['type']==3){
			   	//if(bookObj[day] && bookedArr.indexOf(dt.format('YYYY-MM-DD')) ==-1){
			   	//if(bookObj[day] && data[counter]){	
			   	if(bookObj[day]){	

			   		var objPass={};
				   	objPass=Object.assign({},bookObj[day]);	

			   		objPass['date']=dt.format('YYYY-MM-DD');
			   		
			   		var travelTime;
					var dur = 3600;
					var start_time = bookObj[day]['from_time_sec'];
					var shift_1_arr = [];

					for (var i = 1; i < 100; i++) {

						var time24Is=moment().startOf('day').seconds(start_time).format('h:mm A');
						var time24IsObj={};
						time24IsObj={time:time24Is,is_booked:0};
						if(! bookedObjDate[bookObj[day]['date']]){
						  shift_1_arr.push(time24IsObj);	
						}
						else{
						//else if(bookedObjDate[bookObj[day]['date']].indexOf(time24Is)===-1){
							time24IsObj['is_booked']=bookedObjDate[bookObj[day]['date']].indexOf(time24Is)===-1 ? 0 :1
							shift_1_arr.push(time24IsObj);
						}

						console.log(time24IsObj);

						travelTime = parseInt(start_time) + parseInt(dur);
						start_time = travelTime;
						if (start_time > bookObj[day]['to_time_sec']) {
							break;
						}
						
					}

			   		objPass['time']=shift_1_arr;
			   		finalOp.push(objPass);
			  	}
			   }else{

				   	if(data[0]['type']==1){
				   	var objPass={};
				   	//if(bookedArr.indexOf(dt.format('YYYY-MM-DD')) ==-1){
				   		var newDate2=dt.format('YYYY-MM-DD');
				   		objPass={};
				   		objPass=Object.assign({},bookObj);
				   		objPass['date']=newDate2;
				   		objPass['is_booked']=bookedArr.indexOf(dt.format('YYYY-MM-DD')) ==-1 ? 0 : 1;
				   		objPass['avb_on_txt']="24x7 (Stay at home with Patient)";
				   		
				   		finalOp.push(objPass);
				  	//}
				   	}else{

				   	//console.log('bookObj[day]');		
				   	//console.log(bookObj[day]);	

				   	if(bookObj[day]){
				   	//if(bookObj[day] && bookedArr.indexOf(dt.format('YYYY-MM-DD')) ==-1){
				   						   		console.log(dt.format('YYYY-MM-DD'));
				   		console.log('end loop 1....................');

				   		var objPass={};
				   		objPass=Object.assign({},bookObj[day]);	
				   		objPass['date']=dt.format('YYYY-MM-DD');
				   		objPass['is_booked']=bookedArr.indexOf(dt.format('YYYY-MM-DD')) ==-1 ? 0 : 1;
				   		objPass['avb_on_txt']=data[0]['avb_on']==1 ? "Morning hours (8Am to 8Pm)" : "Evening hours (8Pm to 8Am)" 
				   		finalOp.push(objPass);
				   		// console.log('bookObj[day]-----enter');
				   		// console.log(finalOp);
				   		// console.log('bookObj[day]-----enter');
				  	}
				   	}
			   	

			   }
			   }
			   var newDate = loop.setDate(loop.getDate() + 1);
			   loop = new Date(newDate);
			   counter++;
			}
		
			res({status:true,message:'',data:{timing:finalOp,healthcaredata:Healthcaredata}});

		  });

		  }else{

			res({status:true,message:'Timing Not Found',data:[]});
		  }	

		});	
		});	

		});

	}



	this.searchTag=function(req,res){

		var qry="";
		var qryCount="";
		var qrySelect="";
		var qry_limit="";

		//Add lang--------------
		var whereArr=[];
		req.langId = parseInt(req.langId);
  		if (isNaN(req.langId)) req.langId = 1;		 
		//----------------------
		var start=0;
		if(req.body.pageNo){
			start=parseInt(req.body.limit) * (parseInt(req.body.pageNo)-1)
		}
		var srch='';
		var whereArrCount=[];
		var whereArr=[];


		var col='';
		if(req.body.latitude && req.body.latitude !="" && req.body.longitude && req.body.longitude!=""){
			
			col+=" ,69 * "
	    	col+=" DEGREES(ACOS(COS(RADIANS(hp.latitude)) "
	        col+=" * COS(RADIANS(?)) "
	        col+=" * COS(RADIANS(hp.longitude - ?)) "
	        col+=" + SIN(RADIANS(hp.latitude)) "
	        col+=" * SIN(RADIANS(?)))) AS distance_in_km "
	        whereArr.push(req.body.latitude,req.body.longitude,req.body.latitude);
	        whereArrCount.push(req.body.latitude,req.body.longitude,req.body.latitude);

	        srch+=" and distance_in_km < 51.0 "

		}



		whereArrCount.push(req.langId,req.langId);
		whereArr.push(req.langId,req.langId);
		
		if(req.body.cityId && req.body.cityId !=""){
			srch=" and hp.cityId=? "
			whereArrCount.push(req.body.cityId);
			whereArr.push(req.body.cityId);
		}

		whereArrCount.push(req.langId,req.langId);
		whereArr.push(req.langId,req.langId);

		whereArrCount.push('%'+req.body.title+'%');
		whereArr.push('%'+req.body.title+'%',start,parseInt(req.body.limit));


		//1=>HealthCare  2=>Specialization 3=>Services
		qryCount+=" select count(id) from ( "
		qrySelect+=" select * "
		qrySelect+=" from ( "
		qry+=" select hp.cityId,hp.id,concat(hp.salutation,' ',hpd.name) title,doctor_profile_pic image,'Healthcare' type,'1' type_id  "+col;
		qry+=" from healthcare_profiles hp join healthcare_profile_details hpd on hp.id=hpd.healthcareprofileId and hp.is_live=1 and hp.is_active=1 and hpd.languageId=if(hpd.languageId=?,?,1) having 1=1 "+srch
		qry+=" union "
		qry+=" select '1',t.id,td.title,'','Specializations' type,'2' type_id,'' from "
		qry+=" tags t inner join tag_details td on t.id=td.tagId and t.tagtypeId in ('23') and t.is_approved=1 and t.is_active=1 and td.languageId=if(td.languageId=?,?,1) "
		qry+="  ) tab where tab.title like ? "
		qry_limit+=" limit ?,? "

		

		models.sequelize.query(qryCount+qry, {
				replacements: whereArrCount,
				type: models.sequelize.QueryTypes.SELECT
		}).then(function(counter) {

			models.sequelize.query(qrySelect+qry+qry_limit, {
					replacements:whereArr,
					type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {

				res({status:true,message:"",data:data,pageLimit:req.body.limit,pageNo:req.body.pageNo}); 

			});	

		});

	}

	this.saveBank=function(req,res){

		var doctorProfile = models.healthcareprofile.build(req);
		var errors = [];
		async.parallel([
			function(callback) {
				doctorProfile.validate().then(function(err) {
					console.log(err);
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				})
				// .catch(() => res({
				// 	status: false,
				// 	error: true,
				// 	error_description: language.lang({
				// 		key: "Internal Error1",
				// 		lang: req.lang
				// 	}),
				// 	url: true
				// }));
			}	
		], function(err, errors) {

			console.log(errors);

		var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});

       
        if (uniqueError.length === 0) {
			var saveData={};
			saveData['acc_name']=req.acc_name;
			saveData['acc_no']=req.acc_no;
			saveData['acc_type']=req.acc_type;
			saveData['bank_name']=req.bank_name;
			saveData['bank_city']=req.bank_city;
			saveData['bank_ifsc']=req.bank_ifsc;

			models.healthcareprofile.update(req, {
							where: {
								userId: req.userId
							}
			}).then(function(data) {

				res({status:true,message:language.lang({key: "addedSuccessfully",lang: req.lang}),data: data});

			});
		}else {
          language.errors({errors:uniqueError, lang:req.lang}, function(errors){
            var newArr = {};
            console.log(errors);
            var errObj={};
            for(var i=0;i<errors.length;i++){
            	errObj[errors[i]['path']]=errors[i]['message'];
            }
            newArr = errObj;
            res(errObj);
          });
        }

		});
		
	}


	this.searchSealthcare=function(req,res){

		req.query=req.body;

		var where='';
		var whereArr=[];

		whereArr.push(req.body.langId,req.body.langId,req.body.langId,req.body.langId,req.body.langId,req.body.langId);

		if(req.query.title){

			if(req.query.type_id==1){
				where +=" and (hpd.name like ?) ";
				whereArr.push('%'+req.query.title+'%');
			}

			if(req.query.type_id==2){
				where +=" and (tagd2.title like ?) ";
				whereArr.push('%'+req.query.title+'%');
			}


			if(req.query.type_id==3){
				where +=" and (tagd2.title like ?) ";
				whereArr.push('%'+req.query.title+'%');
			}

			// where +=" and (hpd.name like ? or tagd.title like ?) ";
			// whereArr.push('%'+req.query.title+'%');
			// whereArr.push('%'+req.query.title+'%');
		}
		//1-male 2-female
		if(req.query.gender){
			var genObj={1:'male',2:'female'}
			where +=" and (hp.gender=?) "
			whereArr.push(genObj[req.query.gender]);
		}

		//services_type :-  1=>Available 24X7   2=>Available 12 hr/day 3=>Available 12 hr/night    4=>Available on hourly basis
		if(req.query.services_type){
		  if(req.query.services_type==1){
		  	where +=" and (ht.type=1) ";
		  }else if(req.query.services_type==2){
		  	where +=" and (ht.type=2 and ht.avb_on=1)";
		  }else if(req.query.services_type==3){
		  	where +=" and (ht.type=2 and ht.avb_on=2) ";
		  }else if(req.query.services_type==4){
		  	where +=" and (ht.type=3) ";
		  }	
		  	
		}


		if(req.query.cityId){
			where +=" and (hp.cityId=?) "
			whereArr.push(req.query.cityId);
		}


		if(req.body.latitude && req.body.latitude !="" && req.body.longitude && req.body.longitude!=""){
			where+=" and (69 * "
	    	where+=" DEGREES(ACOS(COS(RADIANS(hp.latitude)) "
	        where+=" * COS(RADIANS(?)) "
	        where+=" * COS(RADIANS(hp.longitude - ?)) "
	        where+=" + SIN(RADIANS(hp.latitude)) "
	        where+=" * SIN(RADIANS(?))))) < 51 "
	        whereArr.push(req.body.latitude,req.body.longitude,req.body.latitude);
		}



		var start=0;
		if(req.query.pageNo){
			start=parseInt(req.query.limit) * (parseInt(req.query.pageNo)-1)
		}

		whereArr.push(start);
		whereArr.push(parseInt(req.query.limit));

		
		var qry='';
		var qry1='';
		var qry2='';
		var qry_limit='';

		qry2=' select count(distinct hpd.healthcareprofileId) counter ';
		qry1 +=" select ht.avb_on avb_on,if(hp.acc_no IS NULL OR hp.acc_no ='',0,1) avb_book,(SELECT max(duration_to)-min(duration_from) FROM healthcare_experiences where healthcareProfileId=hp.id) experience,hpd.healthcareprofileId,ht.fee,ht.type,hpd.name,doctor_profile_pic,avg(ifnull(rating,0)) rating,hp.id healthcareprofileId,count(distinct rating) reviews,GROUP_CONCAT(distinct tagd.title SEPARATOR ', ') tags,concat(hp.salutation,' ',hpd.name) name  "
		qry1 +="  ,(select `value` from contact_informations where model='home_healthcare' and type='mobile' and is_primary=1 and `key`=hp.id limit 1 ) mobile "
		qry +=" from healthcare_profiles hp left join healthcare_profile_details hpd on hp.id=hpd.healthcareprofileId and hpd.languageId=if(hpd.languageId=?,?,1) "
		qry +=" left join healthcare_educations hedu on hp.id=hedu.healthcareprofileId "
		qry += " left join healthcare_feedbacks hfed on hp.id=hfed.healthcareprofileId "
		//qry += " left join healthcare_tags htag on hp.id=htag.healthcareprofileId "
		qry += " left join tag_details tagd on hedu.tagtypeId=tagd.tagId and tagd.languageId=if(tagd.languageId=?,?,1) "

		qry +="  left join healthcare_tags htag on hp.id=htag.healthcareprofileId "
		qry += " left join tag_details tagd2 on htag.tagId=tagd2.tagId and tagd2.languageId=if(tagd2.languageId=?,?,1) "

		qry += " left join healthcare_timings ht on hp.id=ht.healthcareprofileId "
		qry += " where 1=1 and hp.is_live=1 and hp.is_active=1 "+where
		qry_limit += " group by hp.id "
		qry_limit+=" limit ?,? "


		models.sequelize.query(qry2+qry, {
				replacements: whereArr,
				type: models.sequelize.QueryTypes.SELECT
		}).then(function(counter) {


		models.sequelize.query(qry1+qry+qry_limit, {
				replacements: whereArr,
				type: models.sequelize.QueryTypes.SELECT
		}).then(function(data) {

			var cityQry=" select name from city_details where cityId=? and languageId=? ";
			models.sequelize.query(cityQry, {
				replacements:[req.query.cityId,req.body.langId],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(city) {

			var cityName='';
			if(city.length)	
				cityName=city[0]['name']

			var pageCount=Math.ceil(parseInt(counter[0]['counter'])/parseInt(req.query.limit));
			res({status:true,city:cityName,message:'',data:data,totalData:counter[0]['counter'],pageCount:pageCount,pageLimit:req.query.limit,currentPage:req.query.pageNo});


			});

		});	

		});	
	}

	this.healthcareDasboard = function(req, res) {
		models.healthcareprofile.hasMany(models.healthcareprofiledetail);
		models.healthcareprofile.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});
		isWhere = {}
		models.healthcareprofile.find({
			attributes: [
				'id',
				'userId',
				'mobile',
				'email',
				'salutation',
				'doctor_profile_pic',
				'latitude',
				'longitude'
			],
			include: [{
					model: models.healthcareprofiledetail,
					required: false,
					where: language.buildLanguageQuery({}, req.langId, '`healthcareprofile`.`id`', models.healthcareprofiledetail, 'healthcareProfileId')
				},
				{
					model: models.contactinformation,
					where: {
						model: 'home_healthcare'
					},
					required: false
				}
			],
			where: {
				id: req.id,
			},
			order: [
				['id', 'DESC']
			]
		}).then(function(data) {
			promis = new Promise(resolve => users.getAssociateProfile({
				id: data.userId,
				user_type: 'home_healthcare',
				lang: data.default_lang
			}, (associatedProfileData) => {
				return resolve(associatedProfileData);
			}))
			promis.then(function(associativeddd){
				models.notificationreceiver.count({
					where: {
						receiverId:data.userId,
						status: 0
					}
				}).then(count => {
					res({
						status:true,
						message:'Healthcare profile data',
						data: data,
						associatedProfileData : associativeddd.data,
						unreadNoti: count
					})
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};
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
module.exports = new healthcare();