var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var country = require('./country');
var state = require('./state');
var city = require('./city');
var tagtype = require('./tagtype');
//var patienttag = require('./patienttag');

models.hospital_doctors.belongsTo(models.hospital);
models.hospital.hasMany(models.hospitaldetail);

function Patient() {

	this.getAllCountry = function (req, res) {
		country.getAllCountry(req, function (countries) {
			res({
				countries: countries
			});
		});
	}

	this.list = function (req, res) {
		var pageSize = req.app.locals.site.page, // number of items per page
			page = req.query.page || 1;

		var reqData = req.body.data ? JSON.parse(req.body.data) : req.body,
			where = {
				hospitaldetail: {},
			};
		if (req.query) {
			Object.keys(req.query).forEach(key => {
				if (req.query[key] === '') return;
				var modalKey = key.split('__');
				if (modalKey[0] in where) {
					where[modalKey[0]][modalKey[1]] = {
						'$like': '%' + req.query[key] + '%'
					};
				} else {
					where[modalKey[0]] = {};
					where[modalKey[0]][modalKey[1]] = {
						'$like': '%' + req.query[key] + '%'
					};
				}
			});
		}

		where.patientdetail = language.buildLanguageQuery(
			where.patientdetail, reqData.langId, '`patient`.`id`', models.patientdetail, 'patientId'
		);
		where.countrydetail = language.buildLanguageQuery(
			where.countrydetail, reqData.langId, '`country`.`id`', models.countrydetail, 'countryId'
		);
		where.statedetail = language.buildLanguageQuery(
			where.statedetail, reqData.langId, '`state`.`id`', models.statedetail, 'stateId'
		);
		where.citydetail = language.buildLanguageQuery(
			where.citydetail, reqData.langId, '`city`.`id`', models.citydetail, 'cityId'
		);


		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.hospitalfile);
		models.hospital.belongsTo(models.country);
		models.hospital.belongsTo(models.state);
		models.hospital.belongsTo(models.city);
		models.country.hasMany(models.countrydetail);
		models.state.hasMany(models.statedetail);
		models.city.hasMany(models.citydetail);
		models.hospital.findAndCountAll({
				include: [{
						model: models.hospitaldetail,
						where: where.hospitaldetail
					},
					{
						model: models.hospitalfile,
						where: where.hospitalfile
					},
					{
						model: models.country,
						include: [{
							model: models.countrydetail,
							where: where.countrydetail
						}]
					},
					{
						model: models.state,
						include: [{
							model: models.statedetail,
							where: where.statedetail
						}]
					},
					{
						model: models.city,
						include: [{
							model: models.citydetail,
							where: where.citydetail
						}]
					}
				],
				distinct: true,
				where: where.hospital,
				order: [
					['id', 'DESC']
				],
				limit: pageSize,
				offset: (page - 1) * pageSize
			})
			.then(result => {
				res({
					status: true,
					data: result.rows,
					totalData: result.count,
					pageCount: Math.ceil(result.count / pageSize),
					pageLimit: pageSize,
					currentPage: page
				});
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

	/*  * patient question list */
	this.questionlist = function (req, res) {
		var pageSize = req.app.locals.site.page, // number of items per page    
			page = req.body.page || 1;

		models.patientquestion.belongsTo(models.tag);
		models.tag.hasMany(models.tagdetail);

		models.patientquestion.findAndCountAll({
			// distinct: true,     
			attributes: ['id', 'tagId', 'problem_title', 'description', 'image', 'createdAt'],
			include: [{
				model: models.tag,
				attributes: ['id'],
				include: [{
					model: models.tagdetail,
					attributes: ['title'],
					where: language.buildLanguageQuery(
						{}, req.body.langId, '`patientquestion`.`tagId`', models.tagdetail, 'tagId'
					)
				}]
			}],
			where: {
				patientId: req.body.patientId
			},
			order: [
				['createdAt', 'DESC']
			],
			limit: pageSize,
			offset: (page - 1) * pageSize,
		}).then(result => {
			res({
				status: true,
				data: result.rows,
				totalData: result.count,
				pageCount: Math.ceil(result.count / pageSize),
				pageLimit: pageSize,
				currentPage: page
			});
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
	 * patient question list
	 */

	this.questiondetail = function (req, res) {
		req = req.body;
		models.patientquestion.belongsTo(models.tag, {
			foreignKey: 'tagId',
			targetKey: 'id'
		});
		models.doctortags.belongsTo(models.tag, {
			foreignKey: 'tagId',
			targetKey: 'id'
		});
		models.tag.hasMany(models.tagdetail);
		models.patientquestion.hasMany(models.question_answer, {
			foreignKey: 'patientquestionId',
			targetKey: 'id'
		});
		models.question_answer.belongsTo(models.doctorprofile);
		models.question_answer.hasOne(models.helpfulanswer);
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.doctorprofile.hasMany(models.doctortags);

		where = {};
		where.tagdetail = language.buildLanguageQuery(
			where.tagdetail, req.langId, '`question_answers.doctorprofile.doctortags.tag`.`id`', models.tagdetail, 'tagId'
		);
		where.doctorprofiledetail = language.buildLanguageQuery(
			where.doctorprofiledetail, req.langId, '`question_answers.doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'
		);
		models.patientquestion.find({
			attributes: ['id', 'tagId', 'age', 'gender', 'image', 'problem_title', 'description', 'createdAt'],
			include: [{
				model: models.question_answer,
				attributes: ['id', 'answer', 'type', 'createdAt'],
				required: false,
				where: {is_for_profile: 1},
				include: [{
					model: models.doctorprofile,
					attributes: [
						'id',
						'doctor_profile_pic',
						'salutation',
						[
							models.sequelize.literal(
								'(SELECT SUM(duration_to-duration_from) FROM doctor_experiences WHERE doctor_experiences.doctorProfileId = `question_answers.doctorprofile`.`id`)'
							), 'total_exp'
						]
					],
					required: false,
					include: [{
						model: models.doctorprofiledetail,
						attributes: ['name', 'address_line_1'],
						where: where.doctorprofiledetail,
						required: false
					}, {
						model: models.doctortags,
						attributes: ['tagId'],
						where: {
							tagtypeId: 2
						},
						required: false,
						include: [{
							model: models.tag,
							attributes: ['id'],
							required: false,
							include: [{
								model: models.tagdetail,
								where: where.tagdetail,
								attributes: ['title'],
								required: false
							}]
						}]
					}]
				}, {
					model: models.helpfulanswer,
					attributes: ['is_helpful'],
					required: false,
					where: {
						patientId: req.patientId || null
					}
				}]
			}, {
				model: models.tag,
				attributes: ['id'],
				required: false,
				include: [{
					model: models.tagdetail,
					where: where.tagdetail,
					attributes: ['title'],
					required: false
				}]
			}],
			where: {
				id: req.id
			},
			order: [
				['createdAt', 'DESC']
			]
		})
		.then(result => {
			res({
				status: true,
				message: language.lang({
					key: "patient question detail",
					lang: req.lang
				}),
				data: result,
			});
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
	 * save
	 */
	this.save = function (req, res) {
		var patientHasOne = models.patient.hasOne(models.patientdetail, {
			as: 'patient_detail'
		});

		var patient = models.patient.build(req);
		var patientdetail = models.patientdetail.build(req.patient_detail);
		var errors = [];
		// an example using an object instead of an array
		async.parallel([

			function (callback) {
				patient.validate().then(function (err) {
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
				patientdetail.validate().then(function (err) {
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
				if (typeof req.userId !== 'undefined' && req.userId !== '') {
					models.patient.find({
						where: {
							userId: req.userId
						}
					}).then(function (patientData) {

						if (patientData !== null) {

							models.patient.update(req, {
								where: {
									id: patientData.id
								},
								individualHooks: true
							}).then(function (data) {
								models.patientdetail.find({
									where: {
										patientId: patientData.id,
										languageId: req.langId
									}
								}).then(function (resultData) {
									req.languageId = req.langId;
									req.patientId = patientData.id;
									if (typeof req.address !== 'undefined') {
										console.log('testtt');
										// your code here
									}
									if (resultData !== null) {
										models.patientdetail.update(req, {
											where: {
												patientId: patientData.id,
												languageId: req.langId
											}
										}).then(function () {
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
									} else {
										models.patientdetail.create(req).then(function (patientDetailss) {
											res({
												status: true,
												message: language.lang({
													key: "addedSuccessfully",
													lang: req.langId
												}),
												data: patientDetailss
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

							models.patient.create(req, {
								include: [patientHasOne],
								individualHooks: true
							}).then(function (patientData) {

								res({
									status: true,
									message: language.lang({
										key: "addedSuccessfully",
										lang: patientData.languageId
									}),
									data: patientData
								});
							}) //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
						}
					})
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

	/*
	 * save
	 */
	this.add_question = function (req, res) {
		var patientquestion = models.patientquestion.build(req);
		var errors = [];
		// an example using an object instead of an array
		async.parallel([

			function (callback) {
				patientquestion.validate().then(function (err) {
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

		], function (err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function (elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				if (typeof req.patientId !== 'undefined' && req.patientId !== '') {


					models.patientquestion.create(req).then(function (patientData) {

						res({
							status: true,
							message: language.lang({
								key: "addedSuccessfully",
								lang: patientData.languageId
							}),
							data: patientData
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
					language.errors({
						errors: uniqueError,
						lang: req.lang
					}, function (errors) {
						var newArr = {};
						newArr.errors = errors;
						res(newArr);
					});
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
	 * save tags for patient
	 */
	this.addtag = function (req, res) {

		var patienttag = models.patienttag.build(req);

		var errors = [];
		async.parallel([

			function (callback) {
				patienttag.validate().then(function (err) {
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
				if (typeof req.patientId !== 'undefined' && req.patientId !== '') {
					models.patienttag.destroy({
						where: {
							patientId: req.patientId,
							tagtypeId: req.tagtypeId
						}
					});

					req.tagId.split(",").map(function (value) {
						req.tagId = value;
						if (req.tagId != '') {
							models.patienttag.create(req).then(function (patienttags) {
								res({
									status: true,
									message: language.lang({
										key: "addedSuccessfully",
										lang: req.langId
									}),
									data: patienttags
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
								status: true,
								message: language.lang({
									key: "addedSuccessfully",
									lang: req.langId
								}),
								data: {}
							});
						}
					})
				} else if (typeof req.userId !== 'undefined' && req.userId !== '') {

					models.patient.find({
						where: {
							userId: req.userId
						},
						attributes: ['id']
					}).then(function (userData) {
						if (userData === null) {
							res({
								status: false,
								message: language.lang({
									key: "invalid_detail",
									lang: req.lang
								})
							});

						} else {

							models.patienttag.destroy({
								where: {
									patientId: userData.id,
									tagtypeId: req.tagtypeId
								}
							});
							req.tagId.split(",").map(function (value) {
								req.tagId = value;
								if (req.tagId != '') {
									models.patienttag.create(req).then(function (patienttags) {
										res({
											status: true,
											message: language.lang({
												key: "addedSuccessfully",
												lang: req.langId
											}),
											data: patienttags
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
										status: true,
										message: language.lang({
											key: "addedSuccessfully",
											lang: req.langId
										}),
										data: {}
									});
								}
							})
						}
					})

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
	 * status update
	 */
	this.status = function (req, res) {
		models.hospital.update(req, {
			where: {
				id: req.id
			}
		}).then(function (data) {
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
	/*
	 * shiftstatus update
	 */
	this.shiftstatus = function (req, res) {
		models.hospital.update(req, {
			where: {
				id: req.id
			}
		}).then(function (data) {
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
	/*
	 * get By ID
	 */
	this.getById = function (req, res) {
		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.hospitalfile);
		models.hospital.hasMany(models.hospital_timings);
		models.hospital.hasMany(models.hospitalservice);
		models.hospital.hasMany(models.hospitalaward);
		models.hospitalaward.hasMany(models.hospitalawarddetail);
		models.hospital.belongsTo(models.country);
		models.hospital.belongsTo(models.state);
		models.hospital.belongsTo(models.city);
		models.country.hasMany(models.countrydetail);
		models.state.hasMany(models.statedetail);
		models.city.hasMany(models.citydetail);

		var isWhere = {};
		isWhere.hospitaldetail = language.buildLanguageQuery(
			isWhere.hospitaldetail, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'
		);
		isWhere.countrydetail = language.buildLanguageQuery(
			isWhere.countrydetail, req.langId, '`country`.`id`', models.countrydetail, 'countryId'
		);
		isWhere.statedetail = language.buildLanguageQuery(
			isWhere.statedetail, req.langId, '`state`.`id`', models.statedetail, 'stateId'
		);
		isWhere.citydetail = language.buildLanguageQuery(
			isWhere.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId'
		);
		isWhere.hospitalawarddetail = language.buildLanguageQuery(
			isWhere.hospitalawarddetail, req.langId, '`hospital_awards`.`id`', models.hospitalawarddetail, 'hospitalAwardId'
		);
		models.hospital.find({
			include: [{
					model: models.hospitaldetail,
					where: isWhere.hospitaldetail
				},
				{
					model: models.hospitalfile,
					where: isWhere.hospitalfile,
					required: false
				},
				{
					model: models.hospital_timings,
					where: isWhere.hospital_timings,
					required: false
				},
				{
					model: models.hospitalservice,
					where: isWhere.hospitalservice,
					required: false
				},
				{
					model: models.hospitalaward,
					include: [{
						model: models.hospitalawarddetail,
						where: isWhere.hospitalawarddetail,
						required: false
					}],
					required: false
				},
				{
					model: models.country,
					include: [{
						model: models.countrydetail,
						where: isWhere.countrydetail
					}]
				},
				{
					model: models.state,
					include: [{
						model: models.statedetail,
						where: isWhere.statedetail
					}]
				},
				{
					model: models.city,
					include: [{
						model: models.citydetail,
						where: isWhere.citydetail
					}]
				}
			],
			where: {
				id: req.id
			}
		}).then(function (data) {
			country.getAllCountry(req, function (countries) {
				req.countryId = data.countryId;
				req.stateId = data.stateId;
				state.getAllState(req, function (states) {
					city.getAllCity(req, function (cities) {
						doctor.listDoctor(req, function (doctors) {
							res({
								data: data,
								countries: countries,
								states: states,
								cities: cities,
								doctors: doctors
							});
						});
					})
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
	 * doctor get By ID
	 */
	this.getByLocation = function (req, res) {
		models.doctorprofile.hasMany(models.doctorprofiledetail);

		models.doctorprofile.hasMany(models.doctoreducation);
		models.doctoreducation.belongsTo(models.tag, {
			foreignKey: 'tagtypeId',
			targetKey: 'id'
		});
		models.doctorprofile.belongsTo(models.city, {
			foreignKey: 'cityId',
			targetKey: 'id'
		});



		models.doctorprofile.hasOne(models.doctorexperience);
		models.doctorprofile.hasMany(models.hospital_doctors);

		models.hospital_doctors.belongsTo(models.hospital, {
			foreignKey: 'hospitalId',
			targetKey: 'id'
		});

		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

		models.doctorprofile.hasMany(models.doctortags);
		models.doctortags.belongsTo(models.tag, {
			foreignKey: 'tagId',
			targetKey: 'id'
		});
		models.tag.hasMany(models.tagdetail);


		models.doctorprofile.hasMany(models.doctorfile);


		//hospital relations
		models.hospital.hasMany(models.hospitaldetail)
		models.hospital.hasMany(models.hospitalfile);
		models.hospital.belongsTo(models.city, {
			foreignKey: 'cityId',
			targetKey: 'id'
		});
		models.hospital.belongsTo(models.state, {
			foreignKey: 'stateId',
			targetKey: 'id'
		});
		models.hospital.belongsTo(models.country, {
			foreignKey: 'countryId',
			targetKey: 'id'
		});


		isWhere = {}
		var searchConditionForDoctor = {};
		var searchConditionForHospital = {};
		isWhere.doctorprofiledetail = language.buildLanguageQuery(
			isWhere.doctorprofiledetail, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'
		);
		isWhere.hospitaldetail = language.buildLanguageQuery(
			isWhere.hospitaldetail, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'
		);

		models.city.hasMany(models.citydetail);
		models.state.hasMany(models.statedetail);
		models.country.hasMany(models.countrydetail);
		async.parallel({
			doctor_ids: function (callback) {
				models.doctortags.find({
					attributes: [
						[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('doctorProfileId')), 'doctorProfileId']
					],
					required: false,
					where: {
						tagId: req.tagId
					}
				}).then(function (doctorProfileIds) {

					idsssstringDoctor = doctorProfileIds.doctorProfileId;
					var arraydoctorPush = [];
					if (idsssstringDoctor != null) {
						var arrayIDsDoctor = idsssstringDoctor.split(',');

						arrayIDsDoctor.map(value => {
							arraydoctorPush.push(value);
						})
					}
					callback(null, doctorProfileIds);
					console.log(arraydoctorPush);
					/*  models.sequelize.query(
					'SELECT count(*) as live_hospital from hospital_doctors left join hospitals on(hospital_doctors.hospitalId = hospitals.id) where hospital_doctors.doctorProfileId IN ( '+idsssstringDoctor+') and hospitals.is_active=1 and hospitals.is_live=1', 
					{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
					if(data.live_hospital>0){
					callback(null, doctorProfileIds);
					}else{
					callback(null, []);
					}

					})*/

				})
			},
			hospital_ids: function (callback) {
				models.hospitalservice.find({
					attributes: [
						[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('hospitalId')), 'hospitalId']
					],
					required: false,
					where: {
						tagId: req.tagId
					}
				}).then(function (hospitalIds) {
					callback(null, hospitalIds);
				})
			}
		}, function (errrrrr, resultdsss) {
			//doctor ids by tagIds
			idsssstringDoctor = resultdsss.doctor_ids.doctorProfileId;
			var arraydoctorPush = [];
			if (idsssstringDoctor != null) {
				var arrayIDsDoctor = idsssstringDoctor.split(',');

				arrayIDsDoctor.map(value => {
					arraydoctorPush.push(value);
				})
			}
			//end of doctor idss

			//hospital ids by tagIds
			idsssstringHospital = resultdsss.hospital_ids.hospitalId;
			var arrayHospitalPush = [];
			if (idsssstringHospital != null) {
				var arrayIDsHospital = idsssstringHospital.split(',');
				arrayIDsHospital.map(value => {
					arrayHospitalPush.push(value);
				})
			}
			whereHospital = {
				is_live: 1,
				is_active: 1
			}
			isCondition = {
				status: 1
			}
			if ('undefined' !== typeof req.consultation_charge) {
				var feeArray = req.consultation_charge.split("-");
				isCondition = {
					status: 1,
					consultation_charge: {
						$between: feeArray
					}
				}
			}
			if ('undefined' !== typeof req.online_booking) {
				isCondition = {
					status: 1,
					available_on_req: 0
				}
				whereHospital = {
					active_schedule: 1,
					is_live: 1,
					is_active: 1
				}
			}


			if ('undefined' !== typeof req.consultation_charge && 'undefined' !== typeof req.online_booking) {
				var feeArray = req.consultation_charge.split("-");
				isCondition = {
					status: 1,
					consultation_charge: {
						$between: feeArray
					},
					available_on_req: 0
				}
				whereHospital = {
					active_schedule: 1,
					is_live: 1,
					is_active: 1
				}
			}

			doctorConditions = {
				id: arraydoctorPush,
				is_live: 1,
				is_active: 1,
				cityId: req.cityId
			}
			if ('undefined' !== typeof req.gender) {
				doctorConditions = {
					id: arraydoctorPush,
					is_live: 1,
					is_active: 1,
					cityId: req.cityId,
					gender: req.gender
				}
			}
			//end of hospital idss
			async.parallel({

				doctors: function (callback) {
					models.doctorprofile.findAll({
						attributes: [
							'id',
							'doctor_profile_pic',
							'salutation',
							'gender',
							'is_live',
							'is_active', [models.sequelize.literal('(SELECT SUM(duration_to-duration_from) FROM doctor_experiences WHERE doctor_experiences.doctorProfileId = doctorprofile.id)'), 'total_exp'],
							[models.sequelize.literal('(SELECT IFNULL(ROUND(AVG(doctor_feedbacks.rating)),0) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id)'), 'avg_rating'],
						],
						include: [{
								model: models.doctorprofiledetail,
								attributes: ['name'],
								where: isWhere.doctorprofiledetail
							},
							// {model: models.contactinformation,attributes:['value'],where:{type:'mobile',is_primary:1}, required: false},
							{
								model: models.hospital_doctors,
								attributes: ['consultation_charge', 'available_on_req', 'id'],
								where: isCondition,
								include: [{
										model: models.hospital,
										attributes: ['id', 'active_schedule'],
										include: [{
												model: models.hospitaldetail,
												attributes: ['hospital_name']
											},
											{
												model: models.contactinformation,
												attributes: ['value'],
												where: {
													type: 'mobile',
													is_primary: 1
												},
												required: false
											}
										],
										where: whereHospital
									},

								]
							},
							{
								model: models.doctoreducation,
								attributes: ['tagtypeId'],
								include: [{
										model: models.tag,
										attributes: ['id'],
										required: false,
										include: [{
											model: models.tagdetail,
											attributes: ['title'],
											where: language.buildLanguageQuery({}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId')
										}]
									},

								],
								required: false
							},
							{
								model: models.doctortags,
								attributes: ['tagId'],
								include: [{
										model: models.tag,
										attributes: ['id'],
										required: false,
										where: {
											tagtypeId: 2
										},
										include: [{
											model: models.tagdetail,
											attributes: ['title'],
											required: false,
											where: language.buildLanguageQuery({}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId')
										}]
									},

								],
								required: false,
								/* order: [
								[models.hospital,'id', 'DESC'],
								]*/
							},

							{
								model: models.doctorfile,
								attributes: ['doctor_files'],
								where: {
									document_type: 'public_photos',
									file_type: 'image'
								},
								required: false
							},

							{
								model: models.city,
								attributes: ['id'],
								include: [{
									model: models.citydetail,
									attributes: ['name'],
									where: language.buildLanguageQuery({}, req.langId, '`city`.`id`', models.citydetail, 'cityId')
								}],
								required: false
							},

						],
						where: doctorConditions,
						order: '`hospital_doctors.hospital.id` DESC'
					}).then(function (data) {
						callback(null, data);
					})
				},

				hospitals: function (callback) {
					models.hospital.findAll({
						attributes: [
							'id',
							'hospital_logo',
							'zipcode',
							'is_live',
							'is_active', [models.sequelize.literal('(SELECT IFNULL(ROUND(AVG(doctor_feedbacks.rating)),0) FROM doctor_feedbacks WHERE doctor_feedbacks.hospitalId = hospital.id)'), 'avg_rating']
						],
						include: [{
								model: models.hospitaldetail,
								attributes: ['hospital_name', 'address'],
								where: isWhere.hospitaldetail
							},

							{
								model: models.hospitalfile,
								attributes: ['hospital_files'],
								where: {
									document_type: 'public_photos',
									file_type: 'image'
								},
								required: false
							},

							{
								model: models.city,
								attributes: ['id'],
								include: [{
									model: models.citydetail,
									attributes: ['name'],
									where: language.buildLanguageQuery({}, req.langId, '`city`.`id`', models.citydetail, 'cityId')
								}],
								required: false
							},

							{
								model: models.state,
								attributes: ['id'],
								include: [{
									model: models.statedetail,
									attributes: ['name'],
									where: language.buildLanguageQuery({}, req.langId, '`state`.`id`', models.statedetail, 'stateId')
								}],
								required: false
							},

							{
								model: models.country,
								attributes: ['id'],
								include: [{
									model: models.countrydetail,
									attributes: ['name'],
									where: language.buildLanguageQuery({}, req.langId, '`ccountry`.`id`', models.countrydetail, 'countryId')
								}],
								required: false
							},
							{
								model: models.contactinformation,
								attributes: ['value'],
								where: {
									type: 'mobile',
									is_primary: 1
								},
								required: false
							}
						],
						where: {
							id: arrayHospitalPush,
							is_live: 1,
							is_active: 1,
							cityId: req.cityId
						},
						order: [
							['id', 'DESC'],
						]
					}).then(function (data) {
						callback(null, data);
					})
				},

			}, function (err, result) {
				res({
					status: true,
					message: language.lang({
						key: "hospitals and doctors list by location",
						lang: req.lang
					}),
					data: {
						doctors: result.doctors,
						hospitals: result.hospitals
					},
					//specialization_tags: result.specialization_tags,
				})
			});

		})
		//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.adminlist = function (req, res) {

		var pageSize = req.app.locals.site.page, // number of items per page
			page = req.query.page || 1;

		var reqData = req.body,
			where = {};

		if (req.query) {
			Object.keys(req.query).forEach(key => {
				if (req.query[key] === '') return;
				var modalKey = key.split('__');
				if (modalKey.length === 3) {
					if (modalKey[0] in where) {
						where[modalKey[0]][modalKey[1]] = req.query[key];
					} else {
						where[modalKey[0]] = {};
						where[modalKey[0]][modalKey[1]] = req.query[key];
					}
				} else {
					if (modalKey[0] in where) {
						where[modalKey[0]][modalKey[1]] = {
							'$like': '%' + req.query[key] + '%'
						};
					} else {
						where[modalKey[0]] = {};
						where[modalKey[0]][modalKey[1]] = {
							'$like': '%' + req.query[key] + '%'
						};
					}
				}
			});
		}

		models.patient.belongsTo(models.user);
		models.patient.belongsTo(models.city);
		models.patient.belongsTo(models.state);
		models.patient.belongsTo(models.country);
		models.patient.hasMany(models.patientdetail);
		models.user.hasMany(models.userdetail);
		models.patient.belongsTo(models.user);

		models.city.hasMany(models.citydetail);
		models.state.hasMany(models.statedetail);
		models.country.hasMany(models.countrydetail);

		where.patientdetail = language.buildLanguageQuery(
			where.patientdetail, reqData.langId, '`patient`.`id`', models.patientdetail, 'patientId'
		);
		where.userdetail = language.buildLanguageQuery(
			where.userdetail, reqData.langId, '`user`.`id`', models.userdetail, 'userId'
		);
		where.citydetail = language.buildLanguageQuery(
			where.citydetail, reqData.langId, '`city`.`id`', models.citydetail, 'cityId'
		);
		where.statedetail = language.buildLanguageQuery(
			where.statedetail, reqData.langId, '`state`.`id`', models.statedetail, 'stateId'
		);
		where.countrydetail = language.buildLanguageQuery(
			where.countrydetail, reqData.langId, '`country`.`id`', models.countrydetail, 'countryId'
		);

		models.patient.findAndCountAll({
			include: [{
				model: models.patientdetail,
				where: where.patientdetail
			}, {
				model: models.user,
				attributes: ['id', 'email', 'mobile', 'is_active'],
				where: where.user,
				include: [{
					model: models.userdetail,
					attributes: ['fullname'],
					where: where.userdetail
				}]
			}, {
				model: models.country,
				required: where.countrydetail.name ? true : false,
				attributes: ['id'],
				include: [{
					model: models.countrydetail,
					attributes: ['name'],
					required: where.countrydetail.name ? true : false,
					where: where.countrydetail
				}]
			}, {
				model: models.city,
				required: where.citydetail.name ? true : false,
				attributes: ['id'],
				include: [{
					model: models.citydetail,
					attributes: ['name'],
					required: where.citydetail.name ? true : false,
					where: where.citydetail
				}]
			}, {
				model: models.state,
				required: where.statedetail.name ? true : false,
				attributes: ['id'],
				include: [{
					model: models.statedetail,
					attributes: ['name'],
					required: where.statedetail.name ? true : false,
					where: where.statedetail
				}]
			}],
			distinct: true,
			where: where.patient,
			order: [
				['id', 'DESC']
			],
			limit: pageSize,
			offset: (page - 1) * pageSize,
			subQuery: false
		}).then(result => {
			res({
				status: true,
				data: result.rows,
				totalData: result.count,
				pageCount: Math.ceil(result.count / pageSize),
				pageLimit: pageSize,
				currentPage: parseInt(page),
			});
		});
	};

	this.patientdetail = function (req, res) {

		models.patient.belongsTo(models.user);
		models.patient.belongsTo(models.city);
		models.patient.belongsTo(models.state);
		models.patient.hasMany(models.patientdetail);
		models.user.hasMany(models.userdetail);
		models.patient.belongsTo(models.user);

		models.city.hasMany(models.citydetail);
		models.state.hasMany(models.statedetail);

		models.patient.hasMany(models.patienttag);
		models.patienttag.belongsTo(models.tag);
		models.tag.hasMany(models.tagdetail);
		let where = {};
		where.patientdetail = language.buildLanguageQuery(
			where.patientdetail, req.langId, '`patient`.`id`', models.patientdetail, 'patientId'
		);
		where.userdetail = language.buildLanguageQuery(
			where.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId'
		);
		where.citydetail = language.buildLanguageQuery(
			where.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId'
		);
		where.statedetail = language.buildLanguageQuery(
			where.statedetail, req.langId, '`state`.`id`', models.statedetail, 'stateId'
		);
		where.tagdetail = language.buildLanguageQuery(
			where.tagdetail, req.langId, '`patienttags.tag`.`id`', models.tagdetail, 'tagId'
		);

		models.patient.findOne({
			include: [{
				model: models.patientdetail,
				where: where.patientdetail
			}, {
				model: models.user,
				attributes: ['id', 'email', 'mobile', 'is_active'],
				include: [{
					model: models.userdetail,
					attributes: ['fullname'],
					where: where.userdetail
				}]
			}, {
				model: models.city,
				required: false,
				attributes: ['id'],
				include: [{
					model: models.citydetail,
					attributes: ['name'],
					required: false,
					where: where.citydetail
				}]
			}, {
				model: models.state,
				required: false,
				attributes: ['id'],
				include: [{
					model: models.statedetail,
					attributes: ['name'],
					required: false,
					where: where.statedetail
				}]
			}, {
				model: models.patienttag,
				required: false,
				attributes: ['id', 'tagtypeId'],
				include: [{
					model: models.tag,
					required: false,
					attributes: ['id'],
					include: [{
						model: models.tagdetail,
						required: false,
						attributes: ['title'],
						where: where.tagdetail
					}]
				}]
			}],
			where: {
				id: req.id
			}
		}).then(data => {
			res({
				status: true,
				data
			});
		});
	};

	this.patientStatus = function (req, res) {
		models.user.update({
			is_active: req.is_active
		}, {
			where: {
				id: req.id
			}
		}).then(() => {
			res({
				status: true,
				message: language.lang({
					key: "updatedSuccessfully",
					lang: req.lang
				})
			});
		});
	};

	this.makeFavouriteDoctor = function (req, res) {
		models.favouritedoctor.find({
			attributes: [
				[models.sequelize.fn('COUNT', models.sequelize.col('id')), 'is_favourite']
			],
			where: {
				patientId: req.patientId,
				doctorProfileId: req.doctorProfileId
			}
		}).then(function (data) {
			if (data.dataValues.is_favourite == 0) {
				req.is_favourite = 1
				models.favouritedoctor.create(req).then(function (createdata) {
					res({
						status: true,
						data: {
							is_favourite: 1
						},
						message: language.lang({
							key: "startedSuccessfully",
							lang: req.lang
						})
					})
				})
			} else {
				models.favouritedoctor.destroy({
					where: {
						patientId: req.patientId,
						doctorProfileId: req.doctorProfileId
					}
				}).then(function () {
					res({
						status: true,
						data: {
							is_favourite: 0
						},
						message: language.lang({
							key: "unstartedSuccessfully",
							lang: req.lang
						})
					})
				})

			}
		})
	}

	this.CheckFavouriteDoctor = function (req, res) {
		models.favouritedoctor.find({
			attributes: [
				[models.sequelize.fn('COUNT', models.sequelize.col('id')), 'is_favourite']
			],
			where: {
				patientId: req.patientId,
				doctorProfileId: req.doctorProfileId
			}
		}).then(function (data) {
			res({
				status: true,
				is_favourite: data.dataValues.is_favourite
			})
		})
	}

	this.myDoctors = function (req, res) {
		models.favouritedoctor.belongsTo(models.doctorprofile, {
			foreignKey: 'doctorProfileId',
			targetKey: 'id'
		})
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.doctorprofile.hasMany(models.doctortags);
		models.doctorprofile.hasMany(models.doctoreducation);
		models.doctortags.belongsTo(models.tag, {
			foreignKey: 'tagId',
			targetKey: 'id'
		});
		models.doctoreducation.belongsTo(models.tag, {
			foreignKey: 'tagtypeId',
			targetKey: 'id'
		});
		models.tag.hasMany(models.tagdetail);
		models.doctorprofile.hasMany(models.hospital_doctors);
		models.hospital_doctors.belongsTo(models.hospital);
		models.hospital.hasMany(models.hospitaldetail);
		
		models.favouritedoctor.findAll({
			attributes: ['id', 'patientId', 'doctorProfileId'],
			include: [{
				model: models.doctorprofile,
				where: {is_active: 1, is_live: 1},
				attributes: [
					'id',
					'salutation',
					'doctor_profile_pic', [models.sequelize.literal('(SELECT SUM(duration_to-duration_from) FROM doctor_experiences WHERE doctor_experiences.doctorProfileId = doctorprofile.id)'), 'total_exp'],
					[models.sequelize.literal('(SELECT ROUND(AVG(doctor_feedbacks.rating)) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id)'), 'avg_rating'],
					[models.sequelize.literal('(SELECT COUNT(*) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id)'), 'num_ratings']
				],
				include: [{
						model: models.doctorprofiledetail,
						attributes: ['name'],
						where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
					},
					{
						model: models.doctortags,
						include: [{
							model: models.tag,
							attributes: ['id'],
							include: [{
								model: models.tagdetail,
								attributes: ['title'],
								where: language.buildLanguageQuery({}, req.langId, '`doctorprofile.doctortags.tag`.`id`', models.tagdetail, 'tagId')
							}],
							required: false,
							where: {
								tagtypeId: {
									$in: [2]
								}
							}
						}, ],
						attributes: [
							'tagId',
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
								where: language.buildLanguageQuery({}, req.langId, '`doctorprofile.doctoreducations.tag`.`id`', models.tagdetail, 'tagId')
							}],
							required: false,
							where: {
								tagtypeId: {
									$in: [3]
								}
							}
						}, ],
						attributes: [
							'tagtypeId',
						],
						required: false
					},
					{
						model: models.hospital_doctors,
						include: {
							model: models.hospital,
							include: {
								model: models.hospitaldetail,
								where: language.buildLanguageQuery(null, req.langId, '`doctorprofile.hospital_doctors.hospital`.`id`', models.hospitaldetail, 'hospitalId'),
								required: false,
								attributes: ['hospital_name', 'address'],
							},
							attributes: ['id'],
						},
						attributes: ['consultation_charge'],
						required: false,
					}
				],
				required: false
			}, ],
			where: {
				patientId: req.patientId
			},
		}).then(function (data) {

			res({
				status: true,
				data: data,
			})

		})
	}

	this.patientChangeNotificationSettings = function (req, res) {
		var notificationColumns = {
			is_chat_notification: 'is_chat_notification',
			is_appointment_notification: 'is_appointment_notification'
		}
		if (req.type === 'all') {
			models.patient.find({
				attributes: ['userId'],
				where: {
					id: req.patientId
				}
			}).then(function (patientdata) {
				models.user.update({
					is_notification: req.value
				}, {
					where: {
						id: patientdata.userId
					}
				}).then(function (data) {
					models.patient.update({
						is_chat_notification: req.value,
						is_appointment_notification: req.value
					}, {
						where: {
							id: req.patientId
						}
					}).then(function (data) {
						res({
							status: true,
							message: language.lang({
								key: "success",
								lang: req.lang
							})
						})
					})
				})
			})
		} else {
			models.patient.update({
				[notificationColumns[req.type]]: req.value
			}, {
				where: {
					id: req.patientId
				}
			}).then(function (result) {
				res({
					status: true,
					message: language.lang({
						key: "success",
						lang: req.lang
					})
				})
			})
		}
	}

	this.exportData = function(req, res) {

		models.patient.belongsTo(models.country);
		models.patient.belongsTo(models.city);
		models.patient.belongsTo(models.state);
		models.country.hasMany(models.countrydetail);
		models.city.hasMany(models.citydetail);
		models.state.hasMany(models.statedetail);
		models.patient.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		
		models.patient.findAll({
			attributes: ["id", "gender"],
			include: [
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
				      	attributes: ["name"],
				      	required: false
				  	}],
				  	required: false
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
				      	attributes: ["name"],
				      	required: false
				  	}],
				  	required: false
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
				      	attributes: ["name"],
				      	required: false
				  	}],
				  	required: false
				}
			]
		}).then(function(data) {
			res({status: true, patients: data})
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

	this.changeDefaultLang = function(req, res) {
		if(!req.userId) res({status: false, message: language.lang({key: "Missing required parameters.", lang: req.lang})})

		models.user.findOne({where: {id: req.userId, user_type: 'Patient'}}).then(function(userData) {
			if(userData !== null) {
				models.user.update({default_lang: req.default_lang}, {where: {id: req.userId}}).then(function(upd) {
					res({status: true, message: language.lang({key: "Updated successfully.", lang: req.lang})});
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
				res({status: false, message: language.lang({key: "Invalid user type.", lang: req.lang})})				
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
}

module.exports = new Patient();