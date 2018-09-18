'use strict';

const models = require('../models'),
language = require('./language'),
utils = require('./utils'),
mail = require('./mail'),
braintree = require('braintree'),
config = require('../config/config')[process.env.NODE_ENV || 'development'],
moment = require('moment');


let gateway = braintree.connect({
	accessToken: config.paypal ? config.paypal.accessToken:null
});

models.subscriber.belongsTo(models.user);
models.subscriber.belongsTo(models.subscriptionplan);
models.subscriptionplan.hasMany(models.subscriptionplandetail);

exports.list = req => {
	return Promise.all([
		models.subscriptionplan.findAll({
			include: [{
				model: models.subscriptionplandetail,
				attributes: ['features'],
				where: language.buildLanguageQuery(
					{}, req.langId, '`subscriptionplan`.`id`', models.subscriptionplandetail, 'subscriptionplanId'
				)
			}],
			where: {
				type: {$ne: 'trial'}
			}
		}),
		models.subscriptionplan.findOne({
			attributes: ['id'],
			include: [{
				model: models.subscriptionplandetail,
				attributes: ['features'],
				where: language.buildLanguageQuery(
					{}, req.langId, '`subscriptionplan`.`id`', models.subscriptionplandetail, 'subscriptionplanId'
				)
			}],
			where: {
				type: 'trial'
			}
		})
	]).then(([data, trial]) => ({
		status: true,
		data,
		trial: trial.subscriptionplandetails.length ? trial.subscriptionplandetails[0].features:0
	}))
};

exports.getById = req => {
	return models.subscriptionplan.findOne({
		include: [{
			model: models.subscriptionplandetail,
			attributes: ['features'],
			where: language.buildLanguageQuery(
				{}, req.langId, '`subscriptionplan`.`id`', models.subscriptionplandetail, 'subscriptionplanId'
			)
		}],
		where: {
			id: req.id
		}
	}).then(data => ({
		status: true,
		data
	}))
};

exports.save =  req => {

	return Promise.all([
		models.subscriptionplan.build(req).validate(),
		models.subscriptionplandetail.build({features: req.features || ''}).validate()
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
				language.errors(
					{errors, lang: req.lang}
					, errors => resolve({errors})
				);
			});
		}
		if (req.id) {
			return models.subscriptionplan.update(req, {
				where: {
					id: req.id
				}
			}).then(() => {
				return models.subscriptionplandetail.findOne({
					where:{
						languageId: req.langId,
						subscriptionplanId: req.id
					}
				}).then(result => {
					if(result){
						return models.subscriptionplandetail.update({
							features: req.features
						}, {
							where: {
								id: result.id
							}
						}).then(() => ({
							status: true,
							message: language.lang({key:"updatedSuccessfully", lang: req.lang})
						}));
					} else {
						return models.subscriptionplandetail.create({
							languageId: req.langId,
							subscriptionplanId: req.id,
							features: req.features
						}).then(() => ({
							status: true,
							message: language.lang({key:"updatedSuccessfully", lang: req.lang})
						}));
					}
				});
			});
		}
	}).catch(console.log);
};

exports.plans = req => {
	return Promise.all([
		models.subscriptionplan.findOne({
			attributes: ['id', 'title', 'monthly_amount', 'quaterly_amount', 'yearly_amount'],
			include: [{
				model: models.subscriptionplandetail,
				attributes: ['features'],
				where: language.buildLanguageQuery(
					{}, req.langId, '`subscriptionplan`.`id`', models.subscriptionplandetail, 'subscriptionplanId'
				)
			}],
			where:{
				type: 'doctor'
			}
		}),
		models.subscriptionplan.findOne({
			attributes: ['id', 'title', 'monthly_amount', 'quaterly_amount', 'yearly_amount'],
			include: [{
				model: models.subscriptionplandetail,
				attributes: ['features'],
				where: language.buildLanguageQuery(
					{}, req.langId, '`subscriptionplan`.`id`', models.subscriptionplandetail, 'subscriptionplanId'
				)
			}],
			where:{
				type: 'hospital'
			}
		}),
		models.subscriptionplan.findOne({
			attributes: ['id', 'title', 'monthly_amount', 'quaterly_amount', 'yearly_amount'],
			include: [{
				model: models.subscriptionplandetail,
				attributes: ['features'],
				where: language.buildLanguageQuery(
					{}, req.langId, '`subscriptionplan`.`id`', models.subscriptionplandetail, 'subscriptionplanId'
				)
			}],
			where:{
				type: 'doctor_clinic_both'
			}
		}),
		models.subscriptionplan.findOne({
			attributes: ['id'],
			include: [{
				model: models.subscriptionplandetail,
				attributes: ['features'],
				where: language.buildLanguageQuery(
					{}, req.langId, '`subscriptionplan`.`id`', models.subscriptionplandetail, 'subscriptionplanId'
				)
			}],
			where:{
				type: 'trial'
			}
		})
	]).then(([doctor, hospital, doctor_clinic_both, trial]) => {
		return {
			status: true,
			data:{
				doctor,
				hospital,
				doctor_clinic_both,
				trial: {
					features: (trial && trial.subscriptionplandetails.length) ? trial.subscriptionplandetails[0].features:0
				}
			}
		}
	});
};

exports.makePayment = req => {
	return new Promise((resolve, reject) => {
		Promise.all([
			models.subscriptionplan.findOne({
				where: {
					type: req.user_type
				}
			}),
			models.subscriber.findOne({
				where: {
					userId: req.userId,
				},
				order: [
					['id', 'DESC']
				]
			})
		]).then(([data, subscriber]) => {
			let amount = '',
				start_date = moment().format('YYYY-MM-DD'),
				end_date = moment().format('YYYY-MM-DD');
			if(subscriber) {
				if(moment(subscriber.end_date).isAfter(start_date)){
					start_date = moment(subscriber.end_date).format('YYYY-MM-DD');
				}
			}
			if(data){
				if(req.plan === 1){
					amount = data.monthly_amount;
					end_date = moment(start_date).add(30, 'days').format('YYYY-MM-DD');
				}
				if(req.plan === 2){
					amount = data.quaterly_amount;
					end_date = moment(start_date).add(90, 'days').format('YYYY-MM-DD');
				}
				if(req.plan === 3){
					amount = data.yearly_amount;
					end_date = moment(start_date).add(365, 'days').format('YYYY-MM-DD');
				}

				models.subscriber.create({
					userId: req.userId,
					subscriptionplanId: data.id,
					start_date,
					end_date,
					amount,
					payment_status: 'pending',
					type: req.plan
				}).then(subscriber_data => {

					let transactionRequest = {
						amount: amount,
						paymentMethodNonce: req.nonce
					};

					gateway.transaction.sale(transactionRequest, function (err, result) {
						if(err) {
							return resolve({
								status: false,
								message: 'Error'
							});
						} else {
							models.subscriber.update({
								transaction_id: result.success ? result.transaction.id:null,
								payment_status: result.success ? 'success':'failed'
							}, {
								where: {
									id: subscriber_data.id
								}
							}).then(() => {
								return resolve({
									status: result.success ? true:false,
									data: {
										transaction_id: result.success ? result.transaction.id:null,
										payment_status: result.success ? 'success':'failed'
									}
								});
							}).catch(() => {
								return resolve({
									status: false,
									message: 'Error'
								});
							});
						}
					});
				}).catch(() => {
					return resolve({
						status: false,
						message: 'Error'
					});
				});
			} else {
				return resolve({
					status: false,
					message: 'Error'
				});
			}
		});
	});
};

exports.updateTrial = req => {
	return models.subscriptionplan.findOne({
		where: {
			type: 'trial'
		}
	}).then(data => {
		return models.subscriptionplandetail.update({
			features: req.days
		}, {
			where: {
				subscriptionplanId: data.id
			}
		}).then(() => ({
			status:true, 
			message: language.lang({key:"updatedSuccessfully", lang: req.lang})
		}));
	});
};

exports.createTrialPlan = req => {
	if(req.userId) {
		return models.subscriptionplan.findOne({
			attributes: ['id'],
			include: [{
				model: models.subscriptionplandetail,
				attributes: ['features'],
				where: {
					languageId: 1
				}
			}],
			where: {
				type: 'trial'
			}
		}).then(data => {
			let trialData = {};
			if(data){				
				trialData.userId = req.userId;
				trialData.subscriptionplanId = data.id;
				trialData.start_date = moment().format('YYYY-MM-DD');
				trialData.end_date = moment().add(parseInt(data.subscriptionplandetails[0].features), 'days').format('YYYY-MM-DD');
				trialData.amount = '0';
				trialData.payment_status = 'success';
				trialData.type = 4;
				return models.subscriber.create(trialData);
			} else {
				return Promise.resolve();
			}
		});
	} else {
		return Promise.resolve();
	}
};

exports.subscribers = req => {
	var pageSize = req.app.locals.site.page, // number of items per page
	page = req.query.page || 1;

	var reqData = req.body.data ? JSON.parse(req.body.data) : req.body,
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
					where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
				} else {
					where[modalKey[0]] = {};
					where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
				}
			}
		});
	}

	where.userdetail = language.buildLanguageQuery(
		where.userdetail, reqData.langId, '`user`.`id`', models.userdetail, 'userId'
	);

	return models.subscriber.findAndCountAll({
		attributes: [
			'id',
			'userId',
			'start_date',
			'end_date',
			'amount',
			'transaction_id',
			'payment_status',
			'type'
		],
		include: [{
			model: models.user,
			attributes: [
				'id',
				'user_type',
				'email',
				'mobile',
				'roleId'
			],
			include:[{
				model: models.userdetail,
				attributes: ['fullname'],
				where: where.userdetail
			}],
			where: where.user
		}],
		distinct: true,
		where: where.job,
		order: [
			['id', 'DESC']
		],
		limit: pageSize,
		offset: (page - 1) * pageSize,
		subQuery: false
	})
	.then((result) => ({
		status: true,
		data: result.rows,
		totalData: result.count,
		pageCount: Math.ceil(result.count / pageSize),
		pageLimit: pageSize,
		currentPage: parseInt(page)
	}));
};

exports.updatePlan =  req => {

	return Promise.all([
		models.subscriber.build(req).validate()
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
				language.errors(
					{errors, lang: req.lang}
					, errors => resolve({errors})
				);
			});
		}
		return models.subscriber.update(req, {
			where: {
				id: req.id
			}
		}).then(() => ({
			status: true,
			message: language.lang({key:"updatedSuccessfully", lang: req.lang})
		}));
	}).catch(console.log);
};

exports.currentPlan = req => {
	return models.subscriber.findOne({
		include: [{
			model: models.subscriptionplan,
			attributes: ['id'],
			include: [{
				model: models.subscriptionplandetail,
				attributes: ['features'],
				where: language.buildLanguageQuery(
					{}, req.langId, '`subscriptionplan.id`', models.subscriptionplandetail, 'subscriptionplanId'
				)
			}],
		}],
		where: {
			userId: req.userId
		},
		order: [
			['id', 'DESC']
		]
	}).then(data => ({status: true, data}));
};

exports.subscriptionPlan = req => {
	return models.subscriptionplan.findOne({
		include: [{
			model: models.subscriptionplandetail,
			attributes: ['features'],
			where: language.buildLanguageQuery(
				{}, req.langId, '`subscriptionplan`.`id`', models.subscriptionplandetail, 'subscriptionplanId'
			)
		}],
		where: {
			type: req.user_type
		}
	}).then(data => ({status: true, data}));
};

exports.makePaymentRoleChange = req => {
	return new Promise((resolve, reject) => {
		Promise.all([
			models.subscriptionplan.findOne({
				where: {
					type: req.user_type
				}
			}),
			models.subscriber.findOne({
				where: {
					userId: req.userId,
				},
				order: [
					['id', 'DESC']
				]
			})
		]).then(([data, subscriber]) => {
			let amount = '',
				start_date = moment().format('YYYY-MM-DD'),
				end_date = moment().format('YYYY-MM-DD');
			if(subscriber) {
				if(moment(subscriber.end_date).isAfter(start_date)){
					start_date = moment(subscriber.end_date).format('YYYY-MM-DD');
				}
			}
			if(data){
				if(req.plan === 1){
					amount = data.monthly_amount;
					end_date = moment(start_date).add(30, 'days').format('YYYY-MM-DD');
				}
				if(req.plan === 2){
					amount = data.quaterly_amount;
					end_date = moment(start_date).add(90, 'days').format('YYYY-MM-DD');
				}
				if(req.plan === 3){
					amount = data.yearly_amount;
					end_date = moment(start_date).add(365, 'days').format('YYYY-MM-DD');
				}

				models.subscriber.create({
					userId: req.userId,
					subscriptionplanId: data.id,
					start_date,
					end_date,
					amount,
					payment_status: 'pending',
					type: req.plan
				}).then(subscriber_data => {

					let transactionRequest = {
						amount: amount,
						paymentMethodNonce: req.nonce
					};

					gateway.transaction.sale(transactionRequest, function (err, result) {
						if(err) {
							return resolve({
								status: false,
								message: 'Error'
							});
						} else {
							models.subscriber.update({
								transaction_id: result.success ? result.transaction.id:null,
								payment_status: result.success ? 'success':'failed'
							}, {
								where: {
									id: subscriber_data.id
								}
							}).then(() => {
								//update the role of the user from "doctor" to "doctor_clinic_both"
								models.user.update({user_type: "doctor_clinic_both", roleId: 4}, {where: {id: req.userId}}).then(() => {
									return resolve({
										status: result.success ? true:false,
										data: {
											transaction_id: result.success ? result.transaction.id:null,
											payment_status: result.success ? 'success':'failed'
										}
									});
								}).catch(() => {
									return resolve({
										status: false,
										message: 'Error'
									});
								});
							}).catch(() => {
								return resolve({
									status: false,
									message: 'Error'
								});
							});
						}
					});
				}).catch(() => {
					return resolve({
						status: false,
						message: 'Error'
					});
				});
			} else {
				return resolve({
					status: false,
					message: 'Error'
				});
			}
		});
	});
};

exports.sendSubscriptionNoti = req => {	
	let currDate = moment().format('YYYY-MM-DD');
	let currDatePlus1 = moment(currDate, 'YYYY-MM-DD').add(1, 'days').format('YYYY-MM-DD');
	let currDatePlus3 = moment(currDatePlus1, 'YYYY-MM-DD').add(2, 'days').format('YYYY-MM-DD');
	let currDatePlus7 = moment(currDatePlus3, 'YYYY-MM-DD').add(4, 'days').format('YYYY-MM-DD');
	console.log(currDate, currDatePlus1, currDatePlus3, currDatePlus7);
	
	// let queryy; 
	// queryy = 'SELECT * from ('
	// 	+'(SELECT group_concat(userId) as oneDaySub from `subscribers` where end_date = ?) as oneday,'
	// 	+'(SELECT group_concat(userId) as threeDaySub from `subscribers` where end_date = ?) as threeday,'
	// 	+'(SELECT group_concat(userId) as sevenDaySub from `subscribers` where end_date = ?) as sevenday'
	// +')';

	// console.log(queryy)
	// return models.sequelize.query(queryy, { 
	// 	replacements: [
	// 		currDate, 
	// 		currDatePlus3, 
	// 		currDatePlus7
	// 	],
	// 	type: models.sequelize.QueryTypes.SELECT
	// }).then(function(subscribers) {
	// 	return subscribers;


	// 	// async.forEach(Object.keys(req.query), function(item, callback) {
	// 	// 		if (req.query[item] !== '') {
	// 	// 			var modelKey = item.split('__');
	// 	// 			if (typeof responseData[modelKey[0]] == 'undefined') {
	// 	// 				var col = {};
	// 	// 				col[modelKey[1]] = {
	// 	// 					$like: '%' + req.query[item] + '%'
	// 	// 				};
	// 	// 				responseData[modelKey[0]] = col;
	// 	// 			} else {
	// 	// 				responseData[modelKey[0]][modelKey[1]] = {
	// 	// 					$like: '%' + req.query[item] + '%'
	// 	// 				};
	// 	// 			}
	// 	// 		}
	// 	// 		callback();
	// 	// 	}, function() {
	// 	// 		isWhere = responseData;
	// 	// 	});


	// })


	Promise.all([
		models.subscriber.findAll({
			attributes: ['id', 'userId', 'start_date', 'end_date', 'amount', 'transaction_id', 'payment_status', 'type'],
			distinct: true,
			where: {end_date: currDatePlus1},
			order: [
				['id', 'DESC']
			]
		}),
		models.subscriber.findAll({
			attributes: ['id', 'userId', 'start_date', 'end_date', 'amount', 'transaction_id', 'payment_status', 'type'],
			distinct: true,
			where: {end_date: currDatePlus3},
			order: [
				['id', 'DESC']
			]
		}),
		models.subscriber.findAll({
			attributes: ['id', 'userId', 'start_date', 'end_date', 'amount', 'transaction_id', 'payment_status', 'type'],
			distinct: true,
			where: {end_date: currDatePlus7},
			order: [
				['id', 'DESC']
			]
		})
	]).then(([res1, res2, res3]) => {
		let users = [];
		console.log("_________________________________________________________________________")
		console.log(res1)
		console.log(res2)
		console.log(res3)
		//if(res1 !== null) res1.split()
	})
}