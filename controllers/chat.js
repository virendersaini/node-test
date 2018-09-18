const models = require('../models'),
	language = require('./language'),
	notification = require('./notification');

var moment=require('moment');

models.chatconsult.belongsTo(models.doctorprofile);
models.doctorprofile.hasMany(models.doctorprofiledetail, {
	as: 'doctorprofiledetails',
	foreignKey: 'doctorProfileId',
});
models.doctorprofile.hasMany(models.doctortags, {
	as: 'doctortags',
	foreignKey: 'doctorProfileId',
});
models.doctorprofile.hasMany(models.doctorexperience, {
	as: 'doctorexperiences',
	foreignKey: 'doctorProfileId',
});
models.doctorprofile.belongsTo(models.user);
models.doctorprofile.hasMany(models.doctoreducation, {
	as: 'doctoreducations'
});
models.doctoreducation.belongsTo(models.tag,{foreignKey:'tagtypeId'});
models.doctortags.belongsTo(models.tag);
models.tag.hasMany(models.tagdetail);
models.chatconsult.belongsTo(models.patient);
models.patient.belongsTo(models.user);
models.chatconsult.hasOne(models.chatconsultmessage, {
	as: 'chatconsultmessage',
});
models.chatconsult.hasMany(models.chatconsultmessage, {
	as: 'chatconsultmessages',
});
models.chatconsult.belongsTo(models.tag);
models.doctorprofile.hasOne(models.onlineconsultsetting);
models.tagtype.hasMany(models.tagtypedetail);
models.tagtype.hasMany(models.tag);
models.tag.hasMany(models.tagdetail);
models.chatconsult.hasOne(models.transaction);

const lastMessageQuery = models.sequelize.literal(
	'(SELECT MAX(`chat_consult_messages`.`id`) FROM `chat_consult_messages` '
	+ 'WHERE `chatconsultId`= `chatconsult`.`id`)'
);
const unreadMessageForPatientQuery = models.sequelize.literal(
	'(SELECT COUNT(*) FROM `chat_consult_messages` WHERE `status` < 3'
	+ ' AND `chat_consult_messages`.`chatconsultId` = `chatconsult`.`id`'
	+ ' AND sender = 0)'
);
const unreadMessageForDoctorQuery = models.sequelize.literal(
	'(SELECT COUNT(*) FROM `chat_consult_messages` WHERE `status` < 3'
	+ ' AND `chat_consult_messages`.`chatconsultId` = `chatconsult`.`id`'
	+ ' AND sender = 1)'
);
const experienceAttribute = models.sequelize.literal(
	'IFNULL((SELECT SUM(duration_to-duration_from) FROM doctor_experiences WHERE doctor_experiences.doctorProfileId = doctorprofile.id), 0)'
);
const paymentStatus = models.sequelize.literal(
	'(SELECT COUNT(*) FROM `transactions` WHERE `transactions`.`payment_status` = "success"'
	+ ' AND `transactions`.`chatconsultId` = `chatconsult`.`id`)'
);

exports.list = req => {
	const where = {doctorprofileId: req.doctorProfileId};
	if (req.chatconsultId) where.id = req.chatconsultId;
	if (req.name) where.name = {'$like': '%' + req.name + '%'};
	switch (req.chatView) {
		case 'FOLLOW_UP':
			where.createdAt = {
				$and: [
					{
						$gte: new Date(Date.now() - 604800000)
					},
					{
						$lt: new Date(Date.now() - 86400000)
					}
				]
			};
			break;
		case 'CLOSED':
			where.createdAt = {$lt: new Date(Date.now() - 604800000)};
			break;
		default:
			where.createdAt = {$gte: new Date(Date.now() - 86400000)};
	} 

	return models.chatconsult.findAndCountAll({
		include: [
			{
				model: models.patient,
				include: [
					{
						model: models.user,
						attributes: ['user_image'],
					},
				],
				attributes: ['id'],
			},
			{
				model: models.chatconsultmessage,
				as: 'chatconsultmessage',
				where: {
					id: {
						$eq: lastMessageQuery,
					}
				},
				required: false,
			},
			{
				model: models.transaction,
				attributes: ['amount'],
				where: {
					payment_status: 'success'
				}
			}
		],
		where,
		attributes: [
			'id',
			'age',
			'name',
			'title',
			'description',
			'gender',
			'createdAt',
			[unreadMessageForDoctorQuery ,'unread']
		],
		distinct: true,
		order: [
			[{model: models.chatconsultmessage, as: 'chatconsultmessage'}, 'createdAt', 'DESC']
		],
		limit: req.page === undefined ? undefined : req.pageSize,
		offset: req.page === undefined ? undefined : (req.page - 1) * req.pageSize,
	})
		.then(({count, rows: data}) => ({
			status: true,
			data,
			pageInfo: req.page === undefined ? undefined : {
				totalData: count,
				pageCount: Math.ceil(count / req.pageSize),
				pageLimit: req.pageSize,
				currentPage: req.page,
			},
		}));
};

const {
	SpecializationTagId,
	ProbleTypeTagId,
} = require('./utils').getAllTagTypeId();

exports.listForPatient = req => models.chatconsult.findAll({
	include: [
		{
			model: models.doctorprofile,
			include: [
				{
					model: models.doctorprofiledetail,
					as: 'doctorprofiledetails',
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`doctorprofile`.`id`',
						models.doctorprofiledetail,
						'doctorprofileId'
					),
					attributes: ['name'],
				},
				{
					model: models.doctortags,
					as: 'doctortags',
					include: [
						{
							model: models.tag,
							include: [
								{
									model: models.tagdetail,
									where: language.buildLanguageQuery(
										null,
										req.langId,
										'`doctorprofile.doctortags.tag`.`id`',
										models.tagdetail,
										'tagId'
									),
									attributes: ['title'],
								}
							],
							attributes: ['id'],
						},
					],
					where: {
						tagtypeId: SpecializationTagId,
					},
				},
			],
			attributes: [
				'id',
				'salutation',
				'doctor_profile_pic'
			],
		},
		{
			model: models.chatconsultmessage,
			as: 'chatconsultmessage',
			where: {
				id: {
					$eq: lastMessageQuery,
				}
			},
			required: false,
		},
		{
			model: models.tag,
			include: [
				{
					model: models.tagdetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`tag`.`id`',
						models.tagdetail,
						'tagId'
					),
					attributes: ['title'],
				}
			],
			attributes: ['id'],
		},
	],
	where: {
		patientId: req.patientId,
	},
	attributes: [
		'id',
		'doctorprofileId',
		'patientId',
		'name',
		'age',
		'gender',
		'contact',
		'title',
		'description',
		'image',
		'createdAt',
		'tagId',
		[experienceAttribute ,'experience'],
		[unreadMessageForPatientQuery, 'unread'],
		[paymentStatus, 'payment'],
	],
	order: [
		['createdAt', 'DESC']
	],
})
	.then(chatconsults => ({
		status: chatconsults.length !== 0,
		data: chatconsults,
		message: chatconsults.length !== 0 ? language.lang({key: "success", lang: req.lang}) : language.lang({key: "Record not found.", lang: req.lang}),
	}));

exports.getById = req => models.chatconsult.find({
		include: [
			{
				model: models.doctorprofile,
				include: [
					{
						model: models.doctorprofiledetail,
						as: 'doctorprofiledetails',
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`doctorprofile`.`id`',
							models.doctorprofiledetail,
							'doctorprofileId'
						),
						attributes: ['name'],
					},
					{
						model: models.user,
						attributes: ['user_image'],
					},
					{
						model: models.doctortags,
						as: 'doctortags',
						include: [
							{
								model: models.tag,
								include: [
									{
										model: models.tagdetail,
										where: language.buildLanguageQuery(
											{},
											req.langId,
											'`doctorprofile.doctortags.tag`.`id`',
											models.tagdetail,
											'tagId'
										),
										required: false,
										attributes: ['title'],
									}
								],
								attributes: ['id'],
								required: false,
							}
						],
						where: {
							tagtypeId: SpecializationTagId,
						},
						attributes: ['id'],
					},
					{
						model: models.doctoreducation,
						as: 'doctoreducations',
						include: [ 
							{
								model: models.tag,
								attributes: ['id'],
								include: [
									{
										model: models.tagdetail,
										attributes: ['title'],
										where: language.buildLanguageQuery(
											{},
											req.langId,
											'`doctorprofile.doctoreducations.tag`.`id`',
											models.tagdetail,
											'tagId'
										),
										required: false,
									}
								],
								required: false,
							},
						],
						attributes: ['id'],
						required: false
					},
				],
				attributes: [
					'id',
					'doctor_profile_pic',
					'salutation',
					[experienceAttribute, 'experience'],
				],
			},
			{
				model: models.transaction,
				attributes: ['amount', 'payment_status', 'transaction_id'],
				required: false
			},
			{
				model: models.tag,
				attributes: ['id'],
				include: [{
					model: models.tagdetail,
					attributes: ['title']
				}]
			},
			{
				model: models.chatconsultmessage,
				as: 'chatconsultmessages',
				where: {
					type: 1,
				},
				required: false,
				attributes: ['data'],
			}
		],
		where: {
			id: req.id,
		},
	})
	.then(chatconsult => ({
		status: chatconsult !== null,
		data: chatconsult,
		message: chatconsult !== null ? language.lang({key: "success", lang: req.lang}) : language.lang({key: "Record not found.", lang: req.lang}),
	}));

exports.getByIdForDoctor = req => models.chatconsult.findById(req.chatconsultId, {
	include: [
		{
			model: models.patient,
			include: [
				{
					model: models.user,
					attributes: ['user_image', 'email'],
				},
			],
			attributes: ['id'],
		},
		{
			as: 'chatconsultmessages',
			model: models.chatconsultmessage,
		},
		{
			model: models.tag,
			include: [
				{
					model: models.tagdetail,
					attributes: ['title'],
				}
			],
			attributes: ['id'],
		},
	],
})
	.then(chatconsult => ({
		status: chatconsult !== null,
		data: chatconsult,
		message: chatconsult !== null ? language.lang({key: "success", lang: req.lang}) : language.lang({key: "Record not found.", lang: req.lang}),
	}));

exports.messageForPatient = req => models.chatconsultmessage.findAndCountAll({
	where: {
		chatconsultId: req.chatconsultId,
	},
	attributes: [
		'id',
		'sender',
		'status',
		'type',
		'data',
		'createdAt',
	],
})
	.then(({rows: data, count}) => ({
		data,
		count,
		status: data.length !== 0,
		message: language.lang({
			lang: req.lang,
			key: data.length !== 0 ? "success" : "No message found",
		}),
	}))

exports.messageForPatientPagination = req => {
	let limit = parseInt(req.limit), offset = parseInt(req.offset);
	if (isNaN(limit)) limit = undefined;
	if (isNaN(offset)) offset = undefined;
	return models.chatconsultmessage.findAndCountAll({
		where: {
			chatconsultId: req.chatconsultId,
		},
		attributes: [
			'id',
			'sender',
			'status',
			'type',
			'data',
			'createdAt',
		],
		limit,
		offset,
		order: [['id', 'DESC']]
	})
	.then(({rows: data, count}) => ({
		data,
		count,
		status: data.length !== 0,
		message: language.lang({
			lang: req.lang,
			key: data.length !== 0 ? "success" : "No message found",
		}),
	}));
}

exports.add = req => {
	return models.chatconsult.create(req)
	.then(chatconsult => chatconsult.reload())
	.then(chatconsult => {
		
		Promise.all([
			models.doctorprofile.find({
				include: [{
					model: models.user,
					attributes: ['id', 'device_id', 'is_notification'],
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
					attributes: ['id', 'mobile'],
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
		]).then(([result, patient]) => {
			notification.send([{
				id:result.user.id, 
				device_id:result.user.device_id,
				is_notification:result.user.is_notification
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
		});

		return {
			status: true,
			data: chatconsult,
			message: 'success',
		}
	});
}

// exports.add = req => models.chatconsult.create(req)
// 	.then(chatconsult => chatconsult.reload())
// 	.then(chatconsult => ({
// 		status: true,
// 		data: chatconsult,
// 		message: 'success',
// 	}));

exports.doctors = req => 
	models.doctorprofile.findAll({
		include: [
			{
				model: models.doctorprofiledetail,
				as: 'doctorprofiledetails',
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'`doctorprofile`.`id`',
					models.doctorprofiledetail,
					'doctorprofileId'
				),
				attributes: ['name'],
			},
			{
				model: models.onlineconsultsetting,
				where: {
					available_for_consult: 1,
					consultation_fee: {$ne: null},
				},
				attributes: ['consultation_fee'],
			},
			{
				model: models.doctortags,
				as: 'doctortags',
				include: [
					{
						model: models.tag,
						include: [
							{
								model: models.tagdetail,
								attributes: ['title'],
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'`doctortags.tag`.`id`',
									models.tagdetail,
									'tagId'
								),
							}
						],
						attributes: ['id'],
					}
				],
				where: {
					tagId: req.specializationId || {
						$in:models.sequelize.literal(
							'(SELECT `specializationTagId` FROM `mapped_tags` AS `mappedtag` WHERE `mappedtag`.`problemtypeTagId` = '

							+ parseInt(req.problemtypeTagId) + ')'
						),
					},
					tagtypeId: SpecializationTagId,
				},
				attributes: ['id'],
			},
			{
				model: models.doctoreducation,
				as: 'doctoreducations',
				include: [ 
					{
						model: models.tag,
						attributes: ['id'],
						include: [
							{
								model: models.tagdetail,
								attributes: ['title'],
								where: language.buildLanguageQuery(
									{},
									req.langId,
									'`doctoreducations.tag`.`id`',
									models.tagdetail,
									'tagId'
								),
								required: false,
							}
						],
						required: false,
					},
				],
				attributes: ['id'],
				required: false
			}
		],
		where: {
			is_live: 1,
			is_active: 1,
			tagNotNull: models.sequelize.literal('`doctoreducations.tag`.`id` IS NOT NULL'),
		},
		attributes: [
			'id',
			'salutation',
			'doctor_profile_pic',
			[experienceAttribute ,'experience'],
			[models.sequelize.literal('(SELECT ROUND(AVG(doctor_feedbacks.rating)) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id AND doctor_feedbacks.is_approved = 1)'), 'avg_rating'],
			[models.sequelize.literal('(SELECT COUNT(*) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id AND doctor_feedbacks.is_approved = 1)'), 'count_rating']
		],
	})
	.then(doctors => ({
		status: true,
		data: doctors,
		message: doctors.length !== 0 ? language.lang({key: "success", lang: req.lang}) : language.lang({key: "Record not found.", lang: req.lang}),
	}));

exports.listForSuperadmin = req => {
	const pageSize = req.app.locals.site.page, // number of items per page
		page = +req.query.page || 1,
		reqData = req.body,
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

	return models.chatconsult.findAndCountAll({
		include: [
			{
				model: models.transaction,
				attributes: ['amount'],
				required: true
			},
			{
				model: models.doctorprofile,
				include: [
					{
						model: models.doctorprofiledetail,
						as: 'doctorprofiledetails',
						where: language.buildLanguageQuery(
							where.doctorprofiledetail,
							req.langId,
							'`doctorprofile`.`id`',
							models.doctorprofiledetail,
							'doctorprofileId'
						),
						attributes: ['name'],
					}
				],
				attributes: ['id'],
			}
		],
		distinct: true,
		where: where.chatconsult,
		attributes: [
			'id',
			'name',
			'createdAt',
		],
		order: [
			['id', 'DESC']
		],
		limit: pageSize,
		offset: (page - 1) * pageSize,
		subQuery: false,
	})
	.then(result => ({
		status: true,
		data: result.rows,
		totalData: result.count,
		pageCount: Math.ceil(result.count / pageSize),
		pageLimit: pageSize,
		currentPage: parseInt(page),
	}));
};

exports.getForSuperadmin = req => models.chatconsult.find({
	include: [
		{
			model: models.doctorprofile,
			include: [
				{
					model: models.doctorprofiledetail,
					as: 'doctorprofiledetails',
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`doctorprofile`.`id`',
						models.doctorprofiledetail,
						'doctorprofileId'
					),
					attributes: ['name'],
				},
				{
					model: models.doctortags,
					as: 'doctortags',
					include: [
						{
							model: models.tag,
							include: [
								{
									model: models.tagdetail,
									attributes: ['title'],
									where: language.buildLanguageQuery(
										null,
										req.langId,
										'`doctorprofile.doctortags.tag`.`id`',
										models.tagdetail,
										'tagId'
									),
								}
							],
							attributes: ['id'],
						}
					],
					where: {
						tagtypeId: SpecializationTagId,
					},
					attributes: ['id'],
				},
			],
			attributes: [
				'id',
				'doctor_profile_pic',
				[experienceAttribute, 'experience'],
			],
		},
		{
			model: models.patient,
			include: [
				{
					model: models.user,
					attributes: ['user_image', 'email'],
				}
			],
			attributes: ['id'],
		},
		{
			model: models.tag,
			include: [
				{
					model: models.tagdetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`tag`.`id`',
						models.tagdetail,
						'tagId'
					),
					attributes: ['title'],
				}
			],
		},
		{
			model: models.transaction,
			required: false,
			attributes: ['amount', 'payment_status']
		}
	],
	where: {
		id: req.chatconsultId,
	},
})
	.then(data => ({status: true, data}));

exports.tags = req => {
	const where = {is_active: 1};
	if (req.doctorprofileId) {
		where.id = {
			$in: models.sequelize.literal(
				'(SELECT `problemtypeTagId` FROM `mapped_tags` INNER JOIN `doctor_tags` ON '
				+ '`doctor_tags`.`tagId` = `mapped_tags`.`specializationTagId` AND '
				+ '`doctor_tags`.`doctorProfileId` = ' + parseInt(req.doctorprofileId) + ')'
			)
		};
	}

	return models.tagtype.find({
		include: [
			{
				model: models.tag,
				include:[
					{
						model: models.tagdetail,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`tags`.`id`',
							models.tagdetail,
							'tagId'
						)
					},
				],
				where,
			},
		],
		where: {
			id: ProbleTypeTagId,
		}
	})
	.then(data => ({
		data,
		status: true, 
		message: language.lang({key: "Record found.", lang: req.lang}),
	}))
}

exports.getForDoctor = req => models.chatconsult.find({
	include: [
		{
			model: models.doctorprofile,
			include: [
				{
					model: models.doctorprofiledetail,
					as: 'doctorprofiledetails',
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`doctorprofile`.`id`',
						models.doctorprofiledetail,
						'doctorprofileId'
					),
					attributes: ['name'],
				},
				{
					model: models.doctortags,
					as: 'doctortags',
					include: [
						{
							model: models.tag,
							include: [
								{
									model: models.tagdetail,
									attributes: ['title'],
								}
							],
							attributes: ['id'],
						}
					],
					where: {
						tagtypeId: SpecializationTagId,
					},
					attributes: ['id'],
				},
			],
			attributes: [
				'id',
				'doctor_profile_pic',
				[experienceAttribute, 'experience'],
			],
		},
		{
			model: models.patient,
			include: [
				{
					model: models.user,
					attributes: ['user_image', 'email'],
				}
			],
			attributes: ['id'],
		},
		{
			model: models.tag,
			include: [
				{
					model: models.tagdetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`tag`.`id`',
						models.tagdetail,
						'tagId'
					),
					attributes: ['title'],
				}
			],
		},
		{
			model: models.transaction,
			required: false,
			attributes: ['id', 'amount', 'payment_status']
		},
		{
			model: models.chatconsultmessage,
			as: 'chatconsultmessages',
			where: {
				type: 1,
			},
			required: false,
			attributes: ['data'],
		}
	],
	where: {
		id: req.chatconsultId,
	},
})
	.then(data => ({status: true, data}));