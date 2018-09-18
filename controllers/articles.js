var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var tagtype = require('./tagtype');
var utils = require('./utils');

function article() {


	/*
	 * Get list
	 */
	this.list = function (req, res) {
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
			var responseData = {};
			responseData.articledetail = {};
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
		}

		if("undefined" === typeof isWhere.article) {
			isWhere.article = {status: {$in: [1, 2]}}
		} else if("undefined" === typeof isWhere.article.status) {
			isWhere.article.status = {$in: [1, 2]}
		}

		orderBy = 'id DESC';

		
		models.article.hasMany(models.articledetail);
		isWhere.articledetail = language.buildLanguageQuery(isWhere.articledetail, reqData.langId, '`article`.`id`', models.articledetail, 'articleId');

		models.article.belongsTo(models.doctorprofile, {foreignKey: 'keyId', targetKey: 'id'});
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		
		models.article.findAndCountAll({
			attributes: ["id", "keyId", "article_tags", "article_image", "is_active", "status", "createdAt", "updatedAt", [models.sequelize.literal('(SELECT COUNT(article_likes.id) FROM article_likes WHERE article_likes.articleId = article.id)'), 'total_likes']],
			include: [
				{model: models.articledetail, attributes: ["title", "body"], where:isWhere.articledetail},
				{model: models.doctorprofile, attributes: ["id"], include: [{model: models.doctorprofiledetail, attributes: ["name"], where: language.buildLanguageQuery(isWhere.doctorprofiledetail, reqData.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')}]},
			],
			where: isWhere.article,
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag, subQuery: false
		}).then(function(result){
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);
			const articleTagtypeId = utils.getAllTagTypeId()['ArticleHealthIntrestTopicsTagId'];
			tagtype.listByTypeIDForWeb({langId: reqData.langId, lang: reqData.lang, id: articleTagtypeId}, function(tagdata){
				res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage, article_tags: tagdata.data });
			})
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	};

	this.getList = function(req, res) {
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

		let allTagtypeIds = utils.getAllTagTypeId()
		let specializationTagtypeId = allTagtypeIds.SpecializationTagId;

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
			var responseData = {};
			responseData.articledetail = {};
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
		}

		if("undefined" === typeof isWhere.article) {
			isWhere.article = {status: 1, is_active: 1};
		} else {
			isWhere.article.status = 1;
			isWhere.article.is_active = 1;
		}
		if('undefined'!==typeof reqData.doctor_id){
			isWhere.article.keyId = reqData.doctor_id;
		}
		orderBy = 'id DESC';

		
		models.article.hasMany(models.articledetail);
		models.article.hasMany(models.articlelike);

		isWhere.articledetail = language.buildLanguageQuery(isWhere.articledetail, reqData.langId, '`article`.`id`', models.articledetail, 'articleId');

		models.article.belongsTo(models.doctorprofile, {foreignKey: 'keyId'});
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		models.doctorprofile.hasMany(models.doctortags);
		models.doctortags.hasMany(models.tagdetail, {foreignKey: 'tagId', sourceKey: 'tagId'})
		models.article.hasMany(models.starredarticle, {foreignKey: 'articleId', sourceKey: 'id'});
		models.patient.findOne({
			attributes: ["id"],
			where: {
				userId: reqData.id
			}
		}).then(profileData => {
			Promise.all([
				models.patienttag.findAll({
					attributes: ['tagId'],
					where: {
						patientId: profileData.id,
						tagtypeId: 8
					}
				})
			]).then(([selecttags]) => {

				let articletags = [];
				selecttags.forEach(item => {
					articletags.push('FIND_IN_SET('+item.tagId+', `article`.`article_tags`)')
				});

				if(articletags.length > 0){
					if(!isWhere.article) isWhere.article = {};
					isWhere.article.searchtags = models.sequelize.literal('('+articletags.join(' OR ')+')');
				}

				models.article.findAndCountAll({
					attributes: [
						"id",
						"keyId",
						"article_image",
						"createdAt",
						[models.sequelize.literal(
							'(SELECT COUNT(article_likes.id) FROM article_likes WHERE article_likes.articleId = article.id)'), 'total_likes']
					],
					include: [{
						model: models.articledetail,
						attributes: ["title", "body"],
						where:isWhere.articledetail
					}, {
						model: models.doctorprofile,
						attributes: ["id", "salutation"],
						required: false, 
						include: [{
							model: models.doctorprofiledetail,
							attributes: ["name"],
							where: language.buildLanguageQuery(
								isWhere.doctorprofiledetail,
								reqData.langId,
								'`doctorprofile`.`id`',
								models.doctorprofiledetail,
								'doctorProfileId'
							),
							required: false
						}, {
							model: models.doctortags,
							attributes: ["tagId", "tagtypeId"],
							where: {
								tagtypeId: specializationTagtypeId
							},
							include: [{
								model: models.tagdetail,
								attributes: ["title"],
								where: language.buildLanguageQuery(
									isWhere.tagdetail,
									reqData.langId,
									'`doctorprofile.doctortags.tagdetails`.`tagId`',
									models.tagdetail,
									'tagId'
								)
							}],
							required: false
						}]
					}, {
						model: models.articlelike, 
						attributes: ["id"],
						where: {keyId: profileData.id},
						required: false
					},{
						model: models.starredarticle, 
						attributes: ["id"],
						where: {keyId: profileData.id},
						required: false
					}],
					where: isWhere.article,
					order: [
						['id', 'DESC']
					],
					distinct: true,
					limit: parseInt(setPage),
					offset: pag, //subQuery: false
				}).then(function(result){
					var totalData = result.count;
					var pageCount = Math.ceil(totalData / setPage);
					res({
						status: true,
						data: result.rows,
						pageNo: currentPage,
						limit: setPage
					});
				}).catch(() => res({
					status:false,
					error: true,
					error_description: language.lang({key: "Internal Error", lang: reqData.lang}),
					url: true
				}));
			}).catch(() => res({
				status:false,
				error: true,
				error_description: language.lang({key: "Internal Error", lang: reqData.lang}),
				url: true
			}));
		}).catch(() => res({
			status:false,
			error: true,
			error_description: language.lang({key: "Internal Error", lang: reqData.lang}),
			url: true
		}));

	};

	this.pendinglist = function (req, res) {
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
			var responseData = {};
			responseData.articledetail = {};
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
		}

		if("undefined" === typeof isWhere.article) {
			isWhere.article = {status: 0}
		} else {
			isWhere.article.status = 0;
		}

		orderBy = 'id DESC';

		
		models.article.hasMany(models.articledetail);

		isWhere.articledetail = language.buildLanguageQuery(isWhere.articledetail, reqData.langId, '`article`.`id`', models.articledetail, 'articleId');

		models.article.belongsTo(models.doctorprofile, {foreignKey: 'keyId', targetKey: 'id'});
		models.doctorprofile.hasMany(models.doctorprofiledetail);
		
		models.article.findAndCountAll({
			include: [
				{model: models.articledetail, attributes: ["title", "body"], where:isWhere.articledetail},
				{model: models.doctorprofile, attributes: ["id"], include: [{model: models.doctorprofiledetail, attributes: ["name"], where: language.buildLanguageQuery({}, reqData.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')}]},
			],
			where: isWhere.article,
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag, subQuery: false
		}).then(function(result){
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);

			const articleTagtypeId = utils.getAllTagTypeId()['ArticleHealthIntrestTopicsTagId'];
			tagtype.listByTypeIDForWeb({langId: reqData.langId, lang: reqData.lang, id: articleTagtypeId}, function(tagdata){
				res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage, article_tags: tagdata.data });
			})
		})//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	};

	this.getArticles = function(req, res) {
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
			var responseData = {};
			responseData.articledetail = {};
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
		}

		orderBy = 'id DESC';

		
		models.article.hasMany(models.articledetail);

		isWhere.articledetail = language.buildLanguageQuery(isWhere.articledetail, reqData.langId, '`article`.`id`', models.articledetail, 'articleId');

		models.article.findAndCountAll({
			attributes: ["id", "keyId", "article_tags", "article_image", "is_active", "status", "createdAt", "updatedAt", [models.sequelize.literal('(SELECT COUNT(article_likes.id) FROM article_likes WHERE article_likes.articleId = article.id)'), 'total_likes']],
			include: [
				{model: models.articledetail, where:isWhere.articledetail},
			],
			where: {keyId: reqData.doctorProfileId},
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag, //subQuery: false
		}).then(function(result){
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);

			const articleTagtypeId = utils.getAllTagTypeId()['ArticleHealthIntrestTopicsTagId'];
			tagtype.listByTypeIDForWeb({langId: reqData.langId, lang: reqData.lang, id: articleTagtypeId}, function(tagdata){
				res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage, article_tags: tagdata.data }); 
			})
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	}

	this.getMetaDataForAdd = function(req, res) {
		const articleTagtypeId = utils.getAllTagTypeId()['ArticleHealthIntrestTopicsTagId'];
		tagtype.listByTypeIDForWeb({langId: req.body.langId, lang: req.body.lang, id: articleTagtypeId}, function(tagdata){
			res({article_tags: tagdata.data})
		});
	}

	/*
	 * save
	 */
	this.doctorSave = function(req, res){
		req.article_tags = "string" === typeof req.article_tags ? req.article_tags : req.article_tags.join(",");

		var articleHasOneArticalDetail = models.article.hasOne(models.articledetail, {as: 'article_details'});
		req.article_details.languageId = req.langId;
		var article = models.article.build(req);
		var articledetail = models.articledetail.build(req.article_details);

		var errors = [];
		async.parallel([
			function (callback) {
				article.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
			function (callback) {
				articledetail.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
		], function (err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
			if (uniqueError.length === 0) {
				models.doctorprofile.findOne({attributes: ["id"], where: {userId: req.userId}}).then(function(doctorProfileData) {
					if(doctorProfileData) {
						let doctorProfileId = doctorProfileData.id;
						if (typeof req.id !== 'undefined' && req.id !== '') {
							req.article_details.articleId = req.id;
							models.article.update(req,{where: {id:req.id}}).then(function(data){
								models.articledetail.find({where:{articleId:req.id,languageId:req.langId}}).then(function(resultData){
									if (resultData !==null) {
										req.article_details.id = resultData.id;
										models.articledetail.update(req.article_details, {where:{id:resultData.id, articleId:req.id,languageId:req.langId}}).then(function(){
											res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
										}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
									} else {
										delete req.article_details.id;
										models.articledetail.create(req.article_details).then(function(){
											res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
										}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
									}
								}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
							}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
						} else {
							var langId = parseInt(req.article_details.languageId);
							req.keyId = doctorProfileId;
							models.article.create(req, {include: [articleHasOneArticalDetail]}).then(function(data){
								if (langId === 1) {
									res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
								} else {
									req.article_details.articleId = data.id;
									req.article_details.languageId = 1;
									models.articledetail.create(req.article_details).then(function(){
										res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
									}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
								}
							}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
						}
					} else {
						res({status:false, message:language.lang({key:"invalidUserDetails", lang:req.lang}), data:data});
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			} else {
				language.errors({errors:uniqueError, lang:req.lang}, function(errors){
					var newArr = {};
					newArr.errors = errors;
					res(newArr);
				});
			}
		});
	
	};


	/*
	 * get article detail
	 */
	this.getDetail = function(req, res) {
		var reqData = req.body;

		let allTagtypeIds = utils.getAllTagTypeId()
		let specializationTagtypeId = allTagtypeIds.SpecializationTagId;

		models.article.hasMany(models.articledetail);
		models.article.hasMany(models.articlelike);
		models.article.belongsTo(models.doctorprofile, {
			foreignKey: 'keyId'
		});
		models.doctorprofile.hasMany(models.doctorprofiledetail);

		models.doctorprofile.hasMany(models.doctortags);
		models.doctortags.hasMany(models.tagdetail, {
			foreignKey: 'tagId',
			sourceKey: 'tagId'
		})

		models.article.hasMany(models.starredarticle, {
			foreignKey: 'articleId',
			sourceKey: 'id'
		});

		models.patient.findOne({
			attributes: ["id"],
			where: {
				userId: reqData.userId
			}
		}).then(function(profileData) {
			models.article.findOne({
				attributes: ["id", "keyId", "article_image", "createdAt", [models.sequelize.literal('(SELECT COUNT(article_likes.id) FROM article_likes WHERE article_likes.articleId = article.id)'), 'total_likes']],
				include: [{
						model: models.articledetail,
						attributes: ["title", "body"],
						where: language.buildLanguageQuery({}, reqData.langId, '`article`.`id`', models.articledetail, 'articleId')
					},
					{
						model: models.doctorprofile,
						attributes: ["id", "salutation", "doctor_profile_pic", 'is_active'],
						include: [
						{
							model: models.doctorprofiledetail,
							attributes: ["name"],
							where: language.buildLanguageQuery({}, reqData.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
						}, 
						{
							model: models.doctortags,
							attributes: ["tagId"],
							where: {
								tagtypeId: specializationTagtypeId
							},
							include: [{
								model: models.tagdetail,
								attributes: ["title"],
								where: language.buildLanguageQuery({}, reqData.langId, '`doctorprofile.doctortags.tagdetails`.`tagId`', models.tagdetail, 'tagId')
							}],
							required: false
						}
						]
					},
					{
						model: models.articlelike,
						attributes: ["id"],
						where: {
							keyId: profileData.id
						},
						required: false
					},
					{
						model: models.starredarticle,
						attributes: ["id"],
						where: {
							keyId: profileData.id
						},
						required: false
					}
				],
				where: {
					id: reqData.id,
					status: 1,
					is_active: 1
				}
			}).then(function(data) {
				models.article.findAll({
					attributes: [
						"id",
						"keyId",
						"article_image",
						"createdAt", [models.sequelize.literal('(SELECT COUNT(article_likes.id) FROM article_likes WHERE article_likes.articleId = article.id)'), 'total_likes']
					],
					where: {
						keyId: data.keyId,
						id: {
							$ne: data.id
						},
						status: 1,
						is_active: 1
					},
					include: [{
							model: models.articledetail,
							attributes: ["title", "body"],
							where: language.buildLanguageQuery({}, reqData.langId, '`article`.`id`', models.articledetail, 'articleId')
						},
						{

							model: models.doctorprofile,
							attributes: [
								"id",
								"salutation",
								"doctor_profile_pic"
							],
							include: [{
								model: models.doctorprofiledetail,
								attributes: ["name"],
								where: language.buildLanguageQuery({}, reqData.langId, '`doctorprofile.doctorprofiledetails`.`id`', models.doctorprofiledetail, 'doctorProfileId')
							}, {
								model: models.doctortags,
								attributes: ["tagId"],
								where: {
									tagtypeId: specializationTagtypeId
								},
								include: [{
									model: models.tagdetail,
									attributes: ["title"],
									where: language.buildLanguageQuery({}, reqData.langId, '`doctorprofile.doctortags.tagdetails`.`tagId`', models.tagdetail, 'tagId')
								}],
								required: false
							}]
						},
						{
							model: models.articlelike,
							attributes: ["id"],
							where: {
								keyId: profileData.id
							},
							required: false
						},
						{
							model: models.starredarticle,
							attributes: ["id"],
							where: {
								keyId: profileData.id
							},
							required: false
						}
					],
					limit: 2
				}).then(function(otherArticles) {
					res({
						status: true,
						message: language.lang({
							key: "Article detail",
							lang: req.lang
						}),
						data: data,
						other_articles: otherArticles
					});
				}).catch(() => res({
					status: false,
					error: true,
					error_description: language.lang({
						key: "Internal Error",
						lang: req.lang
					}),
					url: true
				}));
			}).catch(() => res({
				status: false,
				error: true,
				error_description: language.lang({
					key: "Internal Error",
					lang: req.lang
				}),
				url: true
			}));
		})
	};

	/*
	 * mark/unmark star article
	 */
	this.markStarred = function(req, res) {
		if("undefined" === typeof req.userId || "undefined" === typeof req.articleId || "" === req.userId || "" === req.articleId) {
			res({status: false, message:language.lang({key:"Required data missing", lang:req.lang})})
		} else {
			models.patient.findOne({
				attributes: ["id", "userId"],
				where: {userId: req.userId}
			}).then(function(userProfileData) {
				if(userProfileData) {
					let patientId = userProfileData.id;
					models.starredarticle.findOne({
						where: {keyId: patientId, articleId: req.articleId}
					}).then(function(alreadyStarredData) {
						if(alreadyStarredData) {
							models.starredarticle.destroy({
								where: {id: alreadyStarredData.id}
							}).then(function(result) {
								res({status: true, message:language.lang({key:"updatedSuccessfully", lang:req.lang})})
							}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
						} else {
							models.starredarticle.create({keyId: patientId, articleId: req.articleId}, {}).then(function(result){
								res({status: true, message:language.lang({key:"updatedSuccessfully", lang:req.lang})})
							}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
						}
					}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));	
				} else {
					res({status: false, message:language.lang({key:"invalidUserDetails", lang:req.lang})})
				}
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
		}
	}



 /*
	 * like unlike article
	 */
	this.like = function(req, res) {
		if("undefined" === typeof req.userId || "undefined" === typeof req.articleId || "" === req.userId || "" === req.articleId) {
			res({status: false, message:language.lang({key:"Required data missing", lang:req.lang})})
		} else {
			models.patient.findOne({
				attributes: ["id", "userId"],
				where: {userId: req.userId}
			}).then(function(userProfileData) {
				if(userProfileData) {
					//let patientId = userProfileData.id;
					models.articlelike.findOne({
						where: {keyId: userProfileData.id, articleId: req.articleId}
					}).then(function(articleLikeData) {
						if(articleLikeData) {
							models.articlelike.destroy({
								where: {id: articleLikeData.id}
							}).then(function(result) {
								res({status: true, message:language.lang({key:"Article Unlike", lang:req.lang}),data:{like:0}})
							}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
						} else {
							models.articlelike.create({keyId: userProfileData.id, articleId: req.articleId}, {}).then(function(result){
								res({status: true, message:language.lang({key:"Article Liked", lang:req.lang}),data:{like:1}})
							}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
						}
					}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));	
				} else {
					res({status: false, message:language.lang({key:"invalidUserDetails", lang:req.lang})})
				}
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
		}
	}


	this.getAtarredArticles = function(req, res) {

		if("undefined" === typeof req.userId || "" == req.userId) {
			res({status: false, message:language.lang({key:"Required data missing", lang:req.lang})})
		} else {
			var setPage = "undefined" === typeof req.limit ? 25 : req.limit ;
			var currentPage = "undefined" === typeof req.pageNo ? 1 : req.pageNo;
			var pag = 1;
			
			if (typeof req.pageNo !== 'undefined') {
				currentPage = +req.pageNo;
				pag = (currentPage - 1)* setPage;
				delete req.pageNo;
			} else {
				pag = 0;
			}

			models.patient.find({
				where: {userId: req.userId}
			}).then(function(associateProfileData) {
				if(associateProfileData) {
					models.starredarticle.find({
						attributes: [[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('articleId')), 'articleIds']],
						where: {keyId: associateProfileData.id},
						raw: true
					}).then(function(starredArticles) {
						if(starredArticles.articleIds) {

							let allTagtypeIds = utils.getAllTagTypeId()
							let specializationTagtypeId = allTagtypeIds.SpecializationTagId;

							models.article.hasMany(models.articledetail);
							models.article.hasMany(models.articlelike);
							models.article.belongsTo(models.doctorprofile, {foreignKey: 'keyId'});
							models.doctorprofile.hasMany(models.doctorprofiledetail);
							models.doctorprofile.hasMany(models.doctortags);
							models.doctortags.hasMany(models.tagdetail, {foreignKey: 'tagId', sourceKey: 'tagId'})

							models.article.hasMany(models.starredarticle, {foreignKey: 'articleId', sourceKey: 'id'});
							models.article.findAndCountAll({
								attributes: ["id", "keyId", "article_image", "article_tags", [models.sequelize.literal('(SELECT COUNT(article_likes.id) FROM article_likes WHERE article_likes.articleId = article.id)'), 'total_likes']],
								include: [
									{
										model: models.articledetail,
										attributes: ["title", "body"],
										where: language.buildLanguageQuery({}, req.langId, '`article`.`id`', models.articledetail, 'articleId')},
									{
										model: models.doctorprofile, attributes: ["id", "salutation"], required: false, 
										include: [
											{
												model: models.doctorprofiledetail, attributes: ["name"], where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'), required: false
											},
											{
												model: models.doctortags,
												attributes: ["tagId", "tagtypeId"],
												where: {tagtypeId: specializationTagtypeId},
												include: [
													{
														model: models.tagdetail,
														attributes: ["title"],
														where: language.buildLanguageQuery({}, req.langId, '`doctorprofile.doctortags`.`tagId`', models.tagdetail, 'tagId')
													}
												],
												required: false
											}
										]
									},
									{
										model: models.articlelike, 
										attributes: ["id"],
										where: {keyId: associateProfileData.id},
										required: false
									},
									{
										model: models.starredarticle, 
										attributes: ["id"],
										where: {keyId: associateProfileData.id},
										required: false
									}
								],
								where: {status: 1, is_active: 1, id: {$in: starredArticles.articleIds.split(",")}},
								order: [
									['id', 'DESC']
								],
								//distinct: true,
								limit: parseInt(setPage),
								offset: pag,
							}).then(function(articles){
								var totalData = articles.count;
								var pageCount = Math.ceil(totalData / setPage);
								res({status: true, data: articles.rows, pageNo: currentPage, limit: setPage})
								//res({status: true, message:language.lang({key:"Starred article list", lang:req.lang}), data: articles})
							})





							// models.article.findAll({
							//	 where: {id: {$in: starredArticles.articleIds.split(",")}}
							// }).then(function(articles) {
							//	 res({status: true, message:language.lang({key:"Starred article list", lang:req.lang}), data: articles})
							// }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
						} else {
							res({status: true, message:language.lang({key:"No record found", lang:req.lang}), data: []})
						}
					}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
				} else {
					res({status: false, message:language.lang({key:"invalidUserDetails", lang:req.lang})})
				}
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
		}
	}

	this.changeStatus = function(req, res) {
		if("undefined" === typeof req.id || '' == req.id) {
			res({status: false, message:language.lang({key:"invalidUserDetails", lang:req.lang})})
		} else {
			let status;
			if(req.actionType === "publish") status = 1;
			if(req.actionType === "reject") status = 2;

			models.article.update({status: status}, {where: {id: req.id}}).then(function(response) {
				res({status: true, message: language.lang({key: "updatedSuccessfully", lang: req.lang})})
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
		}
	}

	this.getById = function(req, res) {
		
		models.article.hasMany(models.articledetail);
		
		models.article.findOne({
			attributes: ["id", "keyId", "article_image", "article_tags", "createdAt"],
			include: [
				{model: models.articledetail, attributes: ["title", "body"], where: language.buildLanguageQuery({}, req.langId, '`article`.`id`', models.articledetail, 'articleId')},
			],
			where:{ id: req.id }
		}).then(function(data){
			const articleTagtypeId = utils.getAllTagTypeId()['ArticleHealthIntrestTopicsTagId'];
			tagtype.listByTypeIDForWeb({langId: req.langId, lang: req.lang, id: articleTagtypeId}, function(tagdata){
				res({data: data, article_tags: tagdata.data});
			});
		})//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	}

	this.activestatus = function(req, res) {
		models.article.update(req,{where:{id:req.id}}).then(function(data){
			res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
	};

	this.articleListForDocApp = function(req, res) {
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
		var isWhere = {};
		var orderBy = '';
		if (req.query) {
			var responseData = {};
			responseData.articledetail = {};
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
		}

		orderBy = 'id DESC';

		let includeModels = [{model: models.articledetail, where:isWhere.articledetail}];
		if(typeof reqData.user_type !== "undefined" && reqData.user_type === "doctor") {
			isWhere.article = {keyId: reqData.doctorProfileId}
		} else {
			isWhere.article = {keyId: reqData.doctorProfileId, status: 1, is_active: 1};
			includeModels.push({model: models.starredarticle, attributes: ["id"], where: {keyId: reqData.patientId}, required: false});
			includeModels.push({model: models.articlelike, attributes: ["id"], where: {keyId: reqData.patientId}, required: false});
		}

		
		models.article.hasMany(models.articledetail);
		models.article.hasMany(models.starredarticle, {foreignKey: 'articleId', sourceKey: 'id'});
		models.article.hasMany(models.articlelike);
		isWhere.articledetail = language.buildLanguageQuery(isWhere.articledetail, reqData.langId, '`article`.`id`', models.articledetail, 'articleId');

		models.article.findAndCountAll({
			attributes: ["id", "keyId", "article_tags", "article_image", "is_active", "status", "createdAt", "updatedAt", [models.sequelize.literal('(SELECT COUNT(article_likes.id) FROM article_likes WHERE article_likes.articleId = article.id)'), 'total_likes']],
			include: includeModels,
			where: isWhere.article,
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: parseInt(setPage),
			offset: pag, //subQuery: false
		}).then(function(result){
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);

			const articleTagtypeId = utils.getAllTagTypeId()['ArticleHealthIntrestTopicsTagId'];
			tagtype.listTagdetailByTagId({langId: reqData.langId, lang: reqData.lang, id: articleTagtypeId}, function(tagdata){
				res({
					status: true,
					message: language.lang({key: "Article list", lang: req.lang}),
					data:result.rows, 
					article_tags: tagdata,
					pageNo: currentPage, limit: setPage
				}); 
			})
		}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	}
	this.articleDetailForDocApp = function(req, res) {
		if(undefined === typeof req.id || req.id == '') {
			res({status: false, message: language.lang({key: "Missing required params", lang: req.lang})})	
		} else {
			models.article.hasMany(models.articledetail);
			models.article.findOne({
				attributes: ["id", "keyId", "article_tags", "article_image", "is_active", "status", "createdAt", "updatedAt", [models.sequelize.literal('(SELECT COUNT(article_likes.id) FROM article_likes WHERE article_likes.articleId = article.id)'), 'total_likes']],
				include: [{
					model: models.articledetail, where: language.buildLanguageQuery({}, req.langId, '`articles`.`id`', models.articledetail, 'articleId')
				}],
				where: {id: req.id}
			}).then(function(result){
				if(result)
					res({status: true, message: language.lang({key: "Article detail", lang: req.lang}), data: result})
				else
					res({status: false, message: language.lang({key: "invalidUserDetails", lang: req.lang})})
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
		}
	}

	this.doctorSaveApp = function(req, res){
		req.article_tags = req.article_tags.length === 0 ? '' : req.article_tags.join(",");

		var articleHasOneArticalDetail = models.article.hasOne(models.articledetail, {as: 'article_details'});
		req.article_details = {
			languageId: req.langId,
			title: req.title,
			body: req.article_body
		}
		
		var article = models.article.build(req);
		var articledetail = models.articledetail.build(req.article_details);
		var errors = [];
		async.parallel([
			function (callback) {
				article.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
			function (callback) {
				articledetail.validate().then(function (err) {
					if (err !== null) {
						errors = errors.concat(err.errors);
						callback(null, errors);
					} else {
						callback(null, errors);
					}
				}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
			},
		], function (err, errors) {
			var merged = [].concat.apply([], errors);
			var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
			if (uniqueError.length === 0) {
				if (typeof req.id !== 'undefined' && req.id !== '') {
					req.article_details.articleId = req.id;
					models.article.update(req,{where: {id:req.id}}).then(function(data){
						models.articledetail.find({where:{articleId:req.id,languageId:req.langId}}).then(function(resultData){
							if (resultData !==null) {
								req.article_details.id = resultData.id;
								models.articledetail.update(req.article_details, {where:{id:resultData.id, articleId:req.id,languageId:req.langId}}).then(function(){
									res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
								}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
							} else {
								delete req.article_details.id;
								models.articledetail.create(req.article_details).then(function(){
									res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
								}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
							}
						}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
					}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
				} else {
					var langId = parseInt(req.article_details.languageId);
					models.article.create(req, {include: [articleHasOneArticalDetail]}).then(function(data){
						if (langId === 1) {
							res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
						} else {
							req.article_details.articleId = data.id;
							req.article_details.languageId = 1;
							models.articledetail.create(req.article_details).then(function(){
								res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
							}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
						}
					}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
				}
			} else {
				language.errors({errors:uniqueError, lang:req.lang}, function(errors){
					var newArr = {};
					newArr.errors = errors;
					res(newArr);
				});
			}
		});
	
	};
	
	this.most_like_article=function(req,res){
		models.sequelize.query(
		  'select newTb.most_like,newTb.artical_id,articles.article_image,articles.createdAt,articles.status,articles.is_active,article_details.title,article_details.body,doctor_profile_details.name,doctor_profiles.salutation from (select count(al.articleId) as most_like,articleId as artical_id from article_likes al group by articleId) as newTb RIGHT JOIN articles on(articles.id=newTb.artical_id) INNER JOIN article_details on(article_details.articleId=articles.id) INNER JOIN doctor_profiles on(doctor_profiles.id=articles.keyId) INNER JOIN doctor_profile_details on(doctor_profile_details.doctorProfileId=doctor_profiles.id) where article_details.languageId=IFNULL((SELECT `languageId` FROM `article_details` WHERE `article_details`.`articleId` = `articles`.`id` AND `article_details`.`languageId`='+req.langId+'),1) and articles.status = 1 and articles.is_active = 1 order by newTb.most_like desc limit 1', { type: models.sequelize.QueryTypes.SELECT }
		).then(function(data){

			if(data.length !== 0) {
				async.parallel({
					starredarticles: function(callback) {
						models.starredarticle.findAll({
							attributes:['id'],
							where:{
								keyId:req.patientId,
								articleId:data[0].artical_id
							},
						}).then(function(starredarticleData){
							callback(null, starredarticleData);
						})
					  
					},
					articlelikes: function(callback) {
					  
						models.articlelike.findAll({
							attributes:['id'],
							where:{
								keyId:req.patientId,
								articleId:data[0].artical_id
							},
						}).then(function(articlelikesData){
							callback(null, articlelikesData);
						})
					}
				}, function(err, results) {
					res({
						status:true,
						message:'Most Liked View',
					   // newdata:data,
						data:[
							{
							id:data[0].artical_id,
							article_image:data[0].article_image,
							total_likes:data[0].most_like,
							createdAt:data[0].createdAt,
							articledetails:[
								{title:data[0].title,body:data[0].body}
							  ],
							  doctorprofile:{salutation: data[0].salutation,doctorprofiledetails:[{name:data[0].name}]},
							  articlelikes:results.articlelikes,
							  starredarticles:results.starredarticles,
		  
		  
						  }
						 
					  ]
					  });
				});
			} else {
				res({status: true, data: [], message: "No record."})
			}
		  })
	}

	this.publish = function(req, res) {
		if(req.id && req.doctorProfileId && req.lang && req.langId) {
			models.article.findOne({where: {id: req.id, keyId: req.doctorProfileId}}).then(function(articleDetail) {
				if(articleDetail !== null) {
					models.article.update({status: 0}, {where: {id: articleDetail.id}}).then(function(resp) {
						res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang})});
					}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
				} else {
					res({status:false, message:language.lang({key:"Invalid detail.", lang:req.lang})});
				}
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
		} else {
			res({status:false, message:language.lang({key:"Missing required parameters.", lang:req.lang})});
		}
	}

	this.remove = function(req, res) {
		if(req.id && req.doctorProfileId && req.lang && req.langId) {
			models.article.findOne({where: {id: req.id, keyId: req.doctorProfileId, status: 3}}).then(function(articleDetail) {
				if(articleDetail !== null) {
					models.articledetail.destroy({where: {articleId: articleDetail.id}}).then(function(resp) {
						models.article.destroy({where: {id: articleDetail.id}}).then(function(resp) {
							res({status:true, message:language.lang({key:"deletedSuccessfully", lang:req.lang})});
						})
					}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
				} else {
					res({status:false, message:language.lang({key:"Invalid detail.", lang:req.lang})});
				}
			}).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
		} else {
			res({status:false, message:language.lang({key:"Missing required parameters.", lang:req.lang})});
		}
	}
  
}
module.exports = new article();