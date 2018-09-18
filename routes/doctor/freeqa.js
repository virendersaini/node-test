var express = require('express');
var multer = require('multer');
var router = express.Router();
var upload = multer();
var models = require('../../models');
var freeqa = require('../../controllers/freeqa');
var oauth = require('../../config/oauth');


/**
 * @api {post} /doctor/freeqa?showlist=new|answered&tagId=all|ProblamTagId doctor questions list
 * @apiName freeqa
 * @apiGroup Doctor Consult
 * @apiParam {integer} doctorprofileId required
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(freeqa.list(req))
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /doctor/freeqa/skipquestion doctor skip question
 * @apiName Skip Question
 * @apiGroup Doctor Consult
 * @apiParam {integer} doctorprofileId required
 * @apiParam {integer} patientquestionId required
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/skipquestion', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(freeqa.skipquestion(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /doctor/freeqa/question question details
 * @apiName question details
 * @apiGroup Doctor Consult
 * @apiParam {integer} doctorprofileId required
 * @apiParam {integer} id required
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/question', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(freeqa.question(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /doctor/freeqa/saveAnswer save answer
 * @apiName save answer
 * @apiGroup Doctor Consult
 * @apiParam {integer} id optional
 * @apiParam {integer} doctorprofileId required
 * @apiParam {integer} patientquestionId required
 * @apiParam {integer} langId required
 * @apiParam {string} answer required
 * @apiParam {string} is_for_profile required
 * @apiParam {string} lang required
 */
router.post('/saveAnswer', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(freeqa.saveAnswer(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /doctor/freeqa/reportQuestion report about question
 * @apiName report about question
 * @apiGroup Doctor Consult
 * @apiParam {integer} doctorprofileId required
 * @apiParam {integer} patientquestionId required
 * @apiParam {integer} langId required
 * @apiParam {integer} type required 1=>Mark Abusive, 2=>Mark Irrelevant, 3=>Mark Fake
 * @apiParam {string} lang required
 */
router.post('/reportQuestion', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(freeqa.reportQuestion(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/adminlist', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(freeqa.adminlist(req))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/viewDetails', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(freeqa.viewDetails(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/sendEmail', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(freeqa.sendEmail(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/status', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(freeqa.status(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /doctor/freeqa/answered-list doctor answered questions list
 * @apiName doctor answered questions list
 * @apiGroup Doctor Consult
 * @apiParam {integer} doctorprofileId required
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/answered-list', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(freeqa.answeredlist(req))
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /doctor/freeqa/view-question question details
 * @apiName view question details
 * @apiGroup Doctor Consult
 * @apiParam {integer} doctorprofileId required
 * @apiParam {integer} id required
 * @apiParam {integer} patientId required
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/view-question', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(freeqa.viewQuestion(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /doctor/freeqa/mark-helpful Mark helpful answer
 * @apiName Mark helpful answer
 * @apiGroup Doctor Consult
 * @apiParam {integer} questionanswerId required
 * @apiParam {integer} patientId required
 * @apiParam {integer} is_helpful required 0 => No, 1 => Yes
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/mark-helpful', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(freeqa.markHelpful(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.use(oauth.oauth.errorHandler());
module.exports = router;