var users = require('../controllers/users');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var auth = require('../config/auth');

/* GET login */
router.post('/login', upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    console.log(data);
    auth.isAuthorise(req, function(isAuth){
        if (isAuth.status === true) {
           users.login(data, function(result){
            res.send(result);
        });
        } else {
            res.send(isAuth);
        }
    });
});

/* GET forgot-password */
router.post('/forgot-password', upload.array(), function (req, res) {
    var data = JSON.parse(req.body.data);
    users.forgotpassword(data, function(result){
        res.send(result);
    });
});

/* GET reset-password */
router.post('/reset-password', upload.array(), function (req, res) {
    var data = JSON.parse(req.body.data);
    users.resetpassword(data, function(result){
        res.send(result);
    });
});


//* GET users listing. */
//router.post('/login', function (req, res, next) {
//    console.log('out side upload');
//    uploadFile(req, res, function (err) {
//        console.log('in side upload');
//        console.log(req.body);
//        res.send({'user':'test'});
//    });
//});
module.exports = router;
