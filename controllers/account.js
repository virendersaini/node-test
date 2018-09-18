const models = require('../models'),
	bcrypt = require('bcrypt-nodejs'),
	language = require('./language'),
	otpmessage = require('./otpmessage'),
	mail = require('./mail');

exports.save = req => {
	return Promise.all([
		models.user.build({
			id: req.id,
			email: req.email,
			mobile: req.mobile,
		})
		.validate(),
		models.userdetail.build({
			fullname: req.name,
		})
		.validate(),
	])
	.then(err => {
		if (err[0]) {
			if (err[1]) {
				return err[0].errors.concat(err[1].errors)
			} else {
				return err[0].errors;
			}
		} else if (err[1]) {
			return err[1].errors;
		} else {
			return [];
		}
	})
	.then(errors => {
		if (errors.length !== 0)
			return new Promise(resolve => {
				language.errors(
					{errors, lang: req.lang},
					errors => resolve({status: false, errors})
				);
			});
		return Promise.all([
			models.user.update(
				{
					email: req.email,
					mobile: req.mobile,
					default_lang: req.default_lang
				},
				{
					where: {id: req.id},
					validate: false,
				}
			),
			models.userdetail.find({
				where: {
					languageId: req.langId,
					userId: req.id,
				}
			})
			.then(userdetail => {
				if (userdetail) {
					userdetail.fullname = req.name;
					return userdetail.save();
				} else {
					let userdetailData = {};
					//delete userdetailData.id;
					userdetailData.languageId = req.langId;
					userdetailData.fullname = req.name;
					userdetailData.userId = req.id;
					return models.userdetail.create(userdetailData);
				}
			})
		])
		.then(() => ({
			status: true,
			data: {
				name: req.name,
				email: req.email,
				mobile: req.mobile,
				default_lang: req.default_lang
			},
			message: language.lang({key:"updatedSuccessfully",lang:req.lang})
		}))
	});
};

exports.changePassword = req => {
	return models.user.build({
		id: req.id,
		//curr_password: req.curr_password,
		new_password: req.new_password,
		confirm_new_password: req.confirm_new_password,
	})
	.validate()
	.then(err => {
		if (err !== null)
			return new Promise(resolve => {
				language.errors(
					{errors: err.errors, lang: req.lang},
					errors => resolve({status: false, errors})
				);
			});
		return models.user.update(
			{
				password: bcrypt.hashSync(req.new_password, null, null)
			},
			{
				where: {id: req.id},
				validate: false,
			}
		)
		.then(() => ({
			status: true,
			message: language.lang({key:"updatedSuccessfully",lang:req.lang})
		}))
	});
};

exports.doctorAppSettings = req => {
	models.user.hasMany(models.userdetail)
	return models.doctorprofile.find({
		include: [
			{
				model: models.onlineconsultsetting,
				attributes: [
					'chat_notification',
					'freeqa_notification',
					'available_for_consult',
				],
			},
			{
				model: models.user,
				attributes: [
					'email',
					'mobile',
					'is_notification',
					'is_email_verified',
					'feedback_notification'
				],
				include: [{
					model: models.userdetail,
					attributes: ['fullname'],
					where: language.buildLanguageQuery(
						{},
						req.langId,
						'`user`.`id`',
						models.userdetail,
						'userId'
					)
				}]
			},
		],
		where: {
			id: req.doctorprofileId,
		},
		attributes: [],
	})
	.then(data => ({
		status: true,
		data,
		message: language.lang({key:"success",lang:req.lang}),
	}));
};

exports.doctorChangeNotificationSettings = req => {
	var notificationColumns = {available_for_consult: 'available_for_consult', freeqa_notification: 'freeqa_notification', chat_notification: 'chat_notification', feedback_notification: 'feedback_notification'}
	if(req.type === 'all') {
		return models.doctorprofile.find({attributes: ['userId'], where: {id: req.doctorprofileId}}).then(doctordata => {
			return models.user.update({feedback_notification: req.value, is_notification: req.value}, {where: {id: doctordata.userId}}).then(data => {
				return models.onlineconsultsetting.update({
					available_for_consult: req.value, 
					freeqa_notification: req.value, 
					chat_notification: req.value
				}, {where: {doctorprofileId: req.doctorprofileId}}).then(data => ({
					status: true,
					message: language.lang({key:"success",lang:req.lang})
				}))
			})
		})
	} else if(req.type === 'feedback_notification') {
		return models.doctorprofile.find({attributes: ['userId'], where: {id: req.doctorprofileId}}).then(doctordata => {
			return models.user.update({[notificationColumns[req.type]]: req.value}, {where: {id: doctordata.userId}}).then(data => ({
				status: true,
				message: language.lang({key:"success",lang:req.lang})
			}))
		})
	} else {
		return models.onlineconsultsetting.update({[notificationColumns[req.type]]: req.value}, {where: {doctorprofileId: req.doctorprofileId}}).then(data => ({
			status: true,
			message: language.lang({key:"success",lang:req.lang})
		}))
	}
};

exports.userdetail = req => {
	models.user.hasMany(models.userdetail);
	return models.user.findOne({
		attributes: ['phone_code', 'mobile', 'email', 'default_lang', 'is_email_verified'],
		include: [{
			model: models.userdetail,
			attributes: ['fullname'],
			where: language.buildLanguageQuery(
				{}, req.langId, '`user`.`id`', models.userdetail, 'userId'
			)
		}],
		where: {
			id: req.id
		}
	}).then(data => {
		let qry = 'SELECT `app_versions`.`app_version`, `app_versions`.`version_for` FROM app_versions WHERE id IN (SELECT MAX(id) FROM app_versions GROUP BY version_for)';
        return models.sequelize.query(qry, { type: models.sequelize.QueryTypes.SELECT }).then(app_versions => ({status:true, data, app_versions}))
	});
};

exports.updateMobile = req => {

	if(req.otp && req.otp !== ''){
		return otpmessage.verifyOtp({
			mobile: req.mobile,
			otp: req.otp
		}).then(result => {
			if (!result.status) return result;

			return models.user.update({
				id: req.id,
				mobile: req.mobile,
				phone_code: req.phone_code
			}, {
				where: {
					id: req.id
				}
			}).then(() => ({
				status: true,
				data: {
					phone_code: req.phone_code,
					mobile: req.mobile,
				},
				message: language.lang({key:"updatedSuccessfully",lang:req.lang})
			}))
		});
	} else {

		if(!req.mobile) {
			req.mobile = '';
		}

		delete req.id;

		return Promise.all([
			models.user.build(req).validate()
		])
		.then(err => {
			if (err[0]) {
				return err[0].errors;
			} else {
				return null;
			}
		})
		.then(errors => {
			if (errors) {
				return new Promise((resolve) => {
					language.errors({
						errors,
						lang: req.lang
					}, errors => resolve({
						errors,
						status: false
					}));
				});
			}

			return otpmessage.sendOtp({
				phone_code: req.phone_code,
				mobile: req.mobile
			});
		});
	}
};

exports.updateEmail = req => {

	if(!req.email) {
		req.email = '';
	}

	return Promise.all([
		models.user.build(req).validate()
	])
	.then(err => {
		if (err[0]) {
			return err[0].errors;
		} else {
			return null;
		}
	})
	.then(errors => {

		if (errors) {
			return new Promise((resolve) => {
				language.errors({
					errors,
					lang: req.lang
				}, errors => resolve({
					errors,
					status: false
				}));
			});
		}

		return models.user.update({
			id: req.id,
			email: req.email,
			is_email_verified: 0
		}, {
			where: {
				id: req.id
			}
		}).then(() => {
			mail.verificationEmail(req);
			return {
				status: true,
				data: {
					email: req.email,
				},
				message: language.lang({key:"updatedSuccessfully",lang:req.lang})
			}
		});
	});
};

exports.emailVerification = req => {
	return models.user.findOne({
		attributes: ['id'],
		where: {
			reset_password_token: req.token
		}
	}).then(result => {
		if(result){
			return models.user.update({
				is_email_verified: 1,
				reset_password_token: ''
			}, {
				where: {
					reset_password_token: req.token
				}
			}).then(() => ({status: true, message: language.lang({key:"Email Verified",lang:req.lang})}));
		} else {
			return {status: false, message: language.lang({key:"Link Expired",lang:req.lang})}
		}
	});
}


