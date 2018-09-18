var feedback = require('../controllers/healthcare_feedbacks');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var auth = require('../config/auth');
var oauth = require('../config/oauth');
var async = require('async');

/* GET list of all feedbacks */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    feedback.getAll(req, function (result) {
        res.send(result);
    });
});

router.post('/create',/*oauth.oauth.authorise(),*/upload.array(), function (req, res) {
          var data = req.body;
          if(typeof req.body.data !== 'undefined'){
              data = JSON.parse(req.body.data);
          }
          feedback.save(data, function(result){
              res.send(result);
          });
});



router.post('/list',upload.array(),function (req, res) {

    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    feedback.list(data, function(result){
              res.send(result);
});
});



router.post('/healthcare',upload.array(),function (req, res) {

    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    feedback.getDoctorFeedback(req, function(result){
      res.send(result);
    });
});

router.post('/get-list-feedback', upload.array(), function (req, res) {
    feedback.getHealthcareFeedbackForApp(req, function (result) {
        res.send(result);
    });
});

router.post('/changeApprovalStatus', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    feedback.changeApprovalStatus(data, function (result) {
        res.send(result);
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
