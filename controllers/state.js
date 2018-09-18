var async = require('async');
const models = require('../models');
var language = require('./language');
var country = require('./country');

function State() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var StateHasOne = models.state.hasOne(models.statedetail, {as: 'state_detail'});
    req.state_detail.languageId = req.langId;
    var state = models.state.build(req);
    var stateDetails = models.statedetail.build(req.state_detail);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
        state.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }

            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        },
        function (callback) {
            stateDetails.validate().then(function (err) {
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
            req.state_detail.stateId = req.id;
            models.state.update(req,{where: {id:req.id}}).then(function(data){
              models.statedetail.find({where:{stateId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.state_detail.id = resultData.id;
                  models.statedetail.update(req.state_detail, {where:{id:resultData.id, stateId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                } else {
                  delete req.state_detail.id;
                  models.statedetail.create(req.state_detail).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          } else {
            var langId = parseInt(req.state_detail.languageId);
            models.state.create(req, {include: [StateHasOne]}).then(function(data){
              if (langId === 1) {
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              } else {
                req.state_detail.stateId = data.id;
                req.state_detail.languageId = 1;
                models.statedetail.create(req.state_detail).then(function(){
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
      responseData.statedetail = {};
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

    models.state.hasMany(models.statedetail);
    models.state.belongsTo(models.country);
    models.country.hasMany(models.countrydetail);

    isWhere.statedetail = language.buildLanguageQuery(
      isWhere.statedetail, reqData.langId, '`state`.`id`', models.statedetail, 'stateId'
    );

    isWhere.countrydetail = language.buildLanguageQuery(
      isWhere.countrydetail, reqData.langId, '`country`.`id`', models.countrydetail, 'countryId'
    );

    models.state.findAndCountAll({
      include: [
        {model: models.statedetail, where:isWhere.statedetail},
        {model:models.country, include: [{model: models.countrydetail, where:isWhere.countrydetail}]}
      ],
      where: isWhere.state,
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
    models.state.hasMany(models.statedetail);
      models.state.belongsTo(models.country);
      models.country.hasMany(models.countrydetail);
    models.state.find({
      include: [
      {
        model: models.statedetail, 
        where: language.buildLanguageQuery({}, req.langId, '`state`.`id`', models.statedetail, 'stateId')

      },
      {
        model: models.country,
        include:[
         { model: models.countrydetail, 
           where: language.buildLanguageQuery({}, req.langId, '`country`.`id`', models.countrydetail, 'countryId')
         }
        ]

      }
        ], 
        where:{
          id:req.id
        }}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
  * Update for react-redux admin
  */
  this.getEditData = function(req, res) {
    models.state.hasMany(models.statedetail);
    models.state.find({
      include: [{
        model: models.statedetail, 
        where: language.buildLanguageQuery({}, req.langId, '`state`.`id`', models.statedetail, 'stateId')
      }], 
      where:{
        id:req.id
      }
    }).then(function(data){
      module.exports.getMetaInformations(req, function(result){
        res({data:data, countries:result.countries});
      });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.state.update(req,{where:{id:req.id}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get All State
  */
 this.getAllState = function(req, res) {
    models.state.hasMany(models.statedetail);
    models.state.belongsTo(models.country);
    models.state.findAll({
      include: [
        {model: models.statedetail, where: language.buildLanguageQuery({}, req.langId, '`state`.`id`', models.statedetail, 'stateId')},
        {model: models.country, attributes: ["id"], where: {is_active: 1}}
      ],
      where:{is_active:1, countryId:req.countryId},
      order: [
        [models.statedetail, 'name', 'ASC']
      ]
    }).then(function(data){
      res({data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getMetaInformations = function(req, res){
    country.getAllCountry(req, function(countries){
        res({countries:countries});
    });
  };
}



module.exports = new State();
