var myschedule = require('../../controllers/myschedule');
var doctor = require('../../controllers/doctor');
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
var path = require('path');
var language = require('../../controllers/language');
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
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            cb(language.lang({key:"Only image files are allowed!",lang:req.body.lang}), false);
        } else {
            cb(null, true);
        }
    },
    limits: {fileSize: 1000000}
}).any();


/* GET list of doctor articles */
router.post('/', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    myschedule.getList(req, function (result) {
      myschedule.getHospital(req, function (list) {
         res.send({data:result,list:list});
      });
    });
});

router.post('/app', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    req.body.languageId = req.body.langId;
    myschedule.getList(req, function (result) {
      myschedule.getHospital(req, function (list) {

        doctor.DoctorBasicAndSpecInfo(req, function (docData) {
            result.list = list;
            result.doctor_data = docData.data;
            result.message = 'No Schedules found';
            res.send(result);    
        })
      });
    });
});

/* GET list of doctor articles */
router.post('/hospital', oauth.oauth.authorise(), upload.array(), function (req, res) {
    myschedule.getListHospital(req, function (result) {
      myschedule.getDoctor(req, function (list) {
         res.send({data:result,list:list});
      });
    });
});

/**
* @api {post} /doctor/myschedule/add-block Block Schedule
* @apiGroup Doctor Schedule
* @apiparam {integer} id required
* @apiparam {integer} hospitalDoctorId required
* @apiparam {integer} doctorProfileId required
* @apiparam {YYYY-MM-DD} from_date required
* @apiparam {YYYY-MM-DD} to_date required
* @apiparam {string} leave_details required
*/
router.post('/add-block', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    myschedule.addBlock(data, function(result){
        res.send(result);
    });
});

router.post('/active-schedule', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    myschedule.activeSchedule(data, function(result){
        res.send(result);
    });
});

/**
* @api {post} /doctor/myschedule/status Change Schedule status
* @apiGroup Doctor Schedule
* @apiParam {sid} id required ScheduleId
* @apiParam {integer} doctorProfileId required
* @apiParam {string} suggestion optional
* @apiParam {status} status required
*/
router.post('/status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    myschedule.chageStatus(data, function(result){
        res.send(result);
    });
});

router.post('/get-schedule', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    myschedule.getSchedule(data, function(result){
        res.send(result);
    });
});

/**
* @api {post} /doctor/myschedule/blocked-schedules Get blocked schedules list
* @apiGroup Doctor Schedule
* @apiParam {integer} doctorProfileId required
* @apiParam {string} langId required
* @apiParam {status} lang required
* @apiParam {status} languageId required
*/
router.post('/blocked-schedules', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    myschedule.getBlockedSchedules(data, function(result){
        res.send(result);
    });
});

router.post('/get-schedule-patient', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    myschedule.getSchedulePatient(data, function(result){
        res.send(result);
    });
});


router.post('/add-schedule-patient', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    myschedule.addSchedule(data, function(result){
        res.send(result);
    });
});


router.post('/re-schedule-patient', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    myschedule.reSchedule(data, function(result){
        res.send(result);
    });
});


router.post('/cancle-schedule-patient', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    myschedule.cancleSchedule(data, function(result){
        res.send(result);
    });
});




router.post('/get-schedule-patient-list', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    myschedule.getSchedulePatientList(data, function(result){
        res.send(result);
    });
});

router.post('/get-schedule-info', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    myschedule.getScheduleInfo(data, function(result){
        res.send(result);
    });
});

/**
* @api {post} /doctor/myschedule/del-blck-sch Delete Block Schedule
* @apiGroup Doctor Schedule
* @apiparam {integer} id required Block schedule Id
* @apiparam {integer} doctorProfileId required
* @apiparam {integer} lang required
* @apiparam {integer} langId required
* @apiparam {integer} languageId required
*/
router.post('/del-blck-sch', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    myschedule.deletBlockSchedule(data, function(result){
        res.send(result);
    });
});


router.post('/add-appointment', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    myschedule.addAppointment(req.body, function(result){
        res.send(result);
    });
});

router.post('/check_appointment', /*oauth.oauth.authorise(),*/ upload.array(), function (req, res) {
    myschedule.checkAppointment(req.body, function(result){
        res.send(result);
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;