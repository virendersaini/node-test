const transaction = require('../../controllers/transaction'),
	oauth = require('../../config/oauth'),
	fs = require('fs'),
	path = require('path'),
	multer = require('multer'),
	language = require('../../controllers/language'),
	router = require('express').Router();

const validFileTypes = ['.png','.jpg','.jpeg'];

const uploadFile =  multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			let destFolder = 'public/uploads/chatfiles/';
			fs.access(destFolder, err => {
				if (err) {
					fs.mkdir(destFolder, () => cb(null, destFolder));
				} else {
					cb(null, destFolder);
				}
			});
		},
		filename: (req, file, cb) => {
			cb(
				null,
				Date.now() + crypto.randomBytes(8).toString('hex') +
				path.extname(file.originalname).toLowerCase()
			);
		}
	}),
	fileFilter: function (req, file, cb) {
		if (validFileTypes.indexOf(path.extname(file.originalname).toLowerCase()) === -1) {
			cb(language.lang({key: 'Invalid File Type', lang: req.body.lang}));
		} else {
			cb(null, true);
		}
	},
	limits: {fileSize: 50000000}
}).single('image');

router.post('/duetransactions', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req)
	.then(transaction.listForAdmin)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/paidtransactions', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req)
	.then(transaction.listForAdminPaid)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/viewDetails', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(transaction.viewDetails)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/viewACDetails', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(transaction.viewACDetails)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/releasePayment', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(transaction.releasePayment)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/viewPaidDetail', oauth.oauth.authorise(), (req, res) => {
	Promise.resolve(req.body)
	.then(transaction.viewPaidDetail)
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /admin/transaction/client_token Client Token
 * @apiName Client Token
 * @apiGroup Chat Payment
 */
router.post('/client_token', (req, res) => {
	Promise.resolve(req.body)
	.then(transaction.clientToken)
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /admin/transaction/checkout Chat payment checkout
 * @apiName Chat payment checkout
 * @apiGroup Chat Payment
 * @apiParam {integer} amount required
 * @apiParam {string} nonce required
 * @apiParam {integer} langId required
 * @apiParam {srring} lang required
 * @apiParam {integer} tagId required
 * @apiParam {string} title required
 * @apiParam {string} description required
 * @apiParam {file} image
 * @apiParam {integer} doctorprofileId required
 * @apiParam {integer} patientId required
 * @apiParam {integer} age required
 * @apiParam {string} gender required
 * @apiParam {integer} contact required
 * @apiParam {string} name required
 */
router.post('/checkout', oauth.oauth.authorise(), (req, res) => {
	uploadFile(req, res, err => {
		if (err) {
			res.send({
				status: false,
				message: language.lang({key: 'File upload failed', lang: req.body.lang}),
			});
		} else {
			req.body.image = req.file ? req.file.path :  null;
			Promise.resolve(req.body)
			.then(transaction.checkout)
			.then(result => res.send(result))
			.catch(console.log);
		}
	});
});

router.post('/invoice', (req, res) => {
	Promise.resolve(req.body)
	.then(transaction.invoice)
	.then(result => res.send(result.html))
	.catch(console.log);
});

router.use(oauth.oauth.errorHandler());
module.exports = router;