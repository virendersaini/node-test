var oauth = require('../config/oauth');
var express = require('express');
var router = express.Router();
var oauthCont = require('../controllers/oauth');
// Handle token grant requests

const oauthGrant = oauth.oauth.grant();

router.all('/token', function(req, res, next){
	var end = res.end;
	res.end = function (...args) {
		var data = args[0];
		if(!(data instanceof Buffer)) return end.call(res, ...args);
		data = data.toString();
		try {
			data = JSON.parse(data);
		} catch(err) {
			return end.call(res, ...args);
		}
		if(data.code == 400) return end.call(res, ...args);
		data.deviceType = req.device.type.toUpperCase();
		oauthCont.updateDeviceType(data, function(){
			end.call(res, ...args);
		});
	};
	oauthGrant(req, res, next);
});

// Show them the "do you authorise xyz app to access your content?" page
router.get('/authorise', function (req, res) {
    if (!req.session.user) {
      // If they aren't logged in, send them to your own login implementation
      return res.redirect('/login?redirect=' + req.path + '&client_id=' + req.query.client_id + '&redirect_uri=' + req.query.redirect_uri);
    }
    res.render('authorise', { client_id: req.query.client_id, redirect_uri: req.query.redirect_uri});
});

router.use(oauth.oauth.errorHandler());
module.exports = router;