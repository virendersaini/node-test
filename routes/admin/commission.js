const commission = require('../../controllers/commission'),
	oauth = require('../../config/oauth'),
	router = require('express').Router();

router.post('/', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(commission.commissionList)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/savegc', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(commission.saveGlobalCommission)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/savedsc', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(commission.savedsc)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/deletecommission', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(commission.deletecommission)
	.then(result => res.send(result))
	.catch(console.log);
});

router.use(oauth.oauth.errorHandler());
module.exports = router;