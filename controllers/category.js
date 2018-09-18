'use strict';

const models = require('../models'),
 language = require('./language'),
 utils = require('./utils');
 var mongo = require('../config/mongo');

function Category() {

	this.list = function (req, res) {
		var pageSize = req.app.locals.site.page, // number of items per page
		page = req.query.page || 1;

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

		var reqData = req.body.data ? JSON.parse(req.body.data) : req.body, where = {
			tagdetail: {}, tag: {is_approved: 1}
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

		where.categorydetail = language.buildLanguageQuery(
			where.categorydetail, reqData.langId, '`category`.`id`', models.categorydetail, 'categoryId'
		);
		models.category.hasMany(models.categorydetail);

		models.category.findAndCountAll({
			include: [
				{ model: models.categorydetail, where: where.categorydetail},
			],
			distinct: true,
			where: where.category,
			order: [
				['id', 'DESC']
			],
			limit: setPage,
	      	offset: pag
		})
		.then(result => {

			console.log(result)
			res({
				status: true,
				data: result.rows,
				totalData: result.count,
	        	pageCount: Math.ceil(result.count / setPage),
	        	pageLimit: setPage,
	        	currentPage:currentPage
			});
		})
		.catch(() => res({
			status:false,
			error: true,
			error_description: language.lang({key: "Internal Error",lang: req.lang}),
			url: true
		}));
	};

	this.getById = function(req, res) {
		models.category.hasMany(models.categorydetail);
		models.category.findById(
			req.id
			, {
				include: [
					{
						model: models.categorydetail
						, where: language.buildLanguageQuery(
							{}, req.langId, '`category`.`id`', models.categorydetail, 'categoryId'
						)
					}
				]
			}
		)
		.then(res)
		.catch(() => res({
			status:false,
			error: true,
			error_description: language.lang({key: "Internal Error", lang: req.lang}),
			url: true
		}));
	};

	this.save = function (req, res) {
		console.log(req)
		if (typeof req.is_active === 'undefined') {
			req.is_active = 0;
		}
		const CategoryHasOne = models.category.hasOne(models.categorydetail, {as: 'categorydetail'});
		req.categorydetail.languageId = req.langId;

		Promise.all([
			models.category.build(req).validate().then(err => err)
			, models.categorydetail.build(req.categorydetail).validate().then(err => err)
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
						{errors: errors, lang: req.lang}
						, errors => resolve({errors: errors})
					);
				});
			} else if (! req.id) {
				models.category.hasMany(models.categorydetail);
				return models.category.findAll({
					include: [
						{model: models.categorydetail, where: language.buildLanguageQuery({title: req.categorydetail.title}, req.langId, '`category`.`id`', models.categorydetail, 'categoryId')}
					]
				}).then(function(tagData) {
					if(tagData.length == 0) {
						return models.category.create(req, {include: [CategoryHasOne]})
							.then(data => {


								//mongo data save
								// if(req.tagtypeId==2){
								// 	var tagTypeName = "Specializations";
								// }
								// if(req.tagtypeId==1){
								// 	var tagTypeName = "Services";
								// }
							
								// var type;
								// var save_json_data_in_mongodb = { key:data.id.toString(),title:req.tagdetail.title,langId:req.languageId.toString(),image:'null',type:tagTypeName}
								// if(req.tagtypeId==2 || req.tagtypeId==1){
								// mongo.save(save_json_data_in_mongodb,type='edit',function(mongodata){})
								// }
								//End of mongo data 
									if (req.langId == 1) {
										return {
											status: true
											, message: language.lang({key:"addedSuccessfully", lang: req.lang})
											, data: data
										};
									} else {
										req.categorydetail.categoryId = data.id;
										req.categorydetail.languageId = 1;
										return models.categorydetail.create(req.categorydetail)
										.then(categorydetail => ({
											status: true
											, message: language.lang({key:"addedSuccessfully", lang: req.lang})
											, data: data
										}));
									}
							});	
					} else {
						return {status: false, message: language.lang({key:"alreadyCategoryExist", lang: req.lang}), errors: true};
					}
				})
			} else {

				models.category.hasMany(models.categorydetail);
				return models.category.findAll({
					where: {id: {$ne: req.id}}, 
					include: [
						{model: models.categorydetail, where: language.buildLanguageQuery({title: req.categorydetail.title}, req.langId, '`category`.`id`', models.categorydetail, 'categoryId')}
					]
				}).then(function(tagData) {
					if(tagData.length == 0) {
						return models.category.update(req, {where: {id: req.id}})
						.then(data => {

							return models.categorydetail.findOne({where: {categoryId: req.id, languageId: req.langId}})
							.then(categorydetail => {
								if (categorydetail === null) {
									req.categorydetail.categoryId = req.id;
									req.categorydetail.languageId = req.langId;
									delete req.categorydetail.id;
									return models.categorydetail.create(req.categorydetail);
								} else {
									return categorydetail.update(req.categorydetail).then(() => data);
								}
							})
							.then((tagdetail) => {
								return {
									status: true
									, message: language.lang({key:"updatedSuccessfully", lang: req.lang})
									, data: data,
								}
								 
							});
						});
					} else {
						return {status: false, message: language.lang({key:"alreadyCategoryExist", lang: req.lang}), errors: true};
					}
				})
			}
		})
		.catch(() => ({
			status: false
			, error: true
			, error_description: language.lang({key:"Internal Error", lang: req.lang})
			, url: true
		})
	)
		.then(res);
	};

	this.status = function (req, res) {

		models.category.update(req, {where: {id: req.id}})
		.then(function(data){ 
			res({
			status: true
			, message: language.lang({key:"updatedSuccessfully", lang:req.lang})
			, data: data
		})
		})
		.catch(() => res({
			status:false
			, error: true
			, error_description: language.lang({key: "Internal Error", lang: req.lang})
			, url: true
		}));
	}

	this.remove = function (req, res) {
		models.tag.hasMany(models.tagdetail, {foreignKey: 'tagId', onDelete: 'CASCADE', hooks: true});
		models.tag.destroy({include: [{model: models.tagdetail}], where: {id: req.id}})
		.then(() => models.tagdetail.destroy({where: {tagId: req.id}}))
		.then(data => res({
			status: true
			, message:language.lang({key:"deletedSuccessfully", lang:req.lang})
			, data: data
		}))
		.catch(() => res({
			status:false
			, error: true
			, error_description: language.lang({key: "Internal Error", lang: req.lang})
			, url: true
		}));
	}

	this.getAll = function (req) {
		var where = {
			is_active: 1
		};

		if (req.type !== undefined) where.type = req.type;

		models.tag.hasMany(models.tagdetail);
		return models.tag.findAll({
			include: [{
				model: models.tagdetail
				, where: language.buildLanguageQuery(
					{}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
				)
				, attributes: ['title', 'description']
			}]
			, where
			, attributes: ['id']
		})
		.then(result => ({
			status: true
			, message: language.lang({key: "Tag List", lang: req.lang})
			, data: result
		}));
	}

	

}

module.exports = new Category();
