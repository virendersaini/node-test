var express = require('express');
var multer = require('multer');
var router = express.Router();
var upload = multer();
var models = require('../../models');
var onlineconsult = require('../../controllers/onlineconsult');
var oauth = require('../../config/oauth');

/**
 * @api {post} /doctor/onlineconsult doctor online consult
 * @apiName doctor online consult
 * @apiGroup Doctor Consult
 * @apiParam {integer} doctorprofileId required
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(onlineconsult.check_availability(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /doctor/onlineconsult/getStart doctor online consult get start
 * @apiName doctor online consult get start
 * @apiGroup Doctor Consult
 * @apiParam {integer} doctorprofileId required
 * @apiParam {integer} available_for_consult required 1=>Enable, 0=>Disable
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/getStart', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(onlineconsult.getStart(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /doctor/onlineconsult/editSetting online consult edit setting
 * @apiName online consult edit setting
 * @apiGroup Doctor Consult
 * @apiParam {integer} doctorprofileId required
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/editSetting', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(onlineconsult.editSetting(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /doctor/onlineconsult/saveSetting online consult save setting
 * @apiName online consult save setting
 * @apiGroup Doctor Consult
 * @apiParam {integer} id required
 * @apiParam {integer} available_for_consult required 1=>Enable, 0=>Disable
 * @apiParam {integer} freeqa_notification required 1=>Enable, 0=>Disable
 * @apiParam {integer} chat_notification required 1=>Enable, 0=>Disable
 * @apiParam {string} account_holder_name required
 * @apiParam {string} account_number required
 * @apiParam {string} account_type required
 * @apiParam {string} bank_name required
 * @apiParam {string} bank_branch_city required
 * @apiParam {string} bank_ifsc_code required
 * @apiParam {number} consultation_fee required
 */
router.post('/saveSetting', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(onlineconsult.saveSetting(req.body))
	.then(result => res.send({status: true, data: result}))
	.catch(console.log);
});

/**
 * @api {post} /doctor/onlineconsult/notificationFreeQA online consult notification Free QA's
 * @apiName online consult notification Free QA's
 * @apiGroup Doctor Consult
 * @apiParam {integer} id required
 * @apiParam {integer} freeqa_notification required 1=>Enable, 0=>Disable
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/notificationFreeQA', oauth.oauth.authorise(), upload.array(), function (req, res) {
	Promise.resolve(onlineconsult.notificationFreeQA(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.use(oauth.oauth.errorHandler());
module.exports = router;