var users = require('../controllers/users');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var auth = require('../config/auth');



/* GET forgot-password */
router.post('/', upload.array(), function (req, res) {
   var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    console.log('--------------test----------------');
    console.log(data);
    console.log('--------------test----------------');
    res.send(data);
});


module.exports = router;
