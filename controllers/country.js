var async = require('async');
const models = require('../models');
var language = require('./language');
var currency = require('./currency');

function Country() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var CountryHasOne = models.country.hasOne(models.countrydetail, {as: 'country_detail'});
    req.country_detail.languageId = req.langId;
    var country = models.country.build(req);
    var countryDetails = models.countrydetail.build(req.country_detail);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
        country.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }

            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        },
        function (callback) {
            countryDetails.validate().then(function (err) {
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
            req.country_detail.countryId = req.id;
            models.country.update(req,{where: {id:req.id}}).then(function(data){
              models.countrydetail.find({where:{countryId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.country_detail.id = resultData.id;
                  models.countrydetail.update(req.country_detail, {where:{id:resultData.id, countryId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                } else {
                  delete req.country_detail.id;
                  models.countrydetail.create(req.country_detail).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          } else {
            var langId = parseInt(req.country_detail.languageId);
            models.country.create(req, {include: [CountryHasOne]}).then(function(data){
              if (langId === 1) {
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              } else {
                req.country_detail.countryId = data.id;
                req.country_detail.languageId = 1;
                models.countrydetail.create(req.country_detail).then(function(){
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


  /*
   * list of all
  */
  this.list = function(req, res) {
    //var data = JSON.parse(req.body.data);
    
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
      responseData.countrydetail = {};
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
    //isWhere['delete'] = 1;
    orderBy = 'id DESC';

    models.country.hasMany(models.countrydetail);
    models.country.belongsTo(models.currency);

    isWhere.countrydetail = language.buildLanguageQuery(
      isWhere.countrydetail, reqData.langId, '`country`.`id`', models.countrydetail, 'countryId'
    );
    models.country.findAndCountAll({
      include: [
        {model: models.countrydetail, where:isWhere.countrydetail},
        {model: models.currency, where: isWhere.currency }
      ],
      where: isWhere.country,
      order: [
        ['id', 'DESC']
      ],
      distinct: true,
      limit: setPage,
      offset: pag, subQuery: false
    }).then(function(result){
      var totalData = result.count;
      var pageCount = Math.ceil(totalData / setPage);
      res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
  };

  /*
   * get By ID
  */
  this.getById = function(req, res) {
    models.country.hasMany(models.countrydetail);
    models.country.find(
      {include: [{
        model: models.countrydetail, 
        where: language.buildLanguageQuery({}, req.langId, '`country`.`id`', models.countrydetail, 'countryId')}], 
        where:{
          id:req.id
        }
      }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
  * Update for react-redux admin
  */
  this.getEditData = function(req, res) {
    models.country.hasMany(models.countrydetail);
    models.country.find(
      {include: [{
        model: models.countrydetail, 
        where: language.buildLanguageQuery({}, req.langId, '`country`.`id`', models.countrydetail, 'countryId')}], 
        where:{
          id:req.id
        }
      }).then(function(data){
        module.exports.getMetaInformations(req, function(result){
          res({data:data, currencies:result.currencies, isoCodes:result.isoCodes});
        });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get All Country
  */
  this.getAllCountry = function(req, res) {
    models.country.hasMany(models.countrydetail);
    models.country.findAll({
      include: [
        {model: models.countrydetail, where: language.buildLanguageQuery({}, req.langId, '`country`.`id`', models.countrydetail, 'countryId')}
      ],
      where:{is_active:1},
      order: [
        [models.countrydetail, 'name', 'ASC']
      ]
    }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * status update
  */
  this.status = function(req, res) {
    models.country.update(req,{where:{id:req.id}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getISOCodes = function (req, res) {
    models.countryisocode.findAll({
      attributes: [
        'iso', 'name'
      ]
    })
    .then(res)
    .catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true
    }));
  };

  this.getMetaInformations = function(req, res){
    currency.list(req, function(currencies){
      module.exports.getISOCodes(req, function(isoCodes){
        res({currencies:currencies, isoCodes:isoCodes});
      });
    });
  };
}

module.exports = new Country();
