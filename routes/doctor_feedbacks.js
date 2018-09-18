var feedback = require('../controllers/doctor_feedbacks');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var auth = require('../config/auth');
var oauth = require('../config/oauth');
var async = require('async');



/**
 * @api {post} /doctor_feedbacks/create  Add feedback for doctor
 * @apiName create
 * @apiGroup Doctor Feedback
 *
 * @apiParam {integer} userId required
 * @apiParam {integer} doctorProfileId required
 * @apiParam {integer} hospitalId required
 * @apiParam {integer} appointmentId required(only for doctors)
 * @apiParam {integer} rating required
 * @apiParam {String} feedback required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post('/create', oauth.oauth.authorise(), function (req, res) {
          var data = req.body;
          if(typeof req.body.data !== 'undefined'){
              data = JSON.parse(req.body.data);
          }
          feedback.save(data, function(result){
              res.send(result);
          });
});


/**
 * @api {post} /doctor_feedbacks/list Get All doctor feedbacks
 * @apiName list
 * @apiGroup Doctor Feedback
 *
 * @apiParam {integer} doctorProfileId required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post('/list',upload.array(),function (req, res) {

    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    feedback.list(data, function(result){
              res.send(result);
});
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
