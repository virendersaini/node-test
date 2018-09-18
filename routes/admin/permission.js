var permission = require('../../controllers/permission');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');

/* GET language */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    permission.list(req, function(result){
        res.send(result);
    });
});

/* save language */
router.post('/save', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = JSON.parse(req.body.data);
    permission.save(data, function(result){
        res.send(result);
    });
});

/* edit language */
router.post('/edit/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = JSON.parse(req.body.data);
    data.id = req.params.id;
    permission.getById(data, function(result){
        res.send(result);
    });
});

/* status */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = JSON.parse(req.body.data);
    data.id = req.params.id;
    data.is_active = req.params.status;
    permission.status(data, function(result){
        res.send(result);
    });
});


/* getAllCountry */
router.post('/list', upload.array(), function (req, res) {
    var data = JSON.parse(req.body.data);
    permission.getAllPermission(data, function(result){
        res.send(result);
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
