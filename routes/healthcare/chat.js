'use strict';

const chat = require('../../controllers/healthcarechat'),
	authorise = require('../../config/oauth').oauth.authorise(),
	router = require('express').Router();

router.post('/healthcare-list', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(chat.listForHealthCare)
		.then(result => res.send(result))
		.catch(console.log);
});

/**
* @api {post} /healthcare/chat/patient-list Get chat list for patient
* @apiGroup HealthcareChat
* @apiParam {integer} patientId required
* @apiParam {string} user_type required
* @apiSuccess {Obeject[]} data messages
*/
router.post('/patient-list', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(chat.listForPatient)
		.then(result => res.send(result))
		.catch(console.log);
});

router.post('/healthcare-messages', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(chat.healthcareMessages)
		.then(result => res.send(result))
		.catch(console.log);
});

/**
* @api {post} /healthcare/chat/messages-pagination Get chat messages
* @apiGroup HealthcareChat
* @apiParam {integer} patientId required
* @apiParam {string} user_type required
* @apiParam {integer} healthcareprofileId required
* @apiParam {integer} limit optional
* @apiParam {offset} offset optional
* @apiSuccess {Obeject[]} data messages
* @apiSuccess {integer} count number of total messages
*/
router.post('/messages-pagination', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(chat.messages)
		.then(result => res.send(result))
		.catch(console.log);
});

router.post('/remove', authorise, (req, res) => {
	Promise.resolve(req.body)
		.then(chat.remove)
		.then(result => res.send(result))
		.catch(console.log);
});

router.use(oauth.oauth.errorHandler());
module.exports = router;