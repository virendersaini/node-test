var patient = require('../controllers/patient');
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
var language = require('../controllers/language');



var mongoDB = require('../config/mongo_config');




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
		if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
			cb(language.lang({key:"Only image files are allowed!",lang:req.body.lang}), false);
		} else {
			cb(null, true);
		}
	},
	limits: {fileSize: 10000000}
}).any();

/**
 * @api {post} /patient/add_question patient ask question
 * @apiName add_question
 * @apiGroup Patient
 * @apiParam {integer} patientId required
 * @apiParam {integer} tagId required
 * @apiParam {integer} age required
 * @apiParam {integer} gender required
 * @apiParam {string} contact required
 * @apiParam {string} patient_name required
 * @apiParam {string} problem_title required
 * @apiParam {string} description required
 * @apiParam {string} image optional
 * 
 * 
 */
router.post('/add_question', oauth.oauth.authorise(), function (req, res) {
  
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
				patient.add_question(data, function(result) {
					res.send(result);
				})
			});
		}
	})
})




/**
 * @api {post} /patient/questionlist patient ask question list
 * @apiName questionlist
 * @apiGroup Patient
 * @apiParam {integer} patientId required
 * @apiParam {integer} page required


 * 
 * 
 */
router.post('/questionlist', oauth.oauth.authorise(),upload.array(), function (req, res) {
  
	  
				patient.questionlist(req, function(result) {
					res.send(result);
				})
		   
})


/**
 * @api {post} /patient/questiondetail patient question detail
 * @apiName questiondetail
 * @apiGroup Patient
 * @apiParam {integer} id required here id is patient question id
 * @apiParam {integer} langId required 

 */
router.post('/questiondetail', oauth.oauth.authorise(),upload.array(), function (req, res) {
	patient.questiondetail(req, function(result) {
		res.send(result);
	})
})

/**
 * @api {post} /patient/filter_records data searching
 * @apiName filter_records
 * @apiGroup Patient
 * @apiParam {String} title required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 * @apiParam {integer} pageNo required
 * @apiParam {integer} limit optional
 * 
 */
router.post('/filter_records', oauth.oauth.authorise(), function (req, res) {
    var limit = 20;
    var page = req.body.pageNo || 1;
    //if(page>1){
    var skip = limit * (page - 1);
    //}else{
    // var skip=0;
    //}
    var collection = mongoDB.get().collection('records');
    var find_json = {
        langId: req.body.langId,
        title: new RegExp(req.body.title, 'i')
    }
    collection.find(find_json).skip(skip).limit(limit).toArray(function (err, countData) {
        res.send({
            status: true,
            message: language.lang({
                key: "filderData",
                lang: req.lang
            }),
            data: countData,
            pageLimit: limit,
            pageNo: page
        });
    })
});

/* GET list of hospital data */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
	req.roleAccess = {model:'institute', action:'view'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			hospital.list(req, function(result){
				res.send(result);
			});
		} else {
			res.send(isPermission);
		}
	});
});




/**
 * @api {post} /patient/getByLocation get hospitals/doctors by location
 * @apiName getByLocation
 * @apiGroup Patient
 * @apiParam {integer} cityId required
 * @apiParam {integer} langId required
 * @apiParam {string} tagId required
 * @apiParam {string} consultation_charge optional send string like (0-100)
 * @apiParam {string} gender optional send string like (male or female)
 * @apiParam {integer} online_booking optional set value 1
 * 
 */

/* GET list of hospital and doctors by location */
router.post('/getByLocation', oauth.oauth.authorise(), upload.array(), function (req, res) {
   //req.roleAccess = {model:'institute', action:'view'};
   // auth.checkPermissions(req, function(isPermission){
		//if (isPermission.status === true) {
			var data = req.body;
			if(typeof req.body.data !== 'undefined'){
			  data = JSON.parse(req.body.data);
			}

			patient.getByLocation(data, function(result){
				res.send(result);
			});
	   // } else {
	   ////  res.send(isPermission);
	   // }
   // });
});


/**
 * @api {post} /patient/make-favourite-doctor Make favourite doctor
 * @apiName make-favourite-doctor
 * @apiGroup Patient
 * @apiParam {integer} patientId required
 * @apiParam {integer} doctorProfileId required
 * 
 */
router.post('/make-favourite-doctor', oauth.oauth.authorise(), upload.array(), function (req, res) {

			 var data = req.body;
			 if(typeof req.body.data !== 'undefined'){
			   data = JSON.parse(req.body.data);
			 }
 
			 patient.makeFavouriteDoctor(data, function(result){
				 res.send(result);
			 });
 });
 


/**
 * @api {post} /patient/check-favourite Check favourite doctor
 * @apiName check-favourite
 * @apiGroup Patient
 * @apiParam {integer} patientId required
 * @apiParam {integer} doctorProfileId required
 * 
 */
router.post('/check-favourite', oauth.oauth.authorise(), upload.array(), function (req, res) {

	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
	  data = JSON.parse(req.body.data);
	}

	patient.CheckFavouriteDoctor(data, function(result){
		res.send(result);
	});
});



/**
 * @api {post} /patient/my-doctors get favourite doctor
 * @apiName my-doctors
 * @apiGroup Patient
 * @apiParam {integer} patientId required
 *  @apiParam {integer} langId required
 * 
 */
router.post('/my-doctors', oauth.oauth.authorise(), upload.array(), function (req, res) {

	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
	  data = JSON.parse(req.body.data);
	}

	patient.myDoctors(data, function(result){
		res.send(result);
	});
});
/**
 * @api {post} /patient/save patinet save
 * @apiName save
 * @apiGroup Patient
 * @apiParam {integer} userId required
 * @apiParam {integer} countryId required
 * @apiParam {integer} stateId required
 * @apiParam {integer} cityId required
 * @apiParam {String} address required
 * @apiParam {String} gender required
 * @apiParam {String} zipcode required
 * @apiParam {String} marital_status optional
 * @apiParam {String} blood_group required
 * @apiParam {integer} height_feet required
 * @apiParam {integer} height_inch required
 * @apiParam {String} weight required
 * @apiParam {String} emergency_contact required
 * @apiParam {String} dob required
 * @apiParam {integer} langId required
 * @apiParam {String} current_medication required
 * @apiParam {String} past_medication required
 * 
 */
router.post('/save', oauth.oauth.authorise(), function (req, res) {
		var data = req.body;
		if(typeof req.body.data !== 'undefined'){
			data = JSON.parse(req.body.data);
		}

		req.roleAccess = {model:'patient', action:'add'};
	   // auth.checkPermissions(req, function(isPermission){
			//if (isPermission.status === true) {
					patient.save(data, function(result){
						res.send(result);
					});
		   /* } else {
				res.send(isPermission);
			}*/
	   // });
	});








/**
 * @api {post} /patient/addtag add patient tags
 * @apiName addtag
 * @apiGroup Patient
 * @apiParam {integer} patientId required
 * @apiParam {integer} tagtypeId required
 * @apiParam {integer} tagId required tagId should be in comma's sepetate like (23,45,78)
 * @apiParam {String} langId required
 * 
 */
	router.post('/addtag', oauth.oauth.authorise(), function (req, res) {
			var data = req.body;
			if(typeof req.body.data !== 'undefined'){
				data = JSON.parse(req.body.data);
			}

			req.roleAccess = {model:'patient', action:'add'};
		   // auth.checkPermissions(req, function(isPermission){
				//if (isPermission.status === true) {
						patient.addtag(data, function(result){
							res.send(result);
						});
			  /*  } else {
					res.send(isPermission);
				}*/
			//});
		});
/* status */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.id = req.params.id;
	data.is_active = req.params.status;
	req.roleAccess = {model:'patient', action:'status'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			patient.status(data, function(result){
				res.send(result);
			});
		} else {
			res.send(isPermission);
		}
	});

});

/* add */
router.post('/add', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	req.roleAccess = {model:'patient', action:'add'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			patient.getAllCountry(data, function(result){
				res.send(result);
			});
		} else {
			res.send(isPermission);
		}
	});
});
/* edit  */
router.post('/edit/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.id = req.params.id;
	req.roleAccess = {model:'patient', action:'edit'};
	auth.checkPermissions(req, function(isPermission){
		if (isPermission.status === true) {
			patient.getById(data, function(result){
				res.send(result);
			});
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/adminlist', oauth.oauth.authorise(), upload.array(), function (req, res) {
	patient.adminlist(req, function(result){
		res.send(result);
	});
});

router.post('/patientdetail', oauth.oauth.authorise(), upload.array(), function (req, res) {
	patient.patientdetail(req.body, function(result){
		res.send(result);
	});
});

router.post('/patientStatus', oauth.oauth.authorise(), upload.array(), function (req, res) {
	patient.patientStatus(req.body, function(result){
		res.send(result);
	});
});

/**
* @api {post} /patient/change-notification-setting Change notification settings for patient app
* @apiGroup Patient
* @apiParam {integer} patientId required
* @apiParam {string} type required ('is_chat_notification' || 'is_appointment_notification' || 'all') any one of them
* @apiParam {integer} value value to be updated(0, 1)
*/
router.post('/change-notification-setting', oauth.oauth.authorise(), upload.array(), function (req, res) {
	patient.patientChangeNotificationSettings(req.body, function(result){
		res.send(result);
	});
});

router.post('/export', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    req.roleAccess = {model:'patient', action:'export'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            patient.exportData(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
})

/**
 * @api {post} /patient/cahngeDefaultLang Change default language
 * @apiName Change Default language
 * @apiGroup Patient
 * @apiParam {integer} userId required
 *  @apiParam {string} lang required(current lang)
 *  @apiParam {integer} default_lang required(language ID to be changed)
 * 
 */
router.post('/cahngeDefaultLang', oauth.oauth.authorise(), upload.array(), function (req, res) {

	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
	  data = JSON.parse(req.body.data);
	}

	patient.changeDefaultLang(data, function(result){
		res.send(result);
	});
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
