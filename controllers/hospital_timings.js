var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');

function hospital_timings() {

  /*
   * save
  */
   this.save_timings = function(req, res){

     savedata = JSON.parse(req.body);
     console.log(savedata);
     return;

     var hospitalId = savedata.hospitalId;
     if(typeof savedata.data !== 'undefined'){
      //console.log('---data key----');
      data = savedata.data;
     }
    //console.log(data);
    var hospitalservice = models.hospitalservice.build(req);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
      function (callback) {
        hospitalservice.validate().then(function (err) {
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

                  models.hospitalservice.update(req,{where: {id:req.id}, individualHooks: true}).then(function(data){
                    res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));

          } else {
            models.hospitalservice.destroy({
                  where: {
                  hospitalId: hospitalId
                  },
                //truncate: true /* this will ignore where and truncate the table instead */
              });
              console.log('------------------new record-------------------------');
                  models.hospitalservice.bulkCreate(data, {individualHooks: true}).then(function(hospitalfiles){
                    res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:hospitalfiles});
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

}
module.exports = new hospital_timings();
