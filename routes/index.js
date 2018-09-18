var users = require('../controllers/users');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var auth = require('../config/auth');
var contacts = require('../controllers/contacts');
var partner = require('../controllers/partner');
var country = require('../controllers/country');
var state = require('../controllers/state');
var city = require('../controllers/city');
var oauth = require('../config/oauth').oauth;
var language = require('../controllers/language');
var otp = require('../controllers/otpmessage');
var utils = require('../controllers/utils');
var subscription = require('../controllers/subscription');
var log = require('../controllers/log');
var tag = require('../controllers/tag');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// router.get('/update', function(req, res, next) {
//     utils.updateLangId(req, function(){
//         res.send({status: true});
//     });
// });

/* GET forgot-password */
router.post('/forgot-password', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	data.deviceType = req.device.type.toUpperCase();
    users.forgotpassword(data, function(result){
        res.send(result);
    });
});

/* GET reset-password */
router.post('/reset-password', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    users.resetpassword(data, function(result){
        res.send(result);
    });
});

/* Contact Page */
router.post('/contacts/send', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    contacts.sentQuery(data, function(result){
        res.send(result);
    });
});

router.post('/partners/send', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    partner.sentQuery(data, function(result){
        res.send(result);
    });
});


/**
 * @api {post} /country/list list all countries
 * @apiName listCountry
 * @apiGroup Common Api
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 * 
 */
router.post('/country/list', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    country.getAllCountry(data, function(result){
        res.send({status:true, message:'', data:result});
    });
});


/**
 * @api {post} /state/list list all states by country id
 * @apiName listState
 * @apiGroup Common Api
 * @apiParam {integer} countryId required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 * 
 */
router.post('/state/list', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    state.getAllState(data, function(result){
        res.send({status:true, message:'', data:result.data});
    });
});

/**
 * @api {post} /city/list list all cities by state id
 * @apiName listCity
 * @apiGroup Common Api
 * @apiParam {integer} stateId required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 * 
 */
router.post('/city/list', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    city.getAllCity(data, function(result){
        res.send({status:true, message:'', data:result.data});
    });
});

router.post('/get-otp', (req, res) => {
    Promise.resolve(req.body)
    .then(otp.sendOtp)
    .then(result => res.send(result))
    .catch(console.log);
});

router.post('/weblogin', (req, res) => {
    let data = req.body;
    data.deviceType = req.device.type.toUpperCase();
    users.login(data)
    .then(function(result){
       res.send(result);
    })
    .catch(console.log);
});

router.post('/verify-login-otp', (req, res) => {
    let data = req.body;
    data.deviceType = req.device.type.toUpperCase();
    users.verifyLoginOTP(data)
    .then(result => res.send(result))
    .catch(console.log);
});

router.post('/login', (req, res) => {
    let data = req.body;
    data.is_patient = true;
    data.deviceType = req.device.type.toUpperCase();
    users.login(data)
    .then(result => res.send(result))
    .catch(console.log);
});

router.post('/getsession', (req, res) => {
    let data = req.body;
    users.getSession(data)
    .then(result => res.send(result))
    .catch(console.log);
});

router.post('/verify-login-otp-patient', (req, res) => {
    let data = req.body;
    data.is_patient = true;
    data.deviceType = req.device.type.toUpperCase();
    users.verifyLoginOTP(data)
    .then(result => res.send(result))
    .catch(console.log);
});

/**
 * @api {post} /register doctor registration
 * @apiName register
 * @apiGroup Doctor
 * @apiParam {integer} roleId required
 * @apiParam {string} name required
 * @apiParam {string} email required
 * @apiParam {string} mobile required
 * @apiParam {string} password required
 * @apiParam {string} user_type required
 * @apiParam {integer} agreed_to_terms required 
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 * 
 */
router.post('/register', upload.array(), (req, res) => {

    auth.isAuthorise(req, function(isAuth){
        if (isAuth.status === true) {
            users.register(req.body)
            .then(result => res.send(result))
            .catch(console.log);
        } else {
            res.send(isAuth);
        }
    });
});

/**
 * @api {post} /logout Logout user
 * @apiName Logout
 * @apiGroup Common
 * @apiParam {string} id userId required
 * @apiParam {string} device_id required
 * 
 */
router.post('/logout', oauth.authorise(), upload.array(), (req, res) => {
    users.logout(req.body.id, req.body.device_id)
        .then(() => res.send({status: true, message: language.lang({key: 'Logged out successfully', lang: req.body.lang})}))
        .catch(console.log);
});

/**
 * @api {post} /device_id update device id
 * @apiName Update device id
 * @apiGroup Common
 * @apiParam {string} device_id required
 * 
 */
router.post('/device_id', oauth.authorise(), upload.array(), (req, res) => {
    users.updateDeviceId(req.user.id, req.body.device_id)
        .then(() => res.send({status: true, message: language.lang({key: 'updatedSuccessfully', lang: req.body.lang})}))
        .catch(console.log);
});

/**
 * @api {post} /city-by-country get cities by country
 * @apiName Cities by country
 * @apiGroup Common Api
 * @apiParam {integer} countryId required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 * 
 */
router.post('/city-by-country', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    } 
    city.getCitiesByCountry(data, function(result){
        res.send({status:true, message:'', data:result.data});
    });
});

/**
 * @api {post} /nationalities get all nationalities
 * @apiName Nationalities
 * @apiGroup Common Api
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 * 
 */
router.post('/nationalities', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    } 
    let result = utils.getNationalities(data);
    res.send({status:true, message: 'Nationalities', data: result});
});

router.post('/all-cities', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    city.getAllCityAtOnce(data, function(result){
        res.send({status:true, message:'', data:result.data});
    });
});

router.post('/send-subs-noti', (req, res) => {
    Promise.resolve(req.body)
    .then(subscription.sendSubscriptionNoti)
    .then(result => res.send(result))
    .catch(err => res.send(log(req, err)));
});

/**
 * @api {post} /verify-otp verify otp
 * @apiName Verify OTP
 * @apiGroup Common Api
 * @apiParam {integer} mobile required
 * @apiParam {integer} otp required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 * 
 */
router.post('/verify-otp', (req, res) => {
    let data = req.body;
    otp.verifyOtp(data)
    .then(result => res.send(result))
    .catch(console.log);
});

/**
 * @api {post} /get-app-version Latest app version
 * @apiName Get latest app version
 * @apiGroup Common Api
 *
 * @apiParam {integer} version_for required (1 - doctor, 2 - patient)
 */
router.post('/get-app-version', upload.array(), function (req, res) {
    let data = req.body;
    utils.getAppVersion(data)
    .then(result => res.send(result))
    .catch(console.log);
});

router.post('/save-app-version', upload.array(), function (req, res) {
    let data = req.body;
    utils.saveAppVersion(data)
    .then(result => res.send(result))
    .catch(console.log);
});

router.use(oauth.errorHandler());

module.exports = router;
