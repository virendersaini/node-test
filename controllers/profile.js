var async = require('async');
const models = require('../models');
var language = require('./language');
var bcrypt = require('bcrypt-nodejs');
var path = require('path');

function Profile() {
  /*
   * save
  */
  this.save = function(req, res){
    if(req.user_detail === undefined) {
       req.user_detail = {};
    }
    req.user_detail.languageId = req.langId;
    var user = models.user.build(req);
    var userDetails = models.userdetail.build(req.user_detail);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
        user.validate().then(function (err) {
                if (err !== null) {
                    errors = errors.concat(err.errors);
                    callback(null, errors);
                } else {
                    callback(null, errors);
                }

            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        },
        function (callback) {
            userDetails.validate().then(function (err) {
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
          req.password = bcrypt.hashSync(req.password, null, null);
          delete req.confirm_password;
          if (typeof req.id !== 'undefined' && req.id !== '') {
            req.user_detail.userId = req.id;
            delete req.masterId;
            models.user.update(req,{where: {id:req.id}}).then(function(data){
              req.user_detail.languageId = req.langId;
              models.userdetail.find({where:{userId:req.id,languageId:req.langId}}).then(function(resultData){
                if (resultData !==null) {
                  req.user_detail.id = resultData.id;
                  models.userdetail.update(req.user_detail, {where:{id:resultData.id, userId:req.id,languageId:req.langId}}).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                } else {
                  delete req.user_detail.id;
                  models.userdetail.create(req.user_detail).then(function(){
                    res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
                  }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                }
              }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
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
   * change user name
  */
  this.changeUserName = function(req, res){
    if(req.user_detail === undefined) {
       req.user_detail = {};
    }
    var user = models.user.build(req);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
        user.validate().then(function (err) {
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
        delete req.curr_password;
        if (uniqueError.length === 0) {
          if (typeof req.id !== 'undefined' && req.id !== '') {
            models.user.update(req,{where: {id:req.id}}).then(function(data){
              res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          }
        } else {
          language.errors({errors:uniqueError, lang:req.lang}, function(errors){
            var newArr = {};
            newArr.status = false;
            newArr.message = errors[0].message;
            newArr.errors = errors;
            res(newArr);
          });
        }
    });
  };

  /*
   * change password
  */
  this.changePassword = function(req, res){
    if(req.user_detail === undefined) {
       req.user_detail = {};
    }
    var user = models.user.build(req);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
        user.validate().then(function (err) {
          if (err !== null) {
              errors = errors.concat(err.errors);
              callback(null, errors);
          } else {
              callback(null, errors);
          }

        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        },
    ], function (err, errors) {
        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
        if (uniqueError.length === 0) {
          req.password = bcrypt.hashSync(req.password, null, null);
          delete req.confirm_password;
          delete req.curr_password;
          if (typeof req.id !== 'undefined' && req.id !== '') {
            models.user.update(req,{where: {id:req.id}}).then(function(data){
              res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
          }
        } else {
          language.errors({errors:uniqueError, lang:req.lang}, function(errors){
            var newArr = {};
            newArr.status = false;
            newArr.message = errors[0].message;
            newArr.errors = errors;
            res(newArr);
          });
        }
    });
  };

  /*
   * change language
  */
  this.changeDefaults = function(req, res){
    if(req.user_detail === undefined) {
       req.user_detail = {};
    }
    var user = models.user.build(req);
    var errors = [];
    // an example using an object instead of an array
    async.parallel([
        function (callback) {
        user.validate().then(function (err) {
          if (err !== null) {
              errors = errors.concat(err.errors);
              callback(null, errors);
          } else {
              callback(null, errors);
          }

        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        },
    ], function (err, errors) {
        var merged = [].concat.apply([], errors);
        var uniqueError = merged.filter(function(elem, pos) {return merged.indexOf(elem) == pos;});
        if (uniqueError.length === 0) {
          if (typeof req.id !== 'undefined' && req.id !== '') {
            models.user.update(req,{where: {id:req.id}}).then(function(data){
              res({status:true, message:language.lang({key:"updatedSuccessfully", lang:req.lang}), data:data});
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
   * get By ID
  */
 this.getById = function(req, res) {
    models.user.hasMany(models.userdetail);
    //---------Teacher-----------
    models.user.hasOne(models.teacher);
    models.teacher.hasMany(models.teacherdetail);
    models.teacher.hasMany(models.teachersubject);
    models.teacher.belongsTo(models.country);
    models.country.hasMany(models.countrydetail);
    models.teacher.belongsTo(models.state);
    models.state.hasMany(models.statedetail);
    models.teacher.belongsTo(models.city);
    models.city.hasMany(models.citydetail);
    models.teachersubject.belongsTo(models.subject);
    models.subject.hasMany(models.subjectdetail);

    //---------Student-------------
    models.user.hasOne(models.student);
    models.student.hasMany(models.studentdetail);
    models.student.hasOne(models.studentrecord);
    models.studentrecord.belongsTo(models.bcsmap,{'foreignKey':'bcsMapId'});
    models.bcsmap.belongsTo(models.board);
    models.board.hasMany(models.boarddetail);
    models.bcsmap.belongsTo(models.section);
    models.section.hasMany(models.sectiondetail);
    models.bcsmap.belongsTo(models.classes);
    models.classes.hasMany(models.classesdetail);
    models.student.belongsTo(models.country);
    models.country.hasMany(models.countrydetail);
    models.student.belongsTo(models.state);
    models.state.hasMany(models.statedetail);
    models.student.belongsTo(models.city);
    models.city.hasMany(models.citydetail);

    //--------institute-------------
    models.user.hasOne(models.institute);
    models.institute.hasMany(models.institutedetail);
    models.institute.belongsTo(models.country);
    models.country.hasMany(models.countrydetail);
    models.institute.belongsTo(models.state);
    models.state.hasMany(models.statedetail);
    models.institute.belongsTo(models.city);
    models.city.hasMany(models.citydetail);
    
    var isWhere = {};
    isWhere.userdetail = language.buildLanguageQuery(
      isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId'
    );
    isWhere.teacherdetail = language.buildLanguageQuery(
      isWhere.teacherdetail, req.langId, '`teacher`.`id`', models.teacherdetail, 'teacherId'
    );
    //--------institute-------------
    isWhere.countrydetailInstitute = language.buildLanguageQuery(
      isWhere.countrydetailInstitute, req.langId, '`institute.country`.`id`', models.countrydetail, 'countryId'
    );
    isWhere.statedetailInstitute = language.buildLanguageQuery(
      isWhere.statedetailInstitute, req.langId, '`institute.state`.`id`', models.statedetail, 'stateId'
    );
    isWhere.citydetailInstitute = language.buildLanguageQuery(
      isWhere.citydetailInstitute, req.langId, '`institute.city`.`id`', models.citydetail, 'cityId'
    );
    //--------Teacher-------------
    isWhere.countrydetailTeacher = language.buildLanguageQuery(
      isWhere.countrydetailTeacher, req.langId, '`teacher.country`.`id`', models.countrydetail, 'countryId'
    );
    isWhere.statedetailTeacher = language.buildLanguageQuery(
      isWhere.statedetailTeacher, req.langId, '`teacher.state`.`id`', models.statedetail, 'stateId'
    );
    isWhere.citydetailTeacher = language.buildLanguageQuery(
      isWhere.citydetailTeacher, req.langId, '`teacher.city`.`id`', models.citydetail, 'cityId'
    );
    //--------Student-------------
    isWhere.countrydetailStudent = language.buildLanguageQuery(
      isWhere.countrydetailStudent, req.langId, '`student.country`.`id`', models.countrydetail, 'countryId'
    );
    isWhere.statedetailStudent = language.buildLanguageQuery(
      isWhere.statedetailStudent, req.langId, '`student.state`.`id`', models.statedetail, 'stateId'
    );
    isWhere.citydetailStudent = language.buildLanguageQuery(
      isWhere.citydetailStudent, req.langId, '`student.city`.`id`', models.citydetail, 'cityId'
    );

    isWhere.subjectdetail = language.buildLanguageQuery(
      isWhere.subjectdetail, req.langId, '`teacher.teachersubjects.subject`.`id`', models.subjectdetail, 'subjectId'
    );
    isWhere.studentdetail = language.buildLanguageQuery(
      isWhere.studentdetail, req.langId, '`student`.`id`', models.studentdetail, 'studentId'
    );
    isWhere.institutedetail = language.buildLanguageQuery(
      isWhere.institutedetail, req.langId, '`institute`.`id`', models.institutedetail, 'instituteId'
    );

    if (req.user_type === 'teacher') {
      models.user.find({
        include: [
          {model: models.userdetail, where:isWhere.userdetail},
          {model: models.teacher,
            include: [
              {model: models.teacherdetail, where:isWhere.teacherdetail},
              {model: models.teachersubject, include:[{model:models.subject, include:[{model:models.subjectdetail, where:isWhere.subjectdetail}]}]},
              {model: models.country, include:[{model:models.countrydetail, where:isWhere.countrydetailTeacher}]},
              {model: models.state, include:[{model:models.statedetail, where:isWhere.statedetailTeacher}]},
              {model: models.city, include:[{model:models.citydetail, where:isWhere.citydetailTeacher}]},
            ]},
        ],
        where:{id:req.id}
      }).then(function(data){
        res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    //-------------Student----------------
    } else if(req.user_type === 'student'){

      models.user.find({
        include: [
          {model: models.userdetail, where:isWhere.userdetail},
          {model: models.student,
            include:[
              {model: models.studentdetail, where:isWhere.countrydetail},
              {model: models.country, include:[{model:models.countrydetail, where:isWhere.countrydetailStudent}]},
              {model: models.state, include:[{model:models.statedetail, where:isWhere.statedetailStudent}]},
              {model: models.city, include:[{model:models.citydetail, where:isWhere.citydetailStudent}]},
              {model: models.studentrecord,
                include:[
                  {model: models.bcsmap,
                    include:[
                      {model:models.board, attribtes:['id'], include:[{model:models.boarddetail, attribtes:['id', 'name'], where:isWhere.boarddetail}]},
                      {model:models.classes, attribtes:['id'], include:[{model:models.classesdetail, attribtes:['id', 'name'], where:isWhere.classesdetail}]},
                      {model:models.section, attribtes:['id'], include:[{model:models.sectiondetail, attribtes:['id', 'name'], where:isWhere.sectiondetail}]}
                    ]
                  }
                ]
              },
            ]
          },
        ],
        where:{id:req.id},
        order: [
          [ models.student, models.studentrecord, 'id', 'DESC']
        ],
        limit: 1,
        subQuery: false
      }).then(function(data){
        res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    //-------------Other----------------
  } else if(req.user_type === 'institute'){
      models.user.find({
        include: [
          {model: models.userdetail, where:isWhere.userdetail},
          {model: models.institute,
            include:[
              {model: models.institutedetail, where:isWhere.institutedetail},
              {model: models.country, include:[{model:models.countrydetail, where:isWhere.countrydetailInstitute}]},
              {model: models.state, include:[{model:models.statedetail, where:isWhere.statedetailInstitute}]},
              {model: models.city, include:[{model:models.citydetail, where:isWhere.citydetailInstitute}]},
            ]
          },
        ],
        where:{id:req.id},
        limit: 1,
        subQuery: false
      }).then(function(data){
        res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    //-------------Other----------------
    }  else {
      models.user.find({
        include: [
          {model: models.userdetail, where:isWhere.userdetail}
        ],
        where:{id:req.id}
      }).then(function(data){
        res({status:true, message:language.lang({key:"addedSuccessfully", lang:req.lang}), data:data});
      }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }
  };

  this.getUserProfileById = function (req, res) {
    var isWhere = {};
    isWhere.institutedetail = language.buildLanguageQuery(
      isWhere.institutedetail, req.langId, '`institute`.`id`', models.institutedetail, 'instituteId'
    );
    isWhere.userdetail = language.buildLanguageQuery(
        isWhere.userdetail, req.langId, '`user`.`id`', models.userdetail, 'userId'
      );
    if (req.user_type === 'institute') {
      models.institute.belongsTo(models.user);
      models.institute.hasMany(models.institutedetail);
      models.institute.findOne({
        where: {
          id: req.id
        },
        include: [{
          model: models.user,
          attributes: ['id', 'email', 'mobile', 'user_type']
        }, {
          model: models.institutedetail,
          where: isWhere.institutedetail,
          attributes: ['id', 'name']
        }],
        attributes: ['id', 'institute_image']
      }).then(institute => {
        res({
          id: institute.id,
          userdetails: [{fullname: institute.institutedetails[0].name, id: institute.institutedetails[0].id}],
          email: institute.user.email,
          user_type: institute.user.user_type,
          mobile: institute.user.mobile
        });
      }, () => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    } else {
      models.user.hasMany(models.userdetail);
      models.user.findOne({
        where: {
          id: req.id
        },
        include: [{
          model: models.userdetail,
          where: isWhere.userdetail,
          attributes: ['id', 'fullname']
        }],
        attributes: ['id', 'mobile', 'email', 'user_type']
      })
      .then(res, () => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }
  };

  this.saveUserProfile = function (req, res) {
    if (req.user_type === 'institute') {
      var institute = models.institute.build({id: req.id}),
      user = models.user.build({mobile: req.mobile, email: req.email});
      //institutedetail = models.institutedetail.build({name: req.userdetail.fullname});
      Promise.all([institute.validate(), user.validate()/*, institutedetail.validate()*/])
      .then(err => err.filter(x => x))
      .then(err => err.reduce((x, y) => x.concat(y.errors), []))
      .then(errors => {
        if (errors.length === 0) {
          var updates = [
            // models.institutedetail.findOne({where: {id: req.userdetail.id}})
            // .then(institutedetail => {
            //   if (institutedetail.languageId != req.langId) {
            //     institutedetail = institutedetail.toJSON();
            //     delete institutedetail.id;
            //     institutedetail.languageId = req.langId;
            //     institutedetail.name = req.userdetail.fullname;
            //     return models.institutedetail.create(institutedetail);
            //   } else {
            //     institutedetail.name = req.userdetail.fullname;
            //     return institutedetail.save();
            //   }
            // }),
            models.institute.findById(
              req.id,
              {attributes: ['id', 'userId']}
            ).then(institute => {
              return models.user.update({
                mobile: req.mobile,
                email: req.email
              }, {
                where: {id: institute.userId}
              });
            })
          ];
          if (req.user_image) {
            updates.push(
              models.institute.update({
                institute_image: req.user_image
              },{
                where: {id: req.id},
                individualHooks: true
              })
            );
          }
          Promise.all(updates).then(
            () => res({
              status: true,
              message: language.lang({key: 'updatedSuccessfully', lang: req.lang}),
              user_image: req.user_image ? path.join('public/uploads', req.user_image.substring(tmpDir.length)) : ''
            }),
            () => res({
              status:false,
              error: true,
              error_description: language.lang({key: "Internal Error", lang: req.lang}),
              url: true
            })
          );
        } else {
          language.errors({errors: errors, lang: req.lang}, errors => {
            errors.forEach(error => {
              if (error.path === 'name') error.path = 'fullname'
            });
            res({errors: errors});
          });
        }
      }).catch(() => res({
        status:false,
        error: true,
        error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true
      }));
    } else {
      var user = models.user.build(req)
      , userdetail = models.userdetail.build(req.userdetail);
      Promise.all([user.validate(), userdetail.validate()])
      .then(err => {
        if (err[0]) {
          if (err[1])
            return err[0].errors.concat(err[1].errors);
          else
            return err[0].errors;
        } else {
          if (err[1])
            return err[1].errors;
          else
            return null;
        }
      }).then(errors => {
        if (errors) {
          language.errors(
            {errors: errors, lang: req.lang}
            , errors => res({errors: errors})
          );
          return;
        }
        Promise.all([models.user.update(req, {where: {id: req.id}, individualHooks: true}),
          models.userdetail.findOne({where: {id: req.userdetail.id}})
          .then(userdetail => {
            if (userdetail.languageId == req.langId) {
              userdetail.fullname = req.userdetail.fullname;
              return userdetail.save();
            } else {
              userdetail = userdetail.toJSON();
              delete userdetail.id;
              userdetail.languageId = req.langId;
              userdetail.fullname = req.userdetail.fullname;
              return models.userdetail.create(userdetail);
            }
          })
        ])
        .then(() => res({
          status: true,
          message: language.lang({key: 'updatedSuccessfully', lang: req.lang}),
          user_image: req.user_image ? path.join('public/uploads', req.user_image.substring(tmpDir.length)) : ''
        }))
        .catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
      });
    }
  };
}

module.exports = new Profile();
