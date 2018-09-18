var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var device = require('express-device');

var fs = require('fs');

//var index = require('./routes/index');
//var users = require('./routes/users');
/*
*
*  mongo DB connection
*
*/
var mongoDB = require('./config/mongo_config');
mongoDB.connect('mongodb://localhost:27017', function(err) {
  if (err) {
    console.log('Unable to connect to Mongo.')
    process.exit(1)
  }
})
/*
*  End of mongo DB connection
*/


var app = express();
var cors = require('cors')

app.use(cors())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(device.capture());
global.image_url = 'http://192.168.100.179/wikicare-service/';

//app.use('/', index);
//app.use('/users', users);

app.locals.site = {
  page: 25
};

app.use(function(err, req, res, next) {
  console.log(req);
});

/*
 * "express-load-routes" user for load routes
 */
require('express-load-routes')(app);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log(err);

  // render the error page
  res.status(err.status || 500);
  res.send({status:false, error: true, error_description: 'Internal Error', url: true});
});


//console.log(result);

tmpDir = '/tmp/pateast-virener/'; try {   fs.accessSync('public/uploads') } catch(err) {   fs.mkdirSync('public/uploads'); } try {   fs.accessSync(tmpDir) } catch(err) {   fs.mkdirSync(tmpDir); }

module.exports = app;
