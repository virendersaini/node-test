'use strict';

const myschedule = require('../../controllers/myschedule'),
	oauth = require('../../config/oauth'),
	router = require('express').Router();

router.post('/list', (req, res) => {
	req.body.pageSize = req.app.locals.site.page;
	Promise.resolve(req.body)
	.then(myschedule.listDoctorClinic)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/consult', (req, res) => {
	Promise.resolve(req.body)
	.then(myschedule.viewDoctorClinic)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.use(oauth.oauth.errorHandler());
module.exports = router;