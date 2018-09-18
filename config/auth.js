var language = require('../controllers/language');
var models = require('../models');
function Auth() {
    this.isAuthorise = function(req, res){
		var formdata = req.body;
		if(typeof req.body.data !== 'undefined'){
			formdata = JSON.parse(req.body.data);
		}
        var auth = req.headers.authorization;
        if(!auth) {
            res({status:false, message:language.lang({key:"accessDenied", lang:formdata.lang})});
        }else if(auth) {
            var tmp = auth.split(' ');   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
            var buf = new Buffer(tmp[1], 'base64'); // create a buffer and tell it the data coming in is base64
            var plain_auth = buf.toString();        // read it back out as a string
            // At this point plain_auth = "username:password"
            var creds = plain_auth.split(':');      // split on a ':'
            var username = creds[0];
            var password = creds[1];
            models.oauthclient.findOne({
                where: { client_id: username, client_secret: password },
                attributes: ['client_id', 'client_secret']
            }).then(function (data) {
                if(data) {   // Is the username/password correct?
                    res({status:true});
                }
                else {
                    res({status:false, message:language.lang({key:"accessDenied", lang:formdata.lang})});
                }
            });
        }
    };
    
    this.checkPermissions = function(req, res){

        var data = req.body;
        if(typeof req.body.data !== 'undefined'){
         data = JSON.parse(req.body.data);
        }
        var auth_token = req.headers.authorization;
        var token = auth_token.split(' ');
         if(!auth_token) {
            res({status:false, error:true, url:true, error_description:language.lang({key:"accessDenied", lang:data.lang})});
        }else if(auth_token) {
            models.oauthaccesstoken.findOne({include: [{model:models.user, attributes:['roleId'], row:true}], where:{access_token:token[1]}, attributes:['user_id'], row:true}).then(function(userData){
                if (userData.user.roleId !==0) {
                    models.permission.find({where:{model:req.roleAccess.model, action:req.roleAccess.action}}).then(function(result){
                        if (result !==null) {
                            models.rolepermission.find({where:{roleId:userData.user.roleId, permissionId:result.id}}).then(function(roleData){
                                if (roleData !==null) {
                                    res({status:true});
                                } else {
                                    res({status:false, error:true, url:true, error_description:language.lang({key:"accessDenied", lang:data.lang})});
                                }
                            });
                        } else {
                            res({status:false, error:true, url:true, error_description:language.lang({key:"wrongAction", lang:data.lang})});
                        }
                    });
                } else {
                    res({status:true});
                }
            });
        }
    };
}
module.exports = new Auth();
