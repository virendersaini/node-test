var patient_web = require('../controllers/patient_web');
var path = require('path');
var crypto = require('crypto');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var auth = require('../config/auth');
var crypto = require('crypto');
var mongoDB = require('../config/mongo_config');
var language = require('../controllers/language');
var tag = require('../controllers/tag');

const uploadFile = multer({
	storage: multer.diskStorage({
		destination: function (req, file, cb) {
			let destFolder = 'public/uploads/user_image';
			if (! fs.existsSync(destFolder)) {
				fs.mkdirSync(destFolder);
			}
			cb(null, destFolder);
		},
		filename: (req, file, cb) => cb(
			null,
			Date.now() +
			crypto.randomBytes(4).toString('hex') +
			path.extname(file.originalname).toLowerCase()
		),
	}),
	fileFilter: function (req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/)) {
			cb(language.lang({key:"Only image files are allowed!", lang:req.body.lang}), false);
		} else {
			cb(null, true);
		}
	},
	limits: {fileSize: 10000000}
}).single('user_image');

router.post('/cities', upload.array(), function (req, res) {
	Promise.resolve(patient_web.getCitiesByCountryId(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/filter_records', upload.array(), function (req, res) {
	var limit = 20;
	var page = req.body.pageNo || 1;
	//if(page>1){
	var skip = limit * (page - 1);
	//}else{
	// var skip=0;
	//}
	var collection = mongoDB.get().collection('records');
	var find_json = {
		langId: req.body.langId.toString(),
		title: new RegExp(req.body.title, 'i')
	}
	collection.find(find_json).skip(skip).limit(limit).toArray(function (err, countData) {
		res.send({
			status: true,
			message: language.lang({
				key: "filderData",
				lang: req.lang
			}),
			data: countData,
			pageLimit: limit,
			pageNo: page
		});
	})	
});

router.post('/filter_records_new', upload.array(), function (req, res) {
	const models = require('../models');

	let qry = 'SELECT * FROM ('
		+' ( '
			+' SELECT `doctor_profiles`.`id` AS keyy, `doctor_profile_details`.`name` AS title, `doctor_profiles`.`doctor_profile_pic` AS image, `doctor_profile_details`.`languageId` AS `langId`, "doctor" AS type '
    		+' FROM `doctor_profiles` '
    		+' INNER JOIN `doctor_profile_details` ON `doctor_profile_details`.`doctorProfileId` = `doctor_profiles`.`id` '
    		+' AND `doctor_profile_details`.`name` LIKE ? '
    		+' AND `doctor_profile_details`.`languageId` = IFNULL((SELECT `languageId` FROM `doctor_profile_details` WHERE `doctor_profiles`.`id` = `doctor_profile_details`.`doctorProfileId` AND `languageId` = 2),1) '
    		+' WHERE `doctor_profiles`.`is_active` = 1 AND `doctor_profiles`.`is_live` = 1 '
    		+' ORDER BY `doctor_profiles`.`id` DESC '
    	+' ) '
    		+' UNION '
    	+' ( '
    		+' SELECT `hospitals`.`id` AS keyy, `hospital_details`.`hospital_name` AS `title`, `hospitals`.`hospital_logo` AS image, `hospital_details`.`languageId` AS `langId`, "hospital" AS type '
    		+' FROM `hospitals` '
    		+' INNER JOIN `hospital_details` ON `hospital_details`.`hospitalId` = `hospitals`.`id` '
    		+' AND `hospital_details`.`hospital_name` LIKE ? '
    		+' AND `hospital_details`.`languageId` = IFNULL((SELECT `languageId` FROM `hospital_details` WHERE `hospitals`.`id` = `hospital_details`.`hospitalId` AND `languageId` = 2),1) '
    		+' WHERE `hospitals`.`is_active` = 1 AND `hospitals`.`is_live` = 1 '
    		+' ORDER BY `hospitals`.`id` DESC '
    	+' ) '
  			+' UNION '
    	+' ( '
    		+' SELECT `tags`.`id` AS keyy, `tag_details`.`title` AS `title`, NULL AS image, `tag_details`.`languageId` AS langId, "Specializations" AS type '
    		+' FROM `tags` '
		    +' INNER JOIN `tag_details` ON `tag_details`.`tagId` = `tags`.`id` '
		    +' AND `tag_details`.`title` LIKE ? '
		    +' AND `tag_details`.`languageId` = IFNULL((SELECT `languageId` FROM `tag_details` WHERE `tags`.`id` = `tag_details`.`tagId` AND `languageId` = 2), 1) '
		    +' WHERE `tags`.`tagtypeId` = 2 AND `tags`.`is_approved` = 1 AND `tags`.`is_active` = 1 '
		    +' ORDER BY `tags`.`id` DESC '
	    +' ) '
	+' ) `search_data` ORDER BY RAND() '
	+' LIMIT 20; ';

	let keyword = req.body.title.trim();
	models.sequelize.query(qry, { 
		replacements: [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`], 
		quote: false,
		type: models.sequelize.QueryTypes.SELECT
	}).then(function(data) {
		res.send({
			status: true,
			message: language.lang({
				key: "filderData",
				lang: req.lang
			}),
			data: data
		});

	})
})



router.post('/doctorById', upload.array(), function (req, res) {
	Promise.resolve(patient_web.doctorById(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/practices', upload.array(), function (req, res) {
	Promise.resolve(patient_web.practices(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/feedbacks', upload.array(), function (req, res) {
	Promise.resolve(patient_web.feedbacks(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/articles', upload.array(), function (req, res) {
	Promise.resolve(patient_web.articles(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/hospitalById', upload.array(), function (req, res) {
	Promise.resolve(patient_web.hospitalById(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/searchlist', upload.array(), function (req, res) {
	Promise.resolve(patient_web.searchlist(req))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/chat-tags', upload.array(), function (req, res) {
	Promise.resolve(patient_web.chatTags(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/online-doctors', upload.array(), function (req, res) {
	Promise.resolve(patient_web.onlineDoctors(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/chat-consult', upload.array(), function (req, res) {
	Promise.resolve(patient_web.chatConsult(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/save-profile', (req, res) => {
	uploadFile(req, res, err => {
		if (err) {
			if (err.code === 'LIMIT_FILE_SIZE')
				err = language.lang({key:"Image size should less than 10 MB",lang: req.lang});
			res.send({
				status: false,
				errors: [{path: 'user_image', message: err}],
			});
		} else {
			if (req.file) req.body.user_image = req.file.path;
			Promise.resolve(req.body)
			.then(patient_web.saveProfile)
			.then(result => res.send(result))
			.catch(console.log);
		}
	});
});

router.post('/feedback-list', upload.array(), function (req, res) {
	req.body.pageSize = req.app.locals.site.page;
	Promise.resolve(req.body)
	.then(patient_web.feedbackList)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/feedback-remove', upload.array(), function (req, res) {
	Promise.resolve(req.body)
	.then(patient_web.removeFeedback)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/article-list', upload.array(), function (req, res) {
	req.body.pageSize = 9;
	Promise.resolve(req.body)
	.then(patient_web.articleList)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/add-article-interest', upload.array(), function (req, res) {
	Promise.resolve(req.body)
	.then(patient_web.addArticleInterest)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/remove-article-interest', upload.array(), function (req, res) {
	Promise.resolve(req.body)
	.then(patient_web.removeArticleInterest)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/article', upload.array(), function (req, res) {
	Promise.resolve(req.body)
	.then(patient_web.article)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/top-articles', upload.array(), function (req, res) {
	Promise.resolve(req.body)
	.then(patient_web.topArticles)
	.then(result => res.send(result))
	.catch(console.log);
});


router.post('/author-articles', upload.array(), function (req, res) {
	Promise.resolve(req.body)
	.then(patient_web.authorArticles)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/doctors', upload.array(), function (req, res) {
	Promise.resolve(patient_web.doctors(req))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/hospitals', upload.array(), function (req, res) {
	Promise.resolve(patient_web.hospitals(req))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/timings', upload.array(), function (req, res) {
	Promise.resolve(patient_web.timings(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/hospital-timings', upload.array(), function (req, res) {
	Promise.resolve(patient_web.hospitalTimings(req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

/**
* @api {post} /patient-web/fitnesscenter-feedback Submit feedback for fitnesscenter
* @apiGroup FitnessCenter
* @apiParam {integer} fitnesscenterId required
* @apiParam {integer} patientId required
* @apiParam {integer} rating required
* @apiParam {string} feedback required
*/
router.post('/fitnesscenter-feedback', upload.array(), function (req, res) {
	Promise.resolve(req.body)
	.then(patient_web.fitnesscenterFeedback)
	.then(result => res.send(result))
	.catch(console.log);
});

/**
* @api {post} /patient-web/fitnesscenter-feedbacks?page=1 Get feedback list with pageination
* @apiGroup FitnessCenter
* @apiParam {integer} patientId required
*/
router.post('/fitnesscenter-feedbacks', upload.array(), function (req, res) {
	req.body.pageSize = req.app.locals.site.page;
	Promise.resolve(req.body)
	.then(patient_web.fitnesscenterFeedbacks)
	.then(result => res.send(result))
	.catch(console.log);
});

/**
* @api {post} /patient-web/ftc-feedback-remove Remove feedback
* @apiGroup FitnessCenter
* @apiParam {integer} id required
*/
router.post('/ftc-feedback-remove', upload.array(), function (req, res) {
	Promise.resolve(req.body)
	.then(patient_web.removeFtcFeedback)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/hhc-feedbacks', upload.array(), function (req, res) {
	req.body.pageSize = req.app.locals.site.page;
	Promise.resolve(req.body)
	.then(patient_web.hhcFeedbacks)
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/hhc-feedback-remove', upload.array(), function (req, res) {
	Promise.resolve(req.body)
	.then(patient_web.removeHhcFeedback)
	.then(result => res.send(result))
	.catch(console.log);
});

/**
 * @api {post} /patient-web/freeqa-spec Get spectialization tags mapped with problem type tags
 * @apiName Get spectialization tags mapped with problem type tags
 * @apiGroup Common Patient
 *
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/freeqa-spec', upload.array(), function (req, res) {
    let data = req.body;
    tag.freeqaSpec(data)
    .then(result => res.send(result))
    .catch(console.log);
});

/**
 * @api {post} /patient-web/prob-tags-by-spec Get problem type tags by specialization tag
 * @apiName Get problem type tags by specialization tag
 * @apiGroup Common Patient
 *
 * @apiParam {integer} specId SpecializationId required
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/prob-tags-by-spec', upload.array(), function (req, res) {
    let data = req.body;
    tag.probTagsBySpec(data)
    .then(result => res.send(result))
    .catch(console.log);
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
