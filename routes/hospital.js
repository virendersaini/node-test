var hospital = require('../controllers/hospital');
var claimrequest = require('../controllers/claimrequest');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var async = require('async');
var oauth = require('../config/oauth');
var auth = require('../config/auth');
var path = require('path'),
crypto = require('crypto');
language = require('../controllers/language');
var doctor = require('../controllers/doctor');
var models = require('../models');
var NodeGeocoder = require('node-geocoder')
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var destFolder = tmpDir;
        if (!fs.existsSync(destFolder+file.fieldname)) {
            fs.mkdirSync(destFolder+file.fieldname);
        }
        cb(null, destFolder);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname+'/'+Date.now() + '.' + mime.extension(file.mimetype));
    }
});
var uploadFile = multer({
  storage: storage,
	fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
            cb(language.lang({key:"Only image files are allowed!",lang:req.body.lang}), false);
        } else {
            cb(null, true);
        }
    },
    limits: {fileSize: 10000000}
}).any();

/* GET list of doctor data */
router.post('/get-profiles', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    
    hospital.getAllProfiles(data, function(result){
        res.send(result);
    });
});

router.post('/meta-data-for-search', oauth.oauth.authorise(), upload.array(), function (req, res) {
    doctor.getMetaDataForSearch(req, function(result) {
        res.send(result);
    })
})

router.post('/check-profile', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    hospital.checkProfile(data, function(result) {
        res.send(result);
    });
});

router.post('/new-profile', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    
    hospital.metaDataForNewProfile(data, function(result) {
        res.send(result);
    })
})

router.post('/save-basic-info', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        if (err) {
            
            if (err.code === 'LIMIT_FILE_SIZE') err = language.lang({key:"Image size should less than 10 MB",lang:req.body.lang});
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if(typeof req.body.data !== 'undefined'){
              data = JSON.parse(req.body.data);
            }

            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !=='') {
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                hospital.save(data, function(result) {
                    res.send(result);
                })
            });
        }
    })
})

router.post("/send-claim-request", oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    claimrequest.clinicClaimRequest(data, function(result) {
        res.send(result);
    })
})
router.post("/cancel-claim-request", oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    claimrequest.hospitalCancelClaimRequest(data, function(result) {
        res.send(result);
    })
})

router.post('/shiftstatus/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    data.shift_24X7 = req.params.status;
    hospital.shiftstatus(data, function(result){
        res.send(result);
    });
});

router.post('/managefreeze/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    data.is_freeze = req.params.status;
    hospital.managefreeze(data, function(result){
        res.send(result);
    });
});

router.post('/freeze-timing', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    hospital.freezeTimings(data, function(result){
        res.send(result);
    });
});

router.post('/save-time', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }

    let timings = data.timings;
    hospital.save_time(data, function(result){
        res.send(result);
    });
});

router.post('/filter_doctor', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    
    hospital.filterDoctorForHospital(req, function(result) {
        res.send(result);
    })
});

router.post('/save_doctor_time', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }

    hospital.save_doctor_time(data, function(result){
        res.send(result);
    });
});

router.post('/check-clinic-profile-status', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }

    hospital.updateProfileStatusWhileUpdate(data, function(result){
        res.send(result);
    });
});
/**
 * @api {post} /hospital/hospitalById Get hospital profile
 * @apiName hospitalById
 * @apiGroup Hospital
 *
 * @apiParam {integer} id required here id is hospital id
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post('/hospitalById', /*oauth.oauth.authorise(),*/ function (req, res) {

    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    hospital.hospitalById(data, function (result) {
        res.send({status:true, message:'', data:result});
    });
});

router.post('/create-by-doctor', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 1 MB';
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if(typeof req.body.data !== 'undefined'){
              data = JSON.parse(req.body.data);
            }

            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !=='') {
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                hospital.createByDoctor(data, function(result) {
                    res.send(result);
                })
            });
        }
    })
})

router.post('/meta-data-for-add', oauth.oauth.authorise(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    hospital.metaDataForNewProfile(data, function(result) {
        res.send(result);
    })
})

router.post('/edit-profile/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    hospital.getProfileForDoctor(data, function(result){
        res.send(result);
    });
});
router.post('/getEditMetaData', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    hospital.metaDataForEditProfile(data, function(result) {
        res.send(result);
    })
})

router.post('/view-hospital-info', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    hospital.viewHospitalInfo(data, function(result){
        res.send(result);
    });
})

router.post('/unmapdoc', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }

    hospital.unmapDoctor(data, function(result) {
        res.send(result);
    });
});
    router.post('/upload-xlsx',upload.array(), function (req, res) {
        var XLSX = require('xlsx');
        var workbook = XLSX.readFile('public/fi_orig.xlsx');
        workbook.SheetNames.forEach(function(sheetName) {
            dataRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
            dataRows.forEach(function(data) {
                data.hospital_detail = {
                    hospital_name:data.hospital_name,
                    about_hospital:data.about_hospital,
                    address:data.address,
                    languageId:1
                }

                data.hospital_detail_ar = {
                    hospital_name:data.hospital_name_arabic ? data.hospital_name_arabic : data.hospital_name,
                    about_hospital:data.about_hospital,
                    address:data.address,
                    languageId:2
                }
                data.is_active=1;
                data.contact_informations='{"emails":[{"key":"","model":"hospital","type":"email","value":"'+data.email.toString()+'","is_primary":1}],"mobiles":[{"key":"","model":"hospital","type":"mobile","value":"'+data.mobile.toString()+'","is_primary":1}]}';
                delete data.hospital_name;
                delete data.about_hospital;
                delete data.address;
                delete data.mobile;
                delete data.email;
           
                delete data.email;
    
                var options = {
                    provider: 'google',
               
                    // Optional depending on the providers
                    httpAdapter: 'https', // Default
                    apiKey: 'AIzaSyAlNp9k6nA5z03BiEYi9djp3yZpMg5asVk', // for Mapquest, OpenCage, Google Premier
                    formatter: null         // 'gpx', 'string', ...
                };
                var geocoder = NodeGeocoder(options);
                geocoder.geocode(data.country+','+data.state+','+data.city, function(err, response) {
                    delete data.city;
                    delete data.state;
                    delete data.country;
                    if('undefined'!==typeof response && response.length>0){
                        data.latitude = response[0].latitude || '';
                        data.longitude = response[0].longitude || '';
                    }
                    data.is_freeze = 1;
                    data.shift_24X7 = 1;
                    hospital.save(data, function(result){
                        res.send(result);
                    });
                })  

        
        //process.exit();
    })
})


    //res.send(workbook)
   /* var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    if(typeof require !== 'undefined') XLSX = require('xlsx');

    models.hospital.unmapdoc(data, function(result){
        res.send(result);
    });*/
});

router.post('/docmap-helper-data', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    hospital.metaDataForDocmap(data, function(result) {
        res.send(result);
    })
})

router.post('/getBasicInfo', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    hospital.getBasicInfo(data, function(result) {
        res.send(result);
    });
});

router.post('/getMappedDoctors', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    hospital.getMappedDoctors(data, function(result) {
        res.send(result);
    });
});

router.post('/get-mapped-doctors', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    } 
    hospital.getMappedDoctors(data, function(result){
        res.send({status:true, message:'', data:result.data});
    });
});

router.post('/validate-detail', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        var data = req.body;
        if(typeof req.body.data !== 'undefined'){
            data = JSON.parse(req.body.data);
        } 
        hospital.validateBasicDetails(data, function(result){
            res.send(result);
        });
    })
});

/**
 * @api {post} /hospital/validate-timing validate and save timings in dummy clinic
 * @apiName Add timing in Dummy Clinic
 * @apiGroup Doctor Api

 * @apiParam {integer} doctorProfileId required
 * @apiParam {String} hospital_detail[hospital_name] required
 * @apiParam {image} hospital_logo optional
 * @apiParam {JSON} contact_informations '{"emails":[{"key":"","model":"hospital","type":"email","value":"","status":0,"is_primary":1}],"mobiles":[{"key":"","model":"hospital","type":"mobile","value":"","status":0,"is_primary":1}]}'
 * @apiParam {integer} zipcode optional
 * @apiParam {integer} cityId required
 * @apiParam {integer} stateId required
 * @apiParam {integer} countryId required
 * @apiParam {integer} hospital_detail[address] required
 * @apiParam {JSON} doc_timings (structure same as used in doctor save timing api but type is JSON)
 * @apiParam {integer} langId required
 * @apiParam {integer} lang required
 * @apiParam {integer} languageId required
 * 
 */
router.post('/validate-timing', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        if (err) {
            
            if (err.code === 'LIMIT_FILE_SIZE') err = language.lang({key:"Image size should less than 10 MB",lang:req.body.lang});
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if(typeof req.body.data !== 'undefined'){
              data = JSON.parse(req.body.data);
            }

            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !=='') {
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                hospital.validateDoctTimingInDummyHos(data, function(result){
                    res.send(result);
                });
            });
        }
    })
})

router.post('/removedoc', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    } 
    hospital.removedoc(data, function(result){
        res.send(result);
    });
});

// router.post('/hos-upl', function (req, res) {
//     var XLSX = require('xlsx');
//         var workbook = XLSX.readFile('public/fi.xlsx');
//         workbook.SheetNames.forEach(function(sheetName) {
//             dataRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])

//             async.forEach(hdtData, function(hdTiming, callbacks) {

//                 dataRows.forEach(function(data) {
//                     var options = {
//                         provider: 'google',
                   
//                         // Optional depending on the providers
//                         httpAdapter: 'https', // Default
//                         apiKey: 'AIzaSyAlNp9k6nA5z03BiEYi9djp3yZpMg5asVk', // for Mapquest, OpenCage, Google Premier
//                         formatter: null         // 'gpx', 'string', ...
//                     };
//                     var geocoder = NodeGeocoder(options);
//                     geocoder.geocode(data.country+','+data.state+','+data.city, function(err, response) {
//                         if('undefined'!==typeof response && response.length>0){
//                             data.latitude = response[0].latitude || '';
//                             data.longitude = response[0].longitude || '';
//                         }

//                 //         data.hospital_detail = {
//                 //     hospital_name:data.hospital_name,
//                 //     about_hospital:data.about_hospital,
//                 //     address:data.address,
//                 //     languageId:1
//                 // }
//                         let hosData = {

//                         }

//                         models.hospital.save(hosData, function function_name(argument) {
//                             // body...
//                         })
//                         hospital.save(data, function(result){
//                             let hosDetail = [
//                                 {
//                                     hospitalId: 
//                                     hospital_name: data.hospital_name,
//                                     about_hospital:data.about_hospital,
//                                     address:data.address,
//                                     languageId: 1               
//                                 }, {
//                                     hospital_name: data.hospital_name,
//                                     about_hospital:data.about_hospital,
//                                     address:data.address,
//                                     languageId: 2
//                                 }
//                             ];
//                             callbacks(); 

//                         });
//                     })
//                 })

//             }, function(callbacks) {
//                 console.log("-------------------------- SAVED SUCCESSFULLY -----------------------------")
//             })
//         })
// })



router.use(oauth.oauth.errorHandler());
module.exports = router;
