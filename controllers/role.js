var async = require('async');
const models = require('../models');
var language = require('./language');
var permission = require('./permission');

function Role() {
  /*
   * save
  */
  this.save = function(req, res){
    if (! res) res = (x => x);
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var RoleHasOne = models.role.hasOne(models.roledetail, {as: 'role_detail'});
    //var rolepermissionHasOne = models.role.hasMany(models.rolepermission, {as: 'rolepermissions'});


    req.role_detail.languageId = req.langId;
    req.role_detail.masterId = req.masterId;
    var roleDetails = models.roledetail.build(req.role_detail);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
            roleDetails.validate().then(function (err) {
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
            req.role_detail.roleId = req.id;
            models.role.update(req,{where: {id:req.id}}).then(function(data){
              models.roledetail.find({where:{roleId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.role_detail.id = resultData.id;
                  models.roledetail.update(req.role_detail, {where:{id:resultData.id, roleId:req.id,languageId:req.langId}}).then(function(){
                    module.exports.createPermission({id:req.id, permissionIds:req.permissionIds}, function(){
                      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                    });
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                } else {
                  delete req.role_detail.id;
                  models.roledetail.create(req.role_detail).then(function(){
                    module.exports.createPermission({id:req.id, permissionIds:req.permissionIds}, function(){
                      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                    });
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          } else {
            var langId = parseInt(req.role_detail.languageId);
            models.role.create(req, {include: [RoleHasOne]}).then(function(data){
              module.exports.createPermission({id:data.id, permissionIds:req.permissionIds}, function(){
                if (langId === 1) {
                  res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                } else {
                  req.role_detail.roleId = data.id;
                  req.role_detail.languageId = 1;
                  models.roledetail.create(req.role_detail).then(function(){
                    res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              });
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
    var reqData = req.body.data ? JSON.parse(req.body.data) : req.body;
    var isWhere = {};
    var orderBy = '';
    if (req.query) {
      var responseData = {};
      responseData.role = {id:{$ne:0}};
      responseData.role.masterId = reqData.masterId;
      responseData.roledetail = {};
      responseData.institutedetail = {};
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

    isWhere.roledetail = language.buildLanguageQuery(
      isWhere.roledetail, reqData.langId, '`role`.`id`', models.roledetail, 'roleId'
    );


    models.role.hasMany(models.roledetail);
    models.role.findAndCountAll({
      include: [
        {model: models.roledetail, where:isWhere.roledetail},
      ],
      where: isWhere.role,
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
    models.role.hasMany(models.roledetail);
    models.role.hasMany(models.rolepermission);
    models.role.find({
      include: [{
        model: models.roledetail, 
        where: language.buildLanguageQuery({}, req.langId, '`role`.`id`', models.roledetail, 'roleId')},
        {model: models.rolepermission}], 
        where:{
          id:req.id,
          masterId: req.masterId
        }}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

/*
Update for React-Redux admin
*/
 this.getEditData = function(req, res) {
    models.role.hasMany(models.roledetail);
    models.role.hasMany(models.rolepermission);
    models.role.find({
      include: [{
        model: models.roledetail, 
        where: language.buildLanguageQuery({}, req.langId, '`role`.`id`', models.roledetail, 'roleId')
      },{
        model: models.rolepermission
      }], 
      where:{
        id:req.id,
        masterId: req.masterId
      }
    }).then(function(data){
      module.exports.getMetaInformations(req, function(result){
        res({data:data, permissions: result.permissions});
      });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get All Country
  */
 this.getAllRole = function(req, res) {
    models.role.hasMany(models.roledetail);
    models.role.findAll({
        include: [
      {model: models.roledetail, where: language.buildLanguageQuery({}, req.langId, '`role`.`id`', models.roledetail, 'roleId')}
  ],
      where:{is_active:1, id:{$ne:0}}
      
    }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.role.update(req,{where:{id:req.id, masterId: req.masterId}}).then(function(data){
      res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get Teacher Role
  */
 this.getAutoRoleId = function(req, res) {
    models.role.find({
      attributes:['id'],
      where:{masterId:req.masterId, slug:req.slug},
    }).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.createPermission = function(req, res){
    var roleId = req.id;
    models.rolepermission.destroy({where:{roleId:roleId}}).then(function(){
      var count =1;
      var permissionData = [];
      var permissionIds = [];
      if (typeof req.permissionIds !=='undefined') {
        permissionIds = req.permissionIds;
      }
      permissionIds.push('1');
      async.forEach(permissionIds, function (item, callback) {
        var saveData = {};
        models.permission.find({
          where: {
            id: item
          }
        }).then(function (result) {
          saveData.roleId = roleId;
          saveData.permissionId = result.id;
          saveData.module_name = result.model;
          permissionData.push(saveData);
          if (permissionIds.length ==count) {
            callback(permissionData);
          }
        count++;
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      }, function () {
        models.rolepermission.bulkCreate(permissionData).then(function(data){
          res(data);
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };


  this.getMetaInformations = function(req, res){
    permission.getAllPermission(req, function(permissions){
        res({permissions:permissions});
    });
  };

  this.getSignupRoles = function(req, res) {
    models.role.hasMany(models.roledetail);
    models.role.findAll({
      include: [
        {model: models.roledetail, where: language.buildLanguageQuery({}, req.langId, '`role`.`id`', models.roledetail, 'roleId')}
      ],
      where:{is_active:1, id:{$ne:0}, slug:{$notIn: ['patient']}}
    }).then(function(data){
      res(data);
    })
    //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  }

}

module.exports = new Role();
