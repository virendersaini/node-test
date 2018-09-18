'use strict';

const models = require('../models'),
 language = require('./language'),
 utils = require('./utils');
 var mongo = require('../config/mongo');

function Medicine() {

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

		where.medicinedetail = language.buildLanguageQuery(
			where.medicinedetail, reqData.langId, '`medicine`.`id`', models.medicinedetail, 'medicineId'
		);
		where.categorydetail = language.buildLanguageQuery(
			where.categorydetail, reqData.langId, '`category`.`id`', models.categorydetail, 'categoryId'
		);
		models.medicine.hasMany(models.medicinedetail);
		models.medicine.belongsTo(models.category);
		models.category.hasMany(models.categorydetail);
		models.medicine.findAndCountAll({
			include: [
				{ model: models.medicinedetail, where: where.medicinedetail},
				{ model: models.category,include:[
						{ model: models.categorydetail, where: where.categorydetail},
					]},
			],
			distinct: true,
			where: where.medicine,
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
this.cart_list = (req,res) =>{
		models.patientcart.belongsTo(models.medicine);
		models.medicine.hasMany(models.medicinedetail);
		models.patientcart.findAll({
				include: [
					{
						model:models.medicine,include:[
						{
							model: models.medicinedetail
							, where: language.buildLanguageQuery(
								{}, req.langId, '`medicine`.`id`', models.medicinedetail, 'medicineId'
							)
						}
						]
					}
				],
				where:{patientId:req.body.patientId}
			}).then(resData =>{
				if(resData.length>0){
					for(var i=0;i<resData.length;i++){
						resData[i] = resData[i].medicine
					}
				}
				res({
					status:true,
					message:language.lang({key: "Patient Cart List", lang: req.lang}),
					data:resData
				})
			}).catch(() => res({
			status:false,
			error: true,
			error_description: language.lang({key: "Internal Error", lang: req.lang}),
			url: true
		}));
}
this.add_to_cart = (req,res) => {
	console.log(req.body.id)
	if(typeof req.body.id!=='undefined' && req.body.id!=''){
		
		if(typeof req.body.prescription_image!=='undefined' && req.body.prescription_image!=''){
			
			models.patientcart.findOne({
				where:{
					id:req.body.id,
				}
			}).then(updateImage =>{
				var fs = require('fs');
				var filePath = updateImage.prescription_image; 
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath,(err)=>{});
				}
			})
		}
		models.patientcart.update(req.body, {where:{id:req.body.id}}).then(updateData =>{
				res({
					status:true,
					message:language.lang({key:"updatedSuccessfully", lang:req.lang}),
					data:updateData
				})
			}).catch(() =>res({
					status:false,
					error: true,
					error_description: language.lang({key: "Internal Error", lang: req.lang}),
				}))
	}else{
	models.patientcart.findOne({
		where:{
			patientId:req.body.patientId,
			medicineId:req.body.medicineId
		}
	}).then(existsdata =>{
		if(existsdata==null){
			models.patientcart.create(req.body	).then(cartData =>{
				res({
					status:true,
					message:language.lang({key:"addedSuccessfully", lang:req.lang}),
					data:cartData
				})
			}).catch(() =>res({
					status:false,
					error: true,
					error_description: language.lang({key: "Internal Error", lang: req.lang}),
				}))
		}else{
			res({
					status:true,
					message:language.lang({key:"This item is already in your cart list", lang:req.lang}),
				})
		}
	}).catch(() => res({
			status:false,
			error: true,
			error_description: language.lang({key: "Internal Error", lang: req.lang}),
		}));
}
}
	this.getById = function(req, res) {
		models.medicine.hasMany(models.medicinedetail);
		models.medicine.findById(
			req.id
			, {
				include: [
					{
						model: models.medicinedetail
						, where: language.buildLanguageQuery(
							{}, req.langId, '`medicine`.`id`', models.medicinedetail, 'medicineId'
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
this.savePriceQty = function(req,res){
	
	models.medicine.build(req.body).validate().then(function(error){
		console.log('=====error=========');
		if(error){
		var errors = error.errors[0].message;
		res({status: false,message:errors});
	}else{
		models.medicine.update(req.body, {where: {id: req.body.id}})
		.then(function(data){ 
			res({
			status: true
			, message: language.lang({key:"updatedSuccessfully", lang:req.lang})
			, data: data
		})
		}).catch(() => ({
			status: false
			, error: true
			, error_description: language.lang({key:"Internal Error", lang: req.lang})
			, url: true
		}))
	}
	})
	
}
	this.save = function (req, res) {
		
		if (typeof req.is_active === 'undefined') {
			req.is_active = 0;
		}
		if (typeof req.is_prescription === 'undefined') {
			req.is_prescription = 0;
		}
		const MedicineHasOne = models.medicine.hasOne(models.medicinedetail, {as: 'medicinedetail'});
		req.medicinedetail.languageId = req.langId;

		Promise.all([
			models.medicine.build(req).validate().then(err => err)
			, models.medicinedetail.build(req.medicinedetail).validate().then(err => err)
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
				models.medicine.hasMany(models.medicinedetail);
				return models.medicine.findAll({
					include: [
						{model: models.medicinedetail, where: language.buildLanguageQuery({title: req.medicinedetail.title}, req.langId, '`medicine`.`id`', models.medicinedetail, 'medicineId')}
					]
				}).then(function(tagData) {
					if(tagData.length == 0) {
						return models.medicine.create(req, {include: [MedicineHasOne]})
							.then(data => {

									if (req.langId == 1) {
										return {
											status: true
											, message: language.lang({key:"addedSuccessfully", lang: req.lang})
											, data: data
										};
									} else {
										req.medicinedetail.medicineId = data.id;
										req.medicinedetail.languageId = 1;
										return models.medicinedetail.create(req.medicinedetail)
										.then(medicinedetail => ({
											status: true
											, message: language.lang({key:"addedSuccessfully", lang: req.lang})
											, data: data
										}));
									}
							});	
					} else {
						return {status: false, message: language.lang({key:"alreadyMedicineExist", lang: req.lang}), errors: true};
					}
				})
			} else {
				models.medicine.hasMany(models.medicinedetail);
				return models.medicine.findAll({
					where: {id: {$ne: req.id}}, 
					include: [
						{model: models.medicinedetail, where: language.buildLanguageQuery({title: req.medicinedetail.title}, req.langId, '`medicine`.`id`', models.medicinedetail, 'medicineId')}
					]
				}).then(function(tagData) {
					if(tagData.length == 0) {
						return models.medicine.update(req, {where: {id: req.id}})
						.then(data => {

							return models.medicinedetail.findOne({where: {medicineId: req.id, languageId: req.langId}})
							.then(medicinedetail => {
								if (medicinedetail === null) {
									req.medicinedetail.medicineId = req.id;
									req.medicinedetail.languageId = req.langId;
									delete req.medicinedetail.id;
									return models.medicinedetail.create(req.medicinedetail);
								} else {
									return medicinedetail.update(req.medicinedetail).then(() => data);
								}
							})
							.then((medicinedetail) => {
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
		/*.catch(() => ({
			status: false
			, error: true
			, error_description: language.lang({key:"Internal Error", lang: req.lang})
			, url: true
		})
	)*/
		.then(res);
	};

	this.status = function (req, res) {

		models.medicine.update(req, {where: {id: req.id}})
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

	this.categoryList = function (req, res) {
    let where = {}
    where.categorydetail = language.buildLanguageQuery(
      where.categorydetail, req.langId, '`category`.`id`', models.categorydetail, 'categoryId'
    );
    models.category.hasMany(models.categorydetail);
    models.category.findAll({
      include: [
        { model: models.categorydetail, where: where.categorydetail}
      ],
      distinct: true,
      where: {is_active:1},
      order: [
        ['id', 'DESC']
      ]
    })
    .then(result => {
      res({
        status: true,
        data: result
      });
    })
    .catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error",lang: req.lang}),
      url: true
    }));
  };

}

module.exports = new Medicine();
