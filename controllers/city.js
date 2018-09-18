var async = require('async');
const models = require('../models');
var language = require('./language');
var country = require('./country');
var state = require('./state');

function City() {
  /*
   * save
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var CityHasOne = models.city.hasOne(models.citydetail, {as: 'city_detail'});
    req.city_detail.languageId = req.langId;
    var city = models.city.build(req);
    var cityDetails = models.citydetail.build(req.city_detail);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
        city.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }

            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error1", lang: req.lang}), url: true}));
        },
        function (callback) {
            cityDetails.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }
            })//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error2", lang: req.lang}), url: true}));
        }
    ], function (err, errors) {
        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});

       
        if (uniqueError.length === 0) {

          if (typeof req.id !== 'undefined' && req.id !== '') {

        models.sequelize.query(
            "select count(cities.id) as city_exist from cities" 
            +" inner join city_details on (city_details.cityId=cities.id)"
            +" where city_details.name='"+req.city_detail.name+"' and cities.countryId="+req.countryId+" and cities.id!="+req.id, 
            { type: models.sequelize.QueryTypes.SELECT}
            ).then(function(countData){
              if(countData[0].city_exist>0){
              res({status:false, errors: true, error_description: language.lang({key: "This city already exists in this country", lang: req.lang}), url: true})
              }else{
            req.city_detail.cityId = req.id;
            models.city.update(req,{where: {id:req.id}}).then(function(data){
              models.citydetail.find({where:{cityId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.city_detail.id = resultData.id;
                  models.citydetail.update(req.city_detail, {where:{id:resultData.id, cityId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error3", lang: req.lang}), url: true}));
                } else {
                  delete req.city_detail.id;
                  models.citydetail.create(req.city_detail).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error4", lang: req.lang}), url: true}));
                }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error5", lang: req.lang}), url: true}));
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error6", lang: req.lang}), url: true}));
          }
          })
          } else {



        models.sequelize.query(
            "select count(cities.id) as city_exist from cities" 
            +" inner join city_details on (city_details.cityId=cities.id)"
            +" where city_details.name='"+req.city_detail.name+"' and cities.countryId="+req.countryId, 
            { type: models.sequelize.QueryTypes.SELECT}
            ).then(function(countData){
              if(countData[0].city_exist>0){
              res({status:false, errors: true, error_description: language.lang({key: "This city already exists in this country", lang: req.lang}), url: true})
              }else{
                var langId = parseInt(req.city_detail.languageId);
                models.city.create(req, {include: [CityHasOne]}).then(function(data){
              if (langId === 1) {
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              } else {
                req.city_detail.cityId = data.id;
                req.city_detail.languageId = 1;
                models.citydetail.create(req.city_detail).then(function(){
                  res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error7", lang: req.lang}), url: true}));
              }
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error8", lang: req.lang}), url: true}));
          }
            })
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

    models.city.hasMany(models.citydetail);
    models.city.belongsTo(models.country);
    models.country.hasMany(models.countrydetail);
    models.city.belongsTo(models.state);
    models.state.hasMany(models.statedetail);

    isWhere.citydetail = language.buildLanguageQuery(
      isWhere.citydetail, reqData.langId, '`city`.`id`', models.citydetail, 'cityId'
    );
    isWhere.countrydetail = language.buildLanguageQuery(
      isWhere.countrydetail, reqData.langId, '`country`.`id`', models.countrydetail, 'countryId'
    );
    isWhere.statedetail = language.buildLanguageQuery(
      isWhere.statedetail, reqData.langId, '`state`.`id`', models.statedetail, 'stateId'
    );

    models.city.findAndCountAll({
      include: [
        {model: models.citydetail, where:isWhere.citydetail},
        {model:models.country, include: [{model: models.countrydetail, where:isWhere.countrydetail}]},
        {model:models.state, include: [{model: models.statedetail, where:isWhere.statedetail}]}
      ],
      where: isWhere.city,
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
   * list of all
  */
  this.cityList = function(req, res) {
    //var data = JSON.parse(req.body.data);
    var setPage = req.app.locals.site.page;
    //var setPage = 5;
   // console.log(setPage)
    var currentPage = 1;
    var pag = 1;
    if (typeof req.body.page !== 'undefined') {
        currentPage = +req.body.page;
        pag = (currentPage - 1)* setPage;
        delete req.body.page;
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

    models.city.hasMany(models.citydetail);
    models.city.belongsTo(models.state);
    models.city.belongsTo(models.country);
    models.state.hasMany(models.statedetail);

    isWhere.citydetail = language.buildLanguageQuery(
      isWhere.citydetail, reqData.langId, '`city`.`id`', models.citydetail, 'cityId'
    );
    isWhere.statedetail = language.buildLanguageQuery(
      isWhere.statedetail, reqData.langId, '`state`.`id`', models.statedetail, 'stateId'
    );

    models.city.findAndCountAll({
     attributes: [
       'id',
       ///[models.sequelize.fn('CONCAT', models.sequelize.literal('citydetails.name'),models.sequelize.literal('state.statedetails[name]')), 'idsss']
      
      ],
      include: [
        {model: models.citydetail,attributes:['name'], where:[isWhere.citydetail,{name:{$like:'%'+req.body.title+'%'}}]},
        {model:models.state,attributes:['id'], where: {is_active: 1}, include: [{model: models.statedetail,attributes:['name'], where:isWhere.statedetail}]},
        {model: models.country, attributes: ["id"], where: {is_active: 1}}
      ],
      where: [isWhere.city,{is_active:1}],
      order: [[models.citydetail, 'name', 'ASC']],
      distinct: true,
      limit: setPage,
      offset: pag,
       subQuery: false
    }).then(function(result){
      var totalData = result.count;
      var pageCount = Math.ceil(totalData / setPage);
      res({status:true,data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
    })//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
  };

/*
   * list of all
  */
  this.cityData = function(req, res) {
    orderBy = 'id DESC';

    models.city.hasMany(models.citydetail);
    models.city.belongsTo(models.state);
    models.state.hasMany(models.statedetail);
    isWhere={};
    isWhere.citydetail = language.buildLanguageQuery(
      isWhere.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId'
    );
    isWhere.statedetail = language.buildLanguageQuery(
      isWhere.statedetail, req.langId, '`state`.`id`', models.statedetail, 'stateId'
    );

    models.city.findAll({
     attributes: [
       'id',
       'countryId'
      ],
      include: [
        {model: models.citydetail,attributes:['name'], where:[isWhere.citydetail]},
        {model:models.state,attributes:['id'], include: [{model: models.statedetail,attributes:['name'], where:isWhere.statedetail}]}
      ],
      where: {id:req},
      order: [
        ['id', 'DESC']
      ],
      distinct: true,
    }).then(function(result){
      res({status:true,data:result});
    })
  };

  /*
   * get By ID
  */
 this.getById = function(req, res) {
    models.city.hasMany(models.citydetail);
    var isWhere = {};
    isWhere.citydetail = language.buildLanguageQuery(
      isWhere.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId'
    );

    models.city.find({
      include: [{model: models.citydetail, where:isWhere.citydetail}],
      where:{
        id:req.id
      },
    }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
  /*
  * Update for react-redux admin
  */
  this.getEditData = function(req, res) {
    models.city.hasMany(models.citydetail);
    var isWhere = {};
    isWhere.citydetail = language.buildLanguageQuery(
      isWhere.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId'
    );

    models.city.find({
      include: [{model: models.citydetail, where:isWhere.citydetail}],
      where:{
        id:req.id
      },
    }).then(function(data){
      module.exports.getMetaInformations(req, function(result){
        req.countryId = data.countryId;
        state.getAllState(req, function(states){
          res({data:data, countries:result.countries, states:states.data});
        });
      });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.city.update(req,{where:{id:req.id}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get All City of state
  */
 this.getAllCity = function(req, res) {
    models.city.hasMany(models.citydetail);
    models.city.belongsTo(models.state);
    models.city.belongsTo(models.country);
    var isWhere = {};
    isWhere.citydetail = language.buildLanguageQuery(
      isWhere.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId'
    );
    models.city.findAll({
      include: [
        {model: models.citydetail, where:isWhere.citydetail},
        {model: models.state, attributes: ["id"], where:{is_active: 1}},
        {model: models.country, attributes: ["id"], where:{is_active: 1}}
      ],
      where:{is_active:1, stateId:req.stateId},
      order: [
        [models.citydetail, 'name', 'ASC']
      ]
    }).then(function(data){
      res({data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get All City at once
  */
  this.getAllCityAtOnce = function(req, res) {
    models.city.hasMany(models.citydetail);
    models.city.belongsTo(models.country);
    models.city.belongsTo(models.state);
    models.state.hasMany(models.statedetail);
    var isWhere = {};
    isWhere.citydetail = language.buildLanguageQuery(
      isWhere.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId'
    );
    isWhere.statedetail = language.buildLanguageQuery(
      isWhere.statedetail, req.langId, '`state`.`id`', models.statedetail, 'stateId'
    );
    models.city.findAll({
      include: [
        {model: models.citydetail, where:isWhere.citydetail},
        {model:models.state, where: {is_active: 1}, attributes:['id'], include: [{model: models.statedetail,attributes:['name'], where:isWhere.statedetail}]},
        {model:models.country, attributes:["id"], where: {is_active: 1}},
      ],
      where:{is_active:1},
      order: [
        [models.citydetail, 'name', 'ASC']
      ]
    }).then(function(data){
      res({data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getCitiesByCountry = function(req, res) {
    models.city.hasMany(models.citydetail);
    models.city.belongsTo(models.country);
    var isWhere = {};
    isWhere.citydetail = language.buildLanguageQuery(
      isWhere.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId'
    );
    models.city.findAll({
      include: [
        {model: models.citydetail, where:isWhere.citydetail},
        {model: models.country, where:{is_active: 1}}
      ],
      where:{is_active:1, countryId: req.countryId},
      order: [
        [models.citydetail, 'name', 'ASC']
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

module.exports = new City();
