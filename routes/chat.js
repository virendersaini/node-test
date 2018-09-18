'use strict';

const chat = require('../controllers/chat'),
	oauth = require('../config/oauth'),
	log = require('../controllers/log'),
	language = require('../controllers/language'),
	authorise = oauth.oauth.authorise(),
	fs = require('fs'),
	path = require('path'),
	multer = require('multer'),
	router = require('express').Router();

const validFileTypes = ['.png','.jpg','.jpeg'];

const uploadFile =  multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			var destFolder = 'public/uploads/';
			//let destFolder = 'public/uploads/chatfiles/';
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
				file.fieldname+'/'+
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

/**
* @api {post} /chat/list Get chat consults
* @apiGroup ChatConsult
* @apiParam {integer} patientId required
*/
router.post('/list', authorise, (req, res) => {
	Promise.resolve(req.body)
	.then(chat.listForPatient)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

/**
* @api {post} /chat/consult Get chat consult
* @apiGroup ChatConsult
* @apiParam {integer} id required
*/
router.post('/consult', authorise, (req, res) => {
	Promise.resolve(req.body)
	.then(chat.getById)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});


/**
* @api {post} /chat/messages Get chat consult message
* @apiGroup ChatConsult
* @apiParam {integer} chatconsultId required
*/
router.post('/messages', authorise, (req, res) => {
	Promise.resolve(req.body)
	.then(chat.messageForPatient)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

/**
* @api {post} /chat/messages-pagination Get chat consult message
* @apiGroup ChatConsult
* @apiParam {integer} chatconsultId required
* @apiParam {integer} limit optional
* @apiParam {offset} offset optional
* @apiSuccess {Obeject[]} data messages
* @apiSuccess {integer} count number of total messages
*/
router.post('/messages-pagination', /*authorise,*/ (req, res) => {
	Promise.resolve(req.body)
	.then(chat.messageForPatientPagination)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

/**
* @api {post} /chat/add Add new chat consult
* @apiGroup ChatConsult
* @apiParam {integer} doctorprofileId required
* @apiParam {integer} patientId required
* @apiParam {integer} name required
* @apiParam {integer} age required
* @apiParam {integer} gender required (0->male or 1->female)
* @apiParam {string} contact required
* @apiParam {string} title required
* @apiParam {string} description required
* @apiParam {string} image optional
*/
router.post('/add', authorise, (req, res) => {
	uploadFile(req, res, err => {
		if (err) {
			res.send({
				status: false,
				message: language.lang({key: 'File upload failed', lang: req.body.lang}),
			});
		} else {
			req.body.image = req.file ? req.file.path :  null;
			Promise.resolve(req.body)
			.then(chat.add)
			.then(result => res.send(result))
			.catch(err => res.send(log(req, err)));
		}
	});
});

/**
* @api {post} /chat/tags Get list of problem type tags for chat
* @apiGroup ChatConsult
* @apiParam {integer} doctorprofileId optional
*/
router.post('/tags', (req, res) => {
	Promise.resolve(req.body)
	.then(chat.tags)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

/**
* @api {post} /chat/doctors Get list of doctors for chat
* @apiGroup ChatConsult
* @apiParam {integer} problemtypeTagId required
*/
router.post('/doctors', (req, res) => {
	Promise.resolve(req.body)
	.then(chat.doctors)
	.then(result => res.send(result))
	.catch(err => res.send(log(req, err)));
});

/**
* @api {post} /chat/file Upload image for chat
* @apiGroup ChatConsult
* @apiParam {integer} uid required
* @apiParam {file} image required
*/
router.post('/file', authorise, (req, res) => {
	uploadFile(req, res, err => {
		if (err) {
			res.send({
				status: false,
				message: language.lang({key: 'File upload failed', lang: req.body.lang}),
				uid: req.body.uid
			});
		} else {
			if (req.file) {
				res.send({
					status: true,
					url: req.file.path,
					uid: req.body.uid
				});
			} else {
				res.send({
					status: false,
					message: language.lang({key: 'File upload failed', lang: req.body.lang}),
					uid: req.body.uid
				});
			}
		}
	});
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
