'use strict';

const models = require('../models'),
language = require('./language'),
utils = require('./utils'),
mail = require('./mail');
models.jobapplication.belongsTo(models.job);
models.job.hasMany(models.jobdetail);

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

	return models.jobapplication.findAndCountAll({
		include: [{
			model: models.job,
			attributes: ['id'],
			include: [{
				model: models.jobdetail,
				attributes: ['title'],
				where: where.jobdetail
			}],
			where: where.job
		}],
		distinct: true,
		where: where.jobapplication,
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

	return models.jobapplication.findAndCountAll({
		include: [{
			model: models.job,
			attributes: ['id'],
			include: [{
				model: models.jobdetail,
				attributes: ['title'],
				where: where.jobdetail
			}],
			where: where.job
		}],
		distinct: true,
		where: where.jobapplication,
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

exports.apply = req => {
	if(!req.doc_file) req.doc_file = '';
	return models.job.findOne({
		where : {
			id: req.jobId,
			is_active: 2
		}
	}).then(result => {
		if(result){
			return Promise.all([
				models.jobapplication.build(req).validate()
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
				return models.jobapplication.create(
					req
				).then(()=>({
					status: true,
					message: language.lang({key: "Applied  Successfully", lang: req.lang})
				})).catch(()=> ({
					status: false,
					message: language.lang({key: "Something went wrong, please try again", lang: req.lang})
				}));
			}).catch(()=> ({
				status: false,
				message: anguage.lang({key: "Something went wrong, please try again", lang: req.lang})
			}))
		} else {
			return {
				status: false,
				message: anguage.lang({key: "Job post not found", lang: req.lang})
			};
		}
	}).catch(()=> ({
		status: false,
		message: anguage.lang({key: "Something went wrong, please try again", lang: req.lang})
	}));
};