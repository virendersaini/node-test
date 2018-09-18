var async = require('async');
const models = require('../models');
var language = require('./language');

function Todo() {
  /*
   * save 
  */
  this.save = function(req, res){
    if (typeof req.is_active === 'undefined') {
      req.is_active = 0;
    }
    var todo = models.todo.build(req);
    todo.validate().then(function (err) {
      if (err !== null) {
        language.errors({errors:err.errors, lang:req.lang}, function(errors){
            err.errors = errors;
            res(err);
        });
      } else {
        if (typeof req.id !== 'undefined' && req.id !== '') {
          models.todo.update(req, {where: {id:req.id}}).then(function(data){
            res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        } else {
          models.todo.create(req).then(function(data){
            res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }
      }
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
  
  /*
   * get All 
  */
 this.getAllTodoList = function(req, res) {
    models.todo.findAll({where:{userId:req.id}, order: [['date', 'ASC'], ['id', 'DESC']]}).then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
  
  /*
   * get All 
  */
 this.remove = function(req, res) {
    models.todo.destroy({where:{id:req.id}}).then(function(){
      res({status:true, message:language.lang({key:"deletedSuccessfully", lang:req.lang})});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
}
module.exports = new Todo();