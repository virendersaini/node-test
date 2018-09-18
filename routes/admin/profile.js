var profile = require('../../controllers/profile');
var express = require('express');
var router = express.Router();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var multer = require('multer');
var path = require('path');
var crypto = require('crypto');
var fs = require('fs');
language = require('../../controllers/language');
const validFileTypes = ['.png', '.jpeg', '.jpg'];
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            var destFolder = tmpDir + 'user_image';
            fs.access(destFolder, err => {
                if (err) {
                    fs.mkdir(destFolder, () => cb(null, destFolder));
                } else {
                    cb(null, destFolder);
                }
            });
        },
        filename: (req, file, cb) => {
            cb(
                null,
                Date.now() + crypto.randomBytes(8).toString('hex') +
                path.extname(file.originalname).toLowerCase()
            );
        }
    }),
    fileFilter: function (req, file, cb) {
        if (validFileTypes.indexOf(path.extname(file.originalname).toLowerCase()) === -1) {
             cb(language.lang({key:"Invalid File Type",lang:req.body.lang}));
        } else {
            cb(null, true);
        }
    },
    limits: {fileSize: 10000000}
});

const uploadFiles = upload.array('profile_picture', 1);

/* save  */
router.post('/save', oauth.oauth.authorise(), upload.none(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    profile.save(data, function(result){
        res.send(result);
    });
});

/* change user name  */
router.post('/changeUserName', oauth.oauth.authorise(), upload.none(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    profile.changeUserName(data, function(result){
        res.send(result);
    });
});

/* change user name  */
router.post('/changePassword', oauth.oauth.authorise(), upload.none(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    profile.changePassword(data, function(result){
        res.send(result);
    });
});

/* change user name  */
router.post('/changeDefaults', oauth.oauth.authorise(), upload.none(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    profile.changeDefaults(data, function(result){
        res.send(result);
    });
});

router.post('/edit', oauth.oauth.authorise(), upload.none(), function (req, res) {
    var data = req.body.data ? JSON.parse(req.body.data) : req.body;
    profile.getUserProfileById(data, function (result) {
        res.send(result);
    });
});

function saveUserProfile(req, res) {
    var data = req.body.data ? JSON.parse(req.body.data) : req.body;
    if (req.files && req.files.length) {
        data.user_image = req.files[0].path;
    }
    profile.saveUserProfile(data, function (result) {
        res.send(result);
    });
}

router.post('/save-user', oauth.oauth.authorise(), function (req, res) {
    uploadFiles(req, res, err => {
        if (err) {
           
            if (err.code === 'LIMIT_FILE_SIZE') err =  language.lang({key:"Image size should less than 10 MB",lang:req.body.lang});
            return res.send({status: false, message: err, data: []});
        }
        saveUserProfile(req, res);
    });
});

/* edit  */
router.post('/', oauth.oauth.authorise(), upload.none(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    profile.getById(data, function(result){
        res.send(result);
    });
});


router.use(oauth.oauth.errorHandler());
module.exports = router;
