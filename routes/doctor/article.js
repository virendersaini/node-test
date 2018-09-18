var article = require('../../controllers/articles');
var models = require('../../models');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var async = require('async');
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var path = require('path');
language = require('../../controllers/language');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var destFolder = 'public/uploads/';
        if (!fs.existsSync(destFolder+file.fieldname)) {
            fs.mkdirSync(destFolder+file.fieldname);
        }
        cb(null, destFolder);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname+'/'+Date.now() + '.' + mime.extension(file.mimetype));
    }
});
var uploadFile = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            cb(language.lang({key:"Only image files are allowed!",lang:req.body.lang}), false);
        } else {
            cb(null, true);
        }
    },
    limits: {fileSize: 10000000}
}).any();

/* GET list of doctor articles */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    article.getArticles(req, function (result) {
        res.send(result);
    });
});

router.post('/add', oauth.oauth.authorise(), upload.array(), function (req, res) {
    article.getMetaDataForAdd(req, function (result) {
        res.send(result);
    });
});

router.post('/edit/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    data.id = req.params.id;
    console.log(data)
    article.getById(data, function(result){
        res.send(result);
    });
});


router.post('/save', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE')
                err = language.lang({key:"Image size should less than 10 MB",lang:req.body.lang});
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if (typeof req.body.data !== 'undefined') {
                data = JSON.parse(req.body.data);
            }

            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !== '') {
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                if("undefined" === typeof data.article_image && data.id == '') data.article_image = '';
                article.doctorSave(data, function (result) {
                    res.send(result);
                })
            });
        }
    })
})

/**
 * @api {post} /doctor/article/get-list Get articles list
 * @apiName article list api for doctor app
 * @apiGroup Doctor
 *
 * @apiParam {integer} doctorProfileId required doctorProfileId
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 * @apiParam {String} patientId (required for patient app)
 * @apiParam {integer} pageNo page number for pagination (optional)
 * @apiParam {integer} limit data limit (optional)
 *
 */
router.post('/get-list', oauth.oauth.authorise(), upload.array(), function (req, res) {
    article.articleListForDocApp(req, function (result) {
        res.send(result);
    });
});

/**
 * @api {post} /doctor/article/get-detail Get article detail
 * @apiName article detail api for doctor app
 * @apiGroup Doctor
 *
 * @apiParam {integer} id required Article ID
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post('/get-detail', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    article.articleDetailForDocApp(data, function (result) {
        res.send(result);
    });
});

/**
 * @api {post} /doctor/article/save-article save/update article
 * @apiName save article api for doctor app
 * @apiGroup Doctor
 *
 * @apiParam {integer} id Article ID(required in case of update, otherwise send blank value)
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 * @apiParam {Array} article_tags required
 * @apiParam {String} title required
 * @apiParam {String} article_body required
 * @apiParam {String} keyId required doctorProfileId
 * @apiParam {File} article_image required 
 * @apiParam {integer} status required(0 - Publish, 3 - Draft)
 *
 */
router.post('/save-article', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE')
                err = language.lang({key:"Image size should less than 10 MB",lang:req.body.lang});
            res.send({status: false, message: err, data: []});
        } else {
            var data = req.body;
            if (typeof req.body.data !== 'undefined') {
                data = JSON.parse(req.body.data);
            }

            var count = 1;
            async.forEach(req.files, function (up_files, callback) {
                if (up_files.path !== '') {
                    data[up_files.fieldname] = up_files.path;
                }
                if (req.files.length == count) {
                    callback(req.body);
                }
                count++;
            }, function () {
                if("undefined" === typeof data.article_image && data.id == '') data.article_image = '';
                article.doctorSaveApp(data, function (result) {
                    res.send(result);
                })
            });
        }
    })
})

/**
 * @api {post} /doctor/article/publish publish article
 * @apiName publish article api for doctor app
 * @apiGroup Doctor
 *
 * @apiParam {integer} id Article ID required
 * @apiParam {integer} doctorProfileId required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post('/publish', oauth.oauth.authorise(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    article.publish(data, function (result) {
        res.send(result);
    })
})

/**
 * @api {post} /doctor/article/remove remove draft article
 * @apiName remove draft article api for doctor app
 * @apiGroup Doctor
 *
 * @apiParam {integer} id Article ID required
 * @apiParam {integer} doctorProfileId required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post('/remove', oauth.oauth.authorise(), function (req, res) {
    var data = req.body;
    if (typeof req.body.data !== 'undefined') {
        data = JSON.parse(req.body.data);
    }
    article.remove(data, function (result) {
        res.send(result);
    })
})

router.use(oauth.oauth.errorHandler());
module.exports = router;