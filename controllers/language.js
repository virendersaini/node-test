var I18n = require('i18n-2');
var async = require('async');
var i18n = new I18n({locales: ['ar', 'en']});
const models = require('../models');

const localeOptions = {
  locales: ['ar', 'en']
};

const rlLocales = ['ar'];

function Language() {

  /*
   * set language
  */
  this.lang =function(req){
    i18n.setLocale(req.lang);
    if(req.params) {
      return i18n.__(req.key, req.params)
    } else {
      return i18n.__(req.key);
    }
    
  };

  /*
   * set language for errors
  */
  this.errors =function(req, res){
    i18n.setLocale(req.lang);
    var err = [];
    var count = 1;
    async.forEach(req.errors, function (item, callback) {
       var error = {};
        error.path = item.path;
        error.message = i18n.__(item.message);
        err.push(error);
        if (req.errors.length == count) {
          callback(req.errors);
        }
        count++;
    }, function () {
      res(err);
    });
  };

  /*
   * save language
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var usr = models.language.build(req);
    usr.validate().then(function (err) {
      if (err !== null) {
        module.exports.errors({errors:err.errors, lang:req.lang}, function(errors){
            err.errors = errors;
            res(err);
        });
      } else {
        if (typeof req.id !== 'undefined' && req.id !== '') {
          models.language.update(req, {where: {id:req.id}}).then(function(data){
            res({status:true, message:module.exports.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        } else {
          models.language.create(req).then(function(data){
            res({status:true, message:module.exports.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }
      }
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * list of all language
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
    var isWhere = {};
    var orderBy = '';
    if (req.query) {
      var responseData = {};
        async.forEach(Object.keys(req.query), function (item, callback) {
        if (req.query[item] !== ''){
          responseData[item] = {$like: '%' + req.query[item] + '%'};
        }
        callback();
        }, function () {
        isWhere = responseData;
      });
    }
    //isWhere['delete'] = 1;
    orderBy = 'id DESC';
    models.language.findAndCountAll({where: isWhere, order: orderBy, limit: setPage, offset: pag, subQuery: false}).then(function(result){
      var totalData = result.count;
      var pageCount = Math.ceil(totalData / setPage);
      res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage });
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
  };

  /*
   * get By ID
  */
 this.getById = function(req, res) {
    models.language.find({where:{id:req.id}}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * get All Language
  */
 this.getAllLanguage = function(req, res) {
	orderBy = 'id DESC';
    models.language.findAll({where:{id:{$ne:1}, is_active:1}, order: orderBy}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * status update
  */
 this.status = function(req, res) {
    models.language.update(req,{where:{id:req.id}}).then(function(data){
      res({status:true, message:module.exports.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  /*
   * User Languages
  */
 this.getUserLanguages = function(req, res) {
    if (req.masterId == 1 ) {
      models.language.findAll({where:{is_active:1}}).then(function(data){
        res(data);
      });
    } else {
      var langId = 1;
      if (req.secondary_lang !== 0) {
        langId = {$in:[1, req.secondary_lang]};
      }
      models.language.findAll({where:{is_active:1/*, id:langId*/}}).then(function(data){
        res(data);
      });
    }
  };
  /*
   *  Languages by id
  */
 this.geLanguageById = function(req, res) {
    models.language.find({where:{id:req.id}}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

this.bindLocale = function(obj, locale) {
  var i18n2 = new I18n(localeOptions);
  i18n2.setLocale(locale);
  var __ = i18n2.__.bind(i18n2);
  obj.langDirection = rlLocales.indexOf(locale) === -1 ? 'ltr' : 'rtl';
  obj.__ = function(str, obj) {
      if (!str) return __.apply(i18n2, arguments);
      if (obj  && obj.constructor === Object) {
          str = __(str);
          var index1 = str.indexOf('{{'), index2 = 0, res = '';
          while(index1 != -1) {
              res += str.substring(index2, index1);
              index2 = str.indexOf('}}', index1);
              if (index2 === -1) {
                  return res + str.substring(index1);
              } else {
                  res += obj[str.substring(index1 + 2, index2)] || '';
              }
              index2 += 2
              index1 = str.indexOf('{{', index2);
          }
          return res + str.substring(index2);
      } else {
          return __.apply(i18n2, arguments);
      }
  };
  return obj;
}

this.buildLanguageQuery = function (where, langId, sourceId, target, foreignKey) {
  where = where || {};
  langId = parseInt(langId);
  if (isNaN(langId)) langId = 1;
  var targetTableName = target.getTableName();
  if (langId == 1) {
    where.languageId = 1;
  } else {
    where.languageId = {
      $in:[
        models.sequelize.literal('IFNULL((SELECT `languageId` FROM `'
        + targetTableName+ '` WHERE ' + sourceId + ' = `'+ targetTableName
        + '`.`' + foreignKey +  '` AND `languageId` = '+ langId + '),1)')
      ]
    };
  }
  return where;
};

this.makeErrors = (err, lang) => {
  i18n.setLocale(lang);
  let errors = [], count = 0;
  for (let i = 0; i < err.length; i++) {
    let error = err[i];
    if (error === null) continue;
    error = error.errors;
    count++;
    for (let j = 0; j < error.length; j++) {
      errors.push({path: error[j].path, message: i18n.__(error[j].message)});
    }
  }
  return count === 0 ? null : errors;
};

}

module.exports = new Language();
