var doctorfile = require('../controllers/doctorfile');
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
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //var destFolder = tmpDir;
        var destFolder = 'public/uploads/';
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
        if(req.body.file_type == 'image') {
            if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
                cb(language.lang({key:"Only image files are allowed!",lang:req.body.lang}), false);
            } else {
                cb(null, true);
            }
        } else {
            if (!file.originalname.match(/\.(mp4|3gp|MP4|3GP|wav|WAV)$/)) {
                cb(language.lang({key:"Only video files are allowed!",lang:req.body.lang}), false);
            } else {
                cb(null, true);
            }
        }
    },
    limits: function (req, file, cb) {
        fileSize: (req.body.file_type=='image') ? 5000000 : 15000000
    }
}).any()


/* GET list of hospital files data */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'hospitalfile', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospitalfile.list(req, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});


/* save */
router.post('/save',oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
      errors=[];
        if (err) {

            if (err.code === 'LIMIT_FILE_SIZE') err = language.lang({key:"Image size should less than 5 MB",lang:req.body.lang});
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if(typeof req.body.data !== 'undefined'){
                data = JSON.parse(req.body.data);
            }
            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !=='') {
                    data.original_name=up_files.originalname;
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                doctorfile.save(data, function(result){
                    res.send(result);
                });
            });
        }
    })
});
/* status */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    data.is_active = req.params.status;
    doctorfile.status(data, function(result){
        res.send(result);
    });
});
/* status */
router.post('/delete/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    hospitalfile.delete(data, function(result){
        res.send(result);
    });

});

router.use(oauth.oauth.errorHandler());

module.exports = router;
