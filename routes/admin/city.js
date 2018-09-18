var city = require('../../controllers/city');
var state = require('../../controllers/state');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer();
var oauth = require('../../config/oauth');
var auth = require('../../config/auth');
var NodeGeocoder = require('node-geocoder')
/* GET  */
router.post('/', oauth.oauth.authorise(), upload.array(), function (req, res) {
    req.roleAccess = {model:'city', action:'view'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            city.list(req, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});



/**
 * @api {post} /admin/city/cityList get city list
 * @apiName cityList
 * @apiGroup City
 * @apiParam {String} title required
 * @apiParam {integer} page required
 * 
 */
router.post('/cityList', oauth.oauth.authorise(), upload.array(), function (req, res) {
    //req.roleAccess = {model:'city', action:'view'};
    //auth.checkPermissions(req, function(isPermission){
       // if (isPermission.status === true) {
            city.cityList(req, function(result){
                res.send(result);
            });
       // } else {
        //    res.send(isPermission);
        //}
   // });
});

/* save  */
router.post('/save', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
    }
    
    //req.roleAccess = {model:'city', action:'add'};
    //auth.checkPermissions(req, function(isPermission){
    //if (isPermission.status === true) {

        var options = {
            provider: 'google',
           
            // Optional depending on the providers
            httpAdapter: 'https', // Default
            apiKey: 'AIzaSyAlNp9k6nA5z03BiEYi9djp3yZpMg5asVk', // for Mapquest, OpenCage, Google Premier
            formatter: null         // 'gpx', 'string', ...
          };
            var geocoder = NodeGeocoder(options);      
            if(data.stateId==null){
              data.stateId='';  
            }
             if(data.countryId==null){
              data.countryId='';  
            }
            if(data.stateId!='' && data.stateId!=null && data.countryId!='' && data.countryId!=null) {    
                state.getById({id:data.stateId}, function(stateResult){
                    geocoder.geocode(stateResult.country.countrydetails[0].name+','+stateResult.statedetails[0].name+','+data.city_detail.name, function(err, response) {
                       if(response.length>0){
                        data.latitude = response[0].latitude || '';
                        data.longitude = response[0].longitude || '';
                       }
                    city.save(data, function(result){ 
                        res.send(result);
                    })
                })  
            });
        }else{
            city.save(data, function(result){ 
                        res.send(result);
                    })
        }


          /*  city.save(data, function(result){
                res.send(result);
            });*/
        //} else {
        //    res.send(isPermission);
       // }
   // });
});

/* add */
router.post('/add', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    req.roleAccess = {model:'city', action:'add'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            city.getMetaInformations(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* edit  */
router.post('/edit/:id', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    req.roleAccess = {model:'city', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            city.getById(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/*
Update for React-Redux admin
*/
router.post('/edit', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
    if(typeof req.body.data !== 'undefined'){
        data = JSON.parse(req.body.data);
    }
    req.roleAccess = {model:'city', action:'edit'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            city.getEditData(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* status  */
router.post('/status/:id/:status', oauth.oauth.authorise(), upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    data.id = req.params.id;
    data.is_active = req.params.status;
    req.roleAccess = {model:'city', action:'status'};
    auth.checkPermissions(req, function(isPermission){
        if (isPermission.status === true) {
            city.status(data, function(result){
                res.send(result);
            });
        } else {
            res.send(isPermission);
        }
    });
});

/* city list by state id  */
router.post('/listByStateId', upload.array(), function (req, res) {
    var data = req.body;
	if(typeof req.body.data !== 'undefined'){
		data = JSON.parse(req.body.data);
	}
    city.getAllCity(data, function(result){
        res.send(result);
    });
});

/* city list by state id  */
router.post('/getAllCityAtOnce', upload.array(), function (req, res) {
    console.log("called");
    var data = req.body;
  	if(typeof req.body.data !== 'undefined'){
  		data = JSON.parse(req.body.data);
  	}
    city.getAllCityAtOnce(data, function(result){
        res.send(result);
    });
});

router.use(oauth.oauth.errorHandler());
module.exports = router;
