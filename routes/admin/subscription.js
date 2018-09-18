const subscription = require('../../controllers/subscription'),
	oauth = require('../../config/oauth'),
	router = require('express').Router();

router.post('/', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(subscription.list)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/edit', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(subscription.getById)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/save', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(subscription.save)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/plans', (req, res) => {
	Promise.resolve(req.body)
	.then(subscription.plans)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/make-payment', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(subscription.makePayment)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/update-trial', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(subscription.updateTrial)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/subscribers', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req)
	.then(subscription.subscribers)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/updatePlan', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(subscription.updatePlan)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/currentPlan', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(subscription.currentPlan)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/subscriptionPlan', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(subscription.subscriptionPlan)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/make-payment-role-change', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(subscription.makePaymentRoleChange)
	.then(result => res.send(result))
	.catch(console.log);
});

router.use(oauth.oauth.errorHandler());
module.exports = router;