'use strict';

const models = require('../models'),
language = require('./language'),
utils = require('./utils'),
mail = require('./mail');

models.job.hasMany(models.jobdetail);
models.job.belongsTo(models.hospital);
models.hospital.hasMany(models.hospitaldetail);
models.job.hasMany(models.jobapplication);

exports.list = function (req) {
	var pageSize = req.app.locals.site.page, // number of items per page
	page = req.query.page || 1;

	var reqData = req.body.data ? JSON.parse(req.body.data) : req.body,
		where = {
			job: {
				hospitalId: reqData.hospitalId
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

	where.jobdetail = language.buildLanguageQuery(
		where.jobdetail, reqData.langId, '`job`.`id`', models.jobdetail, 'jobId'
	);

	return models.job.findAndCountAll({
		include: [{
			model: models.jobdetail,
			where: where.jobdetail
		}],
		attributes: [
			'id',
			'no_of_post',
			'is_active',
			[
				models.sequelize.literal(
					'(SELECT count(*) FROM `job_applications` where jobId = `job`.`id`)'
				),
				'totalapplication'
			]
		],
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

exports.listForClinic = function (req) {
	var pageSize = req.app.locals.site.page, // number of items per page
	page = req.query.page || 1;

	var reqData = req.body.data ? JSON.parse(req.body.data) : req.body,
		where = {
			job: {
				hospitalId: {$in: models.sequelize.literal('(SELECT `id` FROM `hospitals` WHERE `userId`='+reqData.userId+')')}
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

	where.jobdetail = language.buildLanguageQuery(
		where.jobdetail, reqData.langId, '`job`.`id`', models.jobdetail, 'jobId'
	);

	where.hospitaldetail = language.buildLanguageQuery(
		where.hospitaldetail, reqData.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'
	);

	return models.job.findAndCountAll({
		include: [{
			model: models.jobdetail,
			where: where.jobdetail
		}, {
			model: models.hospital,
			attributes: ['id'],
			include: [{
				model: models.hospitaldetail,
				attributes: ['hospital_name'],
				where: where.hospitaldetail
			}]
		}],
		attributes: [
			'id',
			'no_of_post',
			'is_active',
			[
				models.sequelize.literal(
					'(SELECT count(*) FROM `job_applications` where jobId = `job`.`id`)'
				),
				'totalapplication'
			]
		],
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

exports.getById = function(req) {
	return Promise.all([
		models.job.findOne({
			include: [{
				model: models.jobdetail,
				where: language.buildLanguageQuery(
					{}, req.langId, '`job`.`id`', models.jobdetail, 'jobId'
				)
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

exports.saveJob = function (req) {

	return Promise.all([
		models.job.build(req).validate(),
		models.jobdetail.build(req.jobdetail).validate()
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
			return updateJob(req);
		} else {
			return createJob(req);
		}
	})
};

function createJob(req) {
	req.jobdetail.languageId = req.langId;
	req.jobdetails = [models.jobdetail.build(req.jobdetail)];
	if (req.langId != 1) {
		var jobdetail = JSON.parse(JSON.stringify(req.jobdetail));
		jobdetail.languageId = 1;
		req.jobdetails.push(models.jobdetail.build(jobdetail));
	}
	return models.job.create(
		req,
		{
			include: [models.jobdetail]
		}
	)
	.then(() => ({
		status: true,
		message: language.lang({key:"addedSuccessfully", lang: req.lang})
	}));
}

function updateJob(req) {
	return models.job.findById(req.id, {
		include:[{
			model: models.jobdetail,
			where: {
				languageId: req.langId
			},
			required: false
		}]
	})
	.then(job => {
		if (job === null) throw language.lang({key: "chapter not found", lang: req.lang});
		var updates = [job.update(req)];
		if (job.jobdetails.length === 0) {
			delete req.jobdetail.id;
			req.jobdetail.jobId = job.id;
			req.jobdetail.languageId = req.langId;
			updates.push(models.jobdetail.create(req.jobdetail));
		} else {
			updates.push(job.jobdetails[0].update(req.jobdetail));
		}

		return Promise.all(updates);
	})
	.then(() => ({
		status: true,
		message: language.lang({key:"updatedSuccessfully", lang: req.lang})
	}));
}

exports.status = function (req) {
	return Promise.all([
		models.job.update({
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

exports.adminlist = function (req) {
	var pageSize = req.app.locals.site.page, // number of items per page
	page = req.query.page || 1;

	var reqData = req.body.data ? JSON.parse(req.body.data) : req.body,
		where = {
			job:{
				is_active: {$in: [0,2]}
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

	where.jobdetail = language.buildLanguageQuery(
		where.jobdetail, reqData.langId, '`job`.`id`', models.jobdetail, 'jobId'
	);

	where.hospitaldetail = language.buildLanguageQuery(
		where.hospitaldetail, reqData.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'
	);


	return models.job.findAndCountAll({
		include: [{
			model: models.jobdetail,
			attributes: ['title'],
			where: where.jobdetail
		}, {
			model: models.hospital,
			attributes: ['id'],
			include: [{
				model: models.hospitaldetail,
				attributes: ['hospital_name'],
				where: where.hospitaldetail
			}]
		}],
		attributes: [
			'id',
			'no_of_post',
			'is_active',
			[
				models.sequelize.literal(
					'(SELECT count(*) FROM `job_applications` where jobId = `job`.`id`)'
				),
				'totalapplication'
			]
		],
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

exports.viewDetail = function (req) {
	return models.job.findOne({
		include: [{
			model: models.jobdetail,
			attributes: ['title'],
			where: language.buildLanguageQuery(
				{}, req.langId, '`job`.`id`', models.jobdetail, 'jobId'
			)
		}, {
			model: models.jobapplication,
		}, {
			model: models.hospital,
			attributes: ['id'],
			include: [{
				model: models.hospitaldetail,
				attributes: ['hospital_name'],
				where: language.buildLanguageQuery(
					{}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'
				)
			}]
		}],
		where: {
			id: req.id
		}
	}).then((data)=> ({
		status: true,
		data
	}));
};

exports.careersList = req => {
	let pageSize = 25,
		page = req.page;

	return models.job.findAndCountAll({
		include: [{
			model: models.jobdetail,
			attributes: ['title', 'description', 'experience'],
			where: language.buildLanguageQuery(
				{}, req.langId, '`job`.`id`', models.jobdetail, 'jobId'
			)
		}, {
			model: models.hospital,
			attributes: ['id', 'hospital_logo'],
			include: [{
				model: models.hospitaldetail,
				attributes: ['hospital_name', 'address'],
				where: language.buildLanguageQuery(
					{}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'
				)
			}]
		}],
		attributes: [
			'id',
			'no_of_post',
			'is_active'
		],
		distinct: true,
		where: {
			is_active: 2
		},
		order: [
			['id', 'DESC']
		],
		limit: pageSize,
		offset: (page - 1) * pageSize,
		subQuery: false
	}).then(data => ({
		status: true,
		data: data.rows,
		page,
		pageCount: Math.ceil(data.count / pageSize)
	}));
};

exports.careerdetail = req => {
	return models.job.findOne({
		include: [{
			model: models.jobdetail,
			attributes: ['title', 'description', 'experience', 'qualification', 'key_skills', 'designation'],
			where: language.buildLanguageQuery(
				{}, req.langId, '`job`.`id`', models.jobdetail, 'jobId'
			)
		}, {
			model: models.hospital,
			attributes: ['id', 'hospital_logo'],
			include: [{
				model: models.hospitaldetail,
				attributes: ['hospital_name', 'address'],
				where: language.buildLanguageQuery(
					{}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'
				)
			}]
		}],
		where: {
			id: req.id
		}
	}).then((data)=> ({
		status: true,
		data
	}));
}