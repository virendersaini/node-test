var async = require('async');
const models = require('../models');
var language = require('./language');

function Permission() {
  /*
   * save
  */
  this.save = function(req, res){
    var PermissionHasOne = models.permission.hasOne(models.permissiondetail, {as: 'permission_detail'});
    req.permission_detail.languageId = req.langId;
	req.slug = req.action+'-'+req.model;
    var permission = models.permission.build(req);
    var permissionDetails = models.permissiondetail.build(req.permission_detail);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
        permission.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }

            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        },
        function (callback) {
            permissionDetails.validate().then(function (err) {
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
            req.permission_detail.permissionId = req.id;
            models.permission.update(req,{where: {id:req.id}}).then(function(data){
              models.permissiondetail.find({where:{permissionId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.permission_detail.id = resultData.id;
                  models.permissiondetail.update(req.permission_detail, {where:{id:resultData.id, permissionId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                } else {
                  delete req.permission_detail.id;
                  models.permissiondetail.create(req.permission_detail).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          } else {
            var langId = parseInt(req.permission_detail.languageId);
            models.permission.create(req, {include: [PermissionHasOne]}).then(function(data){
              if (langId === 1) {
                res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
              } else {
                req.permission_detail.permissionId = data.id;
                req.permission_detail.languageId = 1;
                models.permissiondetail.create(req.permission_detail).then(function(){
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
    var reqData = JSON.parse(req.body.data);
    var isWhere = {};
    var orderBy = '';
    if (req.query) {
      var responseData = {};
      responseData.permissiondetail = {};
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

    isWhere.permissiondetail = language.buildLanguageQuery(
      isWhere.permissiondetail, reqData.langId, '`permission`.`id`', models.permissiondetail, 'permissionId'
    );

    models.permission.hasMany(models.permissiondetail);
    models.permission.findAndCountAll({
      include: [
        {model: models.permissiondetail, where:isWhere.permissiondetail}
      ],
      where: isWhere.permission,
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
    models.permission.hasMany(models.permissiondetail);
    models.permission.find({include: [{model: models.permissiondetail, where: language.buildLanguageQuery({}, req.langId, '`permission`.`id`', models.permissiondetail, 'permissionId')}], where:{id:req.id}}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get All Permission
  */
 this.getAllPermission = function(req, res) {
    if (req.userId == 1) {
      models.permission.hasMany(models.permissiondetail);
      models.permission.findAll({include: [{model: models.permissiondetail, where: language.buildLanguageQuery({}, req.langId, '`permission`.`id`', models.permissiondetail, 'permissionId')}]}).then(function(data){
        res(data);
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    } else {
      models.permission.hasMany(models.permissiondetail);
      models.rolepermission.belongsTo(models.permission);
      models.rolepermission.findAll({
        include: [
            {model: models.permission, where:{id:{$ne:1}, is_active:1}, include:[{model: models.permissiondetail, where: language.buildLanguageQuery({}, req.langId, '`permission`.`id`', models.permissiondetail, 'permissionId')}]}
            ],
            where: {roleId:req.roleId},
            order: [[ models.permission, 'display_order', 'ASC']]
          }).then(function (data) {
        res(data);
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.permission.update(req,{where:{id:req.id}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
}

module.exports = new Permission();
