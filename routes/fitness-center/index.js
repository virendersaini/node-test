'use strict';

const
	multer = require('multer'),
	models = require('../../models'),
	router = require('express').Router(),
	log = require('../../controllers/log'),
	ftc = require('../../controllers/ftc'),
	oauth = require('../../config/oauth').oauth;

const
	validFileTypes = ['.png', '.jpeg', '.jpg'],
	storage = multer.diskStorage({
		destination: (req, file, cb) => {
			const destFolder = 'public/uploads/' + file.fieldname;
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
	upload = multer({
		storage,
		fileFilter: function (req, file, cb) {
			if (validFileTypes.indexOf(path.extname(file.originalname).toLowerCase()) === -1) {
				cb("Invalid File Type");
			} else {
				cb(null, true);
			}
		},
		limits: {fileSize: 15000000},
	}),
	uploadProfilePicture = upload.single('profile_pic'),
	uploadPublicPhoto = upload.single('fitness_center_files');


/**
* @api {post} /fitness-center/profile Get full profile of fitness center
* @apiGroup FitnessCenter
* @apiParam {integer} fitnesscenterId required
*/
router.post('/profile', (req, res) => {
	Promise.resolve(req.body)
		.then(ftc.profile)
		.then(data => res.send({
			data,
			status: true,
			message: data ? undefined : language.lang({
				lang: req.body.lang,
				key: 'No record found',
			}),
		}))
		.catch(err => res.send(log(req, err)));
});

/**
* @api {post} /fitness-center/search Search fitness center
* @apiGroup FitnessCenter
* @apiParam {string} keyword
* @apiParam {integer} cityId
*/
router.post('/search', (req, res) => {
	Promise.resolve(req.body)
		.then(ftc.search)
		.then(res.send.bind(res))
		.catch(err => res.send(log(req, err)));
});

/**
* @api {post} /fitness-center/suggestions Get suggestions of fitness center
* @apiGroup FitnessCenter
* @apiParam {string} keyword
* @apiParam {integer} cityId
*/
router.post('/suggestions', (req, res) => {
	req.body.limit = req.app.locals.site.page;
	Promise.resolve(req.body)
		.then(ftc.suggestions)
		.then(res.send.bind(res))
		.catch(err => res.send(log(req, err)));
});

/**
* @api {post} /fitness-center/feedbacks Get public feedbacks of fitness center
* @apiGroup FitnessCenter
* @apiParam {string} keyword
* @apiParam {integer} fitnesscenterId
*/
router.post('/feedbacks', (req, res) => {
	req.body.pageSize = req.app.locals.site.page;
	Promise.resolve(req.body)
		.then(ftc.feedbacks)
		.then(res.send.bind(res))
		.catch(err => res.send(log(req, err)));
});

router.use(oauth.authorise());

router.use((req, res, next) => {
	if (req.user.user_type === 'fitness_center') {
		ftc.findFitnessCenter(req.user.id).then(user => {
			req.user = user;
			next();
		});
	} else if (req.user.user_type !== 'admin') {
		next('Access denied');
	} else {
		next();
	}
});

router.post('/my-profile', (req, res) => {
	req.body.fitnesscenterId = req.user.fitnesscenter && req.user.fitnesscenter.id;
	Promise.resolve(req.body)
		.then(ftc.profile)
		.then(data => res.send({status: true, data}))
		.catch(err => res.send(log(req, err)));
});

router.post('/save-profile-details', (req, res) => {
	uploadProfilePicture(req, res, err => {
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 15 MB';
			res.send({
				status: false,
				errors: [{
					path: 'profile_pic',
					message: language.lang({key: err.code || err, lang: req.body.lang}),
				}],
			});
		} else {
			if (req.body.fitnesscenter) {
				if (req.user.user_type !== 'admin') {
					req.body.fitnesscenter.userId = req.user.id;
					req.body.fitnesscenter.id = req.user.fitnesscenter && req.user.fitnesscenter.id;
				}
				req.body.fitnesscenter.profile_pic = req.file && req.file.path;
			}
			
			if (req.body.primary_mobile)
				req.body.fitnesscentercontacts[parseInt(req.body.primary_mobile)].primary = true;
			if (req.body.primary_email)
				req.body.fitnesscentercontacts[parseInt(req.body.primary_email)].primary = true;

			Promise.resolve(req.body)
				.then(ftc.saveProfileDetail)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		}
	});
});

router.post('/save-profile-tags', (req, res) => {
	req.body.fitnesscenterId = req.user.fitnesscenter && req.user.fitnesscenter.id;
	Promise.resolve(req.body)
		.then(ftc.saveProfileTags)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/profile/upload-file', (req, res) => {
	uploadPublicPhoto(req, res, err => {
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE') err = 'Image size should less than 15 MB';
			res.send({
				status: false,
				message: language.lang({key: err.code || err, lang: req.body.lang}),
			});
		} else {
			if (!req.file) {
				res.send({
					status: false,
					message: language.lang({key: 'File upload failed', lang: req.body.lang}),
				});
				return;
			}
			req.body.path = req.file.path;
			req.body.original_name = req.file.originalname;
			req.body.fitnesscenterId = req.user.fitnesscenter && req.user.fitnesscenter.id;
			Promise.resolve(req.body)
				.then(ftc.addFile)
				.then(result => res.send(result))
				.catch(err => res.send(log(req, err)));
		}
	});
});

router.post('/profile/remove-file', (req, res) => {
	req.body.fitnesscenterId = req.user.fitnesscenter && req.user.fitnesscenter.id;
	Promise.resolve(req.body)
		.then(ftc.removeFile)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/profile/add-membership', (req, res) => {
	req.body.fitnesscenterId = req.user.fitnesscenter && req.user.fitnesscenter.id;
	Promise.resolve(req.body)
		.then(ftc.addMembership)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/profile/remove-membership', (req, res) => {
	req.body.fitnesscenterId = req.user.fitnesscenter && req.user.fitnesscenter.id;
	Promise.resolve(req.body)
		.then(ftc.removeMembership)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/profile/save-timings', (req, res) => {
	req.body.fitnesscenterId = req.user.fitnesscenter && req.user.fitnesscenter.id;
	Promise.resolve(req.body)
		.then(ftc.saveTimings)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.post('/feedback-list', (req, res) => {
	req.body.fitnesscenterId = req.user.fitnesscenter && req.user.fitnesscenter.id;
	Promise.resolve(req)
		.then(ftc.feedbackList)
		.then(result => res.send(result))
		.catch(err => res.send(log(req, err)));
});

router.use((req, res, next) => req.user.user_type !== 'admin' ? next('Access denied') : next());

router.post('/list', (req, res) => {
	Promise.resolve(req)
		.then(ftc.list)
		.then(data => res.send({status: true, data}))
		.catch(err => res.send(log(req, err)));
});

router.post('/status', (req, res) => {
	Promise.resolve(req.body)
		.then(ftc.status)
		.then(data => res.send({status: true, data}))
		.catch(err => res.send(log(req, err)));
});

router.post('/verification-status', (req, res) => {
	Promise.resolve(req.body)
		.then(ftc.verificationStatus)
		.then(data => res.send({status: true, data}))
		.catch(err => res.send(log(req, err)));
});

router.post('/admin-feedback-list', (req, res) => {
	Promise.resolve(req)
		.then(ftc.adminFeedbackList)
		.then(data => res.send(data))
		.catch(err => res.send(log(req, err)));
});

router.post('/admin-feedback-status', (req, res) => {
	Promise.resolve(req.body)
		.then(ftc.feedbackStatus)
		.then(data => res.send(data))
		.catch(err => res.send(log(req, err)));
});

router.use(oauth.errorHandler());
module.exports = router;