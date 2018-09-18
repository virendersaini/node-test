'use strict';

const gcm = require('node-gcm'),
config = require('../config/config')[process.env.NODE_ENV || 'development'],
language = require('./language'),
models = require('../models');

const sender = new gcm.Sender(config.notificationApiKey);

const defaultMessage = {
	priority: 'high',
	contentAvailable: true,
	delayWhileIdle: true,
	timeToLive: 3
},
defaultNotification = {
	title: 'Wikicare',
	icon: 'ic_launcher',
	sound: 'default',
	aps: {"sound": "default" },
};

const render = (template, data) => new Promise((resolve, reject) => {
	wikicare_app.render(
		template,
		language.bindLocale(data, data.lang || 'en'),
		(err, result) => {
			if (err)
				reject(err);
			else
				resolve(result)
		}
	);
});

exports.send = function (to, template, data, message = {}) {
	//to = [{id:1, device_id:'dek76zbjOOc:APA91bHtzMkR27WwOz-_0kdJeXE5bVaJrjKAosIXROLqOkaNzwwo__werHandLOeZ7t8NJz3aMWJszAEcXTBE7rABb5jLmb-CFkRmczD8TJ3TvssCX9UwHjv6ZIAJsQkKazAKc0t1Z8e'}];
	message.notification = Object.assign(message.notification || {}, defaultNotification);
	
	module.exports.unreadCount({receiverId: to[0].id}, function(unreadCount) {
		if(unreadCount.data.count > 0) { message.notification.badge = unreadCount.data.count; }

		var recipients = {
			registrationTokens: to.filter(x => x.is_notification && !!x.device_id).map(x => x.device_id)
		};

		return render(template, data)
		.then(result => saveNotification({to, message:result, data:message}))
		.then(notification => {
			return new Promise((resolve, reject) => {
				if(!notification || recipients.registrationTokens.length == 0)
					return resolve(true);
				message.data.notificationId = notification.id;
				message.notification.body = notification.message;
				Object.assign(message, defaultMessage);
				var msg = new gcm.Message(message);
				sender.send(msg, recipients, 3, (err, response) => {
					if (err)
						reject(err);
					else
						resolve(response);
				});
			})
		});
	})
};

exports.sendWithoutSaving = function (to, template, data, message = {}) {
	message.notification = Object.assign(message.notification || {}, defaultNotification);
	const recipients = {registrationTokens: to};

	return render(template, data)
	.then(result => {
		return new Promise((resolve, reject) => {
			message.notification.body = result;
			Object.assign(message, defaultMessage);

			sender.send(new gcm.Message(message), recipients, 3, (err, response) => {
				if (err)
					reject(err);
				else
					resolve(response);
			});
		});
	});
};

const saveNotification = function(data){
	let storeData = {},
		meta = data.data.meta || {};
	storeData.senderId = data.data.senderId;
	storeData.type = data.data.data.type;
	storeData.message = data.message;
	storeData.meta = JSON.stringify(meta);
	let receivers =[];
	data.to.forEach(function(item){
		if(item.id){
			let obj = {};
			obj.receiverId = item.id;
			obj.status = 0;
			receivers.push(obj);
		}
	});
	storeData.receivers = receivers;
	let receiversData = models.notification.hasMany(models.notificationreceiver, {as: 'receivers'});
	if(receivers.length > 0){
		return models.notification.create(storeData,{include: [receiversData]});
	} else {
		return false;
	}
};

exports.list = function (req, res) {
	var setPage = req.app.locals.site.page;
	var currentPage = 1;
	var pag = 1;
	if (typeof req.query.page !== 'undefined') {
		currentPage = +req.query.page;
		pag = (currentPage - 1)* setPage;
		delete req.query.page;
	} else {
		pag = 0;
	}
	var reqData = req.body;
	if(typeof req.body.data !== 'undefined'){
		reqData = JSON.parse(req.body.data);
	}
	models.notificationreceiver.belongsTo(models.notification);
	models.notification.belongsTo(models.user, {foreignKey:'senderId'});
	models.user.hasMany(models.userdetail);
	Promise.all([
		models.notificationreceiver.findAndCountAll({
			include: [
				{
					model: models.notification,
					attributes:['type', 'message', 'meta', 'createdAt'],
					include:[{
						model:models.user,
						attributes:['id'],
						include:[{
							model:models.userdetail,
							attributes:['fullname']
						}]
					}]
				}
			],
			where: {
				receiverId:reqData.userId,
				status: {$in:[0, 1]}
			},
			order: [
				['id', 'DESC']
			],
			distinct: true,
			limit: setPage,
			offset: pag, 
			//subQuery: false
		}),
		models.notificationreceiver.count({
			where: {
				receiverId:reqData.userId,
				status: 0
			}
		})
	]).then(([result, unread_count]) => ({
		totalData: result.count,
		pageCount: Math.ceil(result.count / setPage),
		pageLimit: setPage, 
		currentPage:currentPage, 
		status: true,
		message: language.lang({key: 'Notification List', lang: reqData.lang}),
		data: result.rows,
		unread_count
	}))
	.then(res);
};

/*
   *Notification status update
*/
exports.notificationStatus = function(req, res) {

	if(req.notificationId){
		req.notificationId = req.notificationId.split(',');
	}
	models.notificationreceiver.update(
		{
			status:req.notification_status
		},
		{
			where:{
				notificationId:{$in:req.notificationId},
				receiverId:req.receiverId
			}
		}
	)
	.then(function(data){
		models.notificationreceiver.count({
			where: {
				receiverId:req.receiverId,
				status: 0
			}
		}).then(unread_count => {
			res({
				status:true,
				message:language.lang({key:"updatedSuccessfully", lang:req.lang}),
				data:{notification:req.is_notification},
				unread_count
			});
		});
	}).catch(() => {
		res({status: false, message:language.lang({key:"Internal Error", lang:req.lang})})
	});
};

exports.unreadCount = function(req, res) {
	models.notificationreceiver.count({
		where: {
			receiverId:req.receiverId,
			status: 0
		}
	}).then(count => {
		res({status: true, data:{count}});
	}).catch(() => {
		res({status: false, message:language.lang({key:"Error", lang:req.lang})});
	});
};