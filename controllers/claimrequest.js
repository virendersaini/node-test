var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var country = require('./country');
var state = require('./state');
var city = require('./city');
var tagtype = require('./tagtype');
var doctor = require('./doctor');
var hospital = require('./hospital');
var utils = require('./utils');
var notification=require('./notification');
function claimRequest() {

    this.doctorClaimRequest = function(req, res) {
        models.doctorprofile.hasMany(models.doctorprofiledetail);
        models.doctorprofile.hasMany(models.contactinformation, {foreignKey: 'key', sourceKey: 'id'});
        models.doctorprofile.findOne({
            where: {
                id: req.doctorProfileId
            },
            include: [
                {model: models.doctorprofiledetail, where:language.buildLanguageQuery( {}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')},
                {model: models.contactinformation, where: {model: 'doctorprofile', is_primary: 1}}
            ]
        }).then(function(result) {
            if(result) {

                models.claimrequest.findOne({where: {userId: req.userId, model: 'doctorprofile', status: 'pending'}}).then(function(userPendingClaimRequestData) {
                    if(userPendingClaimRequestData) {
                        res({status:true, message:language.lang({key:"alreadyClaimRequestPending", lang:req.lang})});    
                    } else {
                        if("non-claimed" === result.claim_status) {
                            models.claimrequest.create({ userId: req.userId, keyId: req.doctorProfileId, model: 'doctorprofile', status: 'pending' }).then(function(createResponse) {
                                models.doctorprofile.update({claim_status: 'pending'}, {where: {id: req.doctorProfileId}}).then(function(updateResponse) {
                                    res({status:true, message:language.lang({key:"claimRequestSentSuccessfully", lang:req.lang}), data: result});
                                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang})}));
                            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang})}));
                        } else if("pending" === result.claim_status) {
                            models.claimrequest.findOne({where: {keyId: req.doctorProfileId, model: 'doctorprofile', status: 'pending'}}).then(function(claimRequestData) {
                                if(claimRequestData.userId === req.userId) res({status:false, message:language.lang({key:"alreadyClaimRequestSent", lang:req.lang})});
                                res({status:false, message:language.lang({key:"anotherClaimRequestPending", lang:req.lang})});
                            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang})}));
                        } else {
                            res({status:true, message:language.lang({key:"alreadyProfileClaimed", lang:req.lang})});
                        }        
                    }
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang})}));
                
            } else {
                res({status:true, message:language.lang({key:"Record not found.", lang:req.lang})});
            }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }

    this.doctorCancelClaimRequest = function(req, res) {
        models.claimrequest.destroy({
            where: {userId: req.userId, keyId: req.doctorProfileId, model: 'doctorprofile', status: 'pending'}
        }).then(function(response) {
            models.doctorprofile.update({claim_status: 'non-claimed', userId: null}, {where: {id: req.doctorProfileId}}).then(function(updateResponse) {
                res({status:true, message:language.lang({key:"claimRequestCancelSuccessfully", lang:req.lang})});
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }

    this.hospitalCancelClaimRequest = function(req, res) {
        models.claimrequest.destroy({
            where: {userId: req.userId, keyId: req.hospitalId, model: 'hospital', status: 'pending'}
        }).then(function(response) {
            models.hospital.update({claim_status: 'non-claimed', userId: null}, {where: {id: req.hospitalId}}).then(function(updateResponse) {
                res({status:true, message:language.lang({key:"claimRequestCancelSuccessfully", lang:req.lang})});
            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }

    this.viewClaimedUserDetail = function(req, res) {
        models.claimrequest.belongsTo(models.user, {foreignKey: 'userId'});
        models.user.hasMany(models.userdetail);
        models.claimrequest.findOne({
            where: { keyId: req.keyId, model: req.model, status: 'pending'},
            include: [
                { 
                    model: models.user, 
                    attributes: ['id', 'email', 'mobile'],
                    include: [{model: models.userdetail, where:language.buildLanguageQuery( {}, req.langId, '`user.id`', models.userdetail, 'userId'), attributes: ['fullname']}]   
                }
            ]
        }).then(function(result) {
            res({status: true, data: result})
        }).catch((err) => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }

    this.handleRequest = function(req, res) {
        models.claimrequest.update(
            {status: req.status}, 
            {where: {userId: req.userId, keyId: req.keyId, model: req.model, status: 'pending'}
        }).then(function(response) {
                 let profileUpdateData = {}
                                 let claim_message = '';
                                if("approved" === req.status) {
                                    profileUpdateData.userId = req.userId;
                                    profileUpdateData.claim_status = "approved";
                                }
                                if("rejected" === req.status) {
                                    profileUpdateData.userId = null;
                                    profileUpdateData.claim_status = "non-claimed";
                                }
        
            let responseMessage = req.status === "approved" ? "Claim request has been approved." : "Claim request has been rejected.";
            if(req.model === "doctorprofile") {
                models.doctorprofile.update(
                    profileUpdateData, {where: {id: req.keyId}}
                ).then(function(finalResp) {


                    //CLAIM STATUS NOTIFICATION ONLY FOR DOCTOR

                     //models.doctorprofile.belongsTo(models.user)
                        models.doctorprofile.hasMany(models.doctorprofiledetail)
                            models.doctorprofile.find({
                                include: [
                               // { model: models.user },
                                { model: models.doctorprofiledetail,
                                    where: language.buildLanguageQuery(
                                        {}, req.langId, '`doctor_profiles`.`id`', models.doctorprofiledetail, 'doctorProfileId'
                                    )
                                }
                                ],
                                where: {id: req.keyId},
                            }).then(function(doctData) {
                                models.user.find({
                                where: {id: req.userId}
                                }).then(function(userData) {
                                     let claim_message = '';
                                     let claim_noti_template;
                                    if("approved" === req.status) {
                                        claim_noti_template = 'front/notification/claim_status/approved';
                                        //claim_message = "Your claim request for Profile Id:"+doctData.id+","+doctData.doctorprofiledetails[0].name+" has been approved, now you can manage the profile."                                
                                    }
                                    if("rejected" === req.status) {
                                        claim_noti_template = 'front/notification/claim_status/rejected';
                                       //claim_message = "Your claim request for Profile Id:"+doctData.id+","+doctData.doctorprofiledetails[0].name+" has been rejected by wikicare, please create your own profile.";
                                    }
                                    
                                    if(claim_noti_template) {
                                        notification.send([{
                                            id: doctData.id, 
                                            device_id: userData.device_id,
                                            is_notification: userData.is_notification
                                        }],
                                         claim_noti_template,
                                        {
                                            lang:req.lang,
                                            doctor_id: doctData.id,
                                            doctor_name: doctData.doctorprofiledetails[0].name
                                        }, {
                                            senderId: 1,
                                           // meta: {feedbackId: patientData.id},
                                            data:{type:'claim_status'}
                                        });
                                    }
                                 })
                        })
                    //END OF CLAIM STATUS NOTIFICATION ONLY FOR doctor


                    doctor.updateProfileStatusWhileUpdate({id: req.keyId, langId: req.langId}, function(resp) {
                        if(resp.status) {
                            res({status: true, message: language.lang({key: responseMessage, lang: req.lang})});
                        } else {
                            res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})    
                        }
                    })
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }

            if(req.model === "hospital") {
                models.hospital.update(
                    profileUpdateData, {where: {id: req.keyId}}
                ).then(function(finalResp) {
                    if("approved" === req.status) {
                        models.user.find({where: {id: req.userId}, attributes: ["user_type"]}).then(function(userData) {
                            if(userData.user_type === "doctor") {
                                models.user.update({user_type: "doctor_clinic_both"}, {where: {id: req.userId}})
                            }
                        })
                    }
                    utils.updateProfileStatusWhileUpdate({id: req.keyId, langId: req.langId}, function(resp) {
                        if(resp.status) {
                            res({status: true, message: language.lang({key: responseMessage, lang: req.lang})});
                        } else {
                            res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true})    
                        }
                    })
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
            }
            
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }

    this.clinicClaimRequest = function(req, res) {
        models.hospital.hasMany(models.hospitaldetail);
        models.doctorprofile.hasMany(models.contactinformation, {foreignKey: 'key', sourceKey: 'id'});
        models.hospital.findOne({
            where: {
                id: req.hospitalId
            },
            include: [
                {model: models.hospitaldetail, where:language.buildLanguageQuery( {}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')},
                {model: models.contactinformation, where: {model: 'hospital', is_primary: 1}}
            ]
        }).then(function(result) {
            if(result) {

                models.claimrequest.findOne({where: {userId: req.userId, model: 'hospital', status: 'pending'}}).then(function(userPendingClaimRequestData) {
                    if(userPendingClaimRequestData) {
                        res({status:false, message:language.lang({key:"You have already one pending claim request.", lang:req.lang})});    
                    } else {
                        if("non-claimed" === result.claim_status) {
                            models.claimrequest.create({ userId: req.userId, keyId: req.hospitalId, model: 'hospital', status: 'pending' }).then(function(createResponse) {
                                models.hospital.update({claim_status: 'pending'}, {where: {id: req.hospitalId}}).then(function(updateResponse) {
                                    res({status:true, message:language.lang({key:"claimRequestSentSuccessfully", lang:req.lang}), data: result});
                                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang})}));
                            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang})}));
                        } else if("pending" === result.claim_status) {
                            models.claimrequest.findOne({where: {keyId: req.hospitalId, model: 'hospital', status: 'pending'}}).then(function(claimRequestData) {
                                if(claimRequestData.userId === req.userId) res({status:false, message:language.lang({key:"alreadyClaimRequestSent", lang:req.lang})});
                                res({status:false, message:language.lang({key:"anotherClaimRequestPending", lang:req.lang})});
                            }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang})}));
                        } else {
                            res({status:false, message:language.lang({key:"alreadyProfileClaimed", lang:req.lang})});
                        }        
                    }
                }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang})}));
                
            } else {
                res({status:false, message:language.lang({key:"Record not found.", lang:req.lang})});
            }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }

    this.doctorClaimProfile = function(req,res){
        models.claimrequest.belongsTo(models.doctorprofile, {foreignKey: 'keyId'});
        models.doctorprofile.hasMany(models.doctorprofiledetail);
        models.doctorprofile.hasMany(models.doctortags);
        models.doctortags.belongsTo(models.tag);

        models.tag.hasMany(models.tagdetail);
        models.doctorprofile.hasMany(models.doctorfile);
        models.doctorprofile.hasMany(models.contactinformation, {foreignKey: 'key', sourceKey: 'id'});
        models.doctorprofile.hasMany(models.hospital_doctors);
        models.hospital_doctors.hasMany(models.hospital_doctor_timings, {
            foreignKey: 'hospitalDoctorId',
            sourceKey: 'id'
        });
        models.hospital_doctors.belongsTo(models.hospital);
        models.hospital.hasMany(models.hospitaldetail);
        models.doctorprofile.hasMany(models.doctoreducation);
        models.doctorprofile.hasMany(models.doctorregistration);
        models.claimrequest.findOne({logging:true,
            attributes:['keyId','status'],
            where: {userId: req.userId,model: 'doctorprofile', status: {$in: ['pending', 'approved']}},
            //subQuery: false,
            include: [
               { 
                    model: models.doctorprofile, 
                    attributes: ['id','salutation','doctor_profile_pic','claim_status','is_live','is_active','verified_status','is_complete'],
                    include: [
                        { 
                            model:models.doctortags,where:{tagtypeId:{$in: [utils.getAllTagTypeId()['SpecializationTagId'],utils.getAllTagTypeId()['ServiceTagId']]}},required:false,
                            include:[
                                {
                                    model:models.tag,
                                    attributes:['id'],
                                    required:false,
                                    include:[
                                        {
                                            model: models.tagdetail, where:language.buildLanguageQuery( {}, req.langId, '`doctorprofile.doctortags.tag`.`id`', models.tagdetail, 'tagId'), attributes: ['title'], required: false
                                        }
                                    ]
                                },
                            ]
                        }, {
                            model: models.doctorprofiledetail, where:language.buildLanguageQuery( {}, req.langId, '`doctorprofile.id`', models.doctorprofiledetail, 'doctorProfileId'), attributes: ['name']
                        }, {
                            model: models.contactinformation, required:false,
                            attributes:['value'],
                            where:{
                                type: 'email',
                                is_primary: 1,
                                model: 'doctorprofile'
                            },
                        }, {
                            model: models.doctorfile,
                            where: {file_type: 'image', document_type: 'identity'},
                            required: false
                        }, {
                            model: models.doctoreducation,  
                            required: false
                        }, {
                            model: models.doctorregistration,
                            required: false
                        },
                        {
                            model: models.hospital_doctors,
                            // attributes:['id'],
                            required:false,
                            include: [
                                {
                                    model: models.hospital,
                                    //attributes:['id'], 
                                    required:false, 
                                    include:[
                                        {
                                            model:models.hospitaldetail,
                                            //attributes:['hospital_name'],
                                            where:language.buildLanguageQuery( {}, req.langId, '`doctorprofile.hospital_doctors.hospital`.`id`', models.hospitaldetail, 'hospitalId'), required: false
                                        }
                                    ], 
                                    required: false
                                },
                                {
                                    model: models.hospital_doctor_timings,
                                    attributes: [
                                        [models.sequelize.fn(
                                            'DATE_FORMAT', models.sequelize.fn(
                                                'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
                                            ), "%h:%i %p"
                                        ), 'shift_1_from_time'],
                                        [models.sequelize.fn(
                                            'DATE_FORMAT', models.sequelize.fn(
                                                'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
                                            ), "%h:%i %p"
                                        ), 'shift_1_to_time'],
        
                                        [models.sequelize.fn(
                                            'DATE_FORMAT', models.sequelize.fn(
                                                'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
                                            ), "%h:%i %p"
                                        ), 'shift_2_from_time'],
        
                                        [models.sequelize.fn(
                                            'DATE_FORMAT', models.sequelize.fn(
                                                'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
                                            ), "%h:%i %p"
                                        ), 'shift_2_to_time'],
                                        'days',
                                        'id',
                                        'shift_1_from_key',
                                        'shift_1_to_key',
                                        'shift_2_from_key',
                                        'shift_2_to_key',
                                        ['shift_1_from_time', 'shift_1_from_second'],
                                        ['shift_1_to_time', 'shift_1_to_second'],
                                        ['shift_2_from_time', 'shift_2_from_second'],
                                        ['shift_2_to_time', 'shift_2_to_second']
                                    ],
                                    required: false
                                }
                            ],
                            required: false
                        },
                    ]   
                }
            ]
        }).then(function(data) {
            if(data == null){
                models.doctorprofile.findOne({
                            attributes: ['id','salutation','doctor_profile_pic','claim_status','is_live','is_active','verified_status','is_complete'],
                            where: {userId: req.userId},
                            logging: true,
                            //subQuery: false,
                            include: [
                                { 
                                    model:models.doctortags,where:{tagtypeId:{$in: [utils.getAllTagTypeId()['SpecializationTagId'],utils.getAllTagTypeId()['ServiceTagId']]}},required:false,
                                    include:[
                                        {
                                            model:models.tag,
                                            attributes:['id'],
                                            required:false,
                                            include:[
                                                {
                                                    model: models.tagdetail, where:language.buildLanguageQuery( {}, req.langId, '`doctortags.tag`.`id`', models.tagdetail, 'tagId'), attributes: ['title'], required: false
                                                }
                                            ]
                                        },
                                    ]
                                }, {
                                    model: models.doctorprofiledetail, where:language.buildLanguageQuery( {}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'), attributes: ['name']
                                }, {
                                    model: models.contactinformation, required:false,
                                    attributes:['value'],
                                    where:{
                                        type: 'email',
                                        is_primary: 1,
                                        model: 'doctorprofile'
                                    },
                                }, {
                                    model: models.doctorfile,
                                    where: {file_type: 'image', document_type: 'identity'},
                                    required: false
                                }, {
                                    model: models.doctoreducation,  
                                    required: false
                                }, {
                                    model: models.doctorregistration,
                                    required: false
                                },
                                {
                                    model: models.hospital_doctors,
                                    // attributes:['id'],
                                    required:false,
                                    include: [
                                        {
                                            model: models.hospital,
                                            // attributes:['id'], 
                                            required:false, 
                                            include:[
                                                {
                                                    model:models.hospitaldetail,
                                                    // attributes:[
                                                    //     'hospital_name',
                                                    //     'id',
                                                    //     'about_hospital',
                                                    //     'address'
                                                    // ],
                                                    where:language.buildLanguageQuery( {}, req.langId, '`hospital_doctors.hospital`.`id`', models.hospitaldetail, 'hospitalId'), required: false
                                                }
                                            ], 
                                            required: false
                                        },
                                        {
                                            model: models.hospital_doctor_timings,
                                            attributes: [
                                                [models.sequelize.fn(
                                                    'DATE_FORMAT', models.sequelize.fn(
                                                        'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
                                                    ), "%h:%i %p"
                                                ), 'shift_1_from_time'],
                                                [models.sequelize.fn(
                                                    'DATE_FORMAT', models.sequelize.fn(
                                                        'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
                                                    ), "%h:%i %p"
                                                ), 'shift_1_to_time'],
                
                                                [models.sequelize.fn(
                                                    'DATE_FORMAT', models.sequelize.fn(
                                                        'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
                                                    ), "%h:%i %p"
                                                ), 'shift_2_from_time'],
                
                                                [models.sequelize.fn(
                                                    'DATE_FORMAT', models.sequelize.fn(
                                                        'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
                                                    ), "%h:%i %p"
                                                ), 'shift_2_to_time'],
                                                'days',
                                                'id',
                                                'shift_1_from_key',
                                                'shift_1_to_key',
                                                'shift_2_from_key',
                                                'shift_2_to_key',
                                                ['shift_1_from_time', 'shift_1_from_second'],
                                                ['shift_1_to_time', 'shift_1_to_second'],
                                                ['shift_2_from_time', 'shift_2_from_second'],
                                                ['shift_2_to_time', 'shift_2_to_second']
                                            ],
                                            required: false
                                        }
                                    ],
                                    required: false
                                },
                            ]   
                       
                }).then(function(data){
                    if(data == null){
                    res({status:true,message:language.lang({key:"doctorProfile", lang:req.lang}),data:data}) 
                    }else{
                        //profile complete percentage
                        let specStatus = data.doctortags.some((itm) => itm.tagtypeId === utils.getAllTagTypeId()['SpecializationTagId']),
                        serviceStatus = data.doctortags.some((itm) => itm.tagtypeId === utils.getAllTagTypeId()['ServiceTagId']),
                        //regStatus = data.doctorregistrations.length > 0,
                        eduStatus = data.doctoreducations.length > 0,
                        identityStatus = data.doctorfiles.some((itm) => itm.document_type === "identity"),
                        mappedHosStatus = data.hospital_doctors.length > 0;

                        let profileCompletePercentage = 25, remainigInfo = [];

                        specStatus ? (profileCompletePercentage+=15) : (remainigInfo.push({type: 'specStatus', name: language.lang({key:"Add Specializations", lang:req.lang})})), 
                        serviceStatus ? (profileCompletePercentage+=15) : (remainigInfo.push({type: 'serviceStatus', name: language.lang({key:"Add Services", lang:req.lang})})), 
                        //regStatus ? (profileCompletePercentage+=15) : (remainigInfo.push({type: 'regStatus', name: language.lang({key:"Add Registration", lang:req.lang})})),
                        eduStatus ? (profileCompletePercentage+=15) : (remainigInfo.push({type: 'eduStatus', name: language.lang({key:"Add Education", lang:req.lang})})), 
                        identityStatus ? (profileCompletePercentage+=15) : (remainigInfo.push({type: 'identityStatus', name: language.lang({key:"Add Identity proof", lang:req.lang})})), 
                        mappedHosStatus ? (profileCompletePercentage+=15) : (remainigInfo.push({type: 'mappedHosStatus', name: language.lang({key:"Add Visit Clinic/Hospital timing", lang:req.lang})}));

                        res({status:true,message:language.lang({key:"doctorProfile", lang:req.lang}),data:{doctorprofile:data}, profileCompletePercentage, remainigInfo})    
                    }
                })
            }else{
                //profile complete percentage
                let specStatus = data.doctorprofile.doctortags.some((itm) => itm.tagtypeId === utils.getAllTagTypeId()['SpecializationTagId']),
                serviceStatus = data.doctorprofile.doctortags.some((itm) => itm.tagtypeId === utils.getAllTagTypeId()['ServiceTagId']),
                //regStatus = data.doctorprofile.doctorregistrations.length > 0,
                eduStatus = data.doctorprofile.doctoreducations.length > 0,
                identityStatus = data.doctorprofile.doctorfiles.some((itm) => itm.document_type === "identity"),
                mappedHosStatus = data.doctorprofile.hospital_doctors.length > 0;

                let profileCompletePercentage = 25, remainigInfo = [];

                specStatus ? (profileCompletePercentage+=15) : (remainigInfo.push({type: 'specStatus', name: language.lang({key:"Add Specializations", lang:req.lang})})), 
                serviceStatus ? (profileCompletePercentage+=15) : (remainigInfo.push({type: 'serviceStatus', name: language.lang({key:"Add Services", lang:req.lang})})), 
                //regStatus ? (profileCompletePercentage+=15) : (remainigInfo.push({type: 'regStatus', name: language.lang({key:"Add Registration", lang:req.lang})})),
                eduStatus ? (profileCompletePercentage+=15) : (remainigInfo.push({type: 'eduStatus', name: language.lang({key:"Add Education", lang:req.lang})})), 
                identityStatus ? (profileCompletePercentage+=15) : (remainigInfo.push({type: 'identityStatus', name: language.lang({key:"Add Identity proof", lang:req.lang})})), 
                mappedHosStatus ? (profileCompletePercentage+=15) : (remainigInfo.push({type: 'mappedHosStatus', name: language.lang({key:"Add Visit Clinic/Hospital timing", lang:req.lang})}));

                res({status:true,message:language.lang({key:"doctorProfile", lang:req.lang}),data:data, profileCompletePercentage, remainigInfo})
            }
        }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
    }
}
module.exports = new claimRequest();