const job = require('../controllers/job')
	jobapplication = require('../controllers/jobapplication'),
	oauth = require('../config/oauth'),
	router = require('express').Router(),
	multer = require('multer'),
	mime = require('mime'),
	upload = multer(),
	async = require('async'),
	fs = require('fs'),
	path = require('path');
	language = require('../controllers/language');
let storage = multer.diskStorage({
	destination: function (req, file, cb) {
		let destFolder = tmpDir;
		if (!fs.existsSync(destFolder+file.fieldname)) {
			fs.mkdirSync(destFolder+file.fieldname);
		}
		cb(null, destFolder);
	},
	filename: function (req, file, cb) {
		cb(null, file.fieldname+'/'+Date.now() + path.extname(file.originalname).toLowerCase());
	}
});
let uploadFile = multer({
  storage: storage,
	fileFilter: function (req, file, cb) {
		if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
			cb(language.lang({key:"Only pdf/doc files are allowed!",lang:req.body.lang}), false);
		} else {
			cb(null, true);
		}
	},
	limits: {fileSize: 2000000}
}).any();

router.post('/', (req, res) => {
	Promise.resolve(req.body)
	.then(job.careersList)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/detail', (req, res) => {
	Promise.resolve(req.body)
	.then(job.careerdetail)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/apply', (req, res) => {
	uploadFile(req, res, function (err) {
		if (err) {
			
			if (err.code === 'LIMIT_FILE_SIZE') err = language.lang({key:"File size should less than 2 MB",lang:req.body.lang});
			return res.send({status: false, message: err, data: []});
		}
		var count = 1;
		let data = req.body;
		async.forEach(req.files, function (up_files, callback) {
			if (up_files.path !=='') {
				data[up_files.fieldname] = up_files.path;
			}
			if (req.files.length == count) {
				callback(req.body);
			}
			count++;
		}, function () {
			Promise.resolve(data)
			.then(jobapplication.apply)
			.then(result => res.send(result))
			.catch(console.log);
		});
	});
});

router.use(oauth.oauth.errorHandler());
module.exports = router;