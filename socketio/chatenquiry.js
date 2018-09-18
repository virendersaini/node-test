'use strict';

const models = require('../models'),
	notification = require('../controllers/notification'),
	language = require('../controllers/language');

models.onlineuser.addScope('chatenquiry', {where: {type: 1}});
models.healthcareprofile.belongsTo(models.user);

const nothing = (() => undefined),
	onlineuser = models.onlineuser.scope('chatenquiry');


function sendMessage(message) {
	return Promise.all([
		models.patient.find({
			where: this.user.user_type === 'Patient' ? {userId: this.user.id} :
				{id: message.patientId},
			attributes: ['id', 'userId'],
		}),
		models.healthcareprofile.find({
			where: this.user.user_type === 'Patient' ? {id: message.healthcareprofileId}  : 
				{userId: this.user.id},
			attributes: ['id', 'userId'],
		}),
	])
		.then(([patient, healthcareprofile]) => Promise.all([
			models.healthcarechatmessage.create({
				patientId: patient.id,
				healthcareprofileId: healthcareprofile.id,
				status: 1,
				sender: this.user.user_type === 'Patient' ? 1 : 0,
				type: message.type,
				data: message.data,
			}),
			onlineuser.findAll({
				where: {
					socket: {$ne: this.id},
					userId: this.user.id,
				},
				attributes: ['socket'],
			}),
			onlineuser.findAll({
				where: {
					userId: this.user.user_type === 'Patient' ?
						healthcareprofile.userId : patient.userId,
				},
				attributes: ['socket'],
			}),
		]))
		.then(([healthcarechatmessage, senders, receivers]) => {
			let data = healthcarechatmessage.toJSON();
			this.emit('message-sent', {
				status: true,
				uid: message.uid,
				id: data.id,
			});
			for (let i = senders.length - 1; i >= 0; i--)
				this.to(senders[i].socket).emit('my-message', data);
			for (let i = receivers.length - 1; i >= 0; i--)
				this.to(receivers[i].socket).emit('message', data);
			if (receivers.length === 0)
				sendNotification(data);
		})
		.catch(error => this.emit({status: false, error: error}));
}

function messageSeen(messageId, cb = nothing) {
	models.healthcarechatmessage.findById(messageId, {
		include: [
			{
				model: models.patient,
				attributes: ['userId'],
			},
			{
				model: models.healthcareprofile,
				attributes: ['userId'],
			}
		]
	})
		.then(healthcarechatmessage => {
			let accessDenied = healthcarechatmessage === null ||
				!((this.user.user_type === 'Patient' &&
					this.user.id === healthcarechatmessage.patient.userId) ||
				(this.user.user_type === 'home_healthcare' &&
					this.user.id === healthcarechatmessage.healthcareprofile.userId));
			if (accessDenied) throw 'ACCESS_DENIED';
			if (healthcarechatmessage.status >= 3) return;
			healthcarechatmessage.status = 3;
			return healthcarechatmessage
				.save()
				.then(() => onlineuser.findAll({
					where: {
						userId: this.user.user_type === 'Patient' ?
							healthcarechatmessage.healthcareprofile.userId :
							healthcarechatmessage.patient.userId
					},
					attributes: ['socket'],
				}))
				.then(onlineusers => {
					for (let i = onlineusers.length - 1; i >= 0; i--)
						this.to(onlineusers[i].socket).emit('seen', messageId);
					cb({status: true});
				});
		})
		.catch(cb);
}

function messageReceived(messageId, cb = nothing) {
	models.healthcarechatmessage.findById(messageId, {
		include: [
			{
				model: models.patient,
				attributes: ['userId'],
			},
			{
				model: models.healthcareprofile,
				attributes: ['userId'],
			}
		]
	})
		.then(healthcarechatmessage => {
			let accessDenied = healthcarechatmessage === null ||
				!((this.user.user_type === 'Patient' &&
					this.user.id === healthcarechatmessage.patient.userId) ||
				(this.user.user_type === 'home_healthcare' &&
					this.user.id === healthcarechatmessage.healthcareprofile.userId));
			if (accessDenied) throw 'ACCESS_DENIED';
			if (healthcarechatmessage.status >= 2) return;
			healthcarechatmessage.status = 2;
			return healthcarechatmessage
				.save()
				.then(() => onlineuser.findAll({
					where: {
						userId: this.user.user_type === 'Patient' ?
							healthcarechatmessage.healthcareprofile.userId :
							healthcarechatmessage.patient.userId
					},
					attributes: ['socket'],
				}))
				.then(onlineusers => {
					for (let i = onlineusers.length - 1; i >= 0; i--)
						this.to(onlineusers[i].socket).emit('received', messageId);
					cb({status: true});
				});
		})
		.catch(cb);
}

function sendNotification(message, senderId) {
	if (message.sender === 0) {
		Promise.all([
			models.patient.find({
				include: [
					{
						model: models.user,
						include: [
							{
								model: models.userdetail,
								where: language.buildLanguageQuery(
									null,
									1,
									'`user`.`id`',
									models.userdetail,
									'userId'
								),
								attributes: ['fullname'],
							},
						],
						where: {
							is_notification: 1,
						},
						attributes: ['device_id'],
					},
				],
				where: {
					id: message.patientId,
				},
				attributes: ['id', 'is_chat_notification'],
			}),
			models.healthcarechatmessage.count({
				where: {
					sender: 0,
					status: [1, 2],
					deleted: [0, 1],
					patientId: message.patientId,
					healthcareprofileId: message.healthcareprofileId,
				},
			}),
		])
			.then(([patient, unread]) => {
				if (patient && patient.user && patient.user.device_id && patient.is_chat_notification)
					notification.sendWithoutSaving(
						[patient.user.device_id],
						'front/notification/chat/chatenquiry',
						{
							message,
							senderName: patient.user.userdetails[0].fullname,
						},
						{
							data: {
								unread,
								senderId,
								type: 'chatenquiry-message',
							},
							notification: {
								badge: unread,
								tag: `wikicare-chatenquiry-${message.healthcareprofileId}`,
							},
							collapse_key: `wikicare-chatenquiry-${message.healthcareprofileId}`,
						}
					)
					.then(console.log)
					.catch(console.log);
			});
	} else {
		Promise.all([
			models.healthcareprofile.find({
				include: [
					{
						model: models.user,
						where: {
							is_notification: 1,
						},
						attributes: ['device_id'],
					},
					{
						model: models.healthcareprofiledetail,
						where: language.buildLanguageQuery(
							null,
							1,
							'`doctorprofile`.`id`',
							models.doctorprofiledetail,
							'doctorprofileId'
						),
						attributes: ['name'],
					},
				],
				where: {
					id: message.healthcareprofileId,
				},
			}),
			models.healthcarechatmessage.count({
				where: {
					sender: 1,
					status: [1, 2],
					deleted: [0, 2],
					patientId: message.patientId,
					healthcareprofileId: message.healthcareprofileId,
				},
			}),
		])
			.then(([healthcareprofile, unread]) => {
				if (healthcareprofile && healthcareprofile.user && healthcareprofile.user.device_id)
					notification.sendWithoutSaving(
						[healthcareprofile.user.device_id],
						'front/notification/chat/chatenquiry',
						{
							message,
							senderName: healthcareprofile.healthcareprofiledetails[0].name,
						},
						{
							data: {
								unread,
								senderId,
								type: 'chatenquiry-message',
							},
							notification: {
								badge: unread,
								tag: `wikicare-chatenquiry-${message.patientId}`,
							},
							collapse_key: `wikicare-chatenquiry-${message.patientId}`,
						}
					)
						.then(console.log)
						.catch(console.log);
			})
	}
}

function disconnect() {
	onlineuser.destroy({where: {socket: this.id}});
}

module.exports = (socket, next) => {
	socket.user = socket.request.user;
	if (!socket.user || !(socket.user.user_type === 'Patient' || socket.user.user_type === 'home_healthcare'))
		return next();
	models.onlineuser.create({
		type: 1,
		socket: socket.id,
		userId: socket.request.user.id,
	})
		.then(() => {
			socket.on('seen', messageSeen);
			socket.on('received', messageReceived);
			socket.on('send-message', sendMessage);
			socket.on('disconnect', disconnect);
			next();
		});
};
