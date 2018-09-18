var medical = require('../controllers/medical_records');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var mime = require('mime');
var upload = multer();
var fs = require('fs');
var auth = require('../config/auth');
var oauth = require('../config/oauth');
var async = require('async');
language = require('../controllers/language');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //var destFolder = tmpDir;
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
        
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            cb(language.lang({key:"Only image files are allowed!",lang:req.body.lang}), false);
        }else if(file.originalname==''){
            cb(language.lang({key:"Image is required!",lang:req.body.lang}), false);
        }else {
            cb(null, true);
        }
    },
    limits: {fileSize: 10000000}
}).any();



/**
 * @api {post} /medical_records/create Create medical records
 * @apiName create
 * @apiGroup Medical
 *
 * @apiParam {integer} patientId required
 * @apiParam {Date} date required yyyy-mm-dd
 * @apiParam {integer} medical_record_type required
 * @apiParam {String} img required
 * @apiParam {integer} langId required
 * @apiParam {String} title required
 * @apiParam {String} lang required
 *
 */
router.post('/create', oauth.oauth.authorise(), function (req, res) {
    uploadFile(req, res, function (err) {
        errors=[];
        console.log(err);
          if (err) {
            
              if (err.code === 'LIMIT_FILE_SIZE') err = language.lang({key:"Image size should less than 10 MB",lang:req.body.lang});
              return res.send({status: false,errors:[{path:'img',message:err}], message: err, data: []});
          }
          var data = req.body;
          if(typeof req.body.data !== 'undefined'){
              data = JSON.parse(req.body.data);
          }
          count=1;
    async.forEach(req.files, function (up_files, callback) {
        if (up_files.path !=='') {
          data[up_files.fieldname] = up_files.path;
        }
        if (req.files.length == count) {
            callback(req.body);
          }
          count++;
      }, function () {
        medical.save(data, function(result){
              res.send(result);
          });
      });
});
});



/**
 * @api {post} /medical_records/getById Get medical record by Id
 * @apiName getById
 * @apiGroup Medical
 *
 * @apiParam {integer} id required here id is medical record id
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post('/getById', oauth.oauth.authorise(), function (req, res) {
  
          var data = req.body;
          if(typeof req.body.data !== 'undefined'){
              data = JSON.parse(req.body.data);
          }
        medical.getById(data, function(result){
              res.send(result);
          });
});


/**
 * @api {post} /medical_records Get medical records
 * @apiName medical_records
 * @apiGroup Medical
 *
 * @apiParam {integer} patientId required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
 *
 */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {

   
          medical.list(req, function(result){
              res.send(result);
});
});
/**
 * @api {post} /medical_records/delete Delete records
 * @apiName delete
 * @apiGroup Medical
 *
 * @apiParam {integer} id required here id is medical_record_id
 * @apiParam {String} lang required
 *
 */
router.post('/delete', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
   
    medical.delete(data, function(result){
        res.send(result);
});
});
/**
 * @api {post} /medical_records/deleteItem Delete records items
 * @apiName deleteItem
 * @apiGroup Medical
 *
 * @apiParam {integer} id required here id is medical record item
 * @apiParam {String} lang required
 *
 */
router.post('/deleteItem', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
   
    medical.deleteItem(data, function(result){
        res.send(result);
});
});
router.use(oauth.oauth.errorHandler());
module.exports = router;
