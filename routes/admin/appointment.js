const myschedule = require('../../controllers/myschedule'),
	oauth = require('../../config/oauth'),
	log = require('../../controllers/log'),
	authorise = oauth.oauth.authorise(),
	path = require('path'),
	multer = require('multer'),
	router = require('express').Router();

router.post('/view', authorise, (req, res) => {
	Promise.resolve(req.body)
	.then(myschedule.getForSuperadmin)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.post('/', authorise, (req, res) => {
	Promise.resolve(req)
	.then(myschedule.listForSuperadmin)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
