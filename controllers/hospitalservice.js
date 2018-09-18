var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var utils = require('./utils');
var hospital = require('./hospital');
var doctor = require('./doctor');

function Hospitalservice() {

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
    models.hospitalservice.findAndCountAll({
      include: [],
      distinct: true,
      where: where.hospitalservice,
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
    savedata= JSON.parse(req.body);
    var hospitalId = savedata.hospitalId;
    var langId = savedata.langId;
    if(typeof savedata.data !== 'undefined'){
      data = savedata.data;
    }
    if(typeof savedata.awardData !== 'undefined'){
      dataAward = savedata.awardData;
    }
    //console.log(data);
    var hospitalservice = models.hospitalservice.build(req);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
      function (callback) {
        async.forEachOf(data, function (values, key, callback) {
          var hospitalserviceBuild = models.hospitalservice.build(values);
          hospitalserviceBuild.validate().then(function (err) {
            console.log(values);
            if (err != null) {
              async.forEach(err.errors, function (errObj, inner_callback) {
                errObj.path = errObj.path + '_' + key;
                errors = errors.concat(errObj);
              });
            }
            callback(null, errors);

          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }, function (err) {
          callback(null, errors);
        });
      },
      function (callback) {
        async.forEachOf(dataAward, function (values, key, callback) {
          var hospitalAwardBuild = models.hospitalaward.build(values);
          hospitalAwardBuild.validate().then(function (err) {
            if (err != null) {
              async.forEach(err.errors, function (errObj, inner_callback) {
                errObj.path = errObj.path + '_' + key;
                errors = errors.concat(errObj);
              });
            }
            callback(null, errors);

          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }, function (err) {
          callback(null, errors);
        });
      }
    ], function (err, errors) {
      var merged = [].concat.apply([], errors);
      var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
      if (uniqueError.length === 0) {
        async.parallel([
          function(callback) {
              models.hospitalaward.hasMany(models.hospitalawarddetail);
              models.hospitalaward.findAll({
                  include: [
                      {model: models.hospitalawarddetail, where: language.buildLanguageQuery({}, langId, '`hospitalaward`.`id`', models.hospitalawarddetail, 'hospitalAwardId')},
                  ],
                  where: {hospitalId: hospitalId}
              }).then(function(data) {
                  if(data.length) {
                      async.forEach(data, function (values, icallback) {
                          models.hospitalawarddetail.destroy({where: {hospitalAwardId: values.id}}).then((idata) => {
                              models.hospitalaward.destroy({where: {id: values.id}}).then((data) => {
                                  icallback(null)
                              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                      }, function (innErrr) {
                          callback(null, true);
                      });
                  } else {
                      callback(null, true);
                  }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          }

        ],function(err) {
          if(err) {
            res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})
          } else {
            async.parallel([
              function(callback) {
                models.hospitalservice.findAll({
                  attributes: [
                    [models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('id')), 'hs_ids'],
                    [models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('tagId')), 'hs_tag_ids']
                  ],
                  where: {hospitalId: hospitalId},
                  raw: true
                }).then(function(prevSer) {
                  models.hospitalservice.bulkCreate(data, {individualHooks: true}).then(function(hospitalfiles){
                    if(prevSer[0].hs_ids !== null) { 
                      models.hospitalservice.destroy({where: {id: {$in: prevSer[0].hs_ids.split(',')}}}) 
                      // models.tag.findAll({
                      //   attributes: [[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('id')), 'tg_ids']],
                      //   where: {id: {$in: prevSer[0].hs_tag_ids.split(',')}, is_approved: 0}
                      // })
                    }
                    callback(null, true)
                    //res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:hospitalfiles});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                })
              },
              function(callback) {
                  async.forEach(dataAward, function (values, award_callback) {
                      var hospitalAwardHasOne = models.hospitalaward.hasOne(models.hospitalawarddetail, {as: 'hospital_award_details'});
                      values.hospital_award_details = {award_gratitude_title: values.award_gratitude_title, languageId: langId};

                      models.hospitalaward.create(values, {include: [hospitalAwardHasOne]}).then(function(data){
                        if (req.langId == 1) {
                          award_callback(null)
                        } else {
                          values.hospital_award_details.hospitalAwardId = data.id;
                          values.hospital_award_details.languageId = 1;
                          models.hospitalawarddetail.create(values.hospital_award_details).then(function(){
                            if (req.langId == 1) {
                              award_callback(null)
                            } else {
                              values.hospital_award_details.hospitalAwardId = data.id;
                              values.hospital_award_details.languageId = 1;
                              models.hospitalawarddetail.create(values.hospital_award_details).then(function(){
                                  award_callback(null)
                              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                            }
                          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                        }
                      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                  }, function (innErrr) {
                      callback(null, true)
                  });
              }
            ], function(err) {
              if(err) {
                res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})
              } else {
                utils.updateProfileStatusWhileUpdate({id: hospitalId, langId: req.langId}, function(resp) {
                  if(resp.status) {
                    res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:[]});
                  } else {
                    res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})    
                  }
                })
              }
            }
          )
        }
      })
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

    this.saveSpecializationServies = function(req, res) {
      let tagTypeIds = utils.getAllTagTypeId()
      let insertedTagIds = [tagTypeIds.SpecializationTagId, tagTypeIds.ServiceTagId];
      let newTagsIds = req.tags.map(itm => itm.id);
      newTagsIds = newTagsIds.filter(function(e){return e}); 
      let whereCond = {hospitalId: req.id, tagtypeId: {$in: insertedTagIds}};
      if(newTagsIds.length > 0) { whereCond.id = {'$notIn': newTagsIds} }
      models.hospitalservice.findAll({
        attributes: [[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('id')), 'hs_ids']], 
        where: whereCond, 
        raw: true
      }).then(prevTags => {
        models.hospitalservice.bulkCreate(req.tags, {ignoreDuplicates: true, updateOnDuplicate: ["hospitalId", "tagId", "tagtypeId"]}).then(function(data){
          if(prevTags[0].hs_ids !== null) { 
            module.exports.deleteCustomTags({tagIdsToBeDeleted: prevTags[0].hs_ids.split(','), userId: req.userId}, function(del) {
              if(del) { models.hospitalservice.destroy({where: {id: {$in: prevTags[0].hs_ids.split(',')}}}); }
            });
          } else {
            models.tag.findAll({
              attributes: [[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('id')), 'tag_ids']],
              where: {userId: req.userId, is_approved: 0, tagtypeId: tagTypeIds.ServiceTagId},
              raw: true
            }).then(function(d) {
              if(d[0].tag_ids !== null) {

              }
            })
          }
          utils.updateProfileStatusWhileUpdate({id: req.id, langId: req.langId}, function(resp) {
            if(resp.status) {
              res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:[]});
            } else {
              res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})    
            }
          })
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      })
    }

    this.saveAwardsMemberships = function(req, res) {
      let tagTypeIds = utils.getAllTagTypeId();

      var errors = []
      async.parallel([
        function (callback) {
          async.forEachOf(req.awards, function (values, key, callback) {
              var hospitalAwardBuild = models.hospitalaward.build(values);
              hospitalAwardBuild.validate().then(function (err) {
                  if (err != null) {
                      async.forEach(err.errors, function (errObj, inner_callback) {
                          errObj.path = errObj.path + '_' + key;
                          errors = errors.concat(errObj);
                      });
                  }
                  callback(null, errors);

              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          }, function (err) {
              callback(null, errors);
          });
        },
      ], function (err, errors) {

        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});

        if (uniqueError.length === 0) {

          async.parallel([
            function(callback) {
              models.hospitalaward.hasMany(models.hospitalawarddetail);
                models.hospitalaward.findAll({
                  include: [
                      {model: models.hospitalawarddetail, where: language.buildLanguageQuery({}, req.langId, '`hospitalaward`.`id`', models.hospitalawarddetail, 'hospitalAwardId')},
                  ],
                  where: {hospitalId: req.id}
                }).then(function(data) {
                  if(data.length) {
                      async.forEach(data, function (values, icallback) {
                          models.hospitalawarddetail.destroy({where: {hospitalId: values.id}}).then((idata) => {
                              models.hospitalaward.destroy({where: {id: values.id}}).then((data) => {
                                  icallback(null)
                              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                      }, function (innErrr) {
                          callback(null, true);
                      });
                  } else {
                      callback(null, true);
                  }
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }
          ], function(err) {
            async.parallel([
              function(callback) {
                  async.forEach(req.awards, function (values, awd_callback) {
                      var hospitalAwardHasOne = models.hospitalaward.hasOne(models.hospitalawarddetail, {as: 'hospital_award_details'});
                      values.hospital_award_details = {award_gratitude_title: values.award_gratitude_title, languageId: req.langId};
                      models.hospitalaward.create(values, {include: [hospitalAwardHasOne]}).then(function(data){
                        if (req.langId == 1) {
                          awd_callback(null)
                        } else {
                          values.hospital_award_details.hospitalAwardId = data.id;
                          values.hospital_award_details.languageId = 1;
                          models.hospitalawarddetail.create(values.hospital_award_details).then(function(){
                              awd_callback(null)
                          }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                        }
                      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                  }, function (innErrr) {
                      callback(null, true)
                  });
              },
              function(callback) {
                let newTagsIds = req.tags.map(itm => itm.id);
                newTagsIds = newTagsIds.filter(function(e){return e});
                let whereCond = {hospitalId: req.id, tagtypeId: utils.getAllTagTypeId()['MembershipsTagId']};
                if(newTagsIds.length > 0) { whereCond.id = {'$notIn': newTagsIds} };
                models.hospitalservice.findAll({
                  attributes: [[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('id')), 'hs_ids']], 
                  where: whereCond, 
                  raw: true
                }).then(prevTags => {
                  if(prevTags[0].hs_ids !== null) {
                    module.exports.deleteCustomTags({tagIdsToBeDeleted: prevTags[0].hs_ids.split(','), userId: req.userId}, function(del) {
                      if(del) { models.hospitalservice.destroy({where: {id: {$in: prevTags[0].hs_ids.split(',')}}}); }
                    });
                  }
                  models.hospitalservice.bulkCreate(req.tags, {ignoreDuplicates: true, updateOnDuplicate: ["hospitalId", "tagId", "tagtypeId"]}).then(function(data){
                      callback(null, true)
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                })
              },
            ], function(err) {
              if(err) {
                res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})
              } else {
                utils.updateProfileStatusWhileUpdate({id: req.id, langId: req.langId}, function(resp) {
                  if(resp.status) {
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:[]});
                  } else {
                    res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})    
                  }
                })
              }
            })
          })
        } else {
          language.errors({errors:uniqueError, lang:req.lang}, function(errors){
              var newArr = {};
              newArr.message = language.lang({key:"validationFailed", lang:req.lang});
              newArr.errors = errors;
              res(newArr);
          });
        }

      })
    }

    this.saveInsuranceCompanies = function(req, res) {
      let tagTypeIds = utils.getAllTagTypeId();
      
      let newTagsIds = req.tags.map(itm => itm.id);
      newTagsIds = newTagsIds.filter(function(e){return e});

      let whereCond = {hospitalId: req.id, tagtypeId: utils.getAllTagTypeId()['InsuranceCompaniesTagId']};
      if(newTagsIds.length > 0) { whereCond.id = {'$notIn': newTagsIds} }

      models.hospitalservice.findAll({
        attributes: [[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('id')), 'hs_ids']], 
        where: whereCond, 
        raw: true
      }).then(prevTags => {
        models.hospitalservice.bulkCreate(req.tags, {ignoreDuplicates: true, updateOnDuplicate: ["hospitalId", "tagId", "tagtypeId"]}).then(function(data){
          if(prevTags[0].hs_ids !== null) {
            module.exports.deleteCustomTags({tagIdsToBeDeleted: prevTags[0].hs_ids.split(','), userId: req.userId}, function(del) {
              if(del) { models.hospitalservice.destroy({where: {id: {$in: prevTags[0].hs_ids.split(',')}}}); }
            });
          }
          res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }

    this.deleteCustomTags = function(req, res) {
      //if(!req.tagIdsToBeDeleted || !req.userId) return;

      if(req.tagIdsToBeDeleted !== null) {
        models.tag.findAll({
          attributes: [[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('id')), 'tag_ids']],
          where: {userId: req.userId, is_approved: 0},
          raw: true
        }).then(function(tagIds) {
          if(tagIds[0].tag_ids !== null) {
            let userTagIds = tagIds[0].tag_ids.split(',').map(Number);
            models.hospitalservice.findAll({
              attributes: [[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('tagId')), 'hs_tag_ids']],
              where: {id: {$in: req.tagIdsToBeDeleted}},
              raw: true
            }).then(function(hsTagIds) {
              if(hsTagIds[0].hs_tag_ids !== null) {
                let nhsTagIds = hsTagIds[0].hs_tag_ids.split(',').map(Number);
                let tagToBeDeletes = userTagIds.filter(itm => nhsTagIds.indexOf(itm) !== -1);
                models.tag.destroy({where: {id: {$in: tagToBeDeletes}}});
                res(true);
              } else {
                res(false);
              }
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      } else {
        // Promise.all([
        //   models.tag.findAll({
        //     attributes: [[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('id')), 'tag_ids']],
        //     where: {userId: req.userId, is_approved: 0, tagtypeId: req.tagtypeId},
        //     raw: true
        //   }),
        //   models.hospitals.findAll({
        //     attributes: [[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('id')), 'hos_ids']],
        //     where: {userId: req.userId},
        //     raw: true
        //   })
        // ]).then(([tags, hos]) => {
        //   if(tags[0].tag_ids !== null) {
        //     models.hospitalservice.findAll({
        //       attributes: [[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('tagId')), 'hos_ids']],
        //       where: {tagtypeId: req.tagtypeId}
        //     }).then(function(hs) {
              
        //     })
        //   }
        // })


        // models.tag.findAll({
        //   attributes: [[models.sequelize.fn('GROUP_CONCAT', models.sequelize.col('id')), 'tag_ids']],
        //   where: {userId: req.userId, is_approved: 0, tagtypeId: req.tagtypeId},
        //   raw: true
        // }).then(function(tagIds) {
        //   if(tagIds[0].tag_ids !== null) {

        //   } else {
        //     res(true);
        //   }
        // }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      }
    }

    this.remCusTags = function(req, res) {
      if(!req.id || !req.userId) res({status: false})
      models.tag.find({attributes: ['id', 'is_approved'], where: {id: req.id, userId: req.userId, is_approved: 0}, raw: true}).then(function(tag) {
        console.log("----------------------------------------------------")
        console.log(tag)
        if(tag) {
          models.tag.destroy({where: {id: tag.id}})
          res({status: true})
        } else {
          res({status: false})
        }
      })
    }

}
module.exports = new Hospitalservice();
