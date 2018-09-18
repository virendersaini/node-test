var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var notification = require('../../controllers/notification');

/**
 * @api {post} /admin/notification?page=1 Notification list
 * @apiName Notification list
 * @apiGroup Notification
 * @apiParam {integer} userId required
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/', upload.array(), oauth.oauth.authorise(), function (req, res) {
	notification.list(req, function(result){
		res.send(result);
	});
});

/**
 * @api {post} /admin/notification/setNotificationStatus Notification Change Status
 * @apiName Notification Change Status
 * @apiGroup Notification
 * @apiParam {string} notificationId required In case of multiple(ex: 1,2,3)
 * @apiParam {integer} receiverId required
 * @apiParam {integer} notification_status required 0=>Unread, 1=>Viewed, 2=>Hide
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/setNotificationStatus', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	notification.notificationStatus(data, function(result){
		res.send(result);
	});
});

/**
 * @api {post} /admin/notification/unread-count Notification unread count
 * @apiName Notification unread count
 * @apiGroup Notification
 * @apiParam {integer} receiverId required
 * @apiParam {integer} langId required
 * @apiParam {string} lang required
 */
router.post('/unread-count', oauth.oauth.authorise(), upload.array(), function (req, res) {
	var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
	notification.unreadCount(data, function(result){
		res.send(result);
	});
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
