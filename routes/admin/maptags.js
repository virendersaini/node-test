var tag = require('../../controllers/tag');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');

/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'tag', action:'list'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            tag.getMappedTagList(req, function(result){
                res.send(result);
            });
        } else {
           res.send(isPermission);
        }
    });
});

router.post('/add', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'tag', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            tag.getMapTagMetaData(req, function(result){
                res.send(result);
            });
        } else {
           res.send(isPermission);
        }
    });
});

router.post('/save', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    req.roleAccess = {model:'tag', action:'save'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            tag.saveMappedTags(data, function(result){
                res.send(result);
            });
        } else {
           res.send(isPermission);
        }
    });
});

router.post('/update', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    req.roleAccess = {model:'tag', action:'save'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            tag.updateMappedTags(data, function(result){
                res.send(result);
            });
        } else {
           res.send(isPermission);
        }
    });
});

router.post('/delete', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }

    req.roleAccess = {model:'tag', action:'delete'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            tag.deleteMappedTags(data, function(result){
                res.send(result);
            });
        } else {
           res.send(isPermission);
        }
    });
})

router.post('/edit', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    
    req.roleAccess = {model:'tag', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            tag.editMappedTags(data, function(result){
                res.send(result);
            });
        } else {
           res.send(isPermission);
        }
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
