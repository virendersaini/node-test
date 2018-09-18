'use strict';

const models = require('../models'),
language = require('./language'),
utils = require('./utils'),
mail = require('./mail');

models.patientquestion.hasMany(models.question_answer);
models.patientquestion.belongsTo(models.tag);
models.tag.hasMany(models.tagdetail);

models.question_answer.belongsTo(models.doctorprofile);
models.doctorprofile.belongsTo(models.user);
models.user.hasMany(models.userdetail);

models.patientquestion.belongsTo(models.patient);
models.patient.belongsTo(models.user);

models.question_answer.belongsTo(models.patientquestion);
models.question_answer.hasOne(models.helpfulanswer);

exports.list = function (req) {
	var pageSize = req.app.locals.site.page, // number of items per page
	page = req.query.page || 1;

	var reqData = req.body,
		tagIds = models.sequelize.literal('(SELECT DISTINCT `problemtypeTagId` FROM `mapped_tags`'+
			' WHERE FIND_IN_SET(`specializationTagId`, (SELECT GROUP_CONCAT(`tagId`) from `doctor_tags`'+
			' WHERE `doctorProfileId` = '+reqData.doctorprofileId+
			' AND `tagtypeId` = '+utils.getAllTagTypeId()['SpecializationTagId']+')))'),
		where = {
			skipped: models.sequelize.literal(
				'(SELECT count(*) FROM skipped_questions'+
				' WHERE patientquestionId = `patientquestion`.`id`'+
				' AND doctorprofileId = '+reqData.doctorprofileId+') = 0'
			),
			tagId: {$in: tagIds},
			is_active: 1
		};

	if(req.query && req.query.showlist === 'answered'){
		where.showlist = models.sequelize.literal(
			'(SELECT count(*) FROM question_answers'+
			' WHERE patientquestionId = `patientquestion`.`id`'+
			' AND type = 0 AND doctorprofileId = '+reqData.doctorprofileId+') > 0'
		);
	} else {
		where.showlist = models.sequelize.literal(
			'(SELECT count(*) FROM question_answers'+
			' WHERE patientquestionId = `patientquestion`.`id`'+
			' AND doctorprofileId = '+reqData.doctorprofileId+') = 0'
		);
	}

	if(req.query && req.query.tagId &&req.query.tagId !== 'all'){
		where.tagId = req.query.tagId;
	}

	return Promise.all([
		models.patientquestion.findAndCountAll({
			attributes: [
				'id',
				'patientId',
				'tagId',
				'image',
				'patient_name',
				'problem_title',
				'description',
				'age',
				'gender',
				'contact',
				'is_active',
				'createdAt',
				'updatedAt',
				[
					models.sequelize.literal(
						'(SELECT COUNT(*) FROM `answer_viewers` INNER JOIN `question_answers`'+
						' ON `question_answers`.`id` = `answer_viewers`.`questionanswerId`'+
						' WHERE `question_answers`.`patientquestionId` = `patientquestion`.`id`)'
					),
					'viewers'
				],
				[
					models.sequelize.literal(
						'(SELECT COUNT(*) FROM `helpful_answers` INNER JOIN `question_answers`'+
						' ON `question_answers`.`id` = `helpful_answers`.`questionanswerId`'+
						' WHERE `question_answers`.`patientquestionId` = `patientquestion`.`id`'+
						' AND `helpful_answers`.`is_helpful` = 1)'
					),
					'like'
				],
				[
					models.sequelize.literal(
						'(SELECT COUNT(*) FROM `helpful_answers` INNER JOIN `question_answers`'+
						' ON `question_answers`.`id` = `helpful_answers`.`questionanswerId`'+
						' WHERE `question_answers`.`patientquestionId` = `patientquestion`.`id`'+
						' AND `helpful_answers`.`is_helpful` = 0)'
					),
					'dislike'
				]
			],
			include: [{
				model: models.tag,
				attributes: ['id'],
				include: [{
					model: models.tagdetail,
					where: language.buildLanguageQuery(
						{}, reqData.langId, '`tag`.`id`', models.tagdetail, 'tagId'
					)
				}]
			}],
			distinct: true,
			where: where,
			order: [
				['id', 'DESC']
			],
			limit: pageSize,
			offset: (page - 1) * pageSize,
			subQuery: false
		}),
		models.tag.findAll({
			include: [{
				model: models.tagdetail,
				attributes: ['title'],
				where: language.buildLanguageQuery(
					{}, reqData.langId, '`tag`.`id`', models.tagdetail, 'tagId'
				)
			}],
			attributes: ['id'],
			where: {
				id: {$in: tagIds}
			}
		})
	])
	.then(([result, tags]) => ({
		status: true,
		data: result.rows,
		totalData: result.count,
		pageCount: Math.ceil(result.count / pageSize),
		pageLimit: pageSize,
		currentPage: parseInt(page),
		tags
	}));
};

exports.skipquestion = function(req) {
	return Promise.all([
		models.skippedquestion.create(req)
	])
	.then(([result]) => ({
		status: true,
		message: language.lang({key: "Skipped successfully", lang: req.lang})
	})).catch(() => ({
		status: true,
		message: language.lang({key: "Skipped successfully", lang: req.lang})
	}));
};

exports.question = function(req) {
	return Promise.all([
		models.patientquestion.findOne({
			include: [{
				model: models.question_answer,
				attributes: ['id', 'answer', 'is_for_profile', 'createdAt'],
				required: false,
				where: {
					doctorprofileId: req.doctorprofileId
				}
			}, {
				model: models.tag,
				attributes: ['id'],
				include: [{
					model: models.tagdetail,
					where: language.buildLanguageQuery(
						{}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
					)
				}]
			}],
			where: {
				id: req.id
			}
		})
	])
	.then(([data]) => ({
		status: true,
		data
	}));
};

exports.saveAnswer = function (req) {

	return Promise.all([
		models.question_answer.build(req).validate()
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
		if (req.id) {
			return updateAnswer(req);
		} else {
			return createAnswer(req);
		}
	})
};

exports.reportQuestion = function(req) {
	return models.question_answer.create({
		doctorprofileId: req.doctorprofileId,
		patientquestionId: req.patientquestionId,
		type: req.type
	})
	.then((result) => ({
		status: true,
		message: language.lang({key: "Question reported successfully", lang: req.lang})
	})).catch(() => ({
		status: false,
		message: language.lang({key: "Unable to report question, Please try again", lang: req.lang})
	}));
};

function createAnswer(req) {
	return models.question_answer.create(
		req
	)
	.then(() => ({
		status: true,
		message: language.lang({key:"addedSuccessfully", lang: req.lang})
	}));
}

function updateAnswer(req) {
	return models.question_answer.update(
		req,
		{
			where: {
				id: req.id
			}
		}
	)
	.then(() => ({
		status: true,
		message: language.lang({key:"updatedSuccessfully", lang: req.lang})
	}));
}

exports.adminlist = function (req) {
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
					where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
				} else {
					where[modalKey[0]] = {};
					where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
				}
			}
		});
	}

	return Promise.all([
		models.patientquestion.findAndCountAll({
			include: [{
				model: models.tag,
				attributes: ['id'],
				include: [{
					model: models.tagdetail,
					where: language.buildLanguageQuery(
						{}, reqData.langId, '`tag`.`id`', models.tagdetail, 'tagId'
					)
				}]
			}],
			attributes: Object.keys(models.patientquestion.attributes).concat([
				[
					models.sequelize.literal(
						'(SELECT count(*) FROM `skipped_questions` where patientquestionId = `patientquestion`.`id`)'
					),
					'skipped'
				],
				[
					models.sequelize.literal(
						'(SELECT count(*) FROM `question_answers` where patientquestionId = `patientquestion`.`id` AND type = 0)'
					),
					'answered'
				],
				[
					models.sequelize.literal(
						'(SELECT count(*) FROM `question_answers` where patientquestionId = `patientquestion`.`id` AND type != 0)'
					),
					'reported'
				],
			]),
			distinct: true,
			where: where.patientquestion,
			order: [
				['id', 'DESC']
			],
			limit: pageSize,
			offset: (page - 1) * pageSize,
			subQuery: false
		}),
		models.tag.findAll({
			include: [{
				model: models.tagdetail,
				attributes: ['title'],
				where: language.buildLanguageQuery(
					{}, reqData.langId, '`tag`.`id`', models.tagdetail, 'tagId'
				)
			}],
			attributes: ['id'],
			where: {
				tagtypeId: utils.getAllTagTypeId()['ProbleTypeTagId']
			}
		})
	])
	.then(([result, tags]) => ({
		status: true,
		data: result.rows,
		totalData: result.count,
		pageCount: Math.ceil(result.count / pageSize),
		pageLimit: pageSize,
		currentPage: parseInt(page),
		tags
	})).catch(console.log);
};

exports.viewDetails = function(req) {
	return models.patientquestion.findOne({
		include: [{
			model: models.question_answer,
			attributes: ['id', 'answer', 'type'],
			required: false,
			include: [{
				model: models.doctorprofile,
				attributes: ['id', 'doctor_profile_pic'],
				required: false,
				include: [{
					model: models.user,
					attributes: ['id'],
					required: false,
					include: [{
						model: models.userdetail,
						attributes: ['fullname'],
						required: false,
						where: language.buildLanguageQuery(
							{},
							req.langId,
							'`question_answers.doctorprofile.user`.`id`',
							models.userdetail,
							'userId'
						)
					}]
				}]
			}]
		}, {
			model: models.tag,
			attributes: ['id'],
			include: [{
				model: models.tagdetail,
				where: language.buildLanguageQuery(
					{}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
				)
			}]
		}],
		where: {
			id: req.id
		}
	})
	.then((data) => ({
		status: true,
		data
	}));
};

exports.sendEmail = function(req) {
	return models.patientquestion.findOne({
		include: [{
			model: models.patient,
			attributes: ['id'],
			include: [{
				model: models.user,
				attributes: ['email']
			}]
		}],
		where: {
			id: req.id
		}
	}).then(result => {
		if(result && result.patient.user.email){
			mail.sendMail({
				email: result.patient.user.email,
				subject: req.subject,
				msg: req.message
			});
		}
		return {status: true, message: language.lang({key: "Email Sent Successfully.", lang: req.lang})};
	});
};

exports.status = function (req) {
	return Promise.all([
		models.patientquestion.update({
			is_active: req.is_active
		},{
			where: {
				id: req.id
			}
		})
	])
	.then(() => ({
		status: true,
		message: language.lang({key:"updatedSuccessfully", lang: req.lang})
	}))
};

exports.consult_qa = function (req) {
	return models.question_answer.findOne({
		include: [{
			model: models.patientquestion,
			include: [{
				model: models.tag,
				attributes: ['id'],
				include: [{
					model: models.tagdetail,
					where: language.buildLanguageQuery(
						{}, req.langId, '`patientquestion.tag`.`id`', models.tagdetail, 'tagId'
					)
				}]
			}]
		}],
		where: {
			doctorprofileId: req.id,
			type: 0,
			is_for_profile: 1
		},
		order: [
			['id', 'DESC']
		],
	})
};

exports.answeredlist = function (req) {
	var pageSize = req.app.locals.site.page, // number of items per page
	page = req.query.page || 1;

	var reqData = req.body,
		tagIds = models.sequelize.literal('(SELECT DISTINCT `problemtypeTagId` FROM `mapped_tags`\
			WHERE FIND_IN_SET(`specializationTagId`, (SELECT GROUP_CONCAT(`tagId`) from `doctor_tags`\
			WHERE `doctorProfileId` = '+reqData.doctorprofileId+'\
			AND `tagtypeId` = '+utils.getAllTagTypeId()['SpecializationTagId']+')))'),
		where = {
			skipped: models.sequelize.literal(
				'(SELECT count(*) FROM skipped_questions\
				WHERE patientquestionId = `patientquestion`.`id`\
				AND doctorprofileId = '+reqData.doctorprofileId+') = 0'
			),
			tagId: {$in: tagIds},
			is_active: 1
		};

	where.showlist = models.sequelize.literal(
		'(SELECT count(*) FROM question_answers\
		WHERE patientquestionId = `patientquestion`.`id`\
		AND type = 0 AND is_for_profile = 1 AND doctorprofileId = '+reqData.doctorprofileId+') > 0'
	);
	

	if(req.query && req.query.tagId &&req.query.tagId !== 'all'){
		where.tagId = req.query.tagId;
	}

	return Promise.all([
		models.patientquestion.findAndCountAll({
			attributes: [
				'id',
				'patientId',
				'tagId',
				'image',
				'patient_name',
				'problem_title',
				'description',
				'age',
				'gender',
				'contact',
				'is_active',
				'createdAt',
				'updatedAt',
				[
					models.sequelize.literal(
						'(SELECT COUNT(*) FROM `answer_viewers` INNER JOIN `question_answers`'+
						' ON `question_answers`.`id` = `answer_viewers`.`questionanswerId`'+
						' WHERE `question_answers`.`patientquestionId` = `patientquestion`.`id`)'
					),
					'viewers'
				]
			],
			include: [{
				model: models.tag,
				attributes: ['id'],
				include: [{
					model: models.tagdetail,
					where: language.buildLanguageQuery(
						{}, reqData.langId, '`tag`.`id`', models.tagdetail, 'tagId'
					)
				}]
			}],
			distinct: true,
			where: where,
			order: [
				['id', 'DESC']
			],
			limit: pageSize,
			offset: (page - 1) * pageSize,
			subQuery: false
		})
	])
	.then(([result]) => ({
		status: true,
		data: result.rows,
		totalData: result.count,
		pageCount: Math.ceil(result.count / pageSize),
		pageLimit: pageSize,
		currentPage: parseInt(page)
	}));
};

exports.viewQuestion = function(req) {
	return models.patientquestion.findOne({
		include: [{
			model: models.question_answer,
			attributes: [
				'id',
				'answer',
				'is_for_profile',
				'createdAt',
				[
					models.sequelize.literal(
						'(SELECT COUNT(*) FROM `answer_viewers` WHERE `questionanswerId` = `question_answers`.`id`)'
					),
					'viewers'
				],
			],
			include: [{
				model: models.helpfulanswer,
				attributes: ['is_helpful'],
				required: false,
				where: {
					patientId: req.patientId
				}
			}],
			required: false,
			where: {
				doctorprofileId: req.doctorprofileId
			}
		}, {
			model: models.tag,
			attributes: ['id'],
			include: [{
				model: models.tagdetail,
				where: language.buildLanguageQuery(
					{}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
				)
			}]
		}],
		where: {
			id: req.id
		}
	}).then(data => {
		if(data) {
			data = JSON.parse(JSON.stringify(data));
		}
		let questionanswerId = data.question_answers[0].id;
		return models.answerviewer.findOrCreate({
			where:{
				patientId: req.patientId,
				questionanswerId: questionanswerId
			}, 
			defaults: {
				patientId: req.patientId,
				questionanswerId: questionanswerId
			}
		}).spread((viewer, created) => {
			if(created){
				data.question_answers[0].viewers = (data.question_answers[0].viewers+1);
			}
			return {
				status: true,
				data
			};
		});
	});
};

exports.markHelpful = req => {
	return models.helpfulanswer.count({
		where: {
			patientId: req.patientId,
			questionanswerId: req.questionanswerId
		}
	}).then(count => {
		if(count){
			return {
				status: true,
				message: language.lang({key: "You have already vote for this answer.", lang: req.lang})
			}
		} else {
			return models.helpfulanswer.create({
				patientId: req.patientId,
				questionanswerId: req.questionanswerId,
				is_helpful: req.is_helpful
			}).then(() => ({
				status: true,
				message: language.lang({key: "Mark Successfully", lang: req.lang})
			})).catch(() =>({
				status: false,
				message: 'Error'
			}));
		}
	}).catch(() =>({
		status: false,
		message: 'Error'
	}));
};