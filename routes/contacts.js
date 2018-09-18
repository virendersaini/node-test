'use strict';

const contact = require('../controllers/contacts'),
	oauth = require('../config/oauth'),
	log = require('../controllers/log'),
	language = require('../controllers/language'),
	mail = require('../controllers/mail'),
	authorise = oauth.oauth.authorise(),
	router = require('express').Router();

router.post('/', (req, res) => {
	Promise.resolve(req)
	.then(contact.list)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/save', (req, res) => {
	Promise.resolve(req.body)
	.then(contact.save)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/sendEmail', (req, res) => {
	Promise.resolve(req.body)
	.then(contact.sendEmail)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});


router.use(oauth.oauth.errorHandler());
module.exports = router;
