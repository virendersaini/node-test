var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var hospital = require('./hospital');
var utils = require('./utils');

function Hospitalfile() {

    this.list = function (req, res) {
	var pageSize = req.app.locals.site.page, // number of items per page
	page = req.query.page || 1;

	var reqData = req.body.data ? JSON.parse(req.body.data) : req.body, where = {
		hospitaldetail: {},
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
	models.hospitalfile.findAndCountAll({
		include: [],
		distinct: true,
		where: where.hospitalfile,
		order: [
			['id', 'DESC']
		],
		limit: pageSize,
		offset: (page - 1) * pageSize
	})
	.then(result => {
		res({
			status: true,
			message: language.lang({key: 'item_list', lang: req.lang}),
			data: result.rows,
			totalData: result.count,
			pageCount: Math.ceil(result.count / pageSize),
			pageLimit: pageSize,
			currentPage:page
		});
	})
	.catch(() => res({
		status:false,
		error: true,
		error_description: language.lang({key: "Internal Error",lang: req.lang}),
		url: true
	}));
};

  /*
   * save
  */
   this.save = function(req, res){
    var hospitalfile = models.hospitalfile.build(req);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
      function (callback) {
        hospitalfile.validate().then(function (err) {
            if (err !== null) {
                errors = errors.concat(err.errors);
                callback(null, errors);
            } else {
                callback(null, errors);
            }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      }
    ], function (err, errors) {
        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
        if (uniqueError.length === 0) {
          if (typeof req.id !== 'undefined' && req.id !== '') {

                  models.hospitalfile.update(req,{where: {id:req.id}, individualHooks: true}).then(function(data){
                    res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));

          } else {
                  models.hospitalfile.create(req, {individualHooks: true}).then(function(hospitalfiles){
                    utils.updateProfileStatusWhileUpdate({id: req.hospitalId, langId: req.langId}, function(resp) {
                      if(resp.status) {
                        let messageSent = req.file_type === 'video' ? "Video added successfully. It will take several minutes to process video. Once finished, it will reflected to your profile." : "addedSuccessfully";
                        res({status:true, message:language.lang({key:messageSent, lang:req.lang}), data:hospitalfiles});
                      } else {
                        res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})
                      }
                    })
                  })
                  //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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

  /*
   * status update
  */
  this.status = function(req, res) {
    models.hospitalfile.update(req,{where:{id:req.id}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
 /*
   * get By ID
  */
 this.getById = function(req, res) {
    models.hospital.hasMany(models.hospitaldetail);
      models.hospital.hasMany(models.hospitalfile);
    	models.hospital.belongsTo(models.country);
        models.hospital.belongsTo(models.state);
        models.hospital.belongsTo(models.city);
	models.country.hasMany(models.countrydetail);
        models.state.hasMany(models.statedetail);
        models.city.hasMany(models.citydetail);

    var isWhere = {};
    isWhere.hospitaldetail = language.buildLanguageQuery(
      isWhere.hospitaldetail, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'
    );
       isWhere.countrydetail = language.buildLanguageQuery(
		isWhere.countrydetail, req.langId, '`country`.`id`', models.countrydetail, 'countryId'
	);
 isWhere.statedetail = language.buildLanguageQuery(
		isWhere.statedetail, req.langId, '`state`.`id`', models.statedetail, 'stateId'
	);
 isWhere.citydetail = language.buildLanguageQuery(
		isWhere.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId'
	);
    models.hospital.find({
      include: [
        {model: models.hospitaldetail, where:isWhere.hospitaldetail},
          {model: models.hospitalfile, where:isWhere.hospitalfile},
          { model: models.country,include: [{model: models.countrydetail, where:isWhere.countrydetail}]},
                        { model: models.state,include: [{model: models.statedetail, where:isWhere.statedetail}]},
                        { model: models.city,include: [{model: models.citydetail, where:isWhere.citydetail}]}
      ],
      where:{id:req.id}
    }).then(function(data){
        country.getAllCountry(req, function(countries){
          req.countryId=data.countryId;
          req.stateId=data.stateId;
         state.getAllState(req, function(states){
          city.getAllCity(req, function(cities){
            res({data:data,countries:countries,states:states,cities:cities});
          })
          })
         });

    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
  /*delete hospital documents*/
  this.delete = function (req, res) {
  	models.hospitalfile.destroy({where: {id: req.id}})
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

}
module.exports = new Hospitalfile();
