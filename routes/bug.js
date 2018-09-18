'use strict';

const models = require('../models'),
	log = require('../controllers/log'),
	authorise = require("../config/oauth").oauth.authorise();

const router = require('express').Router();

router.post('/view', authorise, (req, res) => {
	if (req.user.id !== 1) return res.send({status: false});
	models.bug.find({where: {id: {$gte: req.body.id}}})
	.then(bug => res.send({status: true, bug}));
});

router.post('/delete', authorise, (req, res) => {
	if (req.user.id !== 1) return res.send({status: false});
	models.bug.destroy({where: {id: req.body.id}})
	.then(bug => res.send({status: true, bug}));
});

router.post('/report', (req, res) => {
	models.bug.create(req.body)
	.then(bug => res.send({status: true, id: bug.id}))
	.catch(err => res.send(log(req, err)));
});

module.exports = router;