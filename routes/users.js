var users = require('../controllers/users');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var auth = require('../config/auth');
var oauth = require('../config/oauth');
var async = require('async');
var utils = require('../controllers/utils');
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
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/)) {

            cb(language.lang({key:"Only image files are allowed!",lang:req.body.lang}), false);
        } else {
            cb(null, true);
        }
    },
    limits: {fileSize: 10000000}
}).any();

/* users login. */
router.post('/login', upload.array(), function (req, res, next) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    users.getSignUpMetaData(data, function(result){
        res.send(result);
    });
});

/* users login. */
router.post('/signup', upload.array(), function (req, res, next) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    users.signup(req, function(result){
        res.send(result);

    });
});
/**
 * @api {post} /users/update-profile Update profile picture
 * @apiName update-profile
 * @apiGroup Patient
 *
 * @apiParam {integer} id required here 'id' is userId
 * @apiParam {String} user_image required
 *
 */
router.post('/update-profile', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
      errors=[];
        if (err) {

            if (err.code === 'LIMIT_FILE_SIZE') err = language.lang({key:"Image size should less than 10 MB",lang:req.lang});
            return res.send({status: false,errors:[{path:'user_image',message:err}], message: err, data: []});
        }
        var data = req.body;
        if(typeof req.body.data !== 'undefined'){
            data = JSON.parse(req.body.data);
        }

        var count = 1;
        req.roleAccess = {model:'user', action:'add'};
       // auth.checkPermissions(req, function(isPermission){
            //if (isPermission.status === true) {
                async.forEach(req.files, function (up_files, callback) {
                  if (up_files.path !=='') {
                    data[up_files.fieldname] = up_files.path;
                  }
                  if (req.files.length == count) {
                    callback(req.body);
                  }
                  count++;
                }, function () {
                    users.update_profile(data, function(result){
                        res.send(result);
                    });
                });
           /* } else {
                res.send(isPermission);
            }*/
        //});
    });
});


/* GET users listing. */
router.get('/register', function(req, res, next) {
  res.render('user/register', {cooks: req.cookies});
});

router.post('/web-register',  upload.array(), function(req, res, next) {

  var data = req.body;
  if(typeof req.body.data !== 'undefined'){
    data = JSON.parse(req.body.data);
  }
  auth.isAuthorise(req, function(isAuth){
      if (isAuth.status === true) {
         users.register(data, function(result){
          res.send(result);
      });
      } else {
          res.send(isAuth);
      }
  });

});
/**
 * @api {post} /users/userupdate User update
 * @apiName userupdate
 * @apiGroup Patient
 *
 * @apiParam {integer} id required here 'id' is userId
 * @apiParam {String} name required
 * @apiParam {String} mobile required
 * @apiParam {String} email required
 * @apiParam {integer} langId required
 *
 */
router.post('/userupdate', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    //req.roleAccess = {model:'user', action:'add'};
   // auth.checkPermissions(req, function(isPermission){


       // if (isPermission.status === true) {
            users.userupdate(data, function(result){
                res.send(result);
            });
       /* } else {
            res.send(isPermission);
        }*/
    //});
});
/* GET PATIENT PROFILE DATA. */
/**
 * @api {post} /users/patient-profile-data Get patient data
 * @apiName patient-profile-data
 * @apiGroup Patient
 *
 * @apiParam {integer} userId required
 * @apiParam {integer} langId required
 *
 */
router.post('/patient-profile-data', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    //req.roleAccess = {model:'user', action:'add'};
   // auth.checkPermissions(req, function(isPermission){


       // if (isPermission.status === true) {
        users.getProfileById(data, function(result){
                res.send(result);
            });
       /* } else {
            res.send(isPermission);
        }*/
    //});
});

router.post('/mail-demo', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
        utils.sendMailfff(data, function(result){
                res.send(result);
            });
});

/**
 * @api {post} /users/register/add Patient signup
 * @apiName add
 * @apiGroup Patient
 *
 * @apiParam {String} name required
 * @apiParam {String} mobile required
 * @apiParam {String} phone_code required
 * @apiParam {String} email required
 * @apiParam {integer} roleId required
 * @apiParam {String} user_type optional
 * @apiParam {String} device_id required
 * @apiParam {String} device_type required
 * @apiParam {String} password required
 * @apiParam {integer} langId required
 *
 */
router.post('/register/add', upload.array(), (req, res) => {
  auth.isAuthorise(req, function(isAuth){
    if (isAuth.status === true) {
      users.registerPatient(req.body)
      .then(result => res.send(result))
      .catch(console.log);
    } else {
      res.send(isAuth);
    }
  });
});

router.post('/resetpassword-otp', upload.array(), (req, res) => {
  auth.isAuthorise(req, function(isAuth){
    if (isAuth.status === true) {
      users.resetpasswordOtp(req.body)
      .then(result => res.send(result))
      .catch(console.log);
    } else {
      res.send(isAuth);
    }
  });
});

router.post('/resetpassword-patient', upload.array(), (req, res) => {
  req.body.isPatient = true;
  auth.isAuthorise(req, function(isAuth){
    if (isAuth.status === true) {
      users.resetpasswordOtp(req.body)
      .then(result => res.send(result))
      .catch(console.log);
    } else {
      res.send(isAuth);
    }
  });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
