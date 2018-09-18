var article = require('../../controllers/articles');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'article', action:'list'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            article.list(req, function(result){
                res.send(result);
            });
        } else {
           res.send(isPermission);
        }
    });
});

router.post('/pending', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'article', action:'list'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            article.pendinglist(req, function(result){
                res.send(result);
            });
        } else {
           res.send(isPermission);
        }
    });
});

router.post('/changeStatus', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    req.roleAccess = {model:'article', action:'list'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            article.changeStatus(data, function(result){
                res.send(result);
            });
        } else {
           res.send(isPermission);
        }
    });
});

router.post('/active-status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    data.is_active = req.params.status;
    req.roleAccess = {model:'article', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            article.activestatus(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
