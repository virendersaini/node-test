"use strict";
var mongo = require('../config/mongo');
var async = require('async');
var _ = require('lodash');
const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;
var mongo = require('../config/mongo');
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("hospital", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER
        },
        headId: {
            type: DataTypes.INTEGER
        },
        countryId	: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        stateId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        cityId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        zipcode: {
            type: DataTypes.INTEGER
        },
        hospital_logo: {
            type: DataTypes.STRING
        },
        active_schedule: {
            type: DataTypes.STRING
        },
        latitude: {
            type: DataTypes.INTEGER,
        },
        longitude: {
            type: DataTypes.INTEGER,
        },
        google_address: {
            type: DataTypes.STRING,
        },
        is_active: {
            type: DataTypes.INTEGER,
        },
        is_freeze: {
            type: DataTypes.INTEGER,
        },
        shift_24X7: {
            type: DataTypes.INTEGER,
        },
        claim_status: {
            type: DataTypes.STRING,
        },
        is_complete: {
            type: DataTypes.INTEGER,
        },
        is_live: {
            type: DataTypes.INTEGER,
        },
        verified_status: {
            type: DataTypes.STRING,  
        },
        is_dummy: {
            type: DataTypes.INTEGER,
        },
        doctorProfileId: {
            type: DataTypes.INTEGER,
        }
    }, {
        hooks: {
            beforeUpdate: [makeOptimizerHook('hospital_logo', true)],
            beforeCreate: [makeOptimizerHook('hospital_logo', true)],
            afterUpdate: function(reqData, options){
                //Model.mongo_update(reqData.id,options);
                if(options.langId) {
                    Model.mongo_update({id: reqData.id, langId: options.langId, lang: options.lang},options);
                }
            }
        },
        engine: 'InnoDB',
        tableName: 'hospitals',
        classMethods : {
            mongo_update:function(reqData,res){
                var hospitaldetail = Model.hasMany(sequelize.models.hospitaldetail, {foreignKey: 'hospitalId', as: 'hospitaldetail'})
                var req={}
                req.langId=reqData.id
                var where = {};
                where.hospitaldetail = language.buildLanguageQuery(
                    where.hospitaldetail, reqData.langId, '`hospital`.`id`', sequelize.models.hospitaldetail, 'hospitalId'
                );

                Model.find({
                    attributes: ['id', 'cityId','is_active', 'is_live','hospital_logo'],
                    where : { id : reqData.id },
                    distinct: true,
                    include : [{
                        association: hospitaldetail,
                        where: where.hospitaldetail,
                        attributes : ["languageId", "hospital_name"],
                        required: true
                    }]
                }).then(function (req) {
                    var save_hos_data_in_mongodb = {
                        key: req.id.toString(),
                        title: req.hospitaldetail[0].hospital_name,
                        langId: reqData.langId.toString(),
                        image: req.hospital_logo,
                        type: 'hospital'
                    }
                    var type;
                    
                    //if (req.is_active == 1 && req.is_live == 1) {
                    if (req.is_active == 1) {
                        sequelize.query(
                            "SELECT hospital_doctors.doctorProfileId,doctor_profiles.doctor_profile_pic,doctor_profile_details.name ,count(hospitals.id) as hospital_live from hospital_doctors"
                            +" LEFT JOIN hospitals on(hospitals.id=hospital_doctors.hospitalId AND hospitals.is_live=1 AND hospitals.is_active=1)"
                            +" LEFT JOIN doctor_profiles on(doctor_profiles.id=hospital_doctors.doctorProfileId AND doctor_profiles.is_live=1 AND doctor_profiles.is_active=0)"
                            +" LEFT JOIN doctor_profile_details on(doctor_profiles.id=doctor_profile_details.doctorProfileId)"
                            +" where hospital_doctors.doctorProfileId IN (SELECT hospital_doctors.doctorProfileId FROM `hospital_doctors` where hospital_doctors.hospitalId ="+reqData.id+")"
                            +" GROUP BY hospital_doctors.doctorProfileId"
                            +" HAVING count(hospitals.id)=1", { type: sequelize.QueryTypes.SELECT}).then(hospitals => {
                                
                            if(hospitals.length){
                                for(var i=0;i<hospitals.length;i++) {
                                    
                                    //entry in mongodb for doctor
                                    var save_doctor_data_in_mongodb = {
                                        key: hospitals[i].doctorProfileId.toString(),
                                        title: hospitals[i].name,
                                        langId: reqData.langId.toString(),
                                        image: hospitals[i].doctor_profile_pic,
                                        type: 'doctor'
                                    }
                                    mongo.save(save_doctor_data_in_mongodb, type = 'edit', function(mongodata) {})

                                    sequelize.models.doctorprofile.update({is_active:1}, {
                                        where: {
                                            id: hospitals[i].doctorProfileId
                                        },
                                        individualHooks: true
                                    })
                                }
                            }
                            mongo.save(save_hos_data_in_mongodb, type = 'edit', function(mongodata) {})
                        })
                    } else {
                        sequelize.query(
                            "SELECT hospital_doctors.doctorProfileId ,count(hospitals.id) as hospital_live from hospital_doctors"
                            //+" LEFT JOIN hospitals on(hospitals.id=hospital_doctors.hospitalId AND hospitals.is_live=1 AND hospitals.is_active=1)"
                            +" LEFT JOIN hospitals on(hospitals.id=hospital_doctors.hospitalId AND hospitals.is_active=1)"
                            +" where hospital_doctors.doctorProfileId IN (SELECT hospital_doctors.doctorProfileId FROM `hospital_doctors` where hospital_doctors.hospitalId ="+reqData.id+")"
                            +" GROUP BY hospital_doctors.doctorProfileId"
                            +" HAVING count(hospitals.id)=0", { type: sequelize.QueryTypes.SELECT}).then(hospitals => {
                                
                            if(hospitals.length){
                                for(var i=0;i<hospitals.length;i++){
                                    mongo.deleteMany({"key":hospitals[i].doctorProfileId.toString(),"type":"doctor"}, type = 'deleteMany', function(mongodata) {})
                                    sequelize.models.doctorprofile.update({is_active:0}, {
                                        where: {
                                            id: hospitals[i].doctorProfileId
                                        },
                                        individualHooks: true
                                    })
                                }
                            }
                            mongo.save(save_hos_data_in_mongodb, type = 'delete', function(mongodata) {})
                        })
                    }
                })
            },
      save_doctor_time: function (req, res) {
        return sequelize.models.doctorprofile.link_clinic_time(req, res);
      },
      get_list : function (req, res) {
        
        var hospitaldetail = Model.hasOne(sequelize.models.hospitaldetail, {foreignKey: 'hospitalId', as: 'hospitaldetail'})

        let hospitalDetailCond = new Object;

        if(req.language !== undefined && req.language.id > 0){
          hospitalDetailCond['languageId'] = req.language.id;
        } else {
          hospitalDetailCond['languageId'] = req.langId;
        }

        Model.findAll({
          attributes: ['id', 'cityId', 'stateId', 'countryId', 'zipcode', 'is_active', 'claim_status'],
          where : { 'is_active' : 1 },
          distinct: true,
          include : [{
            association: hospitaldetail,
            attributes : ["hospitalId", "languageId", "hospital_name", "address"],
            required: true,
            where : hospitalDetailCond
          }]
        }).then(function (response) {

          let hospitalResObj = JSON.parse(JSON.stringify(response));
          
          if(!_.isEmpty(hospitalResObj)){

            return res({status: true,
              all_hospital_list_on_doctor: hospitalResObj,
              //totalData: usersObj.count,
              //pageCount: Math.ceil(usersObj.count / pageSize),
              //pageLimit: pageSize,
              //currentPage:page
            });
          } else {
            return res({status: true,
              all_hospital_list_on_doctor: []
            });
          }

        })//.catch(sequelize.ValidationError, function (err) {
          // return res({status : false, message : err.errors});
        //}).catch(function (err) {
          // return res({status : false, message: "Internal error" });
        //});
      },
      filter_hospital : function (req, res) {
        if (typeof req !== 'undefined') {

          let pageSize = 10, page = typeof req.page != "undefined" ? 1 : req.page, includeObj = [], hospCond = {}, nameFilter = {}, whereHospitalDetailCond = { languageId : req.language.id };

          var hospitaldetail = Model.hasOne(sequelize.models.hospitaldetail, {foreignKey: 'hospitalId', as: 'hospitaldetail'});
          var hospital_timings = Model.hasMany(sequelize.models.hospital_timings, {foreignKey: 'hospitalId', as: 'hospital_timings'});
          var contactinfo = Model.hasMany(sequelize.models.contactinformation, {foreignKey: 'key', sourceKey: 'id'});
          var hospitalservice = Model.hasMany(sequelize.models.hospitalservice, {foreignKey: 'hospitalId', sourceKey: 'id'});
          var tag = sequelize.models.hospitalservice.belongsTo(sequelize.models.tag, {foreignKey: 'tagId', targetKey: 'id'});
          var tagdetial = sequelize.models.tag.hasMany(sequelize.models.tagdetail, {foreignKey: 'tagId', sourceKey: 'id'});

          hospCond['is_active'] = 1;
          hospCond['is_freeze'] = 1;

          if(req.non_claimed_profiles !== undefined && req.non_claimed_profiles) {
            hospCond['claim_status'] = 'non-claimed';
          } 

          if(!_.isEmpty(req.selected_city)){
            hospCond['cityId'] = req.selected_city;
          }

          if(!_.isEmpty(req.name)){
            whereHospitalDetailCond.hospital_name = { $like : '%' + req.name + '%' };
          }

          let contactInfoCond;
            if(!_.isEmpty(req.email) && !_.isEmpty(req.mobile)) {
                contactInfoCond = {
                  value: {
                    '$in': [req.email, req.mobile]
                  },
                  model: 'hospital'
                }
            }
            if(!_.isEmpty(req.email) && _.isEmpty(req.mobile)) {
                contactInfoCond = {
                    value: { $like : '%' + req.email + '%' },
                    model: 'hospital'
                }
            }
            if(_.isEmpty(req.email) && !_.isEmpty(req.mobile)) {
                contactInfoCond = {
                    value : { $like : '%' + req.mobile + '%' },
                    model: 'hospital'
                }
            }
            includeObj.push(
              {
                association: hospitalservice,
                attributes:['id'],
                include:[
                  {
                    association: tag,
                    attributes:['id'],
                    include:[
                      {
                        association: tagdetial,
                        attributes:['title'],
                        required: false
                      }
                    ],
                    required: false
                  }
                ],
                where: {
                    tagtypeId:2,
                },
                required: false
            }
          );
            if("undefined" !== typeof contactInfoCond) {
                includeObj.push({
                    association: contactinfo,
                    where: contactInfoCond,
                    required: true
                });
            } else {
              includeObj.push(
                {
                  association: contactinfo,
                  where: {
                      model: 'hospital',
                      is_primary: 1
                  },
                  required: false
              });
            }

          includeObj.push({
            association: hospitaldetail,
            where: whereHospitalDetailCond,
            attributes : ["hospital_name", "about_hospital", "address", "contact_emails", "contact_mobiles"],
            required: true
          }, {
            association: hospital_timings,
            //attributes : ["hospital_name", "about_hospital", "address", "contact_emails", "contact_mobiles"],
            required: false
          });

          Model.findAndCountAll({
            attributes : [
              'id',
              'userId',
              'cityId',
              'stateId',
              'countryId',
              'zipcode',
              'hospital_logo',
              'google_address'
            ],
            where: hospCond,
            include: includeObj,
            distinct: true,
            limit: pageSize,
            offset: (page - 1) * pageSize
          }).then(function (hospitals) {

            let filteredHospitalsObj = JSON.parse(JSON.stringify(hospitals));
            
            //if(!_.isEmpty(filteredHospitalsObj.rows)){

              return res({status: true,
                filtered_hospital_list: filteredHospitalsObj.rows,
                totalData: filteredHospitalsObj.count,
                pageCount: Math.ceil(filteredHospitalsObj.count / pageSize),
                pageLimit: pageSize,
                currentPage:page});
            //} else {
            //  return res({status : false, message : "No Record found", filtered_hospital_list: []});
            //}

          }).catch(sequelize.ValidationError, function (err) {
            return res({status : false, message : err.errors});
          }).catch(function (err) {
            return res({status : false, message: "Internal error" });
          })
        } else {
          return res({status : false, message: "Not a valid request" });
        }
      },
      mapped_doctor: function (req, res) {
        
        sequelize.models.hospital_doctors.findAll({
          attributes: ['hospitalId'],
          where : { 'status' : 1, 'doctorProfileId' : req.logged_doctorprofile_id },
          distinct: true,
        }).then(function (response) {

          let hospitalResObj = JSON.parse(JSON.stringify(response));
          
          if(!_.isEmpty(hospitalResObj)){
            return res({mapped_hospitals: _.map(hospitalResObj, _.iteratee('hospitalId'))});
          } else {
            return res({mapped_hospitals : []});
          }
          
        }).catch(sequelize.ValidationError, function (err) {
          // return res({status : false, message : err.errors});
        }).catch(function (err) {
          // return res({status : false, message: "Internal error" });
        })
      },
      unmapdoc : function (req, res) {
        sequelize.models.hospital_doctors.destroy({
            where: {
              doctorProfileId : req.doctorprofileId,
              hospitalId : req.hospitalId
            },
          }).then(function (deletedRecord) {
            console.log(deletedRecord)
            if(deletedRecord === 1){
              sequelize.models.hospital_doctor_timings.destroy({where: {hospitalDoctorId: req.hospitalDoctorId}});
              //mongo entry deleted if this doctor only mapped with this hospital
              Model.sequelize.query(
                    'select count(id) as mapCount from hospital_doctors where doctorProfileId='+req.doctorprofileId, {
                        type: Model.sequelize.QueryTypes.SELECT
                    }).then(function(data) {
                       console.log(data)
                     if(data[0].mapCount==0){
                     
                       var mongo = require('../config/mongo');
                        var json_data_for_doctor_delete = { key:req.doctorprofileId.toString(),langId:req.langId.toString(),type:'doctor'}
                        console.log(json_data_for_doctor_delete);
                        var type;
                        mongo.save(json_data_for_doctor_delete, type = 'delete', function(mongodata) {})
                      }

                      return res({status : true, message: "Unmapped sucessfully."});
                })
             //end of  mongo deletion    
            }else{
             return res({status : true}); 
            }
          }).catch(sequelize.ValidationError, function (err) {
            return res({status : false, message : err.errors});
          }).catch(function (err) {
            return res({status : false, message: "Internal error" });
          });
          
      }
    }
  });
  return Model;
};
