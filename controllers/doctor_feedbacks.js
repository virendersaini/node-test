var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var country = require('./country');
var state = require('./state');
var city = require('./city');
var _ = require('lodash');
var utils = require('./utils');
var notification=require('./notification');
//var patienttag = require('./patienttag');


function DoctorFeedbacks() {

 /*
	 * Get list
	 */
	this.list = function (req, res) {
	  /*  console.log(req);
		var setPage = "undefined" === typeof req.body.limit ? req.app.locals.site.page : req.body.limit ;
		var currentPage = "undefined" === typeof req.body.pageNo ? 1 : req.body.pageNo;
		var pag = 1;
		if (typeof req.body.pageNo !== 'undefined') {
			currentPage = +req.body.pageNo;
			pag = (currentPage - 1)* setPage;
			delete req.body.pageNo;
		} else {
			pag = 0;
		}*/
		/*
		* for  filltering
		*/
	   /* var reqData = req.body;
		if(typeof req.body.data !== 'undefined'){
			reqData = JSON.parse(req.body.data);
		}*/
	   // var isWhere = {doctorProfileId:req.doctorProfileId};
	   // var orderBy = '';
	   /* if (req.query) {
			var responseData = {};
			responseData.doctorfeedbackdetail = {};
			async.forEach(Object.keys(req.query), function (item, callback) {
				if (req.query[item] !== ''){
					var modelKey = item.split('__');
					if(typeof responseData[modelKey[0]] =='undefined'){
						var col = {};
						col[modelKey[1]] = {$like: '%' + req.query[item] + '%'};
						responseData[modelKey[0]] = col;
					} else {
						responseData[modelKey[0]][modelKey[1]] = {$like: '%' + req.query[item] + '%'};
					}
				}
				callback();
			}, function () {
				isWhere = responseData;
			});
		}*/
		var isWhere={};
		//models.doctorfeedback.hasMany(models.doctorfeedbackdetail);
		models.doctorfeedback.belongsTo(models.patient);
		models.patient.belongsTo(models.user);
		models.user.hasMany(models.userdetail);
		//isWhere.doctorfeedbackdetail = language.buildLanguageQuery(isWhere.doctorfeedbackdetail, req.langId, '`doctorfeedback`.`id`', models.doctorfeedbackdetail, 'doctorFeedbackId');

		isWhere.userdetail = language.buildLanguageQuery(isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId');

		
		models.doctorfeedback.findAndCountAll({
			attributes:['id','rating','feedback','createdAt'],
			include: [
				//{model: models.doctorfeedbackdetail,  attributes:['id','feedback'],where:isWhere.doctorfeedbackdetail,required:false},
				{model: models.patient,  attributes:['id'],required:false,
				include:[
					{model: models.user,  attributes:['id'],required:false,
					include:[ 
						{model: models.userdetail,  attributes:['id','fullname'],where:isWhere.userdetail,required:false}
					]
				}
				]
			},
			],
			where:{doctorProfileId:req.doctorProfileId},
			order: [
				['createdAt', 'DESC']
			],
			distinct: true,
		   // limit: parseInt(setPage),
		   // offset: pag, //subQuery: false
		}).then(function(result){
			var totalData = result.count;
		   // var pageCount = Math.ceil(totalData / setPage);
			res({data:result.rows/*, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage*/ });
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};


	/*
	 * save
	 */
	this.save = function (req, res) {

	   
		if(req.hospitalId && req.hospitalId != '') delete req.appointmentId;

		var doctorfeedback = models.doctorfeedback.build(req);
	   
		var errors = [];
		// an example using an object instead of an array
		async.parallel([

			function (callback) {
				doctorfeedback.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			}
		], function (err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function (elem, pos) {
				return merged.indexOf(elem) == pos;
			});
			if (uniqueError.length === 0) {

				if (typeof req.userId !== 'undefined' && req.userId !== '') {
					models.patient.belongsTo(models.user)
					models.user.hasMany(models.userdetail)
					models.patient.findOne({
						include: [
							{
								model: models.user,
								include: [{
									model: models.userdetail,
									where: language.buildLanguageQuery({}, req.langId, '`user.id`', models.userdetail, 'userId')
								}]
							},
						],
						where: {userId: req.userId},
					}).then(function(userProfileData) {
						req.patientId = userProfileData.id;

						if(req.hospitalId && req.hospitalId != '') {
							models.doctorfeedback.create(req).then(function (patientData) {
								res({status: true, message: language.lang({key: "addedSuccessfully", lang: req.lang}), data: patientData});
							}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
						} else {
							models.doctorfeedback.findOne({where: {appointmentId: req.appointmentId, patientId: userProfileData.id}}).then(function(dfData) {
								if(dfData === null) {
									models.doctorfeedback.create(req).then(function (patientData) {

										//save and send feedback notification for doctor
										if(typeof req.doctorProfileId !== undefined && req.doctorProfileId != '') {
											models.doctorprofile.belongsTo(models.user);
											models.doctorprofile.find({
												include: [{ model: models.user }],
												where: {id: req.doctorProfileId},
											}).then(function(doctData) {
												notification.send([{
													id: doctData.user.id, 
													device_id: doctData.user.device_id,
													is_notification: doctData.user.is_notification
												}],
												'front/notification/feedback/doctor_feedback',
												{
													lang:req.lang,
													patient_name: userProfileData.user.userdetails[0].fullname,
												}, {
													senderId: req.userId,
													meta: {feedbackId: patientData.id},
													data:{type:'doctor_feedback'}
												});
											})
										}
										//------------------------------------------- end

										res({status: true, message: language.lang({key: "addedSuccessfully", lang: req.lang}), data: patientData});
									}).catch(() => res({status: false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
								} else {
									res({status: false, message: language.lang({key: "You have already given feedback for this appointment.", lang: req.lang}), data: patientData});
								}
							})
						}
					})
				} else {
					language.errors({errors: uniqueError, lang: req.lang}, function (errors) {
						var newArr = {};
						newArr.errors = errors;
						res(newArr);
					});
				}
			} else {
				language.errors({errors: uniqueError, lang: req.lang}, function (errors) {
					var newArr = {};
					newArr.errors = errors;
					res(newArr);
				});
			}
		});
	};

	this.getDoctorFeedback = function(req, res) {
		var setPage = req.app.locals.site.page;
		var currentPage = 1;
		var pag = 1;
		if (typeof req.query.page !== 'undefined') {
			currentPage = +req.query.page;
			pag = (currentPage - 1)* setPage;
			delete req.query.page;
		} else {
			pag = 0;
		}

		var reqData = req.body;
		if(typeof req.body.data !== 'undefined'){
			reqData = JSON.parse(req.body.data);
		}

		var orderBy = 'id DESC';
		var isWhere = {doctorProfileId: reqData.doctorProfileId, is_approved: 1}

		if (req.query) {
			if("undefined" !== typeof req.query.date && req.query.date != '') {
				orderBy = 'createdAt '+req.query.date
			}
			if("undefined" !== typeof req.query.rating && req.query.rating != '') {
				isWhere['rating'] = req.query.rating
			}

		}

		models.doctorfeedback.belongsTo(models.patient, {foreignKey: 'patientId', targetKey: 'id'})
		models.patient.belongsTo(models.user, {foreignKey: 'userId', targetKey: 'id'})
		models.user.hasMany(models.userdetail)
		

		models.patient.hasMany(models.patientdetail, {foreignKey: 'patientId', targetKey: 'id'})
		models.doctorfeedback.findAndCountAll({
			attributes: ["id", "patientId", "feedback", "rating", "createdAt", "appointmentId"],
			include: [
				{
					model: models.patient, 
					attributes: ["userId"], 
					include: [
						{
							model: models.user, attributes: ["email", "user_image"],
							include: [
								{model: models.userdetail, attributes: ["fullname"], where: language.buildLanguageQuery({}, reqData.langId, '`patient.user`.`id`', models.userdetail, 'userId')}
							]
						}
					]
				}
			],
			where: isWhere,
			order: orderBy,
			distinct: true,
			limit: setPage,
			offset: pag
		}).then(function(result) {
			models.doctorfeedback.find({
				attributes: [[models.sequelize.fn('AVG', models.sequelize.col('rating')), 'average_rating']],
				where: {doctorProfileId: reqData.doctorProfileId},
				raw: true
			}).then(function(averageRating) {
				var totalData = result.count;
				var pageCount = Math.ceil(totalData / setPage);

				res({data:result.rows, average_rating: averageRating.average_rating, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
			})
		})
	}

	this.getHospitalFeedback = function(req, res) {
		var setPage = req.app.locals.site.page;
		var currentPage = 1;
		var pag = 1;
		if (typeof req.query.page !== 'undefined') {
			currentPage = +req.query.page;
			pag = (currentPage - 1)* setPage;
			delete req.query.page;
		} else {
			pag = 0;
		}

		var reqData = req.body;
		if(typeof req.body.data !== 'undefined'){
			reqData = JSON.parse(req.body.data);
		}

		var orderBy = 'id DESC';
		var isWhere = {hospitalId: reqData.hospitalId, is_approved: 1}

		if (req.query) {
			if("undefined" !== typeof req.query.date && req.query.date != '') {
				orderBy = 'createdAt '+req.query.date
			}
			if("undefined" !== typeof req.query.rating && req.query.rating != '') {
				isWhere['rating'] = req.query.rating
			}

		}

		models.doctorfeedback.belongsTo(models.patient, {foreignKey: 'patientId', targetKey: 'id'})

		models.patient.belongsTo(models.user, {foreignKey: 'userId', targetKey: 'id'})
		models.user.hasMany(models.userdetail)
		

		models.patient.hasMany(models.patientdetail, {foreignKey: 'patientId', targetKey: 'id'})
		models.doctorfeedback.findAndCountAll({
			attributes: ["id", "patientId", "feedback", "rating", "createdAt", "appointmentId"],
			include: [
				{
					model: models.patient, 
					attributes: ["userId"], 
					include: [
						{
							model: models.user, attributes: ["email", "user_image"],
							include: [
								{model: models.userdetail, attributes: ["fullname"], where: language.buildLanguageQuery({}, reqData.langId, '`patient.user`.`id`', models.userdetail, 'userId')}
							]
						}
					]
				}
			],
			where: isWhere,
			order: orderBy,
			distinct: true,
			limit: setPage,
			offset: pag
		}).then(function(result) {
			models.doctorfeedback.find({
				attributes: [[models.sequelize.fn('AVG', models.sequelize.col('rating')), 'average_rating']],
				where: {hospitalId: reqData.hospitalId},
				raw: true
			}).then(function(averageRating) {
				var totalData = result.count;
				var pageCount = Math.ceil(totalData / setPage);

				res({data:result.rows, average_rating: averageRating.average_rating, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
			})
		})
	}


	this.getAll = function(req, res) {
		var setPage = req.app.locals.site.page;
		var currentPage = 1;
		var pag = 1;
		if (typeof req.query.page !== 'undefined') {
			currentPage = +req.query.page;
			pag = (currentPage - 1)* setPage;
			delete req.query.page;
		} else {
			pag = 0;
		}
		/*
		* for  filltering
		*/
		var reqData = req.body;
		if(typeof req.body.data !== 'undefined'){
			reqData = JSON.parse(req.body.data);
		}
		var isWhere = {};
		var orderBy = '';

		if (req.query) {
			Object.keys(req.query).forEach(key => {
				if (req.query[key] === '') return;
				var modalKey = key.split('__');
				if (modalKey.length === 3) {
					if (modalKey[0] in isWhere) {
						isWhere[modalKey[0]][modalKey[1]] = req.query[key];
					} else {
						isWhere[modalKey[0]] = {};
						isWhere[modalKey[0]][modalKey[1]] = req.query[key];
					}
				} else {
					let cond = {'$like': '%' + req.query[key] + '%'};
					if(['rating', 'is_approved', 'type', 'profileId'].indexOf(modalKey[1]) !== -1) {
						cond = req.query[key]
					}
					if (modalKey[0] in isWhere) {
						isWhere[modalKey[0]][modalKey[1]] = cond;
					} else {
						isWhere[modalKey[0]] = {};
						isWhere[modalKey[0]][modalKey[1]] = cond;
					}
				}
			});
		}

		if(isWhere.doctorfeedback) {
			if(isWhere.doctorfeedback.type) {
				isWhere.doctorfeedback
			}
		}


		if(isWhere.doctorfeedback && (isWhere.doctorfeedback.type || isWhere.doctorfeedback.profileId)) {
			if(isWhere.doctorfeedback.type) {
				if(isWhere.doctorfeedback.type === 'doctor') {
					if('doctorfeedback' in isWhere) {
						isWhere['doctorfeedback']['doctorProfileId'] = isWhere.doctorfeedback.profileId ? isWhere.doctorfeedback.profileId : {'$ne': null}
						isWhere['doctorfeedback']['hospitalId'] = null;
					} else {
						isWhere['doctorfeedback'] = {doctorProfileId: isWhere.doctorfeedback.profileId ? isWhere.doctorfeedback.profileId : {'$ne': null}, hospitalId: null}	
					}
					
				} else if(isWhere.doctorfeedback.type === 'hospital') {
					if('doctorfeedback' in isWhere) {
						isWhere['doctorfeedback']['hospitalId'] = isWhere.doctorfeedback.profileId ? isWhere.doctorfeedback.profileId : {'$ne': null}
						isWhere['doctorfeedback']['doctorProfileId'] = null;
					} else {
						isWhere['doctorfeedback'] = {hospitalId: isWhere.doctorfeedback.profileId ? isWhere.doctorfeedback.profileId : {'$ne': null}, doctorProfileId: null}
					}
				}
				delete isWhere.doctorfeedback.type;
			}
			if(isWhere.doctorfeedback.profileId && !isWhere.doctorfeedback.type) {
				if('doctorfeedback' in isWhere) {
					isWhere['doctorfeedback']['$or'] = [{hospitalId: parseInt(isWhere.doctorfeedback.profileId)}, {doctorProfileId: parseInt(isWhere.doctorfeedback.profileId)}]
				} else {
					isWhere['doctorfeedback'] = {'$or': [{hospitalId: parseInt(isWhere.doctorfeedback.profileId)}, {doctorProfileId: parseInt(isWhere.doctorfeedback.profileId)}]}
				}
			}

			if(isWhere.doctorfeedback.profileId) delete isWhere.doctorfeedback.profileId;
		}

		console.log(isWhere)

		orderBy = 'id DESC';

		models.doctorfeedback.belongsTo(models.patient, {foreignKey: 'patientId', targetKey: 'id'})

		models.doctorfeedback.belongsTo(models.doctorprofile, {foreignKey: 'doctorProfileId', targetKey: 'id'})
		models.doctorprofile.hasMany(models.doctorprofiledetail);

		models.doctorfeedback.belongsTo(models.hospital, {foreignKey: 'hospitalId', targetKey: 'id'})
		models.hospital.hasMany(models.hospitaldetail);
		
		models.patient.belongsTo(models.user, {foreignKey: 'userId', targetKey: 'id'})
		models.user.hasMany(models.userdetail)

		models.doctorfeedback.findAndCountAll({
			include: [
				{
					model: models.patient, 
					attributes: ["userId"], 
					include: [
						{
							model: models.user, attributes: ["email", "user_image"],
							include: [
								{model: models.userdetail, attributes: ["fullname"], where: language.buildLanguageQuery({}, reqData.langId, '`patient.user`.`id`', models.userdetail, 'userId')}
							]
						}
					]
				}, {
					attributes: ["id", "salutation"],
					model: models.doctorprofile,
					include: [
						{
							attributes: ["name"],
							model: models.doctorprofiledetail,
							where: language.buildLanguageQuery(isWhere.doctorprofiledetail, reqData.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'),
							required: false
						}
					],
					required: false
				}, {
					attributes: ["id"],
					model: models.hospital,
					include: [
						{
							attributes: ["hospital_name"],
							model: models.hospitaldetail,
							where: language.buildLanguageQuery(isWhere.hospitaldetail, reqData.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'),
							required: false
						}
					],
					required: false
				}
			],
			where: isWhere.doctorfeedback,
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag, 
			//subQuery: false
		}).then(function(result){
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);
			res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
		})//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	}

	this.changeApprovalStatus = function(req, res) {
		let approvalStatus;
		req.actionType === 'approve' && (approvalStatus = 1);
		req.actionType === 'reject' && (approvalStatus = 2)
		if(typeof approvalStatus === undefined) {
			res({status: false, message:language.lang({key:"invalidActionType", lang:req.lang})})
		} else {
			models.doctorfeedback.update(
				{is_approved: approvalStatus}, 
				{ where: {id: req.id} }
			).then(function(response) {
				res({status:true, message: language.lang({key: "updatedSuccessfully", lang:req.lang})});
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
		}
	}

	this.getDoctorFeedbackForApp = function(req, res) {
		var setPage = "undefined" === typeof req.body.limit ? req.app.locals.site.page : req.body.limit ;
		var currentPage = "undefined" === typeof req.body.pageNo ? 1 : req.body.pageNo;
		var pag = 1;
		if (typeof req.body.pageNo !== 'undefined') {
			currentPage = +req.body.pageNo;
			pag = (currentPage - 1)* setPage;
			delete req.body.pageNo;
		} else {
			pag = 0;
		}

		var reqData = req.body;
		if(typeof req.body.data !== 'undefined'){
			reqData = JSON.parse(req.body.data);
		}

		var orderBy = 'id DESC';
		var isWhere = {
			[reqData.doctorProfileId === undefined ? 'hospitalId' : 'doctorProfileId']: reqData.doctorProfileId === undefined ? reqData.hospitalId : reqData.doctorProfileId,
			is_approved: 1
		}
		if(typeof reqData.type != "undefined" && reqData.type === "all") delete isWhere.is_approved;
			
		if (req.query) {
			if("undefined" !== typeof req.query.date && req.query.date != '') {
				orderBy = 'createdAt '+req.query.date
			}
			if("undefined" !== typeof req.query.rating && req.query.rating != '') {
				isWhere['rating'] = req.query.rating
			}

		}

		models.doctorfeedback.belongsTo(models.patient, {foreignKey: 'patientId', targetKey: 'id'})
		models.patient.belongsTo(models.user, {foreignKey: 'userId', targetKey: 'id'})
		models.user.hasMany(models.userdetail)
		

		models.patient.hasMany(models.patientdetail, {foreignKey: 'patientId', targetKey: 'id'})
		models.doctorfeedback.findAndCountAll({
			attributes: ["id", "patientId", "feedback", "rating", "createdAt", "appointmentId"],
			include: [
				{
					model: models.patient, 
					attributes: ["userId"], 
					include: [
						{
							model: models.user, attributes: ["email", "user_image", "mobile"],
							include: [
								{model: models.userdetail, attributes: ["fullname"], where: language.buildLanguageQuery({}, reqData.langId, '`patient.user`.`id`', models.userdetail, 'userId')}
							]
						}
					]
				}
			],
			where: isWhere,
			order: orderBy,
			distinct: true,
			limit: parseInt(setPage),
			offset: pag
		}).then(function(result) {
			models.doctorfeedback.find({
				attributes: [[models.sequelize.fn('AVG', models.sequelize.col('rating')), 'average_rating']],
				where: {
					[reqData.doctorProfileId === undefined ? 'hospitalId' : 'doctorProfileId']: reqData.doctorProfileId === undefined ? reqData.hospitalId : reqData.doctorProfileId},
				raw: true
			}).then(function(averageRating) {
				var totalData = result.count;
				var pageCount = Math.ceil(totalData / setPage);

				res({
					status: true,
					message: language.lang({key: "Feedback list", lang: req.lang}),
					data:result.rows, 
					average_rating: averageRating.average_rating, 
					pageNo: currentPage, limit: setPage
				});
			})
		})
	}

	this.getDohFeedback = function(req, res) {
		var setPage = req.app.locals.site.page;
		var currentPage = 1;
		var pag = req.body.page === undefined ? 1 : parseInt(req.body.page);
		if (typeof req.body.page !== 'undefined') {
			currentPage = +req.body.page;
			pag = (currentPage - 1)* setPage;
			delete req.body.page;
		} else {
			pag = 0;
		}

		var reqData = req.body;
		if(typeof req.body.data !== 'undefined'){
			reqData = JSON.parse(req.body.data);
		}
		var orderBy = 'id DESC';
		var isWhere;
		if(reqData.where === undefined)
			isWhere = {doctorProfileId: reqData.doctorProfileId};
		else
			isWhere = reqData.where;

		isWhere.is_approved = 1;

		if (reqData.filterObj !== undefined && Object.keys(reqData.filterObj).length) {
			if("undefined" !== typeof reqData.filterObj.date && reqData.filterObj.date != '') {
				orderBy = 'createdAt '+reqData.filterObj.date
			}
			if("undefined" !== typeof reqData.filterObj.rating && reqData.filterObj.rating != '') {
				isWhere['rating'] = reqData.filterObj.rating
			}

		}

		models.doctorfeedback.belongsTo(models.patient, {foreignKey: 'patientId', targetKey: 'id'})
		models.patient.belongsTo(models.user, {foreignKey: 'userId', targetKey: 'id'})
		models.user.hasMany(models.userdetail)
		

		models.patient.hasMany(models.patientdetail, {foreignKey: 'patientId', targetKey: 'id'})
		models.doctorfeedback.findAndCountAll({
			attributes: ["id", "patientId", "feedback", "rating", "createdAt", "appointmentId"],
			include: [
				{
					model: models.patient, 
					attributes: ["userId"], 
					include: [
						{
							model: models.user, attributes: ["email", "user_image"],
							include: [
								{model: models.userdetail, attributes: ["fullname"], where: language.buildLanguageQuery({}, reqData.langId, '`patient.user`.`id`', models.userdetail, 'userId')}
							]
						}
					]
				}
			],
			where: isWhere,
			order: orderBy,
			distinct: true,
			limit: setPage,
			offset: pag
		}).then(function(result) {
			models.doctorfeedback.find({
				attributes: [[models.sequelize.fn('AVG', models.sequelize.col('rating')), 'average_rating']],
				where: isWhere,
				raw: true
			}).then(function(averageRating) {
				var totalData = result.count;
				var pageCount = Math.ceil(totalData / setPage);

				res({data:result.rows, average_rating: averageRating.average_rating, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
			})
		})
	}
}
module.exports = new DoctorFeedbacks();
