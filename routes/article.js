var article = require('../controllers/articles');
var models = require('../models');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var async = require('async');
var oauth = require('../config/oauth');
var auth = require('../config/auth');
var path = require('path');
language = require('../controllers/language');
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
            cb(language.lang({key:"Only image files are allowed!",lang:req.lang}), false);
        } else {
            cb(null, true);
        }
    },
    limits: {fileSize: 1000000}
}).any();

/**
 * @api {post} /article/detail Get article detail
 * @apiName Article View
 * @apiGroup Article
 *
 * @apiParam {integer} id required here id is article id
 * @apiParam {integer} userId required userId
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post('/detail', oauth.oauth.authorise(), upload.array(), function (req, res) {
    article.getDetail(req, function (result) {
        res.send(result);
    });
});

/**
 * @api {post} /article/list Get articles list
 * @apiName list
 * @apiGroup Article
 *
 * @apiParam {integer} id required userId
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 * @apiParam {integer} pageNo page number for pagination (optional)
 * @apiParam {integer} limit data limit (optional)
 * @apiParam {integer} doctor_id (optional)
 *
 */
router.post('/list', oauth.oauth.authorise(), upload.array(), function (req, res) {
    article.getList(req, function (result) {
        res.send(result);
    });
});



/**
 * @api {post} /article/most_like_article Most liked article
 * @apiName most_like_article
 * @apiGroup Article
 * @apiParam {integer} langId required 
 * @apiParam {integer} patientId required
 */
router.post('/most_like_article', oauth.oauth.authorise(),upload.array(), function (req, res) {
  
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
      data = JSON.parse(req.body.data);
    }
    article.most_like_article(data, function(result) {
        res.send(result);
    })

})

/**
 * @api {post} /article/starred-action Mark/unmark article as starred
 * @apiName Starred action
 * @apiGroup Article
 *
 * @apiParam {integer} userId required
 * @apiParam {integer} favourite required (true/false)
 * @apiParam {integer} articleId required
 * @apiSuccess {String} status true.
 * @apiSuccess {String} message  Updated succesfully.
 */
router.post('/starred-action', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    article.markStarred(data, function (result) {
        res.send(result);
    });
});



/**
 * @api {post} /article/like Like Unlike article
 * @apiName like
 * @apiGroup Article
 *
 * @apiParam {integer} userId required
 * @apiParam {integer} articleId required
 * @apiSuccess {String} status true.
 * @apiSuccess {String} message  Updated succesfully.
 */
router.post('/like', upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    article.like(data, function (result) {
        res.send(result);
    });
});



/**
 * @api {post} /article/starred-articles Get list of starred articles
 * @apiName Starred articles list
 * @apiGroup Article
 *
 * @apiParam {integer} userId required
 * @apiParam {integer} langId required
 * @apiParam {integer} lang required
 * @apiParam {integer} pageNo page number for pagination (optional)
 * @apiParam {integer} limit data limit (optional)
 *
 * @apiSuccess {String} status true.
 * @apiSuccess {String} message String.
 * @apiSuccess {String} data An array of articles.
 */
router.post('/starred-articles', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    article.getAtarredArticles(data, function (result) {
        res.send(result);
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;