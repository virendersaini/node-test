var express = require('express');
var multer = require('multer');
var router = express.Router();
var upload = multer();
var models = require('../../models');
var job = require('../../controllers/job');
var oauth = require('../../config/oauth');

router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(job.list(req))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/listForClinic', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(job.listForClinic(req))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/save', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(job.saveJob(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/edit', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(job.getById(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/status', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(job.status(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/list', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(job.adminlist(req))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/viewDetail', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(job.viewDetail(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.use(oauth.oauth.errorHandler());
module.exports = router;