var express = require('express');
var multer = require('multer');
var router = express.Router();
var upload = multer();
var models = require('../../models');
var jobapplication = require('../../controllers/jobapplication');
var oauth = require('../../config/oauth');

router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(jobapplication.list(req))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/listForClinic', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(jobapplication.listForClinic(req))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/save', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(jobapplication.saveJob(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/edit', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(jobapplication.getById(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/status', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(jobapplication.status(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.use(oauth.oauth.errorHandler());
module.exports = router;