'use strict';
var _ = require('lodash');
var async = require('async');

const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('doctorprofile', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        doctor_id: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        userId: {
            type: DataTypes.INTEGER,
        },
        salutation: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                },
            }
        },
        mobile: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                },
            }
        },
        email: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                },
            }
        },
        google_address: {
            type: DataTypes.STRING
        },
        countryId: {
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
        postal_code: {
            type: DataTypes.STRING
        },
        gender: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        doctor_profile_pic: {
            type: DataTypes.STRING
        },
        latitude: {
            type: DataTypes.INTEGER
        },
        longitude: {
            type: DataTypes.INTEGER
        },
        is_active: {
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
        live_from: {
            type: DataTypes.STRING,    
        },
        nationality: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        }
    }, {
        hooks: {
            beforeUpdate: [makeOptimizerHook('doctor_profile_pic', true)],
            beforeCreate: [makeOptimizerHook('doctor_profile_pic', true)],
            afterUpdate: function(reqData, options){
                if(options.langId) {
                    Model.mongo_update({id: reqData.id, langId: options.langId, lang: options.lang},options);
                }
          }
        },
        tableName: 'doctor_profiles',
        classMethods : {
            
            mongo_update:function(reqData,res){
                var language = require('../controllers/language');
                var mongo = require('../config/mongo');
                var req={}
                 req.langId=reqData.langId;
                var where = {};
                var doctorprofiledetail = {};
                where.doctorprofiledetail = language.buildLanguageQuery(
                    where.doctorprofiledetail, reqData.langId, '`doctorprofile`.`id`', sequelize.models.doctorprofiledetail, 'doctorProfileId'
                );
                Model.hasMany(sequelize.models.doctorprofiledetail);
                Model.find({
                    attributes: ['id','doctor_profile_pic', 'is_live','is_active'],
                    include: [{
                        model: sequelize.models.doctorprofiledetail,
                        where: where.doctorprofiledetail
                    }],
                    where: {
                        id: reqData.id
                    }
                }).then(function(resultData) {
                    Model.checkLiveHospital({
                        id: reqData.id
                    }, function(hospitaldata) {
                        var save_json_data_in_mongodb = {
                            key: resultData.id.toString(),
                            title: resultData.doctorprofiledetails[0].name,
                            langId: reqData.langId.toString(),
                            image: resultData.doctor_profile_pic,
                            type: 'doctor'
                        }
                        var type;
                        if (hospitaldata[0].live_hospital > 0) {
                            if (resultData.is_active == 1 && resultData.is_live == 1) {
                                mongo.save(save_json_data_in_mongodb, type = 'add', function(mongodata) {})
                            } else {
                                mongo.save(save_json_data_in_mongodb, type = 'delete', function(mongodata) {})
                            }
                        } else {
                            mongo.save(save_json_data_in_mongodb, type = 'delete', function(mongodata) {})
                        }
                    })//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
                })
              },
              checkLiveHospital:function(req,res){
                let qry = 'SELECT count(*) as live_hospital from hospital_doctors' 
                +' left join hospitals on(hospital_doctors.hospitalId = hospitals.id)' 
                +' where hospital_doctors.doctorProfileId = ? and hospitals.is_active = 1';
                //+' and hospitals.is_live = 1';
                Model.sequelize.query(qry, { replacements: [req.id],
                    type: Model.sequelize.QueryTypes.SELECT
                }).then(function(data) {
                    res(data);
                })
              },
            filterDoctorsForNotClaimed: function (req, res) {
                if (typeof req !== 'undefined') {
    
                    let pageSize = 10, page = undefined === req.page ? 1 : req.page, includeObj = [], cityCond = {}, nameFilter = {}, whereDoctorProfileDetailCond = { languageId : req.language.id };
    
                    var doctorprofiledetail = Model.hasMany(sequelize.models.doctorprofiledetail, {foreignKey: 'doctorProfileId'});
                    var doctortags = Model.hasMany(sequelize.models.doctortags, {foreignKey: 'doctorProfileId', as: 'doctortags'});
                    var tagdetail = sequelize.models.doctortags.belongsTo(sequelize.models.tagdetail, {foreignKey: 'tagId', as: 'tagdetail', targetKey : "tagId"});
                    var countrydetail = Model.belongsTo(sequelize.models.countrydetail, {foreignKey: 'countryId', as: 'countrydetail', targetKey : "countryId"});
                    var citydetail = Model.belongsTo(sequelize.models.citydetail, {foreignKey: 'cityId', as: 'citydetail', targetKey : "cityId"});
                    var statedetail = Model.belongsTo(sequelize.models.statedetail, {foreignKey: 'stateId', as: 'statedetail', targetKey : "stateId"});
                    var contactinfo = Model.hasMany(sequelize.models.contactinformation, {foreignKey: 'key', sourceKey: 'id'});
                    var doctorexperiences = Model.hasMany(sequelize.models.doctorexperience, {foreignKey: 'doctorProfileId', as: 'doctorexperiences'});
                    var doctoreducations = Model.hasMany(sequelize.models.doctoreducation, {foreignKey: 'doctorProfileId', as: 'doctoreducations'});
                    var educationtagdetail = sequelize.models.doctoreducation.belongsTo(sequelize.models.tagdetail, {foreignKey: 'tagtypeId', as: 'doctoreducationtagdetail', targetKey : "tagId"});
                    var hospital_doctors = Model.hasOne(sequelize.models.hospital_doctors, {foreignKey: 'doctorProfileId', as: 'hospital_doctors'});
                    var hospital = sequelize.models.hospital_doctors.belongsTo(sequelize.models.hospital, {foreignKey: 'hospitalId', as: 'hospital', targetKey : "id"});
                    var hospitaldetail = sequelize.models.hospital.hasMany(sequelize.models.hospitaldetail, {foreignKey: 'hospitalId', as: 'hospitaldetail', sourceKey : "id"});
                    if(!_.isEmpty(req.selected_specialization)){
                        includeObj.push({
                            association: doctortags,
                            where: { tagId : req.selected_specialization },
                            required: true,
                            include: [
                                {
                                    association: tagdetail,
                                    attributes: ["title"],
                                    required: false
                                }
                            ]
                        });
                    } else {
                        includeObj.push({
                            association: doctortags,
                            attributes: ["tagId", "tagtypeId"],
                            where:{tagtypeId:2},
                            required: false,
                            include: [
                                {
                                    association: tagdetail,
                                    attributes: ["title"],
                                    required: false
                                }
                            ]
                        })
                    }
    
                    
    
                    cityCond['is_active'] = 1;
                    cityCond['claim_status']='non-claimed';
                    if(!_.isEmpty(req.selected_city)){
                        cityCond['cityId'] = req.selected_city;
                    }
    
                    if(!_.isEmpty(req.name)){
                        whereDoctorProfileDetailCond.name = { $like : '%' + req.name + '%' };
                    }
    
                    let contactInfoCond;
                    if(!_.isEmpty(req.email) && !_.isEmpty(req.mobile)) {
                        contactInfoCond = {
                          value: {
                            '$in': [req.email, req.mobile]
                          },
                          model: 'doctorprofile'
                        }
                    }
                    if(!_.isEmpty(req.email) && _.isEmpty(req.mobile)) {
                        contactInfoCond = {
                            value: { $like : '%' + req.email + '%' } ,
                            model: 'doctorprofile'
                        }
                    }
                    if(_.isEmpty(req.email) && !_.isEmpty(req.mobile)) {
                        contactInfoCond = {
                            value : { $like : '%' + req.mobile + '%' },
                            model: 'doctorprofile'
                        }
                    }
    
                    if("undefined" !== typeof contactInfoCond) {
                        includeObj.push({
                            association: contactinfo,
                            where: contactInfoCond,
                            required: true
                        });
                    } else {
                        includeObj.push({
                            association: contactinfo,
                            where: {
                                model: 'doctorprofile',
                                is_primary: 1
                            },
                            required: false
                        });
                    }
    
    
                    includeObj.push({
                        association: doctorprofiledetail,
                        where: whereDoctorProfileDetailCond,
                        attributes : ["name", "address_line_1"],
                        required: true
                    }, {
                        association: countrydetail,
                        where: { languageId : req.language.id },
                        attributes : ["name"],
                        required: true
                    }, {
                        association: citydetail,
                        where: { languageId : req.language.id },
                        attributes : ["name"],
                        required: true
                    }, {
                        association: statedetail,
                        where: { languageId : req.language.id },
                        attributes : ["name"],
                        required: true
                    }, {
                        association: doctorexperiences,
                        attributes: ["duration_from", "duration_to"],
                        required: false
                    }, {
                        association: doctoreducations,
                        attributes: ["tagtypeId"],
                        required: false,
                        include: [
                            {association: educationtagdetail, attributes: ["title"], required: false}
                        ]
                    },
                    {
                        association: hospital_doctors,
                        attributes: ["hospitalId"],
                        required: false,
                        include: [
                            {association: hospital,include:[
                                {association: hospitaldetail, attributes: ["hospital_name"], required: false}
                            ],
                             attributes: ["id"], required: false}
                        ]
                    }
                );
    
                    Model.findAndCountAll({
                        attributes : [
                            'id',
                            'salutation',
                            'userId',
                            'doctor_id',
                            'countryId',
                            'stateId',
                            'cityId',
                            'doctor_profile_pic',
                            'gender',
                            'is_active',
                            //[sequelize.literal('(SELECT (MAX(duration_to)-MIN(duration_from)) FROM doctor_experiences WHERE doctor_experiences.doctorProfileId = doctorprofile.id)'),'total_exp'],
                            [sequelize.literal('(SELECT COUNT(*) FROM hospital_doctors WHERE hospital_doctors.doctorProfileId = doctorprofile.id)'),'total_hospital']
                        ],
                        where: cityCond,
                        include: includeObj,
                        distinct: true,
                        limit: 10,
                        offset: (page - 1) * pageSize
                    }).then(function (doctors) {
    
                        let usersObj = JSON.parse(JSON.stringify(doctors));
                        
                        if(!_.isEmpty(usersObj.rows)){
                        
                        // _.forOwn(usersObj.rows, function(value, key) {
                        //     usersObj.rows[key]['doctor_profile_pic'] = value.doctor_profile_pic ? value.doctor_profile_pic : ( value.gender === "male" ? 'public/uploads/icon/male.png' : 'public/uploads/icon/female.png');
                        //     // usersObj.rows[key]['doctor_profile_pic'] = value.doctor_profile_pic ? value.doctor_profile_pic.split("/").pop() : ( value.gender === "male" ? 'public/uploads/icon/male.png' : 'public/uploads/icon/female.png');
                        // });
    
                        return res({status: true,
                            filtered_doctor_list: usersObj.rows,
                            totalData: usersObj.count,
                            pageCount: Math.ceil(usersObj.count / pageSize),
                            pageLimit: pageSize,
                            currentPage:page});
                        } else {
                            return res({status : true, filtered_doctor_list: [], totalData: 0});
                        }
    
                    }).catch(sequelize.ValidationError, function (err) {
                        return res({status : false, message : err.errors});
                    }).catch(function (err) {
                        return res({status : false, message: "Internal error" });
                    })
                } else {
                    return res({status : false, message: "Not a valid request" });
                }
            },

        filterDoctors: function (req, res) {
            if (typeof req !== 'undefined') {

                let pageSize = 10, page = undefined === req.page ? 1 : req.page, includeObj = [], cityCond = {}, nameFilter = {}, whereDoctorProfileDetailCond = { languageId : req.language.id };

                var doctorprofiledetail = Model.hasMany(sequelize.models.doctorprofiledetail, {foreignKey: 'doctorProfileId', as: 'doctorprofiledetails'});
                var doctortags = Model.hasMany(sequelize.models.doctortags, {foreignKey: 'doctorProfileId', as: 'doctortags'});
                var tagdetail = sequelize.models.doctortags.belongsTo(sequelize.models.tagdetail, {foreignKey: 'tagId', as: 'tagdetail', targetKey : "tagId"});
                var countrydetail = Model.belongsTo(sequelize.models.countrydetail, {foreignKey: 'countryId', as: 'countrydetail', targetKey : "countryId"});
                var citydetail = Model.belongsTo(sequelize.models.citydetail, {foreignKey: 'cityId', as: 'citydetail', targetKey : "cityId"});
                var statedetail = Model.belongsTo(sequelize.models.statedetail, {foreignKey: 'stateId', as: 'statedetail', targetKey : "stateId"});
                var contactinfo = Model.hasMany(sequelize.models.contactinformation, {foreignKey: 'key', sourceKey: 'id'});
                var doctorexperiences = Model.hasMany(sequelize.models.doctorexperience, {foreignKey: 'doctorProfileId', as: 'doctorexperiences'});
                var doctoreducations = Model.hasMany(sequelize.models.doctoreducation, {foreignKey: 'doctorProfileId', as: 'doctoreducations'});
                var educationtagdetail = sequelize.models.doctoreducation.belongsTo(sequelize.models.tagdetail, {foreignKey: 'tagtypeId', as: 'doctoreducationtagdetail', targetKey : "tagId"});
                var hospital_doctors = Model.hasOne(sequelize.models.hospital_doctors, {foreignKey: 'doctorProfileId', as: 'hospital_doctors'});
                var hospital = sequelize.models.hospital_doctors.belongsTo(sequelize.models.hospital, {foreignKey: 'hospitalId', as: 'hospital', targetKey : "id"});
                var hospitaldetail = sequelize.models.hospital.hasMany(sequelize.models.hospitaldetail, {foreignKey: 'hospitalId', as: 'hospitaldetail', sourceKey : "id"});
                

                if(!_.isEmpty(req.selected_specialization)){
                    includeObj.push({
                        association: doctortags,
                        where: { tagId : req.selected_specialization },
                        required: true,
                        include: [
                            {
                                association: tagdetail,
                                attributes: ["title"],
                                required: false
                            }
                        ]
                    });
                } else {
                    includeObj.push({
                        association: doctortags,
                        attributes: ["tagId", "tagtypeId"],
                        where:{tagtypeId:2},
                        required: false,
                        include: [
                            {
                                association: tagdetail,
                                attributes: ["title"],
                                required: false
                            }
                        ]
                    })
                }

                cityCond['is_active'] = 1;
                if(req.search_by === 'id') {
                    cityCond['id'] = req.doctorProfileId;
                } else {
                    if(!_.isEmpty(req.selected_city)){
                        cityCond['cityId'] = req.selected_city;
                    }

                    if(!_.isEmpty(req.name)){
                        whereDoctorProfileDetailCond.name = { $like : '%' + req.name + '%' };
                    }

                    let contactInfoCond;
                    if(!_.isEmpty(req.email) && !_.isEmpty(req.mobile)) {
                        contactInfoCond = {
                          value: {
                            '$in': [req.email, req.mobile]
                          },
                          model: 'doctorprofile'
                        }
                    }
                    if(!_.isEmpty(req.email) && _.isEmpty(req.mobile)) {
                        contactInfoCond = {
                            value: { $like : '%' + req.email + '%' } ,
                            model: 'doctorprofile'
                        }
                    }
                    if(_.isEmpty(req.email) && !_.isEmpty(req.mobile)) {
                        contactInfoCond = {
                            value : { $like : '%' + req.mobile + '%' },
                            model: 'doctorprofile'
                        }
                    }

                    if("undefined" !== typeof contactInfoCond) {
                        includeObj.push({
                            association: contactinfo,
                            where: contactInfoCond,
                            required: true
                        });
                    } else {
                        includeObj.push({
                            association: contactinfo,
                            where: {
                                model: 'doctorprofile',
                                is_primary: 1
                            },
                            required: true
                        });
                    }
                }

                
                


                includeObj.push({
                    association: doctorprofiledetail,
                    where: whereDoctorProfileDetailCond,
                    attributes : ["name", "address_line_1"],
                    required: true
                }, {
                    association: countrydetail,
                    where: { languageId : req.language.id },
                    attributes : ["name"],
                    required: true
                }, {
                    association: citydetail,
                    where: { languageId : req.language.id },
                    attributes : ["name"],
                    required: true
                }, {
                    association: statedetail,
                    where: { languageId : req.language.id },
                    attributes : ["name"],
                    required: true
                }, {
                    association: doctorexperiences,
                    attributes: ["duration_from", "duration_to"],
                    required: false
                }, {
                    association: doctoreducations,
                    attributes: ["tagtypeId"],
                    required: false,
                    include: [
                        {association: educationtagdetail, attributes: ["title"], required: false}
                    ]
                },
                {
                    association: hospital_doctors,
                    attributes: ["hospitalId"],
                    required: false,
                    include: [
                        {association: hospital,include:[
                            {association: hospitaldetail, attributes: ["hospital_name"], required: false}
                        ],
                         attributes: ["id"], required: false}
                    ]
                }
            );

                Model.findAndCountAll({
                    attributes : [
                        'id',
                        'salutation',
                        'userId',
                        'doctor_id',
                        'countryId',
                        'stateId',
                        'cityId',
                        'doctor_profile_pic',
                        'gender',
                        'is_active',
                        //[sequelize.literal('(SELECT (MAX(duration_to)-MIN(duration_from)) FROM doctor_experiences WHERE doctor_experiences.doctorProfileId = doctorprofile.id)'),'total_exp'],
                        [sequelize.literal('(SELECT COUNT(*) FROM hospital_doctors WHERE hospital_doctors.doctorProfileId = doctorprofile.id)'),'total_hospital']
                    ],
                    where: cityCond,
                    include: includeObj,
                    distinct: true,
                    limit: 10,
                    offset: (page - 1) * pageSize
                }).then(function (doctors) {

                    let usersObj = JSON.parse(JSON.stringify(doctors));
                    
                    if(!_.isEmpty(usersObj.rows)){
                    
                    _.forOwn(usersObj.rows, function(value, key) {
                        usersObj.rows[key]['doctor_profile_pic'] = value.doctor_profile_pic ? value.doctor_profile_pic : ( value.gender === "male" ? 'public/uploads/icon/male.png' : 'public/uploads/icon/female.png');
                        // usersObj.rows[key]['doctor_profile_pic'] = value.doctor_profile_pic ? value.doctor_profile_pic.split("/").pop() : ( value.gender === "male" ? 'public/uploads/icon/male.png' : 'public/uploads/icon/female.png');
                    });

                    return res({status: true,
                        filtered_doctor_list: usersObj.rows,
                        totalData: usersObj.count,
                        pageCount: Math.ceil(usersObj.count / pageSize),
                        pageLimit: pageSize,
                        currentPage:page});
                    } else {
                        return res({status : true, filtered_doctor_list: [], totalData: 0});
                    }

                }).catch(sequelize.ValidationError, function (err) {
                    return res({status : false, message : err.errors});
                }).catch(function (err) {
                    return res({status : false, message: "Internal error" });
                })
            } else {
                return res({status : false, message: "Not a valid request" });
            }
        },
        checkProfileIsComplete: function (req, res) {
            
            sequelize.models.doctorprofile.hasMany(sequelize.models.doctorprofiledetail);
            sequelize.models.doctorprofile.hasMany(sequelize.models.doctortags);
            sequelize.models.doctorprofile.hasMany(sequelize.models.doctoreducation);
            sequelize.models.doctoreducation.hasMany(sequelize.models.doctoreducationdetail)
            sequelize.models.doctorprofile.hasMany(sequelize.models.doctorexperience);
            sequelize.models.doctorexperience.hasMany(sequelize.models.doctorexperiencedetail)
            sequelize.models.doctorprofile.hasMany(sequelize.models.doctorregistration);
            sequelize.models.doctorregistration.hasMany(sequelize.models.doctorregistrationdetail)
            sequelize.models.doctorprofile.hasMany(sequelize.models.doctoraward);
            sequelize.models.doctoraward.hasMany(sequelize.models.doctorawarddetail)
            sequelize.models.doctorprofile.hasMany(sequelize.models.doctorfile);

            Model.findOne({
                where: {userId: req.userId},
                include: [
                    {model: sequelize.models.doctorprofiledetail, where:language.buildLanguageQuery( {}, req.langId, '`doctor_profiles`.`id`', sequelize.models.doctorprofiledetail, 'doctorProfileId')},
                    {model: sequelize.models.doctortags, attributes: ['tagId', 'tagtypeId'], required: false},
                    {model: sequelize.models.doctoreducation,
                        include: [
                            {
                                model: sequelize.models.doctoreducationdetail,
                                where: language.buildLanguageQuery({}, req.langId, '`doctoreducation`.`id`', sequelize.models.doctoreducationdetail, 'doctorEducationId'),
                                required: false
                            }
                        ],
                        required: false
                    },
                    {model: sequelize.models.doctorexperience,
                        include: [{model: sequelize.models.doctorexperiencedetail, where: language.buildLanguageQuery({}, req.langId, '`doctorexperience`.`id`', sequelize.models.doctorexperiencedetail, 'doctorExperienceId'), required: false}],
                        required: false
                    },
                    {model: sequelize.models.doctorregistration,
                        include: [{model: sequelize.models.doctorregistrationdetail, where: language.buildLanguageQuery({}, req.langId, '`doctorregistration`.`id`', sequelize.models.doctorregistrationdetail, 'doctorRegistrationId'), required: false}],
                        required: false
                    },
                    {model: sequelize.models.doctoraward,
                        include: [{model: sequelize.models.doctorawarddetail, where: language.buildLanguageQuery({}, req.langId, '`doctoraward`.`id`', sequelize.models.doctorawarddetail, 'doctorAwardId'), required: false}],
                        required: false
                    },
                    {model: sequelize.models.doctorfile, required: false},
                ],
            }).then(function(result) {
                if(result !== null) {
                    let educationsStatus = result.doctoreducations.length > 0;
                    let registrationsStatus = result.doctorregistrations.length > 0;
                    let servicesTagStatus = result.doctortags.some((item) => { return item.tagtypeId == 1 })
                    let specializationTagStatus = result.doctortags.some((item) => { return item.tagtypeId == 2 })
                    let filesStatus = result.doctorfiles.some((item) => { return item.document_type === 'identity' })
                    
                    let profileCompletionStatus = educationsStatus && registrationsStatus && servicesTagStatus && specializationTagStatus && filesStatus;

                    return {
                        isClaimed: true, 
                        data: result, 
                        isCompleteProfile: profileCompletionStatus
                    }
                } else {
                    res({
                        isClaimed: false
                    })
                }
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));

        },
        link_clinic_time: function (req, res) {
            var hospital_doctors = Model.hasMany(sequelize.models.hospital_doctors, {foreignKey: 'doctorProfileId', as: 'hospital_doctors'});
            var doctorprofiledetail = Model.hasMany(sequelize.models.doctorprofiledetail, {foreignKey: 'doctorProfileId', as: 'doctorprofiledetails'});
            var hospital_timings = sequelize.models.hospital.hasMany(sequelize.models.hospital_timings, {foreignKey: 'hospitalId', as: 'hospital_timings'});
            var hospital_doctor_timings = sequelize.models.hospital_doctors.hasMany(sequelize.models.hospital_doctor_timings, {foreignKey: 'hospitalDoctorId', as: 'hospital_doctor_timings'});
            
            let reqDaysArr = req.timers.map(function (item){
                return item.days.toLowerCase();
            }); 

            console.log(req);
            
            if (typeof req !== 'undefined') {

                //No need to interact with DB for these 2 validations
                let errorsCustom = {};
                if(!req.consultation_charge){
                    errorsCustom['consultation_charge'] = 'Please enter valid amount.';
                }

                if(req.appointment_duration === undefined || !req.appointment_duration){
                    errorsCustom['appointment_duration'] = 'Please select valid duration.';
                }
                
                if( req.is_hosp === undefined ) { 
                    if(_.isEmpty(req.timers) && (req.available_on_req === undefined || req.available_on_req === false)){
                        errorsCustom['timers'] = 'Please add atleast single day time or check above checkbox as true';
                    }
                } else {
                    if(_.isEmpty(req.timers) && (req.shift_24X7 === undefined || req.shift_24X7 === false)){
                        errorsCustom['timers'] = 'Please add atleast single day time or check shift 24X7 as true';
                    }
                }
                
                if(!_.isEmpty(errorsCustom)){
                    return res({ status : false, error : errorsCustom });
                }
                
                async.parallel({
                    hospitalDetail : function(callback) {
                        sequelize.models.hospital.find({
                            where: { id : req.hospitalId },
                            attributes : ["shift_24X7", "id"],
                            include : [
                                { 
                                    association : hospital_timings,
                                    attributes : ["days", "shift_1_from_time", "shift_1_to_time", "shift_2_from_time", "shift_2_to_time"],
                                }
                            ]
                        }).then(function (response) {
                            let responseObj = JSON.parse(JSON.stringify(response));
                            callback(null, responseObj);
                        });
                    },
                    DoctorDetail : function(callback) {
                        sequelize.models.hospital_doctors.findAll({
                            where: { 
                                doctorProfileId : req.doctorProfileId,
                                hospitalId : { $ne : req.hospitalId }
                            },
                            //attributes : ["id", "available_on_req"],
                            include : [
                                { 
                                    association : hospital_doctor_timings,
                                    attributes : ["days", "shift_1_from_time", "shift_1_to_time", "shift_2_from_time", "shift_2_to_time"],
                                }
                            ]
                        }).then(function (response) {
                            let responseObj = JSON.parse(JSON.stringify(response));
                            callback(null, responseObj);
                        });
                    },
                    DoctorSingleHosp : function(callback) {
                        sequelize.models.hospital_doctors.findAll({
                            where: { 
                                doctorProfileId : req.doctorProfileId,
                                hospitalId : req.hospitalId
                            },
                            //attributes : ["id", "available_on_req"],
                            include : [
                                { 
                                    association : hospital_doctor_timings,
                                    attributes : ["id","days", "shift_1_from_time", "shift_1_to_time", "shift_2_from_time", "shift_2_to_time", "hospitalDoctorId"],
                                }
                            ]
                        }).then(function (response) {
                            let responseObj = JSON.parse(JSON.stringify(response));
                            callback(null, responseObj);
                        });
                    }
                }, function(err, results) {
                    
                    if(results.hospitalDetail.shift_24X7 === 0) {
                        
                        let hospitalDaysArr = results.hospitalDetail.hospital_timings.map(function (item){
                            return item.days;
                        });

                        // Check request days array should present in hospital timing array
                        if(_.difference(reqDaysArr,hospitalDaysArr).length > 0){
                            return res({status : false, message : "Days combinations are not matching with hospital's timings!"});
                        }

                        let singleDayClash = {};
                        req.timers.map(function (reqTimeObj, i) {
                            results.hospitalDetail.hospital_timings.map(function (hospitalTimeObj, k) {
                                
                                if(hospitalTimeObj.days === reqTimeObj.days){
                                
                                    if(reqTimeObj.shift_1_from_time < hospitalTimeObj.shift_1_from_time || reqTimeObj.shift_1_from_time > hospitalTimeObj.shift_1_to_time){

                                        if(!singleDayClash[reqTimeObj.days]){
                                            singleDayClash[reqTimeObj.days] = {};
                                        }

                                        singleDayClash[reqTimeObj.days]['shift_1_from_time'] = 'Not matching';
                                    }

                                    if(reqTimeObj.shift_1_to_time < hospitalTimeObj.shift_1_from_time || reqTimeObj.shift_1_to_time > hospitalTimeObj.shift_1_to_time){

                                        if(!singleDayClash[reqTimeObj.days]){
                                            singleDayClash[reqTimeObj.days] = {};
                                        }

                                        singleDayClash[reqTimeObj.days]['shift_1_to_time'] = 'Not matching';
                                    }

                                    if(reqTimeObj.shift_2_from_time < hospitalTimeObj.shift_2_from_time || reqTimeObj.shift_2_from_time > hospitalTimeObj.shift_2_to_time){

                                        if(!singleDayClash[reqTimeObj.days]){
                                            singleDayClash[reqTimeObj.days] = {};
                                        }

                                        singleDayClash[reqTimeObj.days]['shift_2_from_time'] = 'Not matching';
                                    }

                                    if(reqTimeObj.shift_2_to_time < hospitalTimeObj.shift_2_from_time || reqTimeObj.shift_2_to_time > hospitalTimeObj.shift_2_to_time){

                                        if(!singleDayClash[reqTimeObj.days]){
                                            singleDayClash[reqTimeObj.days] = {};
                                        }

                                        singleDayClash[reqTimeObj.days]['shift_2_to_time'] = 'Not matching';
                                    }
                                
                                }
                            });
                        });

                        if(!_.isEmpty(singleDayClash)){
                            return res({status : false, error : singleDayClash, message : "Oops! There is clash with hospital timings."});
                        }
                        
                    } 

                    //We need to identify whether doctor is available for this slot or not
                    if(!_.isEmpty(req.timers)){

                        let singleDayClash = {};
                        req.timers.map(function (reqTimeObj, i) {
                            results.DoctorDetail.map(function (hospitalTimeObjO) {
                                if(hospitalTimeObjO.hospital_doctor_timings) {
                                    hospitalTimeObjO.hospital_doctor_timings.map(function (hospitalTimeObj) { 
                                        if(hospitalTimeObj.days == reqTimeObj.days){
                                        
                                            if(reqTimeObj.shift_1_from_time < hospitalTimeObj.shift_1_from_time || reqTimeObj.shift_1_from_time > hospitalTimeObj.shift_1_to_time){

                                                if(!singleDayClash[reqTimeObj.days]){
                                                    singleDayClash[reqTimeObj.days] = {};
                                                }

                                                singleDayClash[reqTimeObj.days]['shift_1_from_time'] = 'Not matching';
                                            }

                                            if(reqTimeObj.shift_1_to_time < hospitalTimeObj.shift_1_from_time || reqTimeObj.shift_1_to_time > hospitalTimeObj.shift_1_to_time){

                                                if(!singleDayClash[reqTimeObj.days]){
                                                    singleDayClash[reqTimeObj.days] = {};
                                                }

                                                singleDayClash[reqTimeObj.days]['shift_1_to_time'] = 'Not matching';
                                            }

                                            if(reqTimeObj.shift_2_from_time < hospitalTimeObj.shift_2_from_time || reqTimeObj.shift_2_from_time > hospitalTimeObj.shift_2_to_time){

                                                if(!singleDayClash[reqTimeObj.days]){
                                                    singleDayClash[reqTimeObj.days] = {};
                                                }

                                                singleDayClash[reqTimeObj.days]['shift_2_from_time'] = 'Not matching';
                                            }

                                            if(reqTimeObj.shift_2_to_time < hospitalTimeObj.shift_2_from_time || reqTimeObj.shift_2_to_time > hospitalTimeObj.shift_2_to_time){

                                                if(!singleDayClash[reqTimeObj.days]){
                                                    singleDayClash[reqTimeObj.days] = {};
                                                }

                                                singleDayClash[reqTimeObj.days]['shift_2_to_time'] = 'Not matching';
                                            }

                                        }
                                    });
                                }
                            });
                        });

                        if(!_.isEmpty(singleDayClash)){
                            return res({status : false, error : singleDayClash, message : "Oops! This doctor is already mapped with another hospital for same timings. Please fix these clashed time error and then try again."});
                        }
                    }

                    if(req.id !== undefined){ 
                        //Save the records success
                        let pk = req.id;
                        delete req.id;
                        sequelize.models.hospital_doctors.update(req, { where : {id : pk} }) 
                        .then(anotherTask => {
                            
                            let saveInDoctorTimings = [];
                            
                            req.timers.map(function (singleDayObj) {

                                delete singleDayObj.shift_1_from_second;
                                delete singleDayObj.shift_1_to_second;
                                delete singleDayObj.shift_2_from_second;
                                delete singleDayObj.shift_2_to_second;

                                saveInDoctorTimings.push(_.merge(singleDayObj, { hospitalDoctorId: anotherTask.id}));
                            });

                            var promises = [], 
                            sidsisis = _.map(results.DoctorSingleHosp[0].hospital_doctor_timings, 'id'),
                            reqididi = _.map(req.timers, 'id'),
                            diffididi = _.difference(sidsisis, reqididi);

                            if(!_.isEmpty(diffididi)) { 
                                promises.push(sequelize.models.hospital_doctor_timings.destroy({where :{id : diffididi}})); 
                            }

                            saveInDoctorTimings.map(function (singleObj, index) {
                                if(singleObj.id !== undefined) { 
                                    let Idd = singleObj.id;
                                    delete singleObj.id;
                                    delete singleObj.days;
                                    delete singleObj.hospitalDoctorId;
                                    promises.push(sequelize.models.hospital_doctor_timings.update(singleObj, {where :{id : Idd}}));
                                } else {
                                    singleObj.hospitalDoctorId = results.DoctorSingleHosp[0].hospital_doctor_timings[0].hospitalDoctorId;
                                    promises.push(sequelize.models.hospital_doctor_timings.create(singleObj));
                                }
                            });
                       
                            Promise.all(promises).then(function(updatedObj){
                                return res({status : true, message : "Timings have been udpated successfully."});
                            }, function(err){
                                return res({status : false, message : "Internal error."});
                            });

                        }).catch(sequelize.ValidationError, function (err) {
                            return res({status : false, message : err.errors});
                        }).catch(function (err) {
                            return res({status : false, message: "Internal error" });
                        });
                    } else {
                        //Save the records success
                        sequelize.models.hospital_doctors.build(req) 
                        .save()
                        .then(anotherTask => {
                            let saveInDoctorTimings = [];
                            
                            req.timers.map(function (singleDayObj, index) {

                                delete singleDayObj.shift_1_from_second;
                                delete singleDayObj.shift_1_to_second;
                                delete singleDayObj.shift_2_from_second;
                                delete singleDayObj.shift_2_to_second;

                                saveInDoctorTimings.push(_.merge(singleDayObj, { hospitalDoctorId: anotherTask.id}))
                            });

                            sequelize.models.hospital_doctor_timings.bulkCreate(saveInDoctorTimings)
                                .then(savedTimingsObj => {
                                let savedTimings = JSON.parse(JSON.stringify(savedTimingsObj));
                                if( savedTimings !== null ){
                                    return res({status : true, message : "Timing has been added successfully."});
                                } else {
                                    return res({status : false, message : "Internal error."});
                                }
                            });
                        }).catch(sequelize.ValidationError, function (err) {
                            return res({status : false, message : err.errors});
                        }).catch(function (err) {
                            return res({status : false, message: "Internal error" });
                        })
                    }
                    
                });

            } else {
                return res({status : false, message: "Not a valid request" });
            }
        },
    }
});
return Model;
};
