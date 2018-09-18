const models = require('../models');
models.oauthaccesstoken.belongsTo(models.user, {foreignKey: 'user_id'});

function myController(){

    this.getAccessToken = function (bearerToken, callback) {
        models.oauthaccesstoken.findOne({
            include: {model: models.user, attributes: ['id', 'user_type']},
            where: { access_token: bearerToken },
            attributes: ['access_token', 'client_id', 'expires', 'user_id']
        }).then(function (data) {
            if (!data)
                return callback(null, 0);
            var token = data.dataValues;
            callback(null, {
                accessToken: token.access_token,
                clientId: token.client_id,
                expires: token.expires,
                userId: token.user_id,
                user: token.user.toJSON(),
            });
        }).catch(function (error) {
            if (error)
                return callback(error);
        });
    };

    this.getClient = function (clientId, clientSecret, callback) {
        models.oauthclient.findOne({
            where: { client_id: clientId, client_secret: clientSecret },
            attributes: ['client_id', 'client_secret']
        }).then(function (data) {
            if (!data)
                return callback(null, 0);
            var client = data.dataValues;
            if (clientSecret !== null && client.client_secret !== clientSecret)
                return callback();
            // This object will be exposed in req.oauth.client
            callback(null, {
                clientId: client.client_id,
                clientSecret: client.client_secret
            });
        }).catch(function (error) {
            if (error)
                return callback(error);
        });
    };

    this.getRefreshToken = function (bearerToken, callback) {
        models.saverefreshtoken.findOne({
            where: {refresh_token: bearerToken},
            attributes: ['refresh_token', 'client_id', 'expires', 'user_id']
        }).then(function (data) {
            if (!data)
                return callback(null, 0);
            var token = data.dataValues;
            callback(null, {
                user: token,
                refreshToken: token.refresh_token,
                clientId: token.client_id,
                expires: token.expires,
                userId: token.user_id
            });
        }).catch(function (error) {
            if (error)
                return callback(error);
        });
    };

    // This will very much depend on your setup, I wouldn't advise doing anything exactly like this but
    // it gives an example of how to use the method to resrict certain grant types
    var authorizedClientIds = ['demo', 'def2'];
    this.grantTypeAllowed = function (clientId, grantType, callback) {
        if (grantType === 'password') {
            return callback(false, authorizedClientIds.indexOf(clientId.toLowerCase()) >= 0);
        }
        callback(false, true);
    };

    this.revokeRefreshToken = function (token, callback) {
        return models.saverefreshtoken.findOne({
            where: {refresh_token: token}
        }).then(function (rT) {
            if (rT)
               rT.destroy();
            /***
             * As per the discussion we need set older date
             * revokeToken will expected return a boolean in future version
             * https://github.com/oauthjs/node-oauth2-server/pull/274
             * https://github.com/oauthjs/node-oauth2-server/issues/290
             */
            var expiredToken = token;
            expiredToken.refreshTokenExpiresAt = new Date('2015-05-28T06:59:53.000Z');
            callback(null, expiredToken);
        }).catch(function (err) {
            console.log("revokeToken - Err: ", err);
        });
    };

    this.saveAccessToken = function (accessToken, clientId, expires, userId, callback) {
        if (typeof userId == 'object') {
           userId = userId.user_id;
        }
        models.oauthaccesstoken.create({
            access_token: accessToken,
            client_id: clientId,
            user_id: userId,
            expires: expires
        }).then(function () {
            callback(null, true);
        }).catch(function (error) {
            return callback(error);
        });
    };

    this.saveRefreshToken = function (refreshToken, clientId, expires, userId, callback) {
         if (typeof userId == 'object') {
           userId = userId.user_id;
        }
        models.saverefreshtoken.create({
            refresh_token: refreshToken,
            client_id: clientId,
            user_id: userId,
            expires: expires
        }).then(function () {
            callback(null, true);
        }).catch(function (error) {
            return callback(error);
        });
    };

    /*
     * Required to support password grant type
     */
    this.getUser = function (username, password, callback) {
        models.user.findOne({
            where: {
                user_name: username,
                password: password
            },
            attributes: ['id', 'email', 'user_name', 'password']
        }).then(function (data) {
            if (!data)
                return callback(null, 0);
            var user = data.dataValues;
            // This object will be exposed in req.oauth.client
            callback(null, user.id);
        }).catch(function (error) {
            if (error)
                return callback(error);
        });
    };
    
    this.removeToken = function(req, res){
        models.oauthaccesstoken.destroy({where:{user_id:req.id}}).then(function(){
            models.saverefreshtoken.destroy({where:{user_id:req.id}}).then(function(){
                res();
            });
        });
    };

    this.updateDeviceType = function(req, res){
    	Promise.all([
    		models.oauthaccesstoken.update({
    			device_type:req.deviceType
    		},{
    			where:{
    				access_token:req.access_token
    			}
    		}),
    		models.saverefreshtoken.update({
    			device_type:req.deviceType
    		},{
    			where:{
    				refresh_token:req.refresh_token
    			}
    		}),
    		models.oauthaccesstoken.find({
    			where:{
    				access_token:req.access_token	
    			}
    		})
    	]).then(function(result){
    		if(req.deviceType != 'DESKTOP'){
		        Promise.all([
		        	models.oauthaccesstoken.destroy({
	    				where:{
	    					user_id:result[2].user_id,
	    					device_type:{$ne:'DESKTOP'},
	    					access_token:{$ne:req.access_token}
	    				}
	    			}),
	    			models.saverefreshtoken.destroy({
		            	where:{
		            		user_id:result[2].user_id,
    						device_type:{$ne:'DESKTOP'},
    						refresh_token:{$ne:req.refresh_token}
		            	}
		            })
		        ]).then(function(){
		        	res();
		        })
    		} else {
    			res();
    		}
    	});
    };

}
module.exports = new myController();
