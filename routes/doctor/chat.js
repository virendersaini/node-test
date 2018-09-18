const chat = require('../../controllers/chat'),
	oauth = require('../../config/oauth'),
	transaction = require('../../controllers/transaction'),
	router = require('express').Router();

router.post('/list', (req, res) => {
	req.body.pageSize = req.app.locals.site.page;
	Promise.resolve(req.body)
	.then(chat.list)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/consult', (req, res) => {
	Promise.resolve(req.body)
	.then(chat.getByIdForDoctor)
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /doctor/chat/transactions Chat consult payments details
 * @apiName Chat consult payments details
 * @apiGroup Doctor
 * @apiParam {integet} doctorProfileId required
 * @apiParam {integer} page required
 * @apiParam {integer} is_released required (0 or 1)
 * @apiParam {string} lang required
 * @apiParam {integer} langId required
 * @apiParam {integer} languageId required
 * 
 */
router.post('/transactions', (req, res) => {
	req.body.pageSize = req.app.locals.site.page;
	Promise.resolve(req.body)
	.then(transaction.listForDoctor)
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /doctor/chat/view-consult View chat consult details
 * @apiName Chat consult details
 * @apiGroup Doctor
 * @apiParam {integet} chatconsultId required
 * @apiParam {string} lang required
 * @apiParam {integer} langId required
 * @apiParam {integer} languageId required
 * 
 */
router.post('/view-consult', (req, res) => {
	Promise.resolve(req.body)
	.then(chat.getForSuperadmin)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

router.use(oauth.oauth.errorHandler());
module.exports = router;