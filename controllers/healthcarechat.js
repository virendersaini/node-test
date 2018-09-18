'use strict';

const models = require('../models'),
	language = require('./language');

models.healthcarechatmessage.belongsTo(models.patient);
models.healthcarechatmessage.belongsTo(models.healthcareprofile);
models.healthcareprofile.hasMany(models.healthcareprofiledetail);
models.healthcareprofile.hasMany(models.healthcareeducation, {
	targetKey: 'healthcareProfileId'
});
models.healthcareeducation.belongsTo(models.tag, {
	foreignKey: 'tagtypeId',
});

const
	unreadOfPatient = models.sequelize.literal(
		'(SELECT COUNT(*) FROM `healthcare_chat_messages` WHERE `status` < 3 AND `sender` = 0 AND ' +
		' `healthcare_chat_messages`.`deleted` IN (0, 1) AND ' +
		' `healthcare_chat_messages`.`patientId` = `healthcarechatmessage`.`patientId` AND ' +
		' `healthcare_chat_messages`.`healthcareprofileId` = `healthcarechatmessage`.`healthcareprofileId`)'
	),
	unreadOfHealthcare = models.sequelize.literal(
		'(SELECT COUNT(*) FROM `healthcare_chat_messages` WHERE `status` < 3 AND `sender` = 1 AND ' +
		' `healthcare_chat_messages`.`deleted` IN (0, 2) AND ' +
		' `healthcare_chat_messages`.`patientId` = `healthcarechatmessage`.`patientId` AND ' +
		' `healthcare_chat_messages`.`healthcareprofileId` = `healthcarechatmessage`.`healthcareprofileId`)'
	);

exports.listForHealthCare = req =>
	models.healthcarechatmessage.findAll({
		include: [
			{
				model: models.patient,
				include: [
					{
						model: models.user,
						include: {
							model: models.userdetail,
							where: language.buildLanguageQuery(
								null,
								req.langId,
								'`patient.user`.`id`',
								models.userdetail,
								'userId'
							),
							attributes: ['fullname'],
						},
						attributes: ['user_image'],
					},
				],
				attributes: ['id'],
			},
		],
		where: {
			id: {
				$in: models.sequelize.literal(
					'(SELECT MAX(`id`) FROM `healthcare_chat_messages` WHERE'
					+ ' `healthcare_chat_messages`.`deleted` IN (0, 2) AND '
					+ ' healthcareprofileId=' + parseInt(req.healthcareProfileId)
					+ (req.patientId ? (' AND patientId=' + parseInt(req.patientId)) : '')
					+ ' GROUP BY `healthcareprofileId`)'
				),
			},
		},
		group: [
			['patientId'],
		],
		attributes: [
			'id',
			'patientId',
			'type',
			'sender',
			'status',
			'data',
			'createdAt',
			[unreadOfHealthcare, 'unread'],
		],
		order: [
			['id', 'DESC'],
		],
	})
		.then(data => ({
			status: true,
			data,
			message: data.length === 0 ? language.lang({key: "No message found", lang: req.lang}) : undefined
		}));

exports.healthcareMessages = req =>
	Promise.all([
		models.healthcarechatmessage.find({
			include: {
				model: models.patient,
				include: [
					{
						model: models.user,
						include: {
							model: models.userdetail,
							where: language.buildLanguageQuery(
								null,
								req.langId,
								'`patient.user`.`id`',
								models.userdetail,
								'userId'
							),
							attributes: ['fullname'],
						},
						attributes: [
							'email',
							'mobile',
							'user_image',
						],
					},
				],
				attributes: ['id'],
			},
			where: {
				patientId: req.patientId,
				healthcareprofileId: req.healthcareProfileId,
				deleted: req.user_type === 'home_healthcare' ? [0, 2] : [0, 1],
			},
			order: [
				['id', 'DESC'],
			],
		}),
		models.healthcarechatmessage.findAndCountAll({
			where: {
				patientId: req.patientId,
				healthcareprofileId: req.healthcareProfileId,
				deleted: req.user_type === 'home_healthcare' ? [0, 2] : [0, 1],
			},
			limit: req.limit,
			order: [
				['id', 'DESC'],
			],
		}),
	])
		.then(([data, {rows: messages, count}]) => ({
			status: true,
			data: Object.assign(data.toJSON(), {messages, count}),
			message: data.length === 0 ? language.lang({key: "No message found", lang: req.lang}): undefined,
		}));

exports.listForPatient = req => 
	Promise.all([
		models.healthcarechatmessage.findAll({
			include: [
				{
					model: models.healthcareprofile,
					include: [
						{
							model: models.healthcareprofiledetail,
							where: language.buildLanguageQuery(
								null,
								req.langId,
								'`healthcareprofile`.`id`',
								models.healthcareprofiledetail,
								'healthcareProfileId'
							),
							attributes: ['name'],
						},
						{
							model: models.healthcareeducation,
							include: {
								model: models.tag,
								include: {
									model: models.tagdetail,
									where: language.buildLanguageQuery(
										null,
										req.langId,
										'`healthcareprofile.healthcareeducations.tag`.`id`',
										models.tagdetail,
										'tagId'
									),
									required: false,
									attributes: ['title'],
								},
								required: false,
								attributes: ['id'],
							},
							required: false,
							attributes: ['id'],
						},
					],
					attributes: ['doctor_profile_pic'],
				},
			],
			where: {
				id: {
					$in: models.sequelize.literal(
						'(SELECT MAX(`id`) FROM `healthcare_chat_messages` WHERE'
						+ ' patientId=' + parseInt(req.patientId)
						+ ' GROUP BY `healthcareprofileId`)'
					),
				},
			},
			attributes:[
				'id',
				'data',
				'type',
				'sender',
				'status',
				'createdAt',
				'healthcareprofileId',
				[unreadOfPatient, 'unread'],
			],
		}),
		req.healthcareprofileId && 
		models.healthcarechatmessage.count({
			where: {
				patientId: req.patientId,
				healthcareprofileId: req.healthcareprofileId,
			}
		})
		.then(count => 
			count === 0 &&
			models.healthcareprofile.findById(req.healthcareprofileId, {
				include: [
					{
						model: models.healthcareprofiledetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`healthcareprofile`.`id`',
							models.healthcareprofiledetail,
							'healthcareProfileId'
						),
						attributes: ['name'],
					},
					{
						model: models.healthcareeducation,
						include: {
							model: models.tag,
							include: {
								model: models.tagdetail,
								where: language.buildLanguageQuery(
									null,
									req.langId,
									'`healthcareeducations.tag`.`id`',
									models.tagdetail,
									'tagId'
								),
								required: false,
								attributes: ['title'],
							},
							required: false,
							attributes: ['id'],
						},
						required: false,
						attributes: ['id'],
					},
				],
				attributes: ['doctor_profile_pic'],
			})
		),
	])
		.then(([data, healthcareprofile]) => ({
			status: true,
			data: healthcareprofile ? [{
				unread: 0,
				healthcareprofile,
				healthcareprofileId: req.healthcareprofileId,
			}].concat(data) : data,
			message: data.length === 0 ? language.lang({key: "No message found", lang: req.lang}) : undefined
		}));

exports.messages = req => {
	let limit = parseInt(req.limit),
		offset = parseInt(req.offset),
		where = {
			patientId: req.patientId,
			healthcareprofileId: req.healthcareprofileId,
			deleted: req.user_type === 'home_healthcare' ? [0, 2] : [0, 1],
		}; 
	if (isNaN(limit)) limit = undefined;
	if (isNaN(offset)) offset = undefined;
	if (req.messageId) where.id = {$lt: req.messageId};
	return models.healthcarechatmessage.findAndCountAll({
		where,
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
		order: [['id', 'DESC']],
	})
	.then(({rows: data, count}) => ({
		data,
		count,
		status: data.length !== 0,
		message: data.length !== 0 ? undefined : language.lang({
			lang: req.lang,
			key: "No message found",
		}),
	}))
};

exports.remove = req =>
	models.healthcarechatmessage.update(
		{
			deleted: models.sequelize.literal('`deleted` | 1')
		},
		{
			where: {
				patientId: req.patientId,
				healthcareprofileId: req.healthcareprofileId,
			},
		}
	)
		.then(() => ({
			status: true,
			messages: language.lang({
				lang: req.lang,
				key: "deletedSuccessfully",
			}),
		}))
