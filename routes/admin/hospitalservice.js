var hospitalservice = require('../../controllers/hospitalservice');
var express = require('express');
var router = express.Router();

var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var async = require('async');
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var path = require('path'),
crypto = require('crypto');
/* GET list of hospital files data */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'hospitalservice', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospitalservice.list(req, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});


/* save */
router.post('/save',oauth.oauth.authorise(),upload.array(), function (req, res) {
//console.log(req.body.hospitalId);
//console.log(req.body);
 req.body = JSON.stringify(req.body);
  req.roleAccess = {model:'hospitalservice', action:'add'};
  auth.checkPermissions(req, function(isPermission){
      if (isPermission.status === true) {
          hospitalservice.save(req, function(result){
             res.send(result);
          });
      } else {
          res.send(isPermission);
      }
  });
});
/* status */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    data.is_active = req.params.status;
    req.roleAccess = {model:'hospitalfile', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospitalfile.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });

});
/* status */
router.post('/delete/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    req.roleAccess = {model:'hospitalfile', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospitalfile.delete(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });

});
/* add */
router.post('/add', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'hospitalfile', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospitalfile.getAllCountry(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});
/* edit  */
router.post('/edit/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    req.roleAccess = {model:'institute', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            hospitalfile.getById(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
