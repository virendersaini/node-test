var dashboard = require('../../controllers/dashboard');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');

router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(dashboard.info(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
