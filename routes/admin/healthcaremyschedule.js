var doctor = require('../../controllers/healthcaremyschedule');
var models = require('../../models');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var async = require('async');
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var path = require('path'),
crypto = require('crypto');
var _ = require('lodash');
language = require('../../controllers/language');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if(file.fieldname === "doctor_profile_pic") {
            cb(null, "public/uploads/doctor_profile_pic")    
        } else {
            cb(null, "public/uploads/doctor_proofs")
        }
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
    limits: {fileSize: 10000000}
}).any();

/* GET list of doctor data */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'institute', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            doctor.list(req, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* save */
router.post('/save-basic-info', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE')
                
                err = language.lang({key:"Image size should less than 10 MB",lang:req.body.lang});
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if(typeof req.body.data !== 'undefined'){
                data = JSON.parse(req.body.data);
            }

            req.roleAccess = {model:'doctor', action:'add'};
            auth.checkPermissions(req, function(isPermission){
                if (isPermission.status === true) {
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
                        doctor.saveBasicDetails(data, function(result){
                            res.send(result);
                        });
                    });
                } else {
                    res.send(isPermission);
                }
            });
        }
    })
});

router.post('/save-additional-info', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
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
            doctor.saveAdditionalInfo(data, function(result){
                res.send(result);
            });
        });
    })
});

router.post('/due-payment', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    doctor.duePayment(req, function(result){
        res.send(result);
    });
});


router.post('/pay', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    doctor.pay(data, function(result){
        res.send(result);
    });
});


/* status */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    data.is_active = req.params.status;
    req.roleAccess = {model:'doctor', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            doctor.status(data, function(result){
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
    req.roleAccess = {model:'doctor', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            doctor.getAddData(data, function(result){
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
    req.roleAccess = {model:'doctor', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            doctor.getById(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/link_to_hospital_comp', oauth.oauth.authorise(), upload.array(), function (req, res) {

    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    req.roleAccess = {model:'doctor', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            models.hospital.get_list(data, function(result){
                models.city.get_list(data, function(resultCity){
                    res.send(_.merge(result, resultCity));
                });
            });
        } else {
            res.send(isPermission);
        }
    });
});


router.post('/link_doctor_time', oauth.oauth.authorise(), upload.array(), function (req, res) {

    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    req.roleAccess = {model:'doctor', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            models.doctorprofile.link_clinic_time(data, function(result){
                res.send(_.merge(result, {}));
            });
        } else {
            res.send(isPermission);
        }
    });
});


router.post('/filter_hospital', oauth.oauth.authorise(), upload.array(), function (req, res) {

    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
    }
    
    data.id = req.params.id;
    req.roleAccess = {model:'doctor', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            models.hospital.filter_hospital(data, function(result){
                models.hospital.mapped_doctor(data, function(mappedDoctorList){
                    res.send(_.merge(result, mappedDoctorList));
                })
            });
        } else {
            res.send(isPermission);
        }
    });
});


router.post('/verifystatus', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    req.roleAccess = {model:'doctor', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            doctor.verifystatus(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/livestatus/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    req.roleAccess = {model:'doctor', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            doctor.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });

});

router.use(oauth.oauth.errorHandler());
module.exports = router;
