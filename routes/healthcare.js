var doctor = require('../controllers/healthcare');
var users= require('../controllers/users');
var claimrequest = require('../controllers/claimrequest');
var models = require('../models');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var async = require('async');
var oauth = require('../config/oauth');
var auth = require('../config/auth');
var path = require('path');
crypto = require('crypto');
var _ = require('lodash');
var hospital = require('../controllers/hospital');
var cities = require('cities');
var NodeGeocoder = require('node-geocoder')
var city = require('../controllers/city');
language = require('../controllers/language');
var tag = require('../controllers/tag');
var config = require('../config/config');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === "doctor_profile_pic") {
            cb(null, "public/uploads/doctor_profile_pic")
        }
        cb(null, "public/uploads/doctor_proofs")
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.' + mime.extension(file.mimetype));
    }
});
var uploadFile = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        let checkCondition = file.fieldname === 'doctor_profile_pic' ? file.originalname.match(/\.(jpg|jpeg|png|gif)$/) : file.originalname.match(/\.(jpg|jpeg|png|gif|pdf|PDF)$/);
        if (!checkCondition) {
            cb(language.lang({key:"Only image files are allowed!",lang:req.body.lang}), false);
        } else {
            cb(null, true);
        }
    },
    limits: {fileSize: 150000000}
}).any();

/* GET list of doctor profile search */
router.post('/get-profiles', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    doctor.getAllSearchProfiles(data, function (result) {
        res.send(result);
    });
});



/**
 * @api {post} /doctor/doctor-profiles doctors filtering 
 * @apiName doctor-profiles
 * @apiGroup Doctor
 * @apiParam {string} name optional
 * @apiParam {string} email optional
 * @apiParam {string} mobile optional
 * @apiParam {string} selected_city optional id's are comma seperated
 * @apiParam {string} selected_specialization optional id's are comma seperated
 * 
 * @apiParam {integer} languageId required
 * @apiParam {string} lang required

 * 
 */
/* GET list of doctor data on doctor app */
router.post('/doctor-profiles', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    
    data.language={ id: data.langId, code: data.lang}

    doctor.getAllSearchProfiles(data, function (result) {
        res.send(result);
    });
});



router.post('/meta-data-for-search', oauth.oauth.authorise(), upload.array(), function (req, res) {
    doctor.getMetaDataForSearch(req, function (result) {
        res.send(result);
    })
})

router.post('/check-profile', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.checkProfile(data, function (result) {
        res.send(result);
    })
})



router.post('/saveBooking', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.saveBooking(data, function (result) {
        res.send(result);
    })
})


router.post('/feecalc', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.feecalc(data, function (result) {
        res.send(result);
    })
})



router.post('/search-healthcare', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    // var data = req.body;
    // if (typeof req.body.data !== 'undefined') {
    //     data = JSON.parse(req.body.data);
    // }

    doctor.searchSealthcare(req, function (result) {
        res.send(result);
    })
})


router.post('/search-tag', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    // var data = req.body;
    // if (typeof req.body.data !== 'undefined') {
    //     data = JSON.parse(req.body.data);
    // }

    doctor.searchTag(req, function (result) {
        res.send(result);
    });
    
})


router.post('/save_bank', oauth.oauth.authorise(), upload.array(), function (req, res) {

    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.saveBank(data, function (result) {
        res.send(result);
    });
    
})



router.post('/callApi', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    // var data = req.body;
    // if (typeof req.body.data !== 'undefined') {
    //     data = JSON.parse(req.body.data);
    // }
    doctor.callApp(req, function (result) {
        res.send(result);
    });
    
})


router.post('/healthcare-byid', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.getHealthcareById(data, function (result) {
        res.send(result);
    })
})



router.post('/add-time', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.addTime(data, function (result) {
        res.send(result);
    })
})

router.post('/add-time-api', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.addTimeApi(data, function (result) {
        res.send(result);
    })
})


router.post('/get-booking', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.getBooking(data, function (result) {
        res.send(result);
    })
})

router.post('/get-booking-status', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.getBookingStatus(data, function (result) {
        res.send(result);
    })
})


router.post('/reschedule', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.reScheduleHealthcare(data, function (result) {
        res.send(result);
    })
})



router.post('/new-profile', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.metaDataForNewProfile(data, function (result) {
        res.send(result);
    })
})


router.post('/save-basic-info', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE')
              
                err =   language.lang({key:"Image size should less than 15 MB",lang:req.body.lang});
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if (typeof req.body.data !== 'undefined') {
                data = JSON.parse(req.body.data);
            }

            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !== '') {
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                doctor.saveBasicDetails(data, function (result) {
                    res.send(result);
                })
            });
        }
    })
})



/*
save doctor basic info api
*/
router.post('/save-basic-info-api', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        //req.body.doctor_profile_details={name:req.body.name,about_doctor:req.body.about_doctor,address_line_1:req.body.address_line_1}
       // console.log(req.body);
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE')
                err = language.lang({key:"Image size should less than 15 MB",lang:req.body.lang});

            res.send({status: false, message: err, data: []});
        } else {
            
            var data = req.body;
            if (typeof req.body.data !== 'undefined') {
                data = JSON.parse(req.body.data);
            }





            if(data.id==undefined || data.id==''){
                data.claim_status='user-created';
            }
            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !== '') {
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                doctor.getLatLong({cityId:data.cityId,stateId:data.stateId,countryId:data.countryId,doctor_profile_details:data.doctor_profile_details,}, function (latLongresult) {
                    // /console.log('lat-long');
                    
                    data.latitude=latLongresult.latitude
                    data.longitude=latLongresult.longitude
                doctor.saveBasicDetailsApi(data, function (result) {
                    users.getAssociateProfile({id:data.userId, user_type: 'doctor', lang:data.lang}, function(associatedProfileData){
                        result.associatedProfileData=associatedProfileData.data
                    res.send(result);
                    })
                })
            });
            });
        }
    })
})
/*router.post('/save-additional-info-api', oauth.oauth.authorise(),upload.array(), function (req, res,next){
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    arr = JSON.parse(data.doctorEducations)
    arr.forEach(function(element,index) {
      if(element.edu_proof!=''){
       data['edu_proof___'+index] = element.edu_proof;
      }
      });
    return next();
},secondStepCall);*/
router.post('/save-additional-info-api', oauth.oauth.authorise(), function (req, res){

//function secondStepCall(req, res) {
    uploadFile(req, res, function (err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE')
                err = language.lang({key:"Image size should less than 15 MB",lang:req.body.lang});
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if(typeof req.body.data !== 'undefined'){
                data = JSON.parse(req.body.data);
            }
            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !=='') {
                    data[up_files.fieldname+"___original_name"] = up_files.originalname;
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                doctor.saveAdditionalInfoApi(data, function(result){
                    res.send(result);
                });
            });
        }
    })
});

router.post('/save-edu-spec-info', /*oauth.oauth.authorise(),*/ function (req, res) {
    uploadFile(req, res, function (err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE')
                err = 'Image size should less than 15 MB';
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if (typeof req.body.data !== 'undefined') {
                data = JSON.parse(req.body.data);
            }
            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !== '') {
                    data[up_files.fieldname + "___original_name"] = up_files.originalname;
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                doctor.saveEducationSpecializationInfo(data, function (result) {
                    res.send(result);
                })
            });
        }
    })
})

router.post('/save-registrations-info', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE')
                err = language.lang({key:"Image size should less than 15 MB",lang:req.body.lang});
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if (typeof req.body.data !== 'undefined') {
                data = JSON.parse(req.body.data);
            }
            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !== '') {
                    data[up_files.fieldname + "___original_name"] = up_files.originalname;
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                doctor.saveRegistrationsInfo(data, function (result) {
                    res.send(result);
                })
            });
        }
    })
})

router.post('/save-serv-exp-info', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    doctor.saveServiceExperienceInfo(data, function (result) {
        res.send(result);
    })
})

router.post('/save-award-memberships-info', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.saveAwardmembershipInfo(data, function (result) {
        res.send(result);
    })
})

router.post("/send-claim-request", oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    claimrequest.doctorClaimRequest(data, function (result) {
        res.send(result);
    })
})
/**
 * @api {post} /healthcare/claim-profile-api Healthcare profile screen api
 * @apiName healthcare-profile-api
 * @apiGroup Healthcare
 *
 * @apiParam {integer} userId required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post("/claim-profile-api", oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.checkProfile(data, function (result) {
        res.send(result);
    })
})




/**
 * @api {post} /doctor/send-claim-request-api Send claim request
 * @apiName send-claim-request-api
 * @apiGroup Doctor
 *
 * @apiParam {integer} doctorProfileId required
 * @apiParam {integer} userId required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post("/send-claim-request-api", oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    claimrequest.doctorClaimRequest(data, function (result) {
        res.send(result);
    })
})



/**
 * @api {post} /healthcare/healthcare-dashboard healthcare dashboard
 * @apiName healthcare-dashboard
 * @apiGroup Healthcare
 *
 * @apiParam {integer} id required here id is healthcare profile id
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post("/healthcare-dashboard", oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.healthcareDasboard(data, function (result) {
        res.send(result);
    })
})


router.post("/cancel-claim-request", oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    claimrequest.doctorCancelClaimRequest(data, function (result) {
        res.send(result);
    })
})


/**
 * @api {post} /doctor/doctorById Get doctor profile
 * @apiName doctorById
 * @apiGroup Doctor
 *
 * @apiParam {integer} id required here id is doctor id
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post('/doctorById', /*oauth.oauth.authorise(),*/ function (req, res) {

    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    doctor.doctorById(data, function (result) {
        res.send({status:true, message:'', data:result});
    });
});


/**
 * @api {post} /doctor/doctorByDoctorId Get doctor profile view for doctor app
 * @apiName doctorByDoctorId
 * @apiGroup Doctor
 *
 * @apiParam {integer} id required here id is doctorprofile id
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post('/doctorByDoctorId', /*oauth.oauth.authorise(),*/ function (req, res) {

    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    doctor.doctorByDoctorId(data, function (result) {
        res.send({status:true, message:'', data:result});
    });
});



/**
 * @api {post} /doctor/add-hospital-timing Add hospital timings
 * @apiName add-hospital-timing
 * @apiGroup Doctor
 *
 * @apiParam {integer} doctorProfileId required
 * @apiParam {integer} hospitalId required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post('/add-hospital-doctor-timing', /*oauth.oauth.authorise(),*/ function (req, res) {

    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    doctor.addHospitalDoctorTiming(data, function (result) {
        res.send({status:true, message:'', data:result});
    });
});
/**
 * @api {post} /doctor/get-city-name-from-lat-long Get city name from lat-long
 * @apiName get-city-name-from-lat-long
 * @apiGroup Patient
 * @apiParam {integer} lat required
 * @apiParam {integer} long required
 *
 */
router.post('/get-city-name-from-lat-long', /*oauth.oauth.authorise(),*/ function (req, res) {
     
       
      var data = req.body;
      if (typeof req.body.data !== 'undefined') {
          data = JSON.parse(req.body.data);
      }
//console.log(data);

      var options = {
        provider: 'google',
       
        // Optional depending on the providers
        httpAdapter: 'https', // Default
        apiKey: 'AIzaSyAlNp9k6nA5z03BiEYi9djp3yZpMg5asVk', // for Mapquest, OpenCage, Google Premier
        formatter: null         // 'gpx', 'string', ...
      };
       

      var geocoder = NodeGeocoder(options);
      // Using callback
    /* geocoder.geocode('india,rajasthan,ajmer', function(err, response) {
      res.send(response);
      });
    */
      geocoder.reverse({lat:data.lat, lon:data.long}, function(err, respon) {
        if(respon!=undefined){
        data.title = respon[0].city.toLowerCase();
        }else{
            data.title=''  
        }

        models.sequelize.query("SELECT id, ( 3959 * acos( cos( radians("+data.lat+") ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians("+data.long+") ) + sin( radians("+data.lat+") ) * sin(radians(latitude)) ) ) AS distance FROM cities HAVING distance < 50 ORDER BY distance limit 1",
         { type: models.sequelize.QueryTypes.SELECT})
        .then(users => {
            if(users.length>0){
                var city_id = users[0].id;
            }else{
                var city_id =users.length; 
            }
            city.cityData(city_id, function(result){
                res.send(result);
            });
          // We don't need spread here, since only the results will be returned for select queries
        })
      


        

      });
});


router.post('/getById', oauth.oauth.authorise(), function (req, res) {

    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    doctor.getById(data, function (result) {
        res.send({status:true, message:'', data:result});
    });
});

router.post('/filter_hospital', oauth.oauth.authorise(), upload.array(), function (req, res) {

    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.fiterHospitalForMap(req, function(result) {
        res.send(result);
        // models.hospital.mapped_doctor(data, function (mappedDoctorList) {
        //     res.send(_.merge(result, mappedDoctorList));
        // });        
    })
    // models.hospital.filter_hospital(data, function (result) {
    //     models.hospital.mapped_doctor(data, function (mappedDoctorList) {
    //         res.send(_.merge(result, mappedDoctorList));
    //     });
    // });
});
/**
 * @api {post} /doctor/filter_hospital-api Filter hospital data
 * @apiName filter_hospital-api
 * @apiGroup Doctor
 *
 * @apiParam {string} name optional here name is hospital name
 * @apiParam {string} mobile optional
 * @apiParam {string} email optional
 * 
 * @apiParam {string} selected_city optional cities id's are comma seperated like (1,2,3,4)
 * @apiParam {string} logged_doctorprofile_id required
 * @apiParam {string} lang required
 * @apiParam {string} langId required
 * @apiParam {string} page required
 * 
 *
 */
router.post('/filter_hospital-api', oauth.oauth.authorise(), upload.array(), function (req, res) {

    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    if(data.selected_city!==''){
        data.selected_city = data.selected_city.split(",");
    }else{
     data.selected_city=[];
    }
    data.language={id:data.langId,code:data.lang};
    models.hospital.filter_hospital(data, function (result) {
        models.hospital.mapped_doctor(data, function (mappedDoctorList) {
            res.send(_.merge(result, mappedDoctorList));
        });
    });
});
router.post('/save_doctor_time_front', oauth.oauth.authorise(), upload.array(), function (req, res) {

    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    models.hospital.save_doctor_time(data, function (result) {
        res.send(result);
    });
});

router.post('/link_to_hospital_comp', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    models.hospital.get_list(data, function(result){
        models.city.get_list(data, function(resultCity){
            doctor.pendingHospitalClaimedprofiles(data, function(profile) {
                res.send(_.merge(result, resultCity, profile));
            })
        });
    });
});

router.post('/create-clinic-profile', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    hospital.metaDataForNewProfile(data, function(result){
        res.send(result);
    });
});

router.post('/clinic-add', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    hospital.metaDataForNewProfile(data, function(result){
        res.send(result);
    });
});

router.post('/clinic-save', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    hospital.doctorCreateHospital(data, function(result){
        res.send(result);
    });
});

router.post('/my-clinics', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    doctor.myClinics(data, function(result){
        res.send(result);
    });
})

/**
 * @api {post} /doctor/save_doctor_time-api add doctor timing
 * @apiName save_doctor_time-api
 * @apiGroup Doctor
 * @apiParam {integer} consultation_charge required
 * @apiParam {integer} appointment_duration required
 * @apiParam {integer} hospitalId required
 * @apiParam {integer} doctorProfileId required
 * @apiParam {string} available_on_req optional (false or true)
 * @apiParam {string} timers required 
 * @apiDescription timers data in a json format like ([{"days":"mon","shift_1_from_time": 1800,"shift_1_to_time": 84600,"shift_2_from_time": 14400,"shift_2_to_time": 32400 },{ "days": "tue", "shift_1_from_time": 1800,"shift_1_to_time": 84600,"shift_2_from_time": 12600,"shift_2_to_time": 18000}])
 * 
 */
router.post('/save_doctor_time-api', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
data.timers = JSON.parse(data.timers);
            hospital.save_doctor_time(data, function(result){
                res.send(result);
            });
       
});

router.post('/view-doctor-info', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    doctor.doctorByDoctorId(data, function(result){
        res.send(result);
    });
})

/**
 * @api {post} /doctor/create-tag add custom tag
 * @apiName create-tag
 * @apiGroup Doctor
 * @apiParam {integer} tagtypeId required
 * @apiParam {integer} userId required
 * @apiParam {integer} title required
 * @apiParam {integer} langId required
 * @apiParam {integer} lang required
 * @apiParam {integer} languageId required
 * 
 */
router.post('/create-tag', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    data.tagdetail = {title: typeof data.title === undefined ? "" : data.title};
    data.is_active = 1;
    tag.save(data, function(result){
        res.send(result);
    });
})
router.post('/notification', upload.array(), function (req, res) {
    var FCM = require('fcm-push');

var serverKey = 'AAAAGp6sZZ8:APA91bFlwuRips_sa9u2M-Ybbx3K7G-KX45gEhnJtCc_lFKg0rW_t2ewc0zdlZ9F6XFiHtsgt2_tgvGvC31TKPF18Q1ZMcQv_hx7XpXgoXppAjtzJN7BEHwfi235KpW961oqiA2T-8YZ';
var fcm = new FCM(serverKey);

var message = {
    to: 'fzZXOERTltM:APA91bHUIih05p4Ahc1aIeHztX_Zo6ve5XBiWzv4Y9l0qreeh4gtHERPoRgW-am5AUAAqD4HY23mnYqXkYh4Q2QkdJs3g5KT8Z6EphfeQr59yLZLzuMzYW2KsouBhPFpGi5UIzC_7Nuo', // required fill with device token or topics
    collapse_key: 'your_collapse_key', 
    data: {
        userId: 'your_custom_data_value'
    },
    notification: {
        body: 'This is first notifications on wikicare'
    }
};

//callback style
fcm.send(message, function(err, response){
    if (err) {
        console.log(err);
        res.send({message:"Something has gone wrong!"});
    } else {
        res.send({message:response});
    }
});
})



router.post('/send_clinic', oauth.oauth.authorise(), upload.array(), function (req, res) {

    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.sendClinic(data, function (result) {
        res.send(result);
    });

});


router.post('/send_clinic_admin', oauth.oauth.authorise(), upload.array(), function (req, res) {

    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }

    doctor.sendClinicAdmin(data, function (result) {
        res.send(result);
    });

});

router.post('/save-specializations', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    data.tagtype = 'specializations';
    doctor.saveSerSpec(data, function (result) {
        res.send(result);
    })
})
router.post('/save-education', oauth.oauth.authorise(), function (req, res) {
    
    uploadFile(req, res, function (err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE')
                err = 'Image size should less than 15 MB';
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if (typeof req.body.data !== 'undefined') {
                data = JSON.parse(req.body.data);
            }
            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !== '') {
                    data[up_files.fieldname + "___original_name"] = up_files.originalname;
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                doctor.saveEducation(data, function (result) {
                    res.send(result);
                })
            });
        }
    })
})
router.post('/save-services', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    data.tagtype = 'services';
    doctor.saveSerSpec(data, function (result) {
        res.send(result);
    })
})
router.post('/save-experiences', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    doctor.saveExperience(data, function (result) {
        res.send(result);
    })
})



router.use(oauth.oauth.errorHandler());
module.exports = router;