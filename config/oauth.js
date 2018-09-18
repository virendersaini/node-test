var express = require('express');
var oauthserver = require('oauth2-server');
var app = express();

app.oauth = oauthserver({
    model: require('../controllers/oauth'),
    grants: ['password', 'refresh_token'],
    debug: true
});

// Error handling
app.use(app.oauth.errorHandler());


module.exports = app;
