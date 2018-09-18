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
var storage = multer.diskStorage({

    destination: function (req, file, cb) {
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
            if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
                cb(anguage.lang({key:"Only image files are allowed!",lang:req.body.lang}), false);
            } else {
                cb(null, true);
            }
        } else {
            if (!file.originalname.match(/\.(mp4|3gp|MP4|3GP)$/)) {
                cb(anguage.lang({key:"Only image files are allowed!",lang:req.body.lang}), false);
            } else {
                cb(null, true);
            }
        }
    },
    limits: function (req, file, cb) {
        fileSize: (req.body.file_type=='image') ? 1000000 : 30000000
    }
}).any()


router.post('/view-sent-detail', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    claimrequest.viewClaimedUserDetail(data, function(result){
        res.send(result);
    });
});

router.post('/change', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    claimrequest.handleRequest(data, function(result){
        res.send(result);
    });
});

router.use(oauth.oauth.errorHandler());

module.exports = router;
