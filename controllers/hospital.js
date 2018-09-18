var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var country = require('./country');
var state = require('./state');
var city = require('./city');
var hospitalfile = require('./hospitalfile');
var hospitalservice = require('./hospitalservice');
var hospital_timings = require('./hospital_timings');
var doctor = require('./doctor');
var mongo = require('../config/mongo');
var tagtype = require('./tagtype');
var tag = require('./tag');
var utils = require('./utils');
var _ = require('lodash');

function Hospital() {

	this.getAllCountry = function(req, res) {
		country.getAllCountry(req, function(countries) {
			res({
				countries: countries
			});
		});
	}

	this.getAddMetaDataForAdmin = function(req, res) {
		async.parallel({
			countries: function(callback) {
				country.getAllCountry(req, function(data) {
					callback(null, data);
				});
			},
			service_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['ServiceTagId'],
						lang: req.lang,
						langId: req.langId,
						languageId: req.languageId
					}
				}, function(data) {
					callback(null, data);
				});
			},
			insurance_companies_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['InsuranceCompaniesTagId'],
						lang: req.lang,
						langId: req.langId,
						languageId: req.languageId
					}
				}, function(data) {
					callback(null, data);
				});
			},
			specialization_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['SpecializationTagId'],
						lang: req.lang,
						langId: req.langId,
						languageId: req.languageId
					}
				}, function(data) {
					callback(null, data);
				});
			},
			membership_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['MembershipsTagId'],
						lang: req.lang,
						langId: req.langId,
						languageId: req.languageId
					}
				}, function(data) {
					callback(null, data);
				});
			}
		}, function(err, result) {
			res(result);
		});
	}

	this.hospital_doctor = function(req, res) {
		let _ref = this;
		async.parallel({
			doctors: function(callback) {
				doctor.list(req, function(data) {
					callback(null, data);
				});
			},
			hospitals: function(callback) {
				_ref.list(req, function(data) {
					callback(null, data);
				});
			},
		}, function(err, result) {
			res(result);
		});
	}

	this.list = function(req, res) {
		// var pageSize = req.app.locals.site.page, // number of items per page
		// page = req.query.page || 1;

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

		where.hospitaldetail = language.buildLanguageQuery(
			where.hospitaldetail, reqData.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'
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

		models.hospital.belongsTo(models.user)
		models.user.hasMany(models.userdetail)

		models.hospital.findAndCountAll({
				include: [{
						model: models.hospitaldetail,
						where: where.hospitaldetail,
					},
					{
						model: models.hospitalfile,
						where: where.hospitalfile,
						required: false
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
				],
				where: where.hospital,
				order: [
					['id', 'DESC']
				],
				distinct: true,
				limit: setPage,
				offset: pag,
				//subQuery: false
			})
			.then(result => {
				res({
					status: true,
					data: result.rows,
					totalData: result.count,
					pageCount: Math.ceil(result.count / setPage),
					pageLimit: setPage,
					currentPage: currentPage
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
	this.save = function(req, res) {
		let contact_infos = JSON.parse(req.contact_informations)
		let contact_emails = contact_infos.emails,
			contact_mobiles = contact_infos.mobiles;
		req.contact_informations = contact_infos.emails.concat(contact_infos.mobiles)

		req.latitude = typeof req.latitude === undefined ? '' : req.latitude;
		req.longitude = typeof req.longitude === undefined ? '' : req.longitude;

		var hospitalHasOne = models.hospital.hasOne(models.hospitaldetail, {
			as: 'hospital_detail'
		});

		var hospital = models.hospital.build(req);

		req.hospital_detail.languageId = req.languageId;
		var hospitaldetail = models.hospitaldetail.build(req.hospital_detail);
		var errors = [];
		// an example using an object instead of an array
		async.parallel([

			function(callback) {
				hospital.validate().then(function(err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
			function(callback) {
				hospitaldetail.validate().then(function(err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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
				if (typeof req.is_active === 'undefined') {
					req.is_active = 0;
				}
				if (req.is_active == 'on' || req.is_active == 1) {
					req.is_active = 1;
				} else {
					req.is_active = 0;
				}
				if (typeof req.id !== 'undefined' && req.id !== '') {

					hospitaldetailData = req.hospital_detail;
					hospitaldetailData.languageId = req.languageId
					hospitaldetailData.hospitalId = req.id
					delete req.hospital_detail;
					delete req.languageId;

					models.hospital.update(req, {
						where: {
							id: req.id
						},
						individualHooks: true
					}).then(function(data) {
						models.hospitaldetail.find({
							where: {
								hospitalId: req.id,
								languageId: hospitaldetailData.languageId
							}
						}).then(function(resultData) {

							if (resultData !== null) {
								hospitaldetailData.id = resultData.id;
								models.hospitaldetail.update(hospitaldetailData, {
									where: {
										id: resultData.id,
										hospitalId: req.id,
										languageId: hospitaldetailData.languageId
									},
									individualHooks: true,
									langId: req.langId,
									lang: req.lang
								}).then(function() {
									models.contactinformation.destroy({
										where: {
											key: req.id,
											model: 'hospital'
										}
									}).then(function(CIDeleteStatus) {
										models.contactinformation.bulkCreate(req.contact_informations).then(function(CIStatus) {
											res({
												status: true,
												message: language.lang({
													key: "updatedSuccessfully",
													lang: hospitaldetailData.languageId
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
								delete hospitaldetailData.id;
								models.hospitaldetail.create(hospitaldetailData).then(function() {}) //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
							}
						}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
					}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));

				} else {
					delete req.hospital_detail.id;
					req.is_complete = 0, req.is_live = 0;
					req.verified_status = "incomplete-profile";
					req.claim_status = undefined === typeof req.claim_status && '' == req.claim_status ? 'non-claimed' : req.claim_status;
					models.hospital.findOne({
						where: {
							userId: req.userId,
							headId: null
						}
					}).then(function(hospData) {
						req.headId = hospData ? hospData.id : null;
						models.hospital.create(req, {
							include: [hospitalHasOne],
							individualHooks: true
						}).then(function(hospitalData) {
							//models.hospitaldetail.create(req.hospital_detail_ar);  <-- for bulk upload
							//json object insert in mongodb
							/* var save_json_data_in_mongodb = { key:hospitalData.id.toString(),title:req.hospital_detail.hospital_name,langId:req.languageId,image:req.hospital_logo,type:'hospital'}
							 if(req.is_active==1){
							   mongo.save(save_json_data_in_mongodb,type='add',function(mongodata){
							  })
							}*/

							let contactsInfoData = [];
							async.forEachOf(req.contact_informations, function(civalues, cikey, CICallback) {
								let setCIData = civalues;
								setCIData.key = hospitalData.id;
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
										if (req.langId == 1) {
											res({
												status: true,
												message: language.lang({
													key: "addedSuccessfully",
													lang: hospitalData.languageId
												}),
												data: hospitalData
											});
										} else {
											req.hospital_detail.hospitalId = hospitalData.id;
											req.hospital_detail.languageId = 1;
											models.hospitaldetail.create(req.hospital_detail).then(function() {
												res({
													status: true,
													message: language.lang({
														key: "addedSuccessfully",
														lang: req.lang
													}),
													data: hospitalData
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
									}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
								}
							});
						}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
					})
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
	}

	this.save_time = function(req, res) {
		if(req.shift_24X7 == 1) {
			models.hospital.update({shift_24X7: 1}, {where: {id: req.hospitalId}}).then(function(resp) {
				models.hospital_timings.destroy({where: {hospitalId: req.hospitalId}}).then(function(dresp) {
					res({status: true, message: language.lang({key: "addedSuccessfully", lang: req.lang}), hospTimData: []})
				}).catch(() => res({ status: false, error: true, error_description: language.lang({ key: "Internal Error", lang: req.lang }), url: true }))
			}).catch(() => res({ status: false, error: true, error_description: language.lang({ key: "Internal Error", lang: req.lang }), url: true }))
		} else {
			let allShifts = [
				'shift_1_from_time',
				'shift_1_to_time',
				'shift_2_from_time',
				'shift_2_to_time',
				'shift_1_from_key',
				'shift_1_to_key',
				'shift_2_from_key',
				'shift_2_to_key',
			];

			var hosTimingDays = []; let newTimeObj = [];
			req.timings.forEach(function(item) {
				let timeObj = Object.assign({}, item);
				
				allShifts.forEach(key => {
					timeObj[key] = timeObj[key] === '' ? null : timeObj[key];
				});
				newTimeObj.push(timeObj);
				hosTimingDays.push(item.days);
			});

			req.timings = newTimeObj;
			

			models.hospital_doctors.hasMany(models.hospital_doctor_timings, {foreignKey: 'hospitalDoctorId', sourceKey: 'id'})
			models.hospital_doctors.findAll({
				attributes: [
					[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('id')), 'hd_ids']
				],
				where: {hospitalId: req.hospitalId, available_on_req: 0},
				raw: true
			}).then(function(hdData) {
				if(hdData[0].hd_ids === null) {
					// here, no need to check clashes because no doctor mapped
					models.hospital_timings.findAll({
						attributes: [
							[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('id')), 'timings_ids']
						],
						where: {hospitalId: req.hospitalId},
						raw: true
					}).then(function(prevTimingData) {
						if(prevTimingData[0] && prevTimingData[0].timings_ids !== null) {
							let prevTimingsIds = prevTimingData[0].timings_ids.split(",");
							prevTimingsIds = prevTimingsIds.toString().split(',').map(Number);
							let newHosTimingIds = req.timings.map(itmm => itmm.id);
							newHosTimingIds = newHosTimingIds.toString().split(',').map(Number);
							
							let timingIdsToRemove = prevTimingsIds.filter(it1 => newHosTimingIds.indexOf(it1) === -1);
							
							models.hospital_timings.bulkCreate(req.timings, {
								ignoreDuplicates: true,
								updateOnDuplicate: ['shift_1_from_time', 'shift_1_to_time', 'shift_2_from_time', 'shift_2_to_time', 'shift_1_from_key', 'shift_1_to_key', 'shift_2_from_key', 'shift_2_to_key']
							}).then(function(resp) {
								models.hospital_timings.destroy({where: {id: {$in: timingIdsToRemove}}}).then(function(dresp) {
									models.hospital.update({shift_24X7: 0}, {where: {id: req.hospitalId}}).then(function(resp) {
										models.hospital_timings.findAll({where: {hospitalId: req.hospitalId}}).then(function(hospTimData) {
											res({status: true, message: language.lang({key: "addedSuccessfully", lang: req.lang}), hospTimData})		
										})
									})
								})
							})
						} else {
							models.hospital_timings.bulkCreate(req.timings).then(function(resp) {
								models.hospital.update({shift_24X7: 0}, {where: {id: req.hospitalId}}).then(function(resp) {
									models.hospital_timings.findAll({where: {hospitalId: req.hospitalId}}).then(function(hospTimData) {
										res({status: true, message: language.lang({key: "addedSuccessfully", lang: req.lang}), hospTimData})
									})
								})
							})
						}
					})
				} else {
					let hosDocIds = hdData[0]['hd_ids'].split(",");
					let clashingDays = [];
					models.hospital_doctor_timings.findAll({
						where: {hospitalDoctorId: {$in: hosDocIds}}, exclude: ['createdAt', 'updatedAt'], group: ['days'], raw: true
					}).then(hdtData => {
						let prevSavedTimingDays = hdtData.map(itm => itm.days)
						
						let diffInDays = prevSavedTimingDays.filter(x => !hosTimingDays.includes(x))

						if(diffInDays.length > 0) {
							let orderedDays = reOrderDays(diffInDays, req.lang);
							res({status: false, message: language.lang({key: "Please enter timings for following day(s): %s ", params: orderedDays.join(", "), lang: req.lang})})
						} else {

							async.forEach(hdtData, function(hdTiming, callback1) {
								let newAddedTiming = req.timings.find(itm => itm.days === hdTiming.days);
								
								let shift_1_from_time = hdTiming.shift_1_from_time,
									shift_1_to_time = hdTiming.shift_1_to_time,
									shift_2_from_time = hdTiming.shift_2_from_time,
									shift_2_to_time = hdTiming.shift_2_to_time;

								let isS1InReqS1 = (
									shift_1_from_time >= newAddedTiming.shift_1_from_time && shift_1_from_time <= newAddedTiming.shift_1_to_time && 
									shift_1_to_time >= newAddedTiming.shift_1_from_time && shift_1_to_time <= newAddedTiming.shift_1_to_time
								);
								let isS1InReqS2 = !isS1InReqS1 ? newAddedTiming.shift_2_from_time ? (
									shift_1_from_time >= newAddedTiming.shift_2_from_time && shift_1_from_time <= newAddedTiming.shift_2_to_time && 
									shift_1_to_time >= newAddedTiming.shift_2_from_time && shift_1_to_time <= newAddedTiming.shift_2_to_time
								) : false : true;
								let isS2InReqS1 = shift_2_from_time ? (
									shift_2_from_time >= newAddedTiming.shift_1_from_time && shift_2_from_time <= newAddedTiming.shift_1_to_time && 
									shift_2_to_time >= newAddedTiming.shift_1_from_time && shift_2_to_time <= newAddedTiming.shift_1_to_time
								) : true;


								let isS2InReqS2 = !isS2InReqS1 ? newAddedTiming.shift_2_from_time ? (
									shift_2_from_time >= newAddedTiming.shift_2_from_time && shift_2_from_time <= newAddedTiming.shift_2_to_time && 
									shift_2_to_time >= newAddedTiming.shift_2_from_time && shift_2_to_time <= newAddedTiming.shift_2_to_time
								) : false : true;
								
								let clashStatus = (isS1InReqS1 || isS1InReqS2) && (isS2InReqS1 || isS2InReqS2);

								// console.log("_________________________________ CLASHES ____________________________________")
								// console.log(shift_1_from_time, shift_1_to_time, shift_2_from_time, shift_2_to_time)
								// console.log(newAddedTiming.shift_1_from_time, newAddedTiming.shift_1_to_time, newAddedTiming.shift_2_from_time, newAddedTiming.shift_2_to_time)
								// console.log('( ', isS1InReqS1,' || ', isS1InReqS2, ' ) && ( ', isS2InReqS1, ' || ', isS2InReqS2, ' )')

								if(!clashStatus) clashingDays.push(hdTiming.days);
					
								callback1()
							}, function(callback1Err) {
								if(clashingDays.length > 0) {
									let unqClashedDays = clashingDays.filter((v, i, a) => a.indexOf(v) === i);
									let orderedDays = reOrderDays(unqClashedDays, req.lang);
									res({status: false, message: language.lang({key: "Clash found on following day(s): %s ", params: orderedDays.join(", "), lang: req.lang})})
								} else {
									models.hospital_timings.findAll({
										attributes: [
											[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('id')), 'ht_ids']
										],
										where: {hospitalId: req.hospitalId},
										raw: true
									}).then(function(hosPrevTimings) {
										if(hosPrevTimings[0].ht_ids !== null) {
											let prevTimingsIds = hosPrevTimings[0].ht_ids.split(",");
											prevTimingsIds = prevTimingsIds.toString().split(',').map(Number);
											let newHosTimingIds = req.timings.map(itmm => itmm.id);
											newHosTimingIds = newHosTimingIds.toString().split(',').map(Number);
											
											let timingIdsToRemove = prevTimingsIds.filter(it1 => newHosTimingIds.indexOf(it1) === -1);

											models.hospital_timings.bulkCreate(req.timings, {
												ignoreDuplicates: true,
												updateOnDuplicate: ['shift_1_from_time', 'shift_1_to_time', 'shift_2_from_time', 'shift_2_to_time', 'shift_1_from_key', 'shift_1_to_key', 'shift_2_from_key', 'shift_2_to_key']
											}).then(function(respo) {
												if(hosPrevTimings[0].ht_ids !== null) {
													models.hospital_timings.destroy({where: {id: {$in: timingIdsToRemove}}}).then(() => {
														models.hospital_timings.findAll({where: {hospitalId: req.hospitalId}}).then(function(hospTimData) {
															res({status: true, message: language.lang({key: "addedSuccessfully", lang: req.lang}), hospTimData})
														})
													});
												} else {
													models.hospital_timings.findAll({where: {hospitalId: req.hospitalId}}).then(function(hospTimData) {
														res({status: true, message: language.lang({key: "addedSuccessfully", lang: req.lang}), hospTimData})
													})
												}
											})
										} else {
											models.hospital.update({shift_24X7: 0}, {where: {id: req.hospitalId}}).then(function(hosUpdateStatus) {
												models.hospital_timings.bulkCreate(req.timings, {
													ignoreDuplicates: true,
													updateOnDuplicate: ['shift_1_from_time', 'shift_1_to_time', 'shift_2_from_time', 'shift_2_to_time', 'shift_1_from_key', 'shift_1_to_key', 'shift_2_from_key', 'shift_2_to_key']
												}).then(function(respo) {
													models.hospital_timings.findAll({where: {hospitalId: req.hospitalId}}).then(function(hospTimData) {
														res({status: true, message: language.lang({key: "addedSuccessfully", lang: req.lang}), hospTimData})
													})
												})
											})
										}
									})
								}
							})
						}
					});
				}
			})
		}
	}

	this.save_doctor_time = (req, res) => {
		var docTimingDays = [];
		req.timers.forEach(function(item) {
			docTimingDays.push(item.days)
		})

		let allShifts = [
			'shift_1_from_time',
			'shift_1_to_time',
			'shift_2_from_time',
			'shift_2_to_time',
			'shift_1_from_key',
			'shift_1_to_key',
			'shift_2_from_key',
			'shift_2_to_key',
		];

		let newTimeObj = [];
		req.timers.forEach(function(item) {
			let timeObj = Object.assign({}, item);
			allShifts.forEach(key => {
				timeObj[key] = timeObj[key] === '' ? null : timeObj[key];
			});
			newTimeObj.push(timeObj);
		});

		req.timers = newTimeObj;

		if(!req.available_on_req && req.timers.length == 0) {
			res({status: false, message: language.lang({key: "Please select at least one day", lang: req.lang})})
			return;
		}

		var hdBuildData = {
			doctorProfileId: req.doctorProfileId, 
			consultation_charge: req.consultation_charge, 
			appointment_duration: req.appointment_duration, 
			hospitalId: req.hospitalId, 
			available_on_req: req.available_on_req
		}
		
		var errors = [];
		async.parallel([
			function(callback) {
				models.hospital_doctors.build(hdBuildData).validate().then(function(err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			}
		], function(err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {
				models.hospital.hasMany(models.hospital_timings, {foreignKey: 'hospitalId', sourceKey: 'id'});
				models.hospital_doctors.hasMany(models.hospital_doctor_timings, {foreignKey: 'hospitalDoctorId', sourceKey: 'id'})
				Promise.all([
					models.hospital.find({
						attributes: ["shift_24X7", "id"],
						include: [
							{model: models.hospital_timings, where: {days: {$in: docTimingDays}}, required: false}
						],
						where: {id: req.hospitalId}
					}),
					models.hospital_doctors.findAll({
						include: [
							{
								model: models.hospital_doctor_timings, 
								where: {days: {$in: docTimingDays}}
							}
						],
						where: {doctorProfileId: req.doctorProfileId, hospitalId: {$ne: req.hospitalId}, available_on_req: 0}
					})
				]).then(([hospitalTimings, docTimingsInOtherHospitals]) => {
					if(req.available_on_req) {
						//doctor can add timings
						module.exports.saveHospitalDoctorTimings(req, function(resp) { res(resp) })
					} else {

						if(hospitalTimings.shift_24X7 === 1) {
							if(docTimingsInOtherHospitals.length === 0) {
								//no clashes, doctor can add timings
								module.exports.saveHospitalDoctorTimings(req, function(resp) { res(resp) })
							} else {
								//here, need to check clashes with doctor own timings with other hospitals
								module.exports.checkClashesWithDoctorOwnTimingsInOtherHospitals({doctorTimings: req.timers, doctorOwnTimingsInOtherHospitals: docTimingsInOtherHospitals, lang: req.lang, langId: req.langId, languageId: req.languageId}, function(respo) {
									if(respo.isClash) res(respo)
									if(!respo.isClash) {
										module.exports.saveHospitalDoctorTimings(req, function(resp) { res(resp) })
									}
								});
							}
						} else {
							if(docTimingsInOtherHospitals.length === 0) {
								//here, need to check clashes with only hospital timings
								module.exports.checkClashesWithHospitalTimings({doctorTimings: req.timers, hospitalTimings: hospitalTimings, lang: req.lang, langId: req.langId, languageId: req.languageId}, function(respo) {
									if(respo.isClash) res(respo)
									if(respo.missingHosTimings) res(respo)

									if(!respo.isClash && !respo.missingHosTimings) {
										module.exports.saveHospitalDoctorTimings(req, function(resp) { res(resp) })
									}
								});
							} else {
								//here, need to check clashes with doctor own timings with other hospitals and also with the hospital timings
								
								//check timinig clashes with doctor own timings in other hospitals
								module.exports.checkClashesWithDoctorOwnTimingsInOtherHospitals({doctorTimings: req.timers, doctorOwnTimingsInOtherHospitals: docTimingsInOtherHospitals, lang: req.lang, langId: req.langId, languageId: req.languageId}, function(respo) {
									if(respo.isClash) res(respo)  //console.log("Clashes found with your own timing: ", respo)
									if(!respo.isClash) {
										//here, need to check clashes with only hospital timings
										module.exports.checkClashesWithHospitalTimings({doctorTimings: req.timers, hospitalTimings: hospitalTimings.dataValues, lang: req.lang, langId: req.langId, languageId: req.languageId}, function(respo) {
											if(respo.isClash) res(respo)
											if(respo.missingHosTimings) res(respo)
											if(!respo.isClash && !respo.missingHosTimings) {
												module.exports.saveHospitalDoctorTimings(req, function(resp) { res(resp) })
											}
										});
									}
								});
							}
						}
					}
				})
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
	this.checkClashesWithHospitalTimings = function(req, res) {
		var doctorTimings = req.doctorTimings, hospitalTimingssss = req.hospitalTimings;
		var clashesFound = [], missingHospitalTiming = [];
		async.forEach(doctorTimings, function (docTime, docTimeCallback) {
			var dayTiming = hospitalTimingssss.hospital_timings.filter(function( hospitalTimes ) {
				return hospitalTimes.days === docTime.days;
			});

			if(dayTiming.length) {
				let isDocS1InHosS1 = (
					docTime.shift_1_from_time >= dayTiming[0].shift_1_from_time && docTime.shift_1_from_time <= dayTiming[0].shift_1_to_time && 
					docTime.shift_1_to_time >= dayTiming[0].shift_1_from_time && docTime.shift_1_to_time <= dayTiming[0].shift_1_to_time
				);

				let isDocS1InHosS2 = !isDocS1InHosS1 ? dayTiming[0].shift_2_from_time ? (
					docTime.shift_1_from_time >= dayTiming[0].shift_2_from_time && docTime.shift_1_from_time <= dayTiming[0].shift_2_to_time && 
					docTime.shift_1_to_time >= dayTiming[0].shift_2_from_time && docTime.shift_1_to_time <= dayTiming[0].shift_2_to_time
				) : false : true;
				
				let isDocS2InHosS1 = docTime.shift_2_from_time ? (
					docTime.shift_2_from_time >= dayTiming[0].shift_1_from_time && docTime.shift_2_from_time <= dayTiming[0].shift_1_to_time && 
					docTime.shift_2_to_time >= dayTiming[0].shift_1_from_time && docTime.shift_2_to_time <= dayTiming[0].shift_1_to_time
				) : true;

				let isDocS2InHosS2 = !isDocS2InHosS1 ? dayTiming[0].shift_2_from_time ? (
					docTime.shift_2_from_time >= dayTiming[0].shift_2_from_time && docTime.shift_2_from_time <= dayTiming[0].shift_2_to_time && 
					docTime.shift_2_to_time >= dayTiming[0].shift_2_from_time && docTime.shift_2_to_time <= dayTiming[0].shift_2_to_time
				) : false : true;

				
				if(!((isDocS1InHosS1 || isDocS1InHosS2) && (isDocS2InHosS1 || isDocS2InHosS2))) {
					clashesFound.push(docTime.days)
				}
			} else {
				missingHospitalTiming.push(docTime.days)
			}
			docTimeCallback()
		}, function (docTimecallbackErr) {
			if(clashesFound.length > 0) {
				let orderedDays = reOrderDays(clashesFound, req.lang);
				res({ 
					status: false, isClash: true, missingHosTimings: false, 
					message: language.lang({key: "Clash found on this day(s) with hospital timings: %s", params: orderedDays.join(", "), lang: req.lang})
				});
			} else if(missingHospitalTiming.length > 0) {
				let orderedDays = reOrderDays(missingHospitalTiming, req.lang);
				res({ status: false, isClash: false, missingHosTimings: true, message: language.lang({key: "Hospital off on these day(s): %s", params: orderedDays.join(", "), lang: req.lang}) });
			} else {
				res({status: true, isClash: false, missingHosTimings: false})
			}
		})
	}
	this.checkClashesWithDoctorOwnTimingsInOtherHospitals = function(req, res) {
		var doctorOwnTimingsInOtherHospitals = req.doctorOwnTimingsInOtherHospitals, doctorTimings = req.doctorTimings;
		var clashesWithOtherHospitals = []; 
		async.forEach(doctorOwnTimingsInOtherHospitals, function (item, dTIOHCallback) {
			async.forEach(doctorTimings, function (docTime, docTimeCallback) {	
				var dayTiming = item.hospital_doctor_timings.filter(function( hospitalTimes ) {
						return hospitalTimes.days === docTime.days;
				});				

				if(dayTiming.length) {
					// console.log("-------------------------------------------------------------------------------------------------------")
					// console.log(dayTiming[0].shift_1_from_time.toString().toHHMMSS(), ' > ', docTime.shift_1_from_time.toString().toHHMMSS())
					// console.log(dayTiming[0].shift_1_from_time.toHHMMSS(), ' < ', docTime.shift_1_to_time.toString().toHHMMSS())
					// console.log("---------------------- OR ----------------------- ")
					// console.log(dayTiming[0].shift_1_to_time.toString().toHHMMSS(), ' > ', docTime.shift_1_from_time.toString().toHHMMSS())
					// console.log(dayTiming[0].shift_1_to_time.toString().toHHMMSS(), ' < ', docTime.shift_1_to_time.toString().toHHMMSS())
					// console.log("_____________________________________________ OR ______________________________________________________")
					// console.log(dayTiming[0].shift_2_from_time.toString().toHHMMSS(), ' > ', docTime.shift_1_from_time.toString().toHHMMSS())
					// console.log(dayTiming[0].shift_2_from_time.toString().toHHMMSS(), ' < ', docTime.shift_1_to_time.toString().toHHMMSS())
					// console.log("---------------------- OR ----------------------- ")
					// console.log(dayTiming[0].shift_2_to_time.toString().toHHMMSS(), ' > ', docTime.shift_1_from_time.toString().toHHMMSS())
					// console.log(dayTiming[0].shift_2_to_time.toString().toHHMMSS(), ' < ', docTime.shift_1_to_time.toString().toHHMMSS())
					// console.log("_____________________________________________ OR ______________________________________________________")
					// console.log(dayTiming[0].shift_2_from_time.toString().toHHMMSS(), ' > ', docTime.shift_1_from_time.toString().toHHMMSS())
					// console.log(dayTiming[0].shift_2_from_time.toString().toHHMMSS(), ' < ', docTime.shift_1_to_time.toString().toHHMMSS())
					// console.log("---------------------- OR ----------------------- ")
					// console.log(dayTiming[0].shift_2_to_time.toString().toHHMMSS(), ' > ', docTime.shift_1_from_time.toString().toHHMMSS())
					// console.log(dayTiming[0].shift_2_to_time.toString().toHHMMSS(), ' < ', docTime.shift_1_to_time.toString().toHHMMSS())
					// console.log("_____________________________________________ OR ______________________________________________________")
					// console.log(dayTiming[0].shift_2_from_time.toString().toHHMMSS(), ' > ', docTime.shift_2_from_time.toString().toHHMMSS())
					// console.log(dayTiming[0].shift_2_from_time.toString().toHHMMSS(), ' < ', docTime.shift_2_to_time.toString().toHHMMSS())
					// console.log("---------------------- OR ----------------------- ")
					// console.log(dayTiming[0].shift_2_to_time.toString().toHHMMSS(), ' > ', docTime.shift_2_from_time.toString().toHHMMSS())
					// console.log(dayTiming[0].shift_2_to_time.toString().toHHMMSS(), ' < ', docTime.shift_2_to_time.toString().toHHMMSS())

					let isDocS1InOtherHosS1 = (
						(
							(dayTiming[0].shift_1_from_time < docTime.shift_1_from_time) && (dayTiming[0].shift_1_to_time > docTime.shift_1_from_time)
						) || (
							(dayTiming[0].shift_1_from_time < docTime.shift_1_to_time) && (dayTiming[0].shift_1_to_time > docTime.shift_1_to_time)
						) || (
							(dayTiming[0].shift_1_from_time >= docTime.shift_1_from_time) && (dayTiming[0].shift_1_to_time <= docTime.shift_1_to_time)
						)
					);

					let isDocS1InOtherHosS2 = dayTiming[0].shift_2_from_time ? (
						(
							(dayTiming[0].shift_2_from_time < docTime.shift_1_from_time) && (dayTiming[0].shift_2_to_time > docTime.shift_1_from_time)
						) || (
							(dayTiming[0].shift_2_from_time < docTime.shift_1_to_time) && (dayTiming[0].shift_2_to_time > docTime.shift_1_to_time)
						) || (
							(dayTiming[0].shift_2_from_time >= docTime.shift_1_from_time) && (dayTiming[0].shift_2_to_time <= docTime.shift_1_to_time)
						)
					) : false;

					let isDocS2InOtherHosS1 = docTime.shift_2_from_time ? (
						(
							(dayTiming[0].shift_1_from_time < docTime.shift_2_from_time) && (dayTiming[0].shift_1_to_time > docTime.shift_2_from_time)
						) || (
							(dayTiming[0].shift_1_from_time < docTime.shift_2_to_time) && (dayTiming[0].shift_1_to_time > docTime.shift_2_to_time)
						) || (
							(dayTiming[0].shift_1_from_time >= docTime.shift_2_from_time) && (dayTiming[0].shift_1_to_time <= docTime.shift_2_to_time)
						)
					) : false;

					let isDocS2InOtherHosS2 = docTime.shift_2_from_time ? dayTiming[0].shift_2_from_time ? (
						(
							(dayTiming[0].shift_2_from_time < docTime.shift_2_from_time) && (dayTiming[0].shift_2_to_time > docTime.shift_2_from_time)
						) || (
							(dayTiming[0].shift_2_from_time < docTime.shift_2_to_time) && (dayTiming[0].shift_2_to_time > docTime.shift_2_to_time)
						) || (
							(dayTiming[0].shift_2_from_time >= docTime.shift_2_from_time) && (dayTiming[0].shift_2_to_time <= docTime.shift_2_to_time)
						)
					) : false : false;

					if(isDocS1InOtherHosS1 || isDocS1InOtherHosS2 || isDocS2InOtherHosS1 || isDocS2InOtherHosS2) {
						clashesWithOtherHospitals.push({hospitalId: item.hospitalId, day: docTime.days})
					}
				}
			 	docTimeCallback();
			}, function (docTimecallbackErr) {
			 	dTIOHCallback()
			})
		}, function (dTIOHCallback) {
			if(clashesWithOtherHospitals.length) {
				let clashesDays = clashesWithOtherHospitals.map(itm => itm.day);
				clashesDays = clashesDays.filter((value, index, self) => self.indexOf(value) === index );
				let orderedDays = reOrderDays(clashesDays, req.lang);

				let validationMessage = language.lang({key: "Clashes found in doctor timing in other Hospital(s)/Clinic(s) on following day(s) : %s ", params: orderedDays.join(", "), lang: req.lang})

				res({status: false, isClash: true, message: validationMessage, data: clashesWithOtherHospitals});
			} else {
				res({status: true, isClash: false})
			}
		})
	}

	this.saveHospitalDoctorTimings = function(req, res) {
		var hospital_doctors_data = {
			doctorProfileId: req.doctorProfileId, 
			consultation_charge: req.consultation_charge, 
			appointment_duration: req.appointment_duration, 
			hospitalId: req.hospitalId, 
			available_on_req: req.available_on_req
		}


		models.hospital_doctors.hasMany(models.hospital_doctor_timings, {foreignKey: 'hospitalDoctorId', sourceKey: 'id'})
		models.hospital_doctors.find({
			attributes: ["id", "available_on_req"],
			include: [
				{model: models.hospital_doctor_timings}
			],
			where: {doctorProfileId: req.doctorProfileId, hospitalId: req.hospitalId}, raw: true
		}).then(function(prevTimingInAddedHos) {
			if("undefined" === typeof req.id || req.id == "") {
				models.hospital_doctors.create(
					hospital_doctors_data,
					{individualHooks: true}
				).then(function(hosDoc) {
					if(req.available_on_req) {
						//update doctor pfofile status
						doctor.updateProfileStatusWhileUpdate({id: req.doctorProfileId, lang: req.lang, langId: req.langId}, ()=> {
							res({status: true, message: language.lang({key: "addedSuccessfully", lang: req.lang})})
						})
						
					} else {
						var timingDataToSave = [];
						req.timers.forEach(function(item) {
							timingDataToSave.push({
								days: item.days,
								shift_1_from_time: item.shift_1_from_time,
								shift_1_from_key: item.shift_1_from_key,
								shift_1_to_time: item.shift_1_to_time,
								shift_1_to_key: item.shift_1_to_key,
								shift_2_from_time: item.shift_2_from_time,
								shift_2_from_key: item.shift_2_from_key,
								shift_2_to_time: item.shift_2_to_time,
								shift_2_to_key: item.shift_2_to_key,
								hospitalDoctorId: hosDoc.id
							});
						})
						models.hospital_doctor_timings.bulkCreate(timingDataToSave).then(function(hosDocTime) {
							//update doctor pfofile status
							doctor.updateProfileStatusWhileUpdate({id: req.doctorProfileId, lang: req.lang, langId: req.langId}, () => {
								res({status: true, message: language.lang({key: "addedSuccessfully", lang: req.lang})})
							})
						})
					}
				})
			} else {
				if(req.available_on_req) {
					models.hospital_doctors.update(hospital_doctors_data, {where: {id: req.id}}).then(function(hosDoc) {
						if(prevTimingInAddedHos.available_on_req === 0) {
							//delete all timing in this case
							models.hospital_doctor_timings.destroy({where: {hospitalDoctorId: req.id}}).then(function(delStatus) {
								if(delStatus) {
									//update doctor pfofile status
									doctor.updateProfileStatusWhileUpdate({id: req.doctorProfileId, lang: req.lang, langId: req.langId}, () => {
										res({status: true, message: language.lang({key: "updatedSuccessfully", lang: req.lang})})
									})
								}
							})
						} else {
							res({status: true, message: language.lang({key: "updatedSuccessfully", lang: req.lang})})
						}
					})
				} else {
					models.hospital_doctors.update(hospital_doctors_data, {where: {id: req.id}}).then(function(hosDoc) {
						var docTimingDays = [];
						req.timers.forEach(function(item) {
							docTimingDays.push(item.days)
						})

						models.hospital_doctor_timings.destroy({where: {hospitalDoctorId: req.id}}).then(function(delStatus) {
							var timingDataToSave = [];
							req.timers.forEach(function(item) {
								timingDataToSave.push({
									days: item.days,
									shift_1_from_time: item.shift_1_from_time,
									shift_1_from_key: item.shift_1_from_key,
									shift_1_to_time: item.shift_1_to_time,
									shift_1_to_key: item.shift_1_to_key,
									shift_2_from_time: item.shift_2_from_time,
									shift_2_from_key: item.shift_2_from_key,
									shift_2_to_time: item.shift_2_to_time,
									shift_2_to_key: item.shift_2_to_key,
									hospitalDoctorId: req.id
								});
							})

							models.hospital_doctor_timings.bulkCreate(timingDataToSave).then(function(createStatus) {
								//update doctor pfofile status
								doctor.updateProfileStatusWhileUpdate({id: req.doctorProfileId, lang: req.lang, langId: req.langId}, () => {
									res({status: true, message: language.lang({key: "updatedSuccessfully", lang: req.lang})})
								})
							})
						})
					})
				}
			}
		})
	}

	this.filter_doctor = (req, res) => {
		models.doctorprofile.filterDoctors(req, function(response) {
			res(response);
		})
	}


	/*
	 * status update
	 */
	this.status = function(req, res) {
		models.hospital.update(req, {
			where: {
				id: req.id
			},
			individualHooks: true,
			langId: req.langId,
			lang: req.lang
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
	/*
	 * shiftstatus update
	 */
	this.shiftstatus = function(req, res) {
		models.hospital.update(req, {
			where: {
				id: req.id
			}
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

	/*
	 * shiftstatus update
	 */
	this.managefreeze = function(req, res) {
		models.hospital.update(req, {
			where: {
				id: req.id
			}
		}).then(function(data) {
			//update hospital pfofile status
			utils.updateProfileStatusWhileUpdate({id: req.id, lang: req.lang, langId: req.langId})

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

	this.freezeTimings = function(req, res) {
		models.hospital.update({is_freeze: req.value}, {
			where: {
				id: req.hospitalId
			}
		}).then(function(data) {
			//update hospital pfofile status
			utils.updateProfileStatusWhileUpdate({id: req.hospitalId, lang: req.lang, langId: req.langId}, () => {})

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
	this.getById = function(req, res) {
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

		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

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
			isWhere.hospitalawarddetail, req.langId, '`hospitalawards`.`id`', models.hospitalawarddetail, 'hospitalAwardId'
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
				},
				{
					model: models.contactinformation,
					where: {
						model: 'hospital'
					},
					required: false
				},
			],
			where: {
				id: req.id
			}
		}).then(function(data) {
			req.countryId = data.countryId;
			req.stateId = data.stateId;

			models.hospital_doctors.belongsTo(models.doctorprofile, {foreignKey: 'doctorProfileId', targetKey: 'id'});
			models.doctorprofile.hasMany(models.doctorprofiledetail);
			models.hospital_doctors.hasMany(models.hospital_doctor_timings, {
				foreignKey: 'hospitalDoctorId',
				sourceKey: 'id'
			});
			
			models.doctorprofile.hasMany(models.contactinformation, {
				foreignKey: 'key',
				sourceKey: 'id'
			});
			Promise.all([
				models.hospital_doctors.findAll({
					include: [{
							model: models.doctorprofile,
							required: false,
							include: [
								{
									model: models.doctorprofiledetail,
									where: language.buildLanguageQuery(
										{}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'
									),
									required: false
								},
								{
									model: models.contactinformation,
									where: {
										model: 'doctorprofile'
									},
									required: false,
									attributes: ["type", "value"]
								}
							]
						},
						{
							model: models.hospital_doctor_timings,
							required: false,
							attributes: ["days", "id", "shift_1_from_time", "shift_1_to_time", "shift_2_from_time", "shift_2_to_time", "shift_1_from_key", "shift_1_to_key", "shift_2_from_key", "shift_2_to_key"]
						},
					],
					where: {hospitalId: data.id},
					order: [['id', 'ASC']]
				}),
				new Promise((resolve) => country.getAllCountry(req, (result) => resolve(result))),
				new Promise((resolve) => state.getAllState(req, (result) => resolve(result.data))),
				new Promise((resolve) => city.getAllCity(req, (result) => resolve(result.data))),
				new Promise((resolve) => doctor.listDoctor(req, (result) => resolve(result))),
				new Promise((resolve) => tagtype.listByType({body: {id: utils.getAllTagTypeId()['ServiceTagId'], lang: req.lang, langId: req.langId}, where: {is_active: 1}}, (result) => resolve(result))),
				new Promise((resolve) => tagtype.listByType({body: {id: utils.getAllTagTypeId()['SpecializationTagId'], lang: req.lang, langId: req.langId}, where: {is_active: 1}}, (result) => resolve(result))),
				new Promise((resolve) => tagtype.listByType({body: {id: utils.getAllTagTypeId()['MembershipsTagId'], lang: req.lang, langId: req.langId}, where: {is_active: 1}}, (result) => resolve(result))),
				new Promise((resolve) => tagtype.listByType({body: {id: utils.getAllTagTypeId()['InsuranceCompaniesTagId'], lang: req.lang, langId: req.langId}, where: {is_active: 1}}, (result) => resolve(result)))
			]).then(([hospital_doctors, countries, states, cities, doctors, service_tags, specialization_tags, membership_tags, insurance_companies_tags]) => {
				data.dataValues.hospital_doctors = hospital_doctors;
				res({
					data: data,
					countries: countries,
					states: states,
					cities: cities,
					doctors: doctors,
					service_tags,
					insurance_companies_tags,
					specialization_tags,
					membership_tags
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
	};

	this.checkProfile = function(req, res) {

		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.hospitalservice);
		models.hospital.hasMany(models.hospitalfile);
		models.hospital.hasMany(models.hospitalaward);
		models.hospitalaward.hasMany(models.hospitalawarddetail)
		models.hospital.hasMany(models.hospital_timings);
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});
		
		hospitalWhereCond = {};
		if (typeof req.associatedProfileData !== undefined && req.associatedProfileData != null) {
			hospitalWhereCond = {
				userId: req.userId,
				id: req.associatedProfileData.id
			}
		} else {
			hospitalWhereCond = {
				userId: req.userId
			}
		}

		models.hospital.findOne({
			where: hospitalWhereCond,
			include: [{
					model: models.hospitaldetail,
					where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
				},
				{
					model: models.hospitalservice,
					required: false
				},
				{
					model: models.hospitalfile,
					required: false
				},
				{
					model: models.hospitalaward,
					include: [{
						model: models.hospitalawarddetail,
						where: language.buildLanguageQuery({}, req.langId, '`hospitalawards`.`id`', models.hospitalawarddetail, 'hospitalAwardId'),
						required: false
					}],
					required: false
				},
				{
					model: models.hospital_timings,
					required: false
				},
				{
					model: models.contactinformation,
					where: {
						model: 'hospital'
					},
					required: false
				},
			],
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
								id: utils.getAllTagTypeId()['ServiceTagId'],
								lang: req.lang,
								langId: req.langId,
								languageId: req.languageId
							},
							where: {'$or': [{userId: req.userId, is_active: 1}, {is_active: 1, is_approved: 1}]}
						}, function(data) {
							icallback(null, data);
						});
					},
					insurance_companies_tags: function(icallback) {
						tagtype.listByType({
							body: {
								id: utils.getAllTagTypeId()['InsuranceCompaniesTagId'],
								lang: req.lang,
								langId: req.langId,
								languageId: req.languageId
							},
							where: {'$or': [{userId: req.userId, is_active: 1}, {is_active: 1, is_approved: 1}]}
						}, function(data) {
							icallback(null, data);
						});
					},
					specialization_tags: function(icallback) {
						tagtype.listByType({
							body: {
								id: utils.getAllTagTypeId()['SpecializationTagId'],
								lang: req.lang,
								langId: req.langId,
								languageId: req.languageId
							}
						}, function(data) {
							icallback(null, data);
						});
					},
					membership_tags: function(icallback) {
						tagtype.listByType({
							body: {
								id: utils.getAllTagTypeId()['MembershipsTagId'],
								lang: req.lang,
								langId: req.langId,
								languageId: req.languageId
							},
							where: {'$or': [{userId: req.userId, is_active: 1}, {is_active: 1, is_approved: 1}]}
						}, function(data) {
							icallback(null, data);
						});
					},
					claimed_profile: function(callback) {
						models.claimrequest.belongsTo(models.hospital, {
							foreignKey: 'keyId'
						});
						models.hospital.hasMany(models.hospitaldetail);
						models.hospital.hasMany(models.contactinformation, {
							foreignKey: 'key',
							sourceKey: 'id'
						});
						models.hospital.hasMany(models.citydetail, {foreignKey: 'cityId', sourceKey: 'cityId'});
						models.hospital.hasMany(models.statedetail, {foreignKey: 'stateId', sourceKey: 'stateId'});
						models.hospital.hasMany(models.countrydetail, {foreignKey: 'countryId', sourceKey: 'countryId'});

						models.claimrequest.findOne({
							where: {
								userId: req.userId,
								status: 'pending',
								model: 'hospital'
							},
							include: [{
								model: models.hospital,
								attributes: [
									'id', 
									'hospital_logo', 
									'cityId', 
									'stateId', 
									'countryId',
									[models.sequelize.literal('(SELECT GROUP_CONCAT(`value`) from `contact_informations` WHERE `contact_informations`.`key` = `hospital`.`id` AND `contact_informations`.`model` = "hospital" AND `contact_informations`.`is_primary` = 1)'), 'con_info']
								],
								include: [{
										model: models.hospitaldetail,
										where: language.buildLanguageQuery({}, req.langId, '`hospital.id`', models.hospitaldetail, 'hospitalId'),
										attributes: ['hospital_name', 'about_hospital', 'address']
									}, {
										model: models.citydetail, where: language.buildLanguageQuery({}, req.langId, '`hospital.cityId`', models.citydetail, 'cityId'), attributes: ['name']
									}, {
										model: models.statedetail, where: language.buildLanguageQuery({}, req.langId, '`hospital.stateId`', models.statedetail, 'stateId'), attributes: ['name']
									}, {
										model: models.countrydetail, where: language.buildLanguageQuery({}, req.langId, '`hospital.countryId`', models.countrydetail, 'countryId'), attributes: ['name']
									}
								]
							}]
						}).then(function(data) {
							callback(null, data);
						}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
					},
					all_hospitals: function(callback) {
						models.hospital.findAll({
							attributes: ["id", "claim_status", "is_active", "is_complete", "is_live", "verified_status"],
							include: [{
								model: models.hospitaldetail,
								attributes: ["hospital_name"],
								where: language.buildLanguageQuery({}, req.lang, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
							}],
							where: {
								userId: req.userId
							}
						}).then(function (allProfiles) {
							callback(null, allProfiles);
						}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
					}
				}, function(err, metaData) {

					//profile complete percentage
					let docunmentProofStatus = result.hospitalfiles.some((itm) => ["commercial_register", "municipal_license", "prescription_pad", "clinic_reg_proof", "zakat_certificate"].indexOf(itm.document_type) !== -1), 
					timingsStatus = result.is_freeze === 1, 
					serviceStatus = result.hospitalservices.some((itm) => itm.tagtypeId === utils.getAllTagTypeId()['ServiceTagId']), 
					specStatus = result.hospitalservices.some((itm) => itm.tagtypeId === utils.getAllTagTypeId()['SpecializationTagId']),
					profileCompletePercentage = 20, remainigInfo = [];

					docunmentProofStatus ? (profileCompletePercentage+=20) : (remainigInfo.push("docunmentProofStatus"));
					timingsStatus ? (profileCompletePercentage+=20) : (remainigInfo.push("timingsStatus"));
					serviceStatus ? (profileCompletePercentage+=20) : (remainigInfo.push("serviceStatus"));
					specStatus ? (profileCompletePercentage+=20) : (remainigInfo.push("specStatus"));

					res({
						isClaimed: true,
						data: result,
						countries: metaData.countries,
						states: metaData.states,
						cities: metaData.cities,
						service_tags: metaData.service_tags,
						insurance_companies_tags: metaData.insurance_companies_tags,
						specialization_tags: metaData.specialization_tags,
						membership_tags: metaData.membership_tags,
						doctors_list_all: metaData.doctors_list_all,
						profileCompletePercentage,
						remainigInfo,
						claimedProfile: metaData.claimed_profile,
						all_hospitals: metaData.all_hospitals
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
								id: utils.getAllTagTypeId()['SpecializationTagId'],
								lang: req.lang,
								langId: req.langId,
								languageId: req.languageId
							}
						}, function(data) {
							callback(null, data);
						});
					},
					claimed_profile: function(callback) {
						models.claimrequest.belongsTo(models.hospital, {
							foreignKey: 'keyId'
						});
						models.hospital.hasMany(models.hospitaldetail);
						models.hospital.hasMany(models.contactinformation, {
							foreignKey: 'key',
							sourceKey: 'id'
						});
						models.hospital.hasMany(models.citydetail, {foreignKey: 'cityId', sourceKey: 'cityId'});
						models.hospital.hasMany(models.statedetail, {foreignKey: 'stateId', sourceKey: 'stateId'});
						models.hospital.hasMany(models.countrydetail, {foreignKey: 'countryId', sourceKey: 'countryId'});

						models.claimrequest.findOne({
							where: {
								userId: req.userId,
								status: 'pending',
								model: 'hospital'
							},
							include: [{
								model: models.hospital,
								attributes: [
									'id', 
									'hospital_logo', 
									'cityId', 
									'stateId', 
									'countryId',
									[models.sequelize.literal('(SELECT GROUP_CONCAT(`value`) from `contact_informations` WHERE `contact_informations`.`key` = `hospital`.`id` AND `contact_informations`.`model` = "hospital" AND `contact_informations`.`is_primary` = 1)'), 'con_info']
								],
								include: [{
										model: models.hospitaldetail,
										where: language.buildLanguageQuery({}, req.langId, '`hospital.id`', models.hospitaldetail, 'hospitalId'),
										attributes: ['hospital_name', 'about_hospital', 'address']
									}, {
										model: models.citydetail, where: language.buildLanguageQuery({}, req.langId, '`hospital.cityId`', models.citydetail, 'cityId'), attributes: ['name']
									}, {
										model: models.statedetail, where: language.buildLanguageQuery({}, req.langId, '`hospital.stateId`', models.statedetail, 'stateId'), attributes: ['name']
									}, {
										model: models.countrydetail, where: language.buildLanguageQuery({}, req.langId, '`hospital.countryId`', models.countrydetail, 'countryId'), attributes: ['name']
									}
								]
							}]
						}).then(function(data) {
							callback(null, data);
						}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
					}
				}, function(err, result) {
					let is_any_claim_request_pending = result.claimed_profile ? true : false;
					let profile_data = result.claimed_profile ? result.claimed_profile.hospital : [];
					res({
						isClaimed: false,
						cities: result.cities,
						specialization_tags: result.specialization_tags,
						is_any_claim_request_pending: is_any_claim_request_pending,
						hospital_profile_data: profile_data
					})
				});
			}
		}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	}

	this.getAllProfiles = function(req, res) {
      var setPage = 10;
      var currentPage = 1;
      var pag = 1;
      var orderBy = "";
      if (
          typeof req.query !== "undefined" &&
          typeof req.query.page !== "undefined"
      ) {
          currentPage = +req.query.page;
          pag = (currentPage - 1) * setPage;
          delete req.query.page;
      } else {
          pag = 0;
      }
      orderBy = "id DESC";

      if (req.name && req.selected_specialization && req.selected_city) {
          let emailMobileCond = [req.email, req.mobile];
          emailMobileCond = emailMobileCond.filter(function(e) {
              return e;
          });
          let whereCond = "";
          whereCond += " (`hospitaldetails`.`hospital_name` LIKE '%" + req.name + "%'";
          if (emailMobileCond.length) {
              whereCond +=
                  " or (`contactinformations`.`value` in ('" +
                  emailMobileCond.join("','") +
                  "') and `contactinformations`.`model` = 'hospital') ";
          }
          whereCond += " ) and ";
          whereCond += " (`hospital`.`cityid` = " + req.selected_city;
          whereCond += " or `hospitalservices`.`tagId` = " + req.selected_specialization;
          whereCond += " ) ";
          whereCond +=
              " and `hospital`.`claim_status` = 'non-claimed' and `hospital`.`is_active` = 1";

          whereCond.hospitaldetail = language.buildLanguageQuery({},
              req.langId,
              "`hospitals`.`id`",
              models.hospitaldetail,
              "hospitalId"
          );

          models.hospital.hasMany(models.hospitaldetail);
          models.hospital.hasMany(models.hospitalservice);
          models.hospital.hasMany(models.contactinformation, {foreignKey: "key", sourceKey: "id"});

          
         	models.hospital.hasMany(models.citydetail, {foreignKey: 'cityId', sourceKey: 'cityId'});
			models.hospital.hasMany(models.statedetail, {foreignKey: 'stateId', sourceKey: 'stateId'});
			models.hospital.hasMany(models.countrydetail, {foreignKey: 'countryId', sourceKey: 'countryId'});

          models.hospital
              .findAndCountAll({
                  attributes: [
                  	"id", 
                  	"cityId", 
                  	"stateId", 
                  	"countryId", 
                  	"hospital_logo", 
                  	"claim_status", 
                  	"is_active",
                  	[models.sequelize.literal('(SELECT GROUP_CONCAT(`value`) from `contact_informations` WHERE `contact_informations`.`key` = `hospital`.`id` AND `contact_informations`.`model` = "hospital" AND `contact_informations`.`is_primary` = 1)'), 'con_info']
                  ],
                  where: {
                      whereCondition: models.sequelize.literal(whereCond)
                  },
                  include: [{
                          model: models.hospitaldetail,
                          where: whereCond.hospitaldetail,
                          attributes: [
                              "hospital_name",
                              "contact_emails",
                              "contact_mobiles",
                              "address"
                          ]
                      },
                      {
                          model: models.hospitalservice,
                          where: {},
                          required: false
                      },
                      {
							model: models.citydetail, where: language.buildLanguageQuery({}, req.langId, '`hospital`.`cityId`', models.citydetail, 'cityId'), attributes: ['name']
						}, {
							model: models.statedetail, where: language.buildLanguageQuery({}, req.langId, '`hospital`.`stateId`', models.statedetail, 'stateId'), attributes: ['name']
						}, {
							model: models.countrydetail, where: language.buildLanguageQuery({}, req.langId, '`hospital`.`countryId`', models.countrydetail, 'countryId'), attributes: ['name']
						},
                      {
                          model: models.contactinformation, attributes: [],
                          where: {
                              model: "hospital",
                              is_primary: 1
                          }
                      }
                  ],
                  group: ['`hospital`.`id`'],
                  limit: setPage,
                  offset: pag,
                  subQuery: false
              })
              .then(function(result) {
                  var totalData = result.count;
                  var pageCount = Math.ceil(totalData / setPage);
                  res({
                      status: true,
                      totalData: totalData,
                      pageCount: pageCount,
                      pageLimit: setPage,
                      currentPage: currentPage,
                      data: result.rows
                  });
              })//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      } else {
          res({
              status: false,
              message: language.lang({
                  key: "Missing required parameters",
                  lang: req.lang
              })
          });
      }
  };

	this.metaDataForNewProfile = function(req, res) {
		async.parallel({
			countries: function(callback) {
				country.getAllCountry(req, function(data) {
					callback(null, data);
				});
			},
			service_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['ServiceTagId'],
						lang: req.lang,
						langId: req.langId,
						languageId: req.languageId
					},
					where: {'$or': [{userId: req.userId, is_active: 1}, {is_active: 1, is_approved: 1}]}
				}, function(data) {
					callback(null, data);
				});
			},
			insurance_companies_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['InsuranceCompaniesTagId'],
						lang: req.lang,
						langId: req.langId,
						languageId: req.languageId
					},
					where: {'$or': [{userId: req.userId, is_active: 1}, {is_active: 1, is_approved: 1}]}
				}, function(data) {
					callback(null, data);
				});
			},
			specialization_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['SpecializationTagId'],
						lang: req.lang,
						langId: req.langId,
						languageId: req.languageId
					}
				}, function(data) {
					callback(null, data);
				});
			},
			membership_tags: function(callback) {
				tagtype.listByType({
					body: {
						id: utils.getAllTagTypeId()['MembershipsTagId'],
						lang: req.lang,
						langId: req.langId,
						languageId: req.languageId
					},
					where: {'$or': [{userId: req.userId, is_active: 1}, {is_active: 1, is_approved: 1}]}
				}, function(data) {
					callback(null, data);
				});
			}
		}, function(err, result) {
			res(result);
		});
	}

	this.verifystatus = function(req, res) {
		if (req.id) {
			models.hospital.hasMany(models.hospitaldetail);
			models.hospital.hasMany(models.hospitalservice);
			models.hospital.hasMany(models.hospitalfile);
			var isWhere = {};
			models.hospital.findOne({
				include: [{
						model: models.hospitaldetail,
						where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'),
						attributes: ['hospital_name', 'languageId']
					},
					{
						model: models.hospitalservice,
						where: isWhere.hospitalservice,
						required: false
					},
					{
						model: models.hospitalfile,
						where: isWhere.hospitalfile,
						required: false
					}
				],
				where: {
					id: req.id
				}
			}).then(function(data) {
				if (data) {
					// check condition befor live 
					let tagTypeIds = utils.getAllTagTypeId()
					
					let servicesTagStatus = data.hospitalservices.some((item) => { return item.tagtypeId == tagTypeIds.ServiceTagId })
                	let specializationTagStatus = data.hospitalservices.some((item) => { return item.tagtypeId == tagTypeIds.SpecializationTagId })
                	let filesStatus = data.hospitalfiles.some((item) => ["commercial_register", "municipal_license", "prescription_pad", "clinic_reg_proof", "zakat_certificate"].indexOf(item.document_type) !== -1)
                	let timingStatus = data.is_freeze === 1;
					//end of check conditions

					let profileCompletionStatus = servicesTagStatus && specializationTagStatus && filesStatus && timingStatus;
					
					if (profileCompletionStatus) {
						var checkStatus = 1 === data.is_complete && ("approved" === data.claim_status || "user-created" === data.claim_status);
						if (checkStatus) {
							models.hospital.update({
								verified_status: 'verified',
								is_live: 1,
								is_dummy: 0,
								doctorProfileId: null
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
								key: "Your profile is not complete yet",
								lang: req.lang
							}),
							data: []
						});
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
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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

	/*
	 * doctor get By ID
	*/
	this.hospitalById = function(req, res) {
		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.hospitalfile);
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key'
		});
		models.hospital.hasMany(models.hospitalservice);
		models.hospital.hasMany(models.hospitalaward);
		models.hospitalaward.hasMany(models.hospitalawarddetail);

		models.doctorfeedback.belongsTo(models.patient);
		models.patient.belongsTo(models.user);
		models.user.hasMany(models.userdetail);

		models.hospital_doctors.belongsTo(models.doctorprofile);
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.doctorprofile.hasMany(models.doctoreducation);
		models.doctoreducation.hasMany(models.doctoreducationdetail)
		models.doctoreducation.belongsTo(models.tag, {
			foreignKey: 'tagtypeId'
		})
		models.tag.hasMany(models.tagdetail)
		models.doctorprofile.hasMany(models.doctorexperience);
		models.doctorprofile.hasMany(models.doctortags);

		Promise.all([
			models.hospital.find({
				attributes: [
					'id',
					'hospital_logo',
					'active_schedule',
					'latitude',
					'longitude', 
					'shift_24X7',
					[models.sequelize.literal('(SELECT ROUND(AVG(doctor_feedbacks.rating)) FROM doctor_feedbacks WHERE doctor_feedbacks.hospitalId = hospital.id AND doctor_feedbacks.is_approved = 1)'), 'avg_rating']
				],
				include: [{
					model: models.hospitaldetail,
					attributes: ['id', 'hospital_name', 'about_hospital', 'address'],
					where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
				}, {
					model: models.hospitalfile,
					attributes: ['id', 'hospital_files', 'file_type', 'document_type'],
					where:{$or: [{file_type: 'video'}, {document_type: 'public_photos'}]},
					required: false
				}, {
					model: models.contactinformation,
					attributes: ['type', 'value', 'is_primary'],
					where: {
						is_primary: 1,
						model: 'hospital'
					},
					required: false
				}, {
					model: models.hospitalservice,
					attributes: ['id', 'tagId'],
					required: false
				}, {
					model: models.hospitalaward,
					attributes: ["award_year"],
					include: [{
						model: models.hospitalawarddetail,
						attributes: ["award_gratitude_title"],
						where: language.buildLanguageQuery({}, req.langId, '`hospitalawards`.`id`', models.hospitalawarddetail, 'hospitalAwardId'),
						required: false
					}],
					required: false
				}],
				where: {
					id: req.id,
					is_active: 1,
					//is_live: 1
				}
			}),
			models.hospital_timings.findAll({
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
				where: {
					hospitalId: req.id
				}
			}),
			models.doctorfeedback.findOne({
				attributes: ['id', 'patientId', 'feedback', 'rating', 'createdAt'],
				include: [
					{
						model: models.patient,
						attributes: ['id'],
						include: [{
							model: models.user,
							attributes: ['id'],
							include: [{
								model: models.userdetail,
								attributes: ['id', 'fullname'],
								where: language.buildLanguageQuery(
									{}, req.langId, '`patient.user`.`id`', models.userdetail, 'userId'
								),
							}]
						}]
					},
				],
				order: [['createdAt', 'DESC']],
				where: {
					is_approved: 1,
					hospitalId: req.id
				}
			}),
			models.hospital_doctors.findAll({
				attributes: ['id', 'consultation_charge', 'available_on_req'],
				include: [{
					model: models.doctorprofile,
					where: {
						is_active: 1,
						is_live: 1
					},
					attributes: [
						'id',
						'salutation',
						'doctor_profile_pic', 
						[models.sequelize.literal('(SELECT IFNULL(ROUND(AVG(doctor_feedbacks.rating)),0) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id AND doctor_feedbacks.is_approved = 1)'), 'avg_rating'],
						[models.sequelize.literal('(SELECT SUM(duration_to-duration_from) FROM doctor_experiences WHERE doctor_experiences.doctorProfileId = doctorprofile.id)'), 'total_exp']
					],
					include: [{
							model: models.doctorprofiledetail,
							attributes: ['id', 'name'],
							where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
						},
						{
							model: models.doctoreducation,
							attributes: ['id'],
							include: [{
								model: models.tag,
								attributes: ['id'],
								include: [{
									model: models.tagdetail,
									attributes: ['title'],
									where: language.buildLanguageQuery({}, req.langId, '`doctorprofile.doctoreducations.tag`.`id`', models.tagdetail, 'tagId'),
									required: false
								}],
								required: false
							}],
							required: false
						},
						{
							model: models.doctortags,
							attributes: ['id'],
							include: [{
								model: models.tag,
								attributes: ['id'],
								include: [{
									model: models.tagdetail,
									attributes: ['title'],
									where: language.buildLanguageQuery({}, req.langId, '`doctorprofile.doctortags.tag`.`id`', models.tagdetail, 'tagId'),
									required: false
								}],
								required: false,
							}],
							required: false,
							where: {
								tagtypeId: 2
							},
						},
						{
							model: models.doctorexperience,
							attributes: ["id", "duration_from", "duration_to"],
							required: false
						}
					],
					required: false
				}],
				where: {
					hospitalId: req.id
				}
			})
		]).then(([data, hospital_timings, doctorfeedback, hospital_doctors]) => {
			let arrtag = [];
			if(data){
				data = JSON.parse(JSON.stringify(data)) || {};
				if(data.hospitalservices){
					arrtag = data.hospitalservices.map(item => item.tagId);
				}
			}
			data.hospital_timings = hospital_timings;
			data.doctorfeedback = doctorfeedback;
			data.hospital_doctors = hospital_doctors;
			Promise.all([
				tagtype.listByTypeAndTagsNew({body: {id: 1,tagIDS:arrtag, langId: req.langId}}),
				tagtype.listByTypeAndTagsNew({body: {id: 11,tagIDS:arrtag, langId: req.langId}})
			]).then(([service_tags, insurance_tags]) => {
				res({
					data,
					service_tags: {data: service_tags},
					insurance_tags: {data: insurance_tags}
				});
			}).catch(console.log);
		}).catch(console.log);
	};

	this.createByDoctor = function(req, res) {
		models.hospital.findOne({
			where: {
				userId: req.userId,
				headId: null
			}
		}).then(function(hosData) {

			let contact_infos = JSON.parse(req.contact_informations)
			let contact_emails = contact_infos.emails,
				contact_mobiles = contact_infos.mobiles;
			req.contact_informations = contact_infos.emails.concat(contact_infos.mobiles)
			var hospitalHasOne = models.hospital.hasOne(models.hospitaldetail, {
				as: 'hospital_detail'
			});
			var hospital = models.hospital.build(req);
			req.hospital_detail.languageId = req.languageId;
			var hospitaldetail = models.hospitaldetail.build(req.hospital_detail);
			var errors = [];

			req.latitude = typeof req.latitude === undefined ? '' : req.latitude;
			req.longitude = typeof req.longitude === undefined ? '' : req.longitude;

			async.parallel([
				function(callback) {
					hospital.validate().then(function(err) {
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
					hospitaldetail.validate().then(function(err) {
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
					if (typeof req.is_active === 'undefined') {
						req.is_active = 0;
					}
					if (req.is_active == 'on' || req.is_active == 1) {
						req.is_active = 1;
					} else {
						req.is_active = 0;
					}
					if (typeof req.id !== 'undefined' && req.id !== '') {
						hospitaldetailData = req.hospital_detail;
						hospitaldetailData.languageId = req.languageId
						hospitaldetailData.hospitalId = req.id
						delete req.hospital_detail;
						delete req.languageId;
						models.hospital.update(req, {
							where: {
								id: req.id
							},
							individualHooks: true
						}).then(function(data) {
							models.hospitaldetail.find({
								where: {
									hospitalId: req.id,
									languageId: hospitaldetailData.languageId
								}
							}).then(function(resultData) {
								if (resultData !== null) {
									hospitaldetailData.id = resultData.id;
									models.hospitaldetail.update(hospitaldetailData, {
										where: {
											id: resultData.id,
											hospitalId: req.id,
											languageId: hospitaldetailData.languageId
										}
									}).then(function() {
										models.contactinformation.destroy({
											where: {
												key: req.id,
												model: 'hospital'
											}
										}).then(function(CIDeleteStatus) {
											models.contactinformation.bulkCreate(req.contact_informations).then(function(CIStatus) {
												res({
													status: true,
													message: language.lang({
														key: "addedSuccessfully",
														lang: hospitaldetailData.languageId
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
										'error_description': language.lang({
											key: "Internal Error",
											lang: req.lang
										}),
										url: true
									}));
								} else {
									delete hospitaldetailData.id;
									models.hospitaldetail.create(hospitaldetailData).then(function() {}).catch(() => res({
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
						delete req.hospital_detail.id;
						req.is_complete = 0, req.is_live = 0;
						req.verified_status = "incomplete-profile";
						req.claim_status = undefined === typeof req.claim_status && '' == req.claim_status ? 'non-claimed' : req.claim_status;
						req.headId = hosData ? hosData.id : null;
						models.hospital.create(req, {
							include: [hospitalHasOne],
							individualHooks: true
						}).then(function(hospitalData) {

							let contactsInfoData = [];
							async.forEachOf(req.contact_informations, function(civalues, cikey, CICallback) {
								let setCIData = civalues;
								setCIData.key = hospitalData.id;
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
										if (req.langId == 1) {
											res({
												status: true,
												message: language.lang({
													key: "addedSuccessfully",
													lang: hospitalData.languageId
												}),
												data: hospitalData
											});
										} else {
											req.hospital_detail.hospitalId = hospitalData.id;
											req.hospital_detail.languageId = 1;
											models.hospitaldetail.create(req.hospital_detail).then(function() {
												res({
													status: true,
													message: language.lang({
														key: "addedSuccessfully",
														lang: req.lang
													}),
													data: hospitalData
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
		})
	}

	this.getProfileForDoctor = function(req, res) {
		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.hospitalservice);
		models.hospital.hasMany(models.hospitalfile);
		models.hospital.hasMany(models.hospitalaward);
		models.hospitalaward.hasMany(models.hospitalawarddetail)
		models.hospital.hasMany(models.hospital_timings);
		models.hospital.hasMany(models.hospital_doctors);
		models.hospital_doctors.belongsTo(models.doctorprofile);
		models.hospital_doctors.hasMany(models.hospital_doctor_timings, {
			foreignKey: 'hospitalDoctorId',
			sourceKey: 'id'
		});
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});
		models.doctorprofile.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

		models.hospital.findOne({
			where: {
				id: req.id
			},
			include: [{
					model: models.hospitaldetail,
					where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
				},
				{
					model: models.hospitalservice,
					required: false
				},
				{
					model: models.hospitalfile,
					required: false
				},
				{
					model: models.hospitalaward,
					include: [{
						model: models.hospitalawarddetail,
						where: language.buildLanguageQuery({}, req.langId, '`hospitalawards`.`id`', models.hospitalawarddetail, 'hospitalAwardId'),
						required: false
					}],
					required: false
				},
				{
					model: models.hospital_timings,
					required: false
				},
				{
					model: models.hospital_doctors,
					include: [{
							model: models.doctorprofile,
							required: false,
							attributes: ["doctor_id", "id", "mobile", "email"],
							include: [{
									model: models.doctorprofiledetail,
									required: false,
									attributes: ["name", "address_line_1"],
									where: language.buildLanguageQuery({}, req.langId, '`hospital_doctors.doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
								},
								{
									model: models.contactinformation,
									where: {
										model: 'doctorprofile'
									},
									attributes: ["type", "value"],
									required: false
								}
							]
						},
						{
							model: models.hospital_doctor_timings,
							required: false,
							attributes: ["days", "id", "shift_1_from_time", "shift_1_to_time", "shift_2_from_time", "shift_2_to_time"]
						}
					],
					required: false
				},
				{
					model: models.contactinformation,
					where: {
						model: 'hospital'
					},
					required: false
				},
			],
		}).then(function(result) {
			res({
				data: result
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
	}

	this.metaDataForEditProfile = function(req, res) {
		models.hospital.findOne({
			where: {
				id: req.id
			}
		}).then(function(result) {
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
							id: utils.getAllTagTypeId()['ServiceTagId'],
							langId: req.langId,
							lang: req.lang
						},
						where: {'$or': [{userId: req.userId, is_active: 1}, {is_active: 1, is_approved: 1}]}
					}, function(data) {
						icallback(null, data);
					});
				},
				insurance_companies_tags: function(icallback) {
					tagtype.listByType({
						body: {
							id: utils.getAllTagTypeId()['InsuranceCompaniesTagId'],
							langId: req.langId,
							lang: req.lang
						},
						where: {'$or': [{userId: req.userId, is_active: 1}, {is_active: 1, is_approved: 1}]}
					}, function(data) {
						icallback(null, data);
					});
				},
				specialization_tags: function(icallback) {
					tagtype.listByType({
						body: {
							id: utils.getAllTagTypeId()['SpecializationTagId'],
							langId: req.langId,
							lang: req.lang
						}
					}, function(data) {
						icallback(null, data);
					});
				},
				membership_tags: function(icallback) {
					tagtype.listByType({
						body: {
							id: utils.getAllTagTypeId()['MembershipsTagId'],
							langId: req.langId,
							lang: req.lang
						},
						where: {'$or': [{userId: req.userId, is_active: 1}, {is_active: 1, is_approved: 1}]}
					}, function(data) {
						icallback(null, data);
					});
				},
				doctors_list_all: function(icallback) {
					doctor.listDoctor(req, function(data) {
						icallback(null, data)
					})
				}
			}, function(err, metaData) {
				res({
					countries: metaData.countries,
					states: metaData.states,
					cities: metaData.cities,
					service_tags: metaData.service_tags.data.tags,
					insurance_companies_tags: metaData.insurance_companies_tags.data.tags,
					specialization_tags: metaData.specialization_tags.data.tags,
					membership_tags: metaData.membership_tags.data.tags,
					doctors_list_all: metaData.doctors_list_all
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

	this.viewHospitalInfo = function(req, res) {
		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.hospitalfile);
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key'
		});
		models.hospital.hasMany(models.hospitalservice);
		models.hospital.hasMany(models.hospitalaward);
		models.hospitalaward.hasMany(models.hospitalawarddetail)

		models.hospital.hasMany(models.citydetail, {foreignKey: 'cityId', sourceKey: 'cityId'});
		models.hospital.hasMany(models.statedetail, {foreignKey: 'stateId', sourceKey: 'stateId'});
		models.hospital.hasMany(models.countrydetail, {foreignKey: 'countryId', sourceKey: 'countryId'});

		models.hospital_doctors.belongsTo(models.doctorprofile);
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.doctorprofile.hasMany(models.doctoreducation);
		models.doctoreducation.hasMany(models.doctoreducationdetail)
		models.doctoreducation.belongsTo(models.tag, {
			foreignKey: 'tagtypeId'
		})
		models.tag.hasMany(models.tagdetail)
		models.doctorprofile.hasMany(models.doctorexperience);
		models.doctorprofile.hasMany(models.doctortags);

		Promise.all([
			models.hospital.find({
				attributes: [
					'id',
					'hospital_logo',
					'active_schedule',
					'shift_24X7',
					'is_freeze',
					'latitude',
					'longitude', [models.sequelize.literal('(SELECT ROUND(AVG(doctor_feedbacks.rating)) FROM doctor_feedbacks WHERE doctor_feedbacks.hospitalId = hospital.id)'), 'avg_rating']
				],
				include: [{
					model: models.hospitaldetail,
					attributes: ['id', 'hospital_name', 'about_hospital', 'address'],
					where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
				}, {
					model: models.hospitalfile,
					attributes: ['id', 'hospital_files', 'file_type', 'document_type'],
					where: {document_type: 'public_photos'},
					required: false
				}, {
					model: models.contactinformation,
					attributes: ['type', 'value', 'is_primary'],
					where: {
						is_primary: 1,
						model: 'hospital'
					},
					required: false
				}, {
					model: models.hospitalservice,
					attributes: ['id', 'tagId'],
					required: false
				}, {
					model: models.hospitalaward,
					attributes: ['id', 'award_year'],
					include: [{
						model: models.hospitalawarddetail,
						attributes: ['award_gratitude_title'],
						where: language.buildLanguageQuery({}, req.langId, '`hospitalawards`.`id`', models.hospitalawarddetail, 'hospitalAwardId'),
						required: false
					}],
					required: false
				}, {
					model: models.citydetail, where: language.buildLanguageQuery({}, req.langId, '`hospital`.`cityId`', models.citydetail, 'cityId'), attributes: ['name']
				}, {
					model: models.statedetail, where: language.buildLanguageQuery({}, req.langId, '`hospital`.`stateId`', models.statedetail, 'stateId'), attributes: ['name']
				}, {
					model: models.countrydetail, where: language.buildLanguageQuery({}, req.langId, '`hospital`.`countryId`', models.countrydetail, 'countryId'), attributes: ['name']
				}],
				where: {
					id: req.id,
					is_active: 1
				}
			}),
			models.hospital_timings.findAll({
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
				where: {
					hospitalId: req.id
				}
			}),
			models.hospital_doctors.findAll({
				attributes: ['id', 'consultation_charge', 'available_on_req'],
				include: [{
					model: models.doctorprofile,
					where: {
						is_active: 1
					},
					attributes: [
						'id',
						'salutation',
						'doctor_profile_pic', 
						[models.sequelize.literal('(SELECT IFNULL(ROUND(AVG(doctor_feedbacks.rating)),0) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = id)'), 'avg_rating'],
						[models.sequelize.literal('(SELECT MAX(duration_to) - MIN(duration_from) FROM doctor_experiences WHERE doctor_experiences.doctorProfileId = doctorprofile.id)'), 'total_exp']
					],
					include: [{
							model: models.doctorprofiledetail,
							attributes: ['id', 'name'],
							where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
						},
						{
							model: models.doctoreducation,
							attributes: ['id'],
							include: [{
								model: models.tag,
								attributes: ['id'],
								include: [{
									model: models.tagdetail,
									attributes: ['title'],
									where: language.buildLanguageQuery({}, req.langId, '`doctorprofile.doctoreducations.tag`.`id`', models.tagdetail, 'tagId'),
									required: false
								}],
								required: false
							}],
							required: false
						},
						{
							model: models.doctortags,
							attributes: ['id'],
							include: [{
								model: models.tag,
								attributes: ['id'],
								include: [{
									model: models.tagdetail,
									attributes: ['title'],
									where: language.buildLanguageQuery({}, req.langId, '`doctorprofile.doctortags.tag`.`id`', models.tagdetail, 'tagId'),
									required: false
								}],
								required: false,
							}],
							required: false,
							where: {
								tagtypeId: utils.getAllTagTypeId()['SpecializationTagId']
							},
						},
						{
							model: models.doctorexperience,
							attributes: ["id", "duration_from", "duration_to"],
							required: false
						}
					],
					required: false
				}],
				where: {
					hospitalId: req.id
				}
			})
		]).then(([data, hospital_timings, hospital_doctors]) => {
			let arrtag = [];
			if(data){
				data = JSON.parse(JSON.stringify(data)) || {};
				if(data.hospitalservices){
					arrtag = data.hospitalservices.map(item => item.tagId);
				}
			}
			data.hospital_timings = hospital_timings;
			data.hospital_doctors = hospital_doctors;
			Promise.all([
				tagtype.listByTypeAndTagsNew({body: {id: utils.getAllTagTypeId()['ServiceTagId'],tagIDS:arrtag}}),
				tagtype.listByTypeAndTagsNew({body: {id: utils.getAllTagTypeId()['SpecializationTagId'],tagIDS:arrtag}}),
				tagtype.listByTypeAndTagsNew({body: {id: utils.getAllTagTypeId()['MembershipsTagId'],tagIDS:arrtag}}),
				tagtype.listByTypeAndTagsNew({body: {id: utils.getAllTagTypeId()['InsuranceCompaniesTagId'],tagIDS:arrtag}})
			]).then(([service_tags, specialization_tags, membership_tags, insurance_comp_tags]) => {
				res({
					data,
					service_tags: {data: service_tags},
					specialization_tags: {data: specialization_tags},
					membership_tags: {data: membership_tags},
					insurance_comp_tags: {data: insurance_comp_tags}
				});
			}).catch(console.log);
		}).catch(console.log);
	};

	this.metaDataForDocmap = function(req, res) {
		req.body = {id: utils.getAllTagTypeId()['SpecializationTagId']}
		let tagtypeListData = {body: req};
		tagtypeListData.body.id = utils.getAllTagTypeId()['SpecializationTagId'];

		Promise.all([
			new Promise((resolve) => tagtype.listTagdetailByTagId(tagtypeListData.body, (result) => resolve(result))),
			new Promise((resolve) => city.getAllCityAtOnce(req, (result) => resolve(result)))
		]).then(([specTags, cities]) => {
			res({specializationTags: specTags, cities: cities.data})
		})
	}

	this.getBasicInfo = function(req, res) {
		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.hasMany(models.hospitalservice);
		models.hospital.hasMany(models.hospitalfile);
		models.hospital.hasMany(models.hospitalaward);
		models.hospitalaward.hasMany(models.hospitalawarddetail);
		models.hospital.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});
		models.hospitalservice.hasMany(models.tagdetail, {foreignKey: 'tagId', sourceKey: 'tagId'})
		models.hospital.hasMany(models.hospital_timings);

		models.hospital.findOne({
			include: [
				{
					model: models.hospitaldetail,
					where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
				}, {
					model: models.contactinformation,
					where: {
						model: 'hospital'
					},
					required: false
				}, {
					model: models.hospitalservice,
					attributes: ['tagId', 'tagtypeId'],
					include: [
						{
							model: models.tagdetail,
							attributes: ["title"]
						}
					],
					required: false
				}, {
					model: models.hospitalfile,
					required: false
				}, {
					model: models.hospitalaward,
					include: [{
						model: models.hospitalawarddetail,
						where: language.buildLanguageQuery({}, req.langId, '`hospitalawards`.`id`', models.hospitalawarddetail, 'hospitalAwardId'),
						required: false
					}],
					required: false
				}, {
					model: models.hospital_timings, required: false
				}
			],
			where: {id: req.id}
		}).then(function(hosData) {

			//get all tag id's
			let hostagIds = [];
			hosData.hospitalservices.map((itm) => { hostagIds.push(itm.tagId) })

			//Edit helper data
			req.countryId = hosData.countryId;
			req.stateId = hosData.stateId;
			let tagWhere = {
				where: {'$or': [{userId: req.userId}, {is_active: 1, is_approved: 1}]},
				langId: req.langId, lang: req.lang
			}

			if(hostagIds.length > 0) tagWhere.where.id = {'$notIn': hostagIds};

			Promise.all([
				new Promise((resolve) => country.getAllCountry(req, (result) => resolve(result))),
				new Promise((resolve) => state.getAllState(req, (result) => resolve(result))),
				new Promise((resolve) => city.getAllCity(req, (result) => resolve(result))),
				new Promise((resolve) => tag.getAllForProviders(tagWhere, (result) => resolve(result)))
			]).then(([countries, states, cities, tags]) => {
				res({
					status: true, 
					data: hosData, 
					countries, 
					states: states.data, cities: cities.data,
					tags: tags.data
				})
			})
		})

	}

	this.exportData = function(req, res) {

		models.hospital.hasMany(models.hospitaldetail);
		models.hospital.belongsTo(models.country);
		models.hospital.belongsTo(models.city);
		models.hospital.belongsTo(models.state);
		models.country.hasMany(models.countrydetail);
		models.city.hasMany(models.citydetail);
		models.state.hasMany(models.statedetail);
		models.hospital.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		models.hospital.hasMany(models.contactinformation, {foreignKey: 'key', sourceKey: 'id'});

		models.hospital.findAll({
			attributes: ["id"],
			include: [
				{
					model: models.hospitaldetail, 
					attributes: ["hospital_name"],
					where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
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
					where: {model: 'hospital'},
					required: false
				}
			]
		}).then(function(data) {
			res({status: true, hospitals: data})
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

	this.getMappedDoctors = function(req, res) {
		models.hospital_doctors.belongsTo(models.doctorprofile, {foreignKey: 'doctorProfileId', targetKey: 'id'});
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.hospital_doctors.hasMany(models.hospital_doctor_timings, {
			foreignKey: 'hospitalDoctorId',
			sourceKey: 'id'
		});
		models.doctorprofile.hasMany(models.contactinformation, {
			foreignKey: 'key',
			sourceKey: 'id'
		});

		models.hospital_doctors.findAll({
			attributes: ["id", "doctorProfileId", "hospitalId", "consultation_charge", "appointment_duration", "available_on_req"],
			include: [
				{
					model: models.doctorprofile, attributes: ["id", "salutation"],
					include: [
						{
							model: models.doctorprofiledetail,
							attributes: ["name"],
							where: language.buildLanguageQuery(
								{}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'
							),
							required: false
						}, {
							model: models.contactinformation,
							where: { model: 'doctorprofile', is_primary: 1 },
							required: false,
							attributes: ["type", "value"]
						}
					]
				}, {
					model: models.hospital_doctor_timings,
					required: false,
					attributes: [
						"days", "id", "shift_1_from_time", "shift_1_to_time", "shift_2_from_time", "shift_2_to_time", "shift_1_from_key", "shift_1_to_key", "shift_2_from_key", "shift_2_to_key",
						[models.sequelize.fn('DATE_FORMAT', models.sequelize.fn('SEC_TO_TIME', models.sequelize.col('`hospital_doctor_timings.shift_1_from_time`')), "%h:%i %p"), 'shift_1_from_time_hr'],
						[models.sequelize.fn('DATE_FORMAT', models.sequelize.fn('SEC_TO_TIME', models.sequelize.col('`hospital_doctor_timings.shift_1_to_time`')), "%h:%i %p"), 'shift_1_to_time_hr'],
						[models.sequelize.fn('DATE_FORMAT', models.sequelize.fn('SEC_TO_TIME', models.sequelize.col('`hospital_doctor_timings.shift_2_from_time`')), "%h:%i %p"), 'shift_2_from_time_hr'],
						[models.sequelize.fn('DATE_FORMAT', models.sequelize.fn('SEC_TO_TIME', models.sequelize.col('`hospital_doctor_timings.shift_2_to_time`')), "%h:%i %p"), 'shift_2_to_time_hr'],
					]
				}
			],
			where: {hospitalId: req.hospitalId},
			order: [['id', 'DESC']]
		}).then(function(hosDoctors) {
			res({status: true, data: hosDoctors})
		}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	}

	this.filterDoctorForHospital = function(req, res) {
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

		isWhere = {};
		isWhere.doctorprofile = {is_active: 1};

		isWhere.contactinformation = {is_primary: 1, model: 'doctorprofile'};
		isWhere.doctortags = {tagtypeId: utils.getAllTagTypeId()['SpecializationTagId']};
		if(reqData.search_by === 'id') {
			isWhere.doctorprofile.id = reqData.doctorProfileId;
		} else {
			isWhere.doctorprofiledetail = {
				name: {
					'$like': '%' + reqData.name + '%'
				}
			}
			if(reqData.selected_city) isWhere.doctorprofile.cityId = reqData.selected_city;
			if(reqData.selected_specialization) isWhere.doctortags.tagId = reqData.selected_specialization;

			if(reqData.email || reqData.mobile) {
				isWhere.contactinformation.value = {'$in': [reqData.email, reqData.mobile].filter(e => e)}
			}
			
			if(reqData.selected_city) isWhere.doctorprofile.cityId = reqData.selected_city;
			if(reqData.selected_specialization) isWhere.doctortags.tagId = reqData.selected_specialization;
		}

		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.doctorprofile.hasMany(models.doctortags);
		models.doctortags.hasMany(models.tagdetail, {foreignKey: 'tagId', sourceKey: 'tagId'});
		models.doctorprofile.hasMany(models.citydetail, {foreignKey: 'cityId', sourceKey: 'cityId'});
		models.doctorprofile.hasMany(models.statedetail, {foreignKey: 'stateId', sourceKey: 'stateId'});
		models.doctorprofile.hasMany(models.countrydetail, {foreignKey: 'countryId', sourceKey: 'countryId'});
		models.doctorprofile.hasMany(models.contactinformation, { foreignKey: 'key', sourceKey: 'id' });

		models.hospital_doctors.findAll({
			attributes: [[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('doctorProfileId')), 'doc_ids']], 
			where: {hospitalId: reqData.hospitalId}, raw: true
		}).then(function(mappedDocs) {
			if(mappedDocs[0].doc_ids != null) {
				if(reqData.search_by === 'id') {
					isWhere.doctorprofile = {
						is_active: 1,
						id: {'$notIn': mappedDocs[0].doc_ids.split(","), '$in': reqData.doctorProfileId.split(",")}
					}
				} else {
					isWhere.doctorprofile.id = {'$notIn': mappedDocs[0].doc_ids.split(",")};
				}
			}

			models.doctorprofile.findAndCountAll({
				attributes: ['id', 'gender', 'salutation', 'doctor_profile_pic', 'cityId', 'stateId', 'countryId'],
				include: [
					{ 
						model: models.doctorprofiledetail, attributes: ["name", "address_line_1"],
						where: language.buildLanguageQuery(
							isWhere.doctorprofiledetail, reqData.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'
						)
					}, {
						model: models.doctortags, attributes: ['tagId', 'tagtypeId'], required: false,
						where: isWhere.doctortags,
						include: [
							{
								model: models.tagdetail, attributes: ["title"],
								where: language.buildLanguageQuery({}, reqData.langId, '`doctortags`.`tagId`', models.tagdetail, 'tagId')
							}
						]
					}, {
						model: models.contactinformation, where: isWhere.contactinformation, /*required: false,*/ attributes: ["value", "type"]
					}, {
						model: models.citydetail, where: language.buildLanguageQuery({}, reqData.langId, '`doctorprofile`.`cityId`', models.citydetail, 'cityId'), attributes: ['name']
					}, {
						model: models.statedetail, where: language.buildLanguageQuery({}, reqData.langId, '`doctorprofile`.`stateId`', models.statedetail, 'stateId'), attributes: ['name']
					}, {
						model: models.countrydetail, where: language.buildLanguageQuery({}, reqData.langId, '`doctorprofile`.`countryId`', models.countrydetail, 'countryId'), attributes: ['name']
					}
				],
				where: isWhere.doctorprofile,
				order: [['id', 'DESC']],
				distinct: true,
				limit: setPage,
				offset: pag
			}).then(function(doctors) {
				var totalData = doctors.count;
				var pageCount = Math.ceil(totalData / setPage);
				res({
					status: true,
					data: doctors.rows,
					totalData: totalData,
					pageCount: pageCount,
					pageLimit: setPage,
					currentPage: currentPage
				})
			}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
		}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	}

	this.unmapDoctor = function(req, res) {
		models.hospital_doctors.find({
			where: {id: req.hospitalDoctorId}, raw: true
		}).then(function(hosDocData) {
			if(hosDocData !== null) {
				models.hospital_doctors.destroy({where: {id: req.hospitalDoctorId}}).then(function(deleted) {
					if(hosDocData.available_on_req === 0) {
						models.hospital_doctor_timings.destroy({where: {hospitalDoctorId: req.hospitalDoctorId}});
					}

					let queryToExec = 'select count(id) as mapCount from hospital_doctors where doctorProfileId = ?';
					models.sequelize.query(queryToExec, {
						replacements: [req.doctorprofileId],
						type: models.sequelize.QueryTypes.SELECT
					}).then(function(totalMappedHosofDoc) {
						if(totalMappedHosofDoc[0].mapCount === 0) {
							var json_data_for_doctor_delete = {
								key: req.doctorprofileId.toString(),
								langId:req.langId.toString(),
								type:'doctor'
							}
                        	mongo.save(json_data_for_doctor_delete, type = 'delete', function(mongodata) {})
						}
						res({ status: true, message: language.lang({key: "Unmapped successfully.", lang: req.lang}) });
					}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
				}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			} else {
				res({ status: false, message: language.lang({key: "Invalid Detail.", lang: req.languageId}) });
			}
		}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	}

	this.validateBasicDetails = function(req, res) {
		let contact_infos = JSON.parse(req.contact_informations)
		let contact_emails = contact_infos.emails,
			contact_mobiles = contact_infos.mobiles;
		req.contact_informations = contact_infos.emails.concat(contact_infos.mobiles)

		req.latitude = typeof req.latitude === undefined ? null : req.latitude;
		req.longitude = typeof req.longitude === undefined ? null : req.longitude;

		var hospitalHasOne = models.hospital.hasOne(models.hospitaldetail, {
			as: 'hospital_detail'
		});

		var hospital = models.hospital.build(req);

		req.hospital_detail.languageId = req.languageId;
		var hospitaldetail = models.hospitaldetail.build(req.hospital_detail);
		var errors = [];

		async.parallel([
			function(callback) {
				hospital.validate().then(function(err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
			function(callback) {
				hospitaldetail.validate().then(function(err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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

					}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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

					}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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
				res({status: true});
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

	this.validateDoctTimingInDummyHos = function(req, res) {
		let docTimingsData = JSON.parse(req.doc_timings);
		
		if(!docTimingsData.available_on_req && docTimingsData.timers.length == 0) {
			res({status: false, message: language.lang({key: "Please select at least one day", lang: req.lang})})
			return;
		}

		var docTimingDays = []
		docTimingsData.timers.forEach(function(item) {
			docTimingDays.push(item.days)
		})

		let allShifts = [
			'shift_1_from_time',
			'shift_1_to_time',
			'shift_2_from_time',
			'shift_2_to_time',
			'shift_1_from_key',
			'shift_1_to_key',
			'shift_2_from_key',
			'shift_2_to_key',
		];
		let newTimeObj = [];
		docTimingsData.timers.forEach(function(item) {
			let timeObj = Object.assign({}, item);
			allShifts.forEach(key => {
				timeObj[key] = timeObj[key] === '' ? null : timeObj[key];
			});
			newTimeObj.push(timeObj);
		});


		docTimingsData.timers = newTimeObj;

		models.hospital_doctors.hasMany(models.hospital_doctor_timings, {foreignKey: 'hospitalDoctorId', sourceKey: 'id'})
		Promise.all([
			models.hospital_doctors.findAll({
				include: [
					{
						model: models.hospital_doctor_timings, 
						where: {days: {$in: docTimingDays}}
					}
				],
				where: {doctorProfileId: docTimingsData.doctorProfileId, available_on_req: 0}
			})
		]).then(([docTimingsInOtherHospitals]) => {
			let saveStatus = false;

			if(docTimingsData.available_on_req) {
				saveStatus = true;
			} else {
				if(docTimingsInOtherHospitals.length === 0) {
					saveStatus = true;
				} else {
					module.exports.checkClashesWithDoctorOwnTimingsInOtherHospitals({doctorTimings: docTimingsData.timers, doctorOwnTimingsInOtherHospitals: docTimingsInOtherHospitals, lang: req.lang, langId: req.langId, languageId: req.languageId}, function(respo) {
						if(respo.isClash) res(respo)
						if(!respo.isClash) {
							saveStatus = true;
						}
					});
				}
			}

			if(saveStatus) {
				let contact_infos = JSON.parse(req.contact_informations)
				let contact_emails = contact_infos.emails,
				contact_mobiles = contact_infos.mobiles;
				req.contact_informations = contact_infos.emails.concat(contact_infos.mobiles)

				req.latitude = typeof req.latitude === undefined ? '' : req.latitude;
				req.longitude = typeof req.longitude === undefined ? '' : req.longitude;
				req.shift_24X7 = 1;
				req.is_freeze = 1;
				req.is_dummy = 1;
				req.is_active = 1;
				req.doctorProfileId = docTimingsData.doctorProfileId;


				let hospitalHasOne = models.hospital.hasOne(models.hospitaldetail, {as: 'hospital_detail'});

				req.hospital_detail.languageId = req.languageId;
				var errors = [];

				models.hospital.create(req, {
					include: [hospitalHasOne],
					individualHooks: true
				}).then(function(hospitalData) {

					let contactsInfoData = [];
					async.forEachOf(req.contact_informations, function(civalues, cikey, CICallback) {
						let setCIData = civalues;
						setCIData.key = hospitalData.id;
						contactsInfoData.push(setCIData)
						CICallback()
					}, function(err) {
						if (err) {
							res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})
						} else {
							models.contactinformation.bulkCreate(contactsInfoData).then(function(CIStatus) {
								if (req.langId == 1) {
									docTimingsData.hospitalId = hospitalData.id;
									module.exports.saveHospitalDoctorTimings(docTimingsData, function(resp) { 
										res(resp);
									})
								} else {
									req.hospital_detail.hospitalId = hospitalData.id;
									req.hospital_detail.languageId = 1;
									models.hospitaldetail.create(req.hospital_detail).then(function() {
										docTimingsData.hospitalId = hospitalData.id;
										module.exports.saveHospitalDoctorTimings(docTimingsData, function(resp) { 
											res(resp);
										})
									}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
								}
							}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
						}
					});
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			}
		})
	}

	this.removedoc = function(req, res) {
		if(!req.hospitalId && !req.id) {
			res({status: false, message: language.lang({key: "invalidRequest", lang: req.lang})})
		} else {
			models.hospitalfile.findOne({attributes: ["id", "file_type", "document_type"], where: {id: req.id, hospitalId: req.hospitalId}, raw: true}).then(function(docfile) {
				if(docfile === null) {
					res({status: false, message: language.lang({key: "File not found.", lang: req.lang})})
				} else {
					models.hospitalfile.destroy({where: {id: docfile.id}}).then((delSt) => {
						if(typeof req.is_admin !== 'undefined' && req.is_admin && docfile.file_type === "image" && docfile.document_type !== "public_photos") {
							utils.updateProfileStatusWhileUpdate({id: req.hospitalId, langId: req.langId, lang: req.lang}, ress => {});
						}

						if(delSt) {
							res({status: true, message: language.lang({key: "Removed successfully.", lang: req.lang})});
						} else {
							res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})
						}
					}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}))
				}
			})
		}
	}
}

function reOrderDays(daysArray, lang = 'ar') {
	if(typeof daysArray === 'undefined' || daysArray.length === 0) return [];

	const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

	const fullDayName = {
		sun: language.lang({key: 'Sunday', lang: lang}),
		mon: language.lang({key: 'Monday', lang: lang}),
		tue: language.lang({key: 'Tuesday', lang: lang}),
		wed: language.lang({key: 'Wednesday', lang: lang}),
		thu: language.lang({key: 'Thursday', lang: lang}),
		fri: language.lang({key: 'Friday', lang: lang}),
		sat: language.lang({key: 'Saturday', lang: lang})
	}

	let orderedDays = [];
	daysArray.sort(function (a, b) {
    	return days.indexOf(a) > days.indexOf(b);
	}).forEach(function(dayKey) {
		orderedDays.push(fullDayName[dayKey])
	});

	return orderedDays;

}

module.exports = new Hospital();