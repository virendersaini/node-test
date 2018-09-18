var hospital = require('../../controllers/hospital');
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
language = require('../../controllers/language');

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

/* GET list of hospital data */
router.post('/hospital_doctor', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'institute', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospital.hospital_doctor(req, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});


/* save */
router.post('/save', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
      errors=[];
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') err = language.lang({key:"Image size should less than 10 MB",lang:req.body.lang});
            return res.send({status: false,errors:[{path:'hospital_logo',message:err}], message: err, data: []});
        }
        var data = req.body;
        if(typeof req.body.data !== 'undefined'){
            data = JSON.parse(req.body.data);
        }
        var count = 1;
        req.roleAccess = {model:'hospital', action:'add'};
        auth.checkPermissions(req, function(isPermission){
            if (isPermission.status === true) {
                async.forEach(req.files, function (up_files, callback) {
                  if (up_files.path !=='') {
                    data[up_files.fieldname] = up_files.path;
                  }
                  if (req.files.length == count) {
                    callback(req.body);
                  }
                  count++;
                }, function () {
                    hospital.save(data, function(result){
                        res.send(result);
                    });
                });
            } else {
                res.send(isPermission);
            }
        });
    });
});

router.post('/save_time', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }

    req.roleAccess = {model:'hospital', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospital.save_time(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/unmapdoc', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    hospital.unmapDoctor(data, function(result) {
        res.send(result);
    });
});

router.post('/save_doctor_time', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }

    req.roleAccess = {model:'hospital', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospital.save_doctor_time(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/filter_doctor', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }

    req.roleAccess = {model:'hospital', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospital.filterDoctorForHospital(req, function(result) {
                res.send(result);
            })
            // hospital.filter_doctor(data, function(result){
            //     res.send(result);
            // });
        } else {
            res.send(isPermission);
        }
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
    req.roleAccess = {model:'hospital', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospital.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });

});
/* open24X7 status */
router.post('/shiftstatus/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    data.shift_24X7 = req.params.status;
    req.roleAccess = {model:'hospital', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospital.shiftstatus(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });

});

router.post('/managefreeze/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    data.is_freeze = req.params.status;
    req.roleAccess = {model:'hospital', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospital.managefreeze(data, function(result){
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
    req.roleAccess = {model:'hospital', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospital.getAddMetaDataForAdmin(data, function(result){
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
    req.roleAccess = {model:'institute', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospital.getById(data, function(result){
                res.send(result);
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
    
    req.roleAccess = {model:'hospital', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospital.verifystatus(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.post('/export', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    req.roleAccess = {model:'hospital', action:'export'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospital.exportData(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
})

router.use(oauth.oauth.errorHandler());
module.exports = router;
