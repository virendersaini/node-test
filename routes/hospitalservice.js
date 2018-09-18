var hospitalservice = require('../controllers/hospitalservice');
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

router.post('/save-spec-service-info', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    hospitalservice.saveSpecializationServies(data, function(result) {
        res.send(result);
    })
})

router.post('/save-award-memb-info', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    hospitalservice.saveAwardsMemberships(data, function(result) {
        res.send(result);
    })
})

router.post('/save-insurance-comp-info', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    hospitalservice.saveInsuranceCompanies(data, function(result) {
        res.send(result);
    })
})

router.post('/remove-custom-tag', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    } 
    hospitalservice.remCusTags(data, function(result){
        res.send(result);
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
