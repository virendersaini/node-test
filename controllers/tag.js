'use strict';

const models = require('../models'),
 language = require('./language'),
 utils = require('./utils');
 var mongo = require('../config/mongo');

function Tag() {

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

		where.tagdetail = language.buildLanguageQuery(
			where.tagdetail, reqData.langId, '`tag`.`id`', models.tagdetail, 'tagId'
		);
		models.tag.hasMany(models.tagdetail);
	  models.tag.belongsTo(models.tagtype);
	  models.tagtype.hasMany(models.tagtypedetail);

		models.tag.findAndCountAll({
			include: [
				{ model: models.tagdetail, where: where.tagdetail},
	      { model: models.tagtype,include:[{ model: models.tagtypedetail, where: where.tagtypedetail}], where: where.tagtype},

			],
			distinct: true,
			where: where.tag,
			order: [
				['id', 'DESC']
			],
			limit: setPage,
	      	offset: pag
		})
		.then(result => {
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
		models.tag.hasMany(models.tagdetail);
		models.tag.findById(
			req.id
			, {
				include: [
					{
						model: models.tagdetail
						, where: language.buildLanguageQuery(
							{}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
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
		if (typeof req.tagtypeId === 'undefined') {
			console.log('true')
			req.tagtypeId='';
		}
		
		req.tagdetail.tagtypeId = parseInt(req.tagtypeId);
		const TagHasOne = models.tag.hasOne(models.tagdetail, {as: 'tagdetail'});
		req.tagdetail.languageId = req.langId;

		if (typeof req.is_active === 'undefined') {
			req.is_active = 1;
		}

		Promise.all([
			models.tag.build(req).validate().then(err => err)
			, models.tagdetail.build(req.tagdetail).validate().then(err => err)
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
				models.tag.hasMany(models.tagdetail);
				return models.tag.findAll({
					where: {tagtypeId: req.tagtypeId}, 
					include: [
						{model: models.tagdetail, where: language.buildLanguageQuery({title: req.tagdetail.title}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId')}
					]
				}).then(function(tagData) {
					if(tagData.length == 0) {
						return models.tag.create(req, {include: [TagHasOne]})
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
										// tagdetail for english is necessary
										req.tagdetail.tagId = data.id;
										req.tagdetail.languageId = 1;
										return models.tagdetail.create(req.tagdetail)
										.then(tagdetail => ({
											status: true
											, message: language.lang({key:"addedSuccessfully", lang: req.lang})
											, data: data
										}));
									}
							});	
					} else {
						return {status: false, message: language.lang({key:"alreadyTagExist", lang: req.lang}), errors: true};
					}
				})
			} else {

				models.tag.hasMany(models.tagdetail);
				return models.tag.findAll({
					where: {tagtypeId: req.tagtypeId, id: {$ne: req.id}}, 
					include: [
						{model: models.tagdetail, where: language.buildLanguageQuery({title: req.tagdetail.title}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId')}
					]
				}).then(function(tagData) {
					if(tagData.length == 0) {
						//mongo data
						if(req.tagtypeId==2){
							var tagTypeName = "Specializations";
						}
						if(req.tagtypeId==1){
							var tagTypeName = "Services";
						}
					
						var type;
						var save_json_data_in_mongodb = { key:req.id.toString(),title:req.tagdetail.title,langId:req.languageId.toString(),image:'null',type:tagTypeName}
						//End of mongo data


						return models.tag.update(req, {where: {id: req.id}})
						.then(data => {

							return models.tagdetail.findOne({where: {tagId: req.id, languageId: req.langId}})
							.then(tagdetail => {
								if (tagdetail === null) {
									req.tagdetail.tagId = req.id;
									req.tagdetail.languageId = req.langId;
									delete req.tagdetail.id;
									return models.tagdetail.create(req.tagdetail);
								} else {
									return tagdetail.update(req.tagdetail).then(() => data);
								}
							})
							.then((tagdetail) => {
								//mongo save query
								if(req.tagtypeId==2 || req.tagtypeId==1){
								mongo.save(save_json_data_in_mongodb,type='edit',function(mongodata){})
								}
								//end of mongo save
								return {
									status: true
									, message: language.lang({key:"updatedSuccessfully", lang: req.lang})
									, data: data,
								}
								 
							});
						});
					} else {
						return {status: false, message: language.lang({key:"alreadyTagExist", lang: req.lang}), errors: true};
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
		//req.is_approved = req.is_active;
		models.tag.update(req, {where: {id: req.id}})
		.then(function(data){ 

			var where={};
			var tagdetail={};
			where.tagdetail = language.buildLanguageQuery(
			  where.tagdetail, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
			);
			models.tag.hasMany(models.tagdetail);
			models.tag.find({
			  attributes: ['id','tagtypeId'],
			  include: [
				{ model: models.tagdetail, where: where.tagdetail}
			  ],
				where:{id:req.id}
			}).then(function(resultData){
				if(resultData.tagtypeId==2){
					var tagTypeName = "Specializations";
				}
				if(resultData.tagtypeId==1){
					var tagTypeName = "Services";
				}
				var type;
				if(resultData.tagtypeId==2 || resultData.tagtypeId==1){
					var save_json_data_in_mongodb = { key:req.id,title:resultData.tagdetails[0].title,langId:req.langId.toString(),image:'null',type:tagTypeName}
					if(req.is_active==1){
						mongo.save(save_json_data_in_mongodb,type='add',function(mongodata){
						})
					}else{
						mongo.save(save_json_data_in_mongodb,type='delete',function(mongodata){
						})
					}
				}
			})
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

	this.getMappedTagList = function(req, res) {
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
			tagdetail: {}
		};
		if (req.query) {
			Object.keys(req.query).forEach(key => {
				if (req.query[key] === '') return;
				var modalKey = key.split('__');
				if (modalKey[0] in where) {
					where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
				} else {
					where[modalKey[0]] = {};
					where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
				}
			});
		}

		models.mappedtag.belongsTo(models.tag, {foreignKey: 'specializationTagId', targetKey: 'id', as: 'specialization'})
		models.mappedtag.belongsTo(models.tag, {foreignKey: 'problemtypeTagId', targetKey: 'id', as: 'problemtype'})
		models.tag.hasMany(models.tagdetail)

		
		where.tagdetail = language.buildLanguageQuery(
			where.tagdetail, reqData.langId, '`mappedtag`.`specializationTagId`', models.tagdetail, 'tagId'
		);

		models.mappedtag.findAll({
			attributes: ["id", "specializationTagId", [models.sequelize.fn('GROUP_CONCAT', models.sequelize.fn('DISTINCT', models.sequelize.col("mappedtag.problemtypeTagId"))), 'problemtypetags']],
			include: [
				{
					model: models.tag,
					attributes: ["id"],
					as: 'specialization',
					include: [
						{model: models.tagdetail, attributes: ["title"], where: where.tagdetail}
					]
				}
			],
			group: ['specializationTagId'],
			order: [
				['id', 'DESC']
			],
			distinct: false,
			limit: setPage,
	      	offset: pag
		})
		.then(result => {
			module.exports.getMapTagMetaData(req, function(allMapTagsData) {
				res({
					status: true,
					data: result,
					totalData: result.length,
		        	pageCount: Math.ceil(result.length / setPage),
		        	pageLimit: setPage,
		        	currentPage:currentPage,
		        	allTagsData: allMapTagsData.data
				});
			})
		})//.catch(() => res({ status:false, error: true, error_description: language.lang({key: "Internal Error",lang: req.lang}), url: true }));
	}

	this.getMapTagMetaData = function(req, res) {
		const allTagtypeIds = utils.getAllTagTypeId();

		var reqData = req.body.data ? JSON.parse(req.body.data) : req.body;
		var where = {};

		where.tag = {tagtypeId: {$in: [allTagtypeIds.SpecializationTagId, allTagtypeIds.ProbleTypeTagId]}}

		where.tagdetail = language.buildLanguageQuery(
			where.tagdetail, reqData.langId, '`tag`.`id`', models.tagdetail, 'tagId'
		);
		models.tag.hasMany(models.tagdetail);
	  	models.tag.findAll({
			include: [
				{ model: models.tagdetail, where: where.tagdetail},
			],
			distinct: true,
			where: where.tag,
			order: [
				['id', 'DESC']
			]
		}).then(result => {
			res({
				data: result
			});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error",lang: req.lang}), url: true}));
	}

	this.saveMappedTags = function(req, res) {
		var tagData = req.mappedtags;

		models.mappedtag.find({
			where: {
				specializationTagId: tagData.specializationTagId,
				problemtypeTagId: {$in: tagData.problemtypeTagId}
			},
			group: ["specializationTagId"],
			raw: true
		}).then(function(checkData) {
			if(checkData) {
				res({status: false, message: language.lang({key:"alreadyTagMapped", lang:req.lang})})
			} else {
				var dataToSave = [];
				tagData.problemtypeTagId.forEach(function(item) {
					dataToSave.push({
						specializationTagId: tagData.specializationTagId,
						problemtypeTagId: item
					})
				})

				models.mappedtag.bulkCreate(dataToSave).then(function(response) {
					res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:[]});
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error",lang: req.lang}), url: true}));
			}
		})
	}

	this.updateMappedTags = function(req, res) {
		let mappedTags = req.mappedtags;
		models.mappedtag.findOne({
			where: {id: mappedTags.id}
		}).then(function(getData) {
			models.mappedtag.find({
				attributes: [
					[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col("id")), 'ids']
				],
				where: {
					specializationTagId: getData.specializationTagId
				},
				raw: true
			}).then(function(getEditData) {
				if(getEditData.ids) {
					let idsArray = getEditData.ids.split(",");
					models.mappedtag.find({
						where: {
							specializationTagId: mappedTags.specializationTagId,
							problemtypeTagId: {$in: mappedTags.problemtypeTagId},
							id: {
								$notIn: idsArray
							}
						},
						raw: true
					}).then(function(checkData) {
						if(checkData) {
							res({status: false, message: language.lang({key:"alreadyTagMapped", lang:req.lang})})
						} else {
							var dataToSave = [];
							mappedTags.problemtypeTagId.forEach(function(item) {
								dataToSave.push({
									specializationTagId: mappedTags.specializationTagId,
									problemtypeTagId: item
								})
							})

							models.mappedtag.destroy({where: {id: {$in: idsArray}}}).then(function(deleted) {
								models.mappedtag.bulkCreate(dataToSave).then(function(response) {
									res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:[]});
								}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error",lang: req.lang}), url: true}));
							}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error",lang: req.lang}), url: true}));
						}
					})
				} else {
					res({status:true, message:language.lang({key:"invalidData", lang:req.lang}), data:[]});
				}
			})
		})
	}

	this.deleteMappedTags = function(req, res) {
		if(req.id === undefined || req.id == '') {
			res({status: false, message: language.lang({key:"addedSuccessfully", lang:req.lang}), data: []});
		} else {
			models.mappedtag.findOne({attributes: ["specializationTagId"], where: {id: req.id}}).then(function(result) {
				models.mappedtag.destroy({
					where: {specializationTagId: result.specializationTagId}
				}).then(function(status) {
					res({status:true, message:language.lang({key:"deletedSuccessfully", lang:req.lang}), data:[]});
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error",lang: req.lang}), url: true}));
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error",lang: req.lang}), url: true}));
		}
	}

	this.editMappedTags = function(req, res) {
		models.mappedtag.findAll({
			attributes: ["id", "specializationTagId", [models.sequelize.fn('GROUP_CONCAT', models.sequelize.fn('DISTINCT', models.sequelize.col("mappedtag.problemtypeTagId"))), 'problemtypetags']],
			where: {
				specializationTagId: req.specializationTagId
			},
			group: ['specializationTagId'],
		}).then(function(data) {
			module.exports.getMapTagMetaData({body: req.langId}, function(helData) {
				res({data: data, helperData: helData.data})
			})
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error",lang: req.lang}), url: true}));
	}

	this.getAllTagForApproval = function (req) {
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
		var where = { is_approved: 0, is_active: 1 };

		models.tag.hasMany(models.tagdetail);
		models.tag.belongsTo(models.tagtype);
	  	models.tagtype.hasMany(models.tagtypedetail);
		return models.tag.findAndCountAll({
			include: [{
				model: models.tagdetail
				, where: language.buildLanguageQuery(
					{}, req.body.langId, '`tag`.`id`', models.tagdetail, 'tagId'
				)
				, attributes: ['title', 'description']
			}, 
			{
				model: models.tagtype,
				include:[
					{ model: models.tagtypedetail, where: language.buildLanguageQuery(
					{}, req.body.langId, '`tagtype`.`id`', models.tagtypedetail, 'tagtypeId'
				)}
				]
			}
			]
			, where
			, attributes: ['id', 'tagtypeId'],
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag, subQuery: false
		})
		.then(result => ({
			status: true
			, data: result.rows
			, totalData: result.count
			, pageCount: Math.ceil(result.count / setPage)
			, pageLimit: setPage
			, currentPage: currentPage
		}));
	}

	this.approve = function (req, res) {
		if(req.id && req.dataAction) {
			let updateData = {is_approved: 1};
			if(req.dataAction === 'inactive') {
				updateData.is_active = 0;
			}
			models.tag.update(updateData, {where: {id: req.id}}).then(function(result) {
				res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang})});	
			})
		} else {
			res({status:false, message:language.lang({key:"Missing required parameters", lang:req.lang})});
		}
	}

	this.getAllForProviders = function(req, res) {
		var where = {};

		if(req.where !== "undefined") where = req.where;
		else where = { is_active: 1, is_approved: 1 }

		models.tag.hasMany(models.tagdetail);
		models.tag.findAll({
			include: [{
				model: models.tagdetail
				, where: language.buildLanguageQuery(
					{}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
				)
			}]
			, where
		}).then(function(result) {
			res({
				status: true
				, message: language.lang({key: "Tag List", lang: req.lang})
				, data: result
			})
		})
	}

	this.freeqaSpec = function(req) {
		let qry = 'SELECT GROUP_CONCAT(DISTINCT(specializationTagId)) as specIds from mapped_tags;'
		return models.sequelize.query(qry, { type: models.sequelize.QueryTypes.SELECT }).then(function(allMappedSpecId) {
			let specIds = [];
			if(allMappedSpecId[0].specIds !== null) specIds = allMappedSpecId[0].specIds.split(",");

			models.tag.hasMany(models.tagdetail);
			return models.tag.findAll({
				attributes: ["id"],
				include: [{
					model: models.tagdetail, 
					where: language.buildLanguageQuery(
						{}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
					), 
					attributes: ['title']
				}],
				where: {is_active: 1, id: {$in: specIds}}
			}).then(data => ({status: true, data}));
		})
	}

	this.probTagsBySpec = function(req) {
		let qry = 'SELECT GROUP_CONCAT(DISTINCT(problemtypeTagId)) as probIds FROM mapped_tags WHERE specializationTagId = ?;'
		return models.sequelize.query(qry, { replacements: [req.specId], type: models.sequelize.QueryTypes.SELECT }).then(function(allMappedProbTags) {
			let probIds = [];
			if(allMappedProbTags[0].probIds !== null) probIds = allMappedProbTags[0].probIds.split(",");

			const ProbleTypeTagId = utils.getAllTagTypeId()['ProbleTypeTagId'];
			models.tag.hasMany(models.tagdetail);
			return models.tag.findAll({
				attributes: ["id"],
				include: [{
					model: models.tagdetail, 
					where: language.buildLanguageQuery(
						{}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
					), 
					attributes: ['title']
				}],
				where: {tagtypeId: ProbleTypeTagId, is_active: 1, id: {$in: probIds}}
			}).then(data => ({status: true, data}));
		});
	}
}

module.exports = new Tag();
