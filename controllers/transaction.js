'use strict';

const models = require('../models'),
language = require('./language'),
commission = require('./commission'),
utils = require('./utils'),
mail = require('./mail'),
moment = require('moment'),
braintree = require('braintree'),
ejs = require('ejs'),
fs = require('fs'),
config = require('../config/config')[process.env.NODE_ENV || 'development'],
pdf = require('html-pdf'),
notification = require('./notification');

const invoiceTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/invoice.ejs', 'utf8')
);

let gateway = braintree.connect({
	accessToken: config.paypal ? config.paypal.accessToken:null
});

models.transaction.belongsTo(models.chatconsult);
models.chatconsult.belongsTo(models.doctorprofile);
models.doctorprofile.belongsTo(models.user);
models.user.hasMany(models.userdetail);
models.chatconsult.hasOne(models.transaction);
models.releaseamount.hasMany(models.releaseamountrecord);
models.releaseamount.belongsTo(models.doctorprofile);
models.releaseamountrecord.belongsTo(models.transaction);
models.doctorprofile.hasMany(models.doctorprofiledetail, {foreignKey: 'doctorProfileId', as: 'doctorprofiledetails'});
models.chatconsult.belongsTo(models.tag);
models.tag.hasMany(models.tagdetail);

models.chatconsult.belongsTo(models.patient);
models.patient.belongsTo(models.city);
models.patient.belongsTo(models.state);
models.patient.belongsTo(models.country);
models.city.hasMany(models.citydetail);
models.state.hasMany(models.statedetail);
models.country.hasMany(models.countrydetail);
models.patient.hasMany(models.patientdetail);
models.patient.belongsTo(models.user);

exports.listForDoctor = req => {
	const where = {};
	where.chatconsult = {doctorprofileId: req.doctorProfileId};
	where.transaction = {payment_status: 'success'};

	if(req.consultId) where.transaction.chatconsultId = req.consultId;
	if(req.patient_name) where.chatconsult.name = {'$like': '%' + req.patient_name + '%'};
	if(req.is_released && req.is_released !=='') where.transaction.is_released = req.is_released;

	return Promise.all([
		models.transaction.findAndCountAll({
			include: [{
				model: models.chatconsult,
				attributes: ['id', 'name', 'createdAt'],
				where: where.chatconsult
			}],
			attributes: ['id', 'amount', 'chatconsultId', 'is_released', 'ref_id', 'createdAt'],
			where: where.transaction,
			distinct: true,
			order: [
				['id', 'DESC']
			],
			limit: req.page === undefined ? undefined : req.pageSize,
			offset: req.page === undefined ? undefined : (req.page - 1) * req.pageSize,
		}),
		commission.getCommissionRate({doctorprofileId: req.doctorProfileId})
	]).then(([{count, rows: data}, commissionRate]) => {
		
		let totalAmountQuery = 'SELECT (SUM(`transactions`.`amount`) - ROUND ((SUM(`transactions`.`amount`) * ? / 100), 2)) as `totalAmount` FROM `transactions` '
			+'INNER JOIN `chat_consults` ON `chat_consults`.`id` = `transactions`.`chatconsultId` '
			+'WHERE `transactions`.`payment_status` = ? AND `transactions`.`is_released` = ? AND `chat_consults`.`doctorprofileId` = ?';
		
		return models.sequelize.query(totalAmountQuery, { replacements: [commissionRate, 'success', (req.is_released && req.is_released !== '' ? req.is_released : 0), req.doctorProfileId],
			type: models.sequelize.QueryTypes.SELECT
		}).then(function(totalAmount) {
			return {
				status: true,
				data,
				pageInfo: req.page === undefined ? undefined : {
					totalData: count,
					pageCount: Math.ceil(count / req.pageSize),
					pageLimit: req.pageSize,
					currentPage: req.page,
					commissionRate,
					totalAmount: totalAmount[0].totalAmount || 0.00 
				},
			}
		})
	});
};

exports.listForAdmin = req => {

	let pageSize = req.app.locals.site.page, // number of items per page
	page = req.query.page || 1,
	timestamp = moment(Date.now() - 691200000).startOf('day').format('YYYY-MM-DD hh:mm:ss');

	let reqData = req.body,
		where = {
			chatconsult: {
				consults: models.sequelize.literal(chatTransactionInfo('COUNT(`chat_consults`.`id`)', timestamp)+' > 0')
			}
		};

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
		where.userdetail, reqData.langId, '`doctorprofile.user`.`id`', models.userdetail, 'userId'
	);

	let commission = '(SELECT `percentage` FROM `doctor_specific_commissions`';
		commission += ' WHERE `doctorprofileId` = `chatconsult`.`doctorprofileId`';
		commission += ' AND `type` = "chat_consult")';

	return Promise.all([
		models.chatconsult.findAndCountAll({
			include: [{
				model: models.doctorprofile,
				attributes: ['id'],
				include: [{
					model: models.user,
					attributes: ['id'],
					include: [{
						model: models.userdetail,
						attributes: ['fullname'],
						where: where.userdetail
					}]
				}]
			}],
			attributes: [
				'id',
				[models.sequelize.literal(chatTransactionInfo('COUNT(`chat_consults`.`id`)', timestamp)), 'consults'],
				[models.sequelize.literal(chatTransactionInfo('SUM(`transactions`.`amount`)', timestamp)), 'amount'],
				[models.sequelize.literal(commission), 'commission']	
			],
			where: where.chatconsult,
			distinct: true,
			order: [
				['id', 'DESC']
			],
			group: ['doctorprofileId'],
			limit: pageSize,
			offset: (page - 1) * pageSize,
			subQuery: false,
		}),
		models.globalcommission.findOne({
			attributes: ['percentage'],
			where: {
				type: 'chat_consult',
			}
		})
	]).then(([result, globalcommission]) => ({
		status: true,
		data: result.rows,
		totalData: result.count.length,
		pageCount: Math.ceil(result.count.length / pageSize),
		pageLimit: pageSize,
		currentPage: parseInt(page),
		timestamp,
		globalcommission: globalcommission ? globalcommission.percentage:0
	}));
};

exports.listForAdminPaid = req => {

	let pageSize = req.app.locals.site.page, // number of items per page
	page = req.query.page || 1;

	let reqData = req.body,
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
		where.userdetail, reqData.langId, '`doctorprofile.user`.`id`', models.userdetail, 'userId'
	);

	return models.releaseamount.findAndCountAll({
		include: [{
			model: models.doctorprofile,
			attributes: ['id'],
			include: [{
				model: models.user,
				attributes: ['id'],
				include: [{
					model: models.userdetail,
					attributes: ['fullname'],
					where: where.userdetail
				}]
			}]
		}],
		attributes: [
			'id',
			'total_amount',
			'commision_amount',
			'release_amount',
			'reference_no',
			'createdAt'
		],
		where: where.chatconsult,
		distinct: true,
		order: [
			['id', 'DESC']
		],
		group: ['doctorprofileId'],
		limit: pageSize,
		offset: (page - 1) * pageSize,
		subQuery: false
	})
	.then((result) => ({
		status: true,
		data: result.rows,
		totalData: result.count.length,
		pageCount: Math.ceil(result.count.length / pageSize),
		pageLimit: pageSize,
		currentPage: parseInt(page)
	}));
};

exports.viewDetails = req => {
	return Promise.all([
		models.chatconsult.findAll({
			include: [{
				model: models.transaction,
				attributes: ['amount']
			}],
			where: {
				doctorprofileId: req.id,
				id: {$in: models.sequelize.literal(chatTransactionInfo('`chat_consults`.`id`', req.timestamp))}
			}
		}),
		models.doctorprofile.findOne({
			include: [{
				model: models.user,
				attributes: ['id'],
				include: [{
					model: models.userdetail,
					attributes: ['fullname'],
					where: language.buildLanguageQuery(
						{}, req.langId, '`user`.`id`', models.userdetail, 'userId'
					)
				}]
			}],
			attributes: ['id', 'salutation'],
			where: {
				id: req.id
			}
		}),
		commission.getCommissionRate({doctorprofileId: req.id})
	]).then(([result, doctor, commission]) => ({
		status: true,
		doctor,
		commission,
		data: result
	}));
};

exports.viewACDetails = req => {
	return models.onlineconsultsetting.findOne({
		attributes: [
			'account_holder_name',
			'account_number',
			'account_type',
			'bank_name',
			'bank_branch_city',
			'bank_ifsc_code',
			'iban_number'
		],
		where: {
			doctorprofileId: req.id
		}
	}).then(data => ({
		status: true,
		data
	}));
};

exports.releasePayment = req => {
	return Promise.all([
		models.chatconsult.findAll({
			include: [{
				model: models.transaction,
				attributes: ['id', 'amount']
			}],
			where: {
				doctorprofileId: req.doctorprofileId,
				id: {$in: models.sequelize.literal(chatTransactionInfo('`chat_consults`.`id`', req.timestamp))}
			}
		}),
		commission.getCommissionRate({doctorprofileId: req.doctorprofileId})
	]).then(([consults, commisionRate]) => {
		if(consults.length > 0){
			let tatalAmount = 0,
				transactionIds = [],
				tIds = [];

			consults.forEach(item => {
				tatalAmount = tatalAmount+item.transaction.amount;
				transactionIds.push({transactionId: item.transaction.id});
				tIds.push(item.transaction.id);
			});

			let commision_amount = ((tatalAmount*commisionRate)/100),
				release_amount = tatalAmount-commision_amount,
				releaseData = {
					doctorprofileId: req.doctorprofileId,
					total_amount: tatalAmount,
					commision_amount: commision_amount,
					release_amount: release_amount,
					reference_no: req.reference_no,
					commission_rate: commisionRate,
					releaseamountrecords: transactionIds

				};

			return Promise.all([
				models.releaseamount.create(
					releaseData,
					{
						include: [models.releaseamountrecord]
					}
				),
				models.transaction.update({
					is_released: 1,
					ref_id: req.reference_no
				}, {
					where: {
						id: {$in: tIds}
					}
				})
			])
			.then(() => ({status:true, message:language.lang({key: "Payment released successfully", lang: req.lang})}))
			.catch(() => ({status:false, message:language.lang({key: "Internal Error", lang: req.lang})}));
		} else {
			return {status: false, message: language.lang({key: "Chat Consult not found", lang: req.lang})}
		}
	})
};

exports.viewPaidDetail = req => {
	return models.releaseamount.findOne({
		include: [{
			model: models.releaseamountrecord,
			attributes: ['id'],
			include: [{
				model: models.transaction,
				attributes: ['id', 'amount'],
				include: [{
					model: models.chatconsult,
					attributes: ['id', 'name', 'createdAt']
				}]
			}]
		}, {
			model: models.doctorprofile,
			attributes: ['id'],
			include: [{
				model: models.user,
				attributes: ['id'],
				include: [{
					model: models.userdetail,
					attributes: ['fullname'],
					where: language.buildLanguageQuery(
						{}, req.langId, '`doctorprofile.user`.`id`', models.userdetail, 'userId'
					)
				}]
			}]
		}],
		attributes: [
			'id',
			'total_amount',
			'commision_amount',
			'release_amount',
			'reference_no',
			'commission_rate'
		],
		where: {
			id: req.id
		}
	}).then(data => ({
		status: true,
		data
	}));
};

function chatTransactionInfo(column, timestamp){
	let qry = '(SELECT '+column+' FROM `chat_consults`';
		qry += ' INNER JOIN `transactions` ON `transactions`.`chatconsultId` = `chat_consults`.`id`';
		qry += ' WHERE `transactions`.`payment_status` = "success"';
		qry += ' AND `chat_consults`.`createdAt` <= "'+timestamp+'"';
		qry += ' AND `chat_consults`.`doctorProfileId` = `chatconsult`.`doctorProfileId`';
		qry += ' AND `transactions`.`is_released` = 0)';
	return qry;
}

exports.clientToken = req => {
	return new Promise((resolve, reject) => {
		gateway.clientToken.generate({}, function (err, response) {
			if(err)
				return reject({
					status: false
				});
			else
				return resolve({
					status: true,
					data: {
						clientToken:response.clientToken
					}
				});
		});	
	});
}

exports.checkout_old = req => {
	return new Promise((resolve, reject) => {
		models.chatconsult.findOne({
			include: [{
				model: models.patient,
				attributes: ['id'],
				include: [{
					model:models.user,
					attributes: ['email']
				}]
			}, {
				model: models.doctorprofile,
				attributes: ['id'],
				include: [{
					model:models.user,
					attributes: ['email']
				}]
			}],
			where: {
				id: req.chatconsultId
			}
		}).then(data => {
			let transactionRequest = {
				amount: req.amount,
				paymentMethodNonce: req.nonce
			};

			gateway.transaction.sale(transactionRequest, function (err, result) {
				if(err) {
					return reject({
						status: false
					});
				} else {
					models.transaction.create({
						chatconsultId: req.chatconsultId,
						transaction_id: result.success ? result.transaction.id:null,
						amount: req.amount,
						meta: JSON.stringify(result),
						payment_status: result.success ? 'success':'failed'
					}).then(() => {
						if(result.success) {
							let email = [
								data.patient.user.email,
								data.doctorprofile.user.email
							];
							module.exports.mail({
								id: req.chatconsultId,
								currency: '$',
								email,
								lang: req.lang
							});
							return resolve({
								status: true,
								data: {
									transactionId: result.transaction.id,
								},
								chatconsultId: req.chatconsultId,
								message: language.lang({key: "Payment success", lang: req.lang})
							});
						} else {
							return resolve({
								status: false,
								message: result.message
							});
						}
					});
				}
			});	
		});
	});
};

exports.checkout = req => {
	let transactionRequest = {
		amount: req.amount,
		paymentMethodNonce: req.nonce
	};
	return new Promise((resolve, reject) => {
		gateway.transaction.sale(transactionRequest, function (err, result) {
			if(err) {
				return reject({
					status: false
				});
			} else {
				models.transaction.create({
					transaction_id: result.success ? result.transaction.id:null,
					amount: req.amount,
					meta: JSON.stringify(result),
					payment_status: result.success ? 'success':'failed'
				}).then(transaction => {
					if(result.success) {
						let ccdata = {
							langId: req.langId,
							tagId: req.tagId,
							title: req.title,
							description: req.description,
							image: req.image,
							doctorprofileId: req.doctorprofileId,
							patientId: req.patientId,
							age: req.age,
							gender: req.gender,
							contact: req.contact,
							name: req.name
						}

						models.chatconsult.create(ccdata)
						.then(chatconsult => chatconsult.reload())
						.then(chatconsult => {
							models.transaction.update({chatconsultId: chatconsult.id}, {where: {id: transaction.id}}).then(transc => {
								Promise.all([
									models.doctorprofile.find({
										include: [{
											model: models.user,
											attributes: ['id', 'email', 'device_id', 'is_notification'],
											include: [{
												model: models.userdetail,
												attributes: ['fullname'],
												where: language.buildLanguageQuery(
													{},
													req.langId,
													'`user`.`id`',
													models.userdetail,
													'userId'
												)
											}]
										}],
										where: {
											id: req.doctorprofileId
										}
									}),
									models.patient.findOne({
										include: [{
											model: models.user,
											attributes: ['id', 'email', 'mobile'],
											include: [{
												model: models.userdetail,
												attributes: ['fullname'],
												where: language.buildLanguageQuery(
													{},
													req.langId,
													'`user`.`id`',
													models.userdetail,
													'userId'
												)
											}]
										}],
										where: {
											id: req.patientId
										}
									})
								]).then(([ccresult, patient]) => {
									notification.send([{
										id:ccresult.user.id, 
										device_id:ccresult.user.device_id,
										is_notification:ccresult.user.is_notification
									}],
									'front/notification/chat/booked',
									{
										lang:req.lang,
										patient_name: patient.user.userdetails[0].fullname,
										mobile: patient.user.mobile,
										moment: moment
									}, {
										senderId: patient.user.id,
										meta: {},
										data:{type:'chat_consult_booked'}
									});

									let email = [
										patient.user.email,
										ccresult.user.email
									];
									module.exports.mail({
										id: chatconsult.id,
										currency: '$',
										email,
										lang: req.lang
									});
								})

								return resolve({
									status: true,
									data: {
										transactionId: result.transaction.id,
									},
									chatconsultId: chatconsult.id,
									message: language.lang({key: "Payment success", lang: req.lang})
								});
							})
						})
					} else {
						return resolve({
							status: false,
							message: result.message
						});
					}
				})
			}
		})
	})
};

exports.invoice = req => {
	return Promise.all([
		models.chatconsult.findOne({
			include: [{
				model: models.doctorprofile,
				attributes: ['id'],
				include:[{
					model: models.doctorprofiledetail,
					as: 'doctorprofiledetails',
					attributes: ['name', 'address_line_1'],
					where: language.buildLanguageQuery(
						{}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'
					)
				}]
			}, {
				model: models.tag,
				attributes: ['id'],
				include: [{
					model: models.tagdetail,
					attributes: ['title']
				}]
			}, {
				model: models.patient,
				attributes: ['id', 'zipcode'],
				include: [{
					model: models.city,
					attributes: ['id'],
					required: false,
					include: [{
						model: models.citydetail,
						attributes: ['name'],
						required: false,
						where: language.buildLanguageQuery(
							{}, req.langId, '`patient.city`.`id`', models.citydetail, 'cityId'
						)
					}]
				}, {
					model: models.state,
					required: false,
					attributes: ['id'],
					include: [{
						model: models.statedetail,
						attributes: ['name'],
						required: false,
						where: language.buildLanguageQuery(
							{}, req.langId, '`patient.state`.`id`', models.statedetail, 'stateId'
						)
					}]
				}, {
					model: models.country,
					required: false,
					attributes: ['id'],
					include: [{
						model: models.countrydetail,
						attributes: ['name'],
						required: false,
						where: language.buildLanguageQuery(
							{}, req.langId, '`patient.country`.`id`', models.countrydetail, 'countryId'
						)
					}]
				}, {
					model: models.patientdetail,
					attributes: ['address'],
					required: false,
					where: language.buildLanguageQuery(
						{}, req.langId, '`patient`.`id`', models.patientdetail, 'patientId'
					)
				}]
			}],
			attributes: [
				'id',
				'name',
				'title',
				[
					models.sequelize.literal('(SELECT `amount` FROM `transactions` WHERE `chatconsultId` = `chatconsult`.`id` AND'+
					' `payment_status` = "success")'),
					'amount'
				],
				[
					models.sequelize.literal('(SELECT `createdAt` FROM `transactions` WHERE `chatconsultId` = `chatconsult`.`id` AND'+
					' `payment_status` = "success")'),
					'createdAt'
				],
				[
					models.sequelize.literal('(SELECT `id` FROM `transactions` WHERE `chatconsultId` = `chatconsult`.`id` AND'+
					' `payment_status` = "success")'),
					'transactionId'
				]
			],
			where: {
				id: req.id
			}
		})
	]).then(([data]) => {
		if(data){
			data = JSON.parse(JSON.stringify(data));
			return {html: invoiceTemplate(language.bindLocale({data, currency: req.currency || '$', moment, lang: req.lang}, req.lang))}
		} else {
			return {html: 'Error'}
		}
	})
};

exports.mail = req => {
	module.exports.invoice(req).then(result => {
		pdf.create(result.html).toStream(function(err, stream){
			mail.sendInvoiceMail({
				from: 'noreply@wikicare.co',
				email: req.email,
				subject: 'Chat Consult Invoice',
				msg: 'Chat Consult Invoice',
				pdf: stream
			});
		});
	});
};