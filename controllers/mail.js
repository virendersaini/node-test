var nodemailer = require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;
var env       = process.env.NODE_ENV || 'mail';
var config    = require(__dirname + '/../config/config.json')[env];
var path = require('path');
var language = require('./language');
var moment = require('moment');
var ejs = require('ejs');
var fs = require('fs');
const sgMail = require('@sendgrid/mail');
var async = require('async');
sgMail.setApiKey(config.sendGridApiKey);
var randomstring = require("randomstring"),
	models = require('../models');

const registerMailTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/email/register/html.ejs', 'utf8'),
	{
		filename: __dirname + '/../views/front/email/register/html.ejs',
		cache: true
	}
),
resetPasswordMailTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/email/reset_password/html.ejs', 'utf8'),
	{
		filename: __dirname + '/../views/front/email/reset_password/html.ejs',
		cache: true
	}
);


function Mail() {
	
	//var transporter = nodemailer.createTransport(config.config);
	let transporter = nodemailer.createTransport({
        host: config.config.host,
        port: config.config.port,
        secure: config.config.port === '465' ? true: false, // true for 465, false for other ports
        auth: {
            user: config.config.user, // generated ethereal user
            pass: config.config.password // generated ethereal password
        }
    });

	// send mail with defined transport object
	var from = config.from;
	this.sendMail=function (data) {
		if(data.from){
			from  = data.from;
		}else{
			from  = 'noreply@wikicare.co';
		}
		if(email_provider == 'SendGrid'){
			const msg = {
			to: data.email,
			from: from,
			subject: data.subject,
			html: data.msg
			};
			if(data.attachments){
			   var attachments = [];
			   data.attachments.forEach(function(item){ 
				var file = {};
				file.filename = item.filename;
				file.content = fs.readFileSync(item.path, 'base64');
				attachments.push(file);
			   });

			   Promise.all(attachments).then(function(fileData){
				msg.attachments = fileData;
				sgMail.send(msg).then(function (response) {
					console.log('Mail Sent');
				}).catch(function (error) {
					// error is an instance of SendGridError
					// The full response is attached to error.response
					console.log('Some Error');
				});
			   }).catch(console.log);
			} else {
				sgMail.send(msg).then(function (response) {
					console.log('Mail Sent');
				}).catch(function (error) {
					// error is an instance of SendGridError
					// The full response is attached to error.response
					console.log('Some Error');
				});
			}
		}else{
			var mailOptions = {
			from: from,
			to: data.email,
			subject: data.subject,
			//text: data.msg,
			html: data.msg
			};
			transporter.sendMail(mailOptions, function(error){
				if(error){
					return console.log(error);
				}
			});
		}
	};

	this.sendHtmlMailGeneric = function (template, lang, data) {
		data.list = data.data;
		delete data.data;
		if(email_provider == 'SendGrid'){
			return this.mailBySendGrid(data, lang, eval(template));
		}else{
			if(template == 'ticketCreatedMailTemplate'){
				var templateDir = path.join(__dirname, '../views', '/front/email/ticket/created');
			}else if(template == 'ticketMessageMailTemplate'){
				var templateDir = path.join(__dirname, '../views', '/front/email/ticket/message');
			}
			return this.mailByNormalTemplateSystem(data, lang, templateDir);
		}
	}

	this.sendHtmlMail=function(data, lang){
		if(email_provider == 'SendGrid'){
			return this.mailBySendGrid(data, lang, registerMailTemplate);
		}else{
			var templateDir = path.join(__dirname, '../views', '/front/email/register');
			return this.mailByNormalTemplateSystem(data, lang, templateDir);
		}
	};
	/* Reset password mail */
	this.sendResetPasswordMail = function(data, lang) {
		if(email_provider == 'SendGrid'){
			return this.mailBySendGrid(data, lang, resetPasswordMailTemplate);
		}else{
			var templateDir = path.join(__dirname, '../views', '/front/email/reset_password');
			return this.mailByNormalTemplateSystem(data, lang, templateDir);
		}
	};

	this.mailBySendGrid = function(data, lang, template){
		//Send Grid
		const msg = {
			to: data.email,
			from: { name: "Pateast", email: "noreply@wikicare.co" },
			subject: data.subject,
			html: template(language.bindLocale({data:data.list, moment:moment}, lang))
		};
		sgMail.send(msg)
		.then(function (response) {
			console.log('Mail Sent');
		})
		.catch(function (error) {
			// error is an instance of SendGridError
			// The full response is attached to error.response
			console.log('Some Error');
		});
	};

	this.mailByNormalTemplateSystem = function(data, lang, templateDir){
		var mailTemplate = transporter.templateSender(new EmailTemplate(templateDir), {
			from:from,
		});
		// use template based sender to send a message
		mailTemplate({
			to: data.email,
			subject: data.subject
		}, language.bindLocale({
			data:data.list,
			moment:moment
		}, lang), function(err){
			if(err){
			   console.log(err);
			}else{
				console.log('Mail sent');
			}
		});
	};

	this.mailFrontBySendGrid = function(data, lang, template){
		//Send Grid
		const msg = {
			to: data.email,
			from: { name: data.list.name, email: data.list.email },
			subject: data.subject,
			html: template(language.bindLocale({data:data.list, moment:moment}, lang))
		};
		sgMail.send(msg)
		.then(function (response) {
			console.log('Mail Sent');
		})
		.catch(function (error) {
			// error is an instance of SendGridError
			// The full response is attached to error.response
			console.log('Some Error');
			//console.log(error);
		});
	};

	this.sendInvoiceMail = function(data, lang){
		let mailFrom = config.from;

		if (data.from) {
			mailFrom = data.from;
		}

		let mailOptions = {
			from: mailFrom,
			to: data.email,
			subject: data.subject,
			html: data.msg,
			attachments: [{
				filename: 'invoice.pdf',
				content: data.pdf
			}]
		};
		transporter.sendMail(mailOptions, function(error){
			if(error){
				return console.log(error);
			} else {
				return console.log('Mail sent')
			}
		});
	};

	this.verificationEmail = req => {
		models.user.hasMany(models.userdetail);
		return models.user.findOne({
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
		}).then(result => {
			let rstPswrdToken = randomstring.generate(),
				rstPswrdVrfUrl = req.verificationUrl + rstPswrdToken,
				mailFrom = config.from,
				mailOptions = {
					from: config.from || 'noreply@wikicare.co',
					email: result.email,
					subject: 'Wikicare - Email Verification',
					list: {
						link: rstPswrdVrfUrl,
						fullname: result.userdetails[0].fullname,
						lang: req.lang 
					}
				};

			return models.user.update({
				reset_password_token: rstPswrdToken
			}, {
				where: {
					id: result.id
				}
			}).then(() => {
				let verificationEmailTemplate = path.join(__dirname, '../views', '/front/email/verification_mail');
				return this.mailByNormalTemplateSystem(mailOptions, req.lang, verificationEmailTemplate);
			});
		});
	};

	this.welcomeEmail = req => {
		let subscription = require('./subscription');
		subscription.list({langId: req.langId}).then(plans => {
			let trialSubDays = plans.status ? plans.trial : 0;
			let rstPswrdVrfUrl = req.verificationUrl;
				mailOptions = {
					from: config.from || 'noreply@wikicare.co',
					email: req.email,
					subject: 'Wikicare - Registration',
					list: {
						link: rstPswrdVrfUrl,
						fullname: req.fullname,
						mobile: req.mobile,
						password: req.password,
						email: req.email,
						trialSubDays: trialSubDays,
						lang: req.lang
					}
				};

			let templateByRole;
			switch(req.user_type) {
				case 'doctor':
				case 'doctor_clinic_both':
					templateByRole = '/front/email/register/doctor';
					break;
				case 'hospital':
					templateByRole = '/front/email/register/hospital';
					break;
				case 'home_healthcare':
					templateByRole = '/front/email/register/hhc';
					break;
				case 'fitness_center':
					templateByRole = '/front/email/register/ftc';
					break;
				case 'Patient':
					templateByRole = '/front/email/register/patient';
					break;
			}

			let registerEmailTemplate = path.join(__dirname, '../views', templateByRole);
			return this.mailByNormalTemplateSystem(mailOptions, req.lang, registerEmailTemplate);
		})
	};

	this.adminResetPassword = req => {
		let rstPswrdToken = randomstring.generate(),
			rstPswrdVrfUrl = req.verificationUrl + rstPswrdToken,
			mailOptions = {
				from: config.from || 'noreply@wikicare.co',
				email: req.email,
				subject: 'Wikicare - Password Updated',
				list: {
					email: req.email,
					password: req.password
				}
			};

		let adminResetPasswordEmailTemplate = path.join(__dirname, '../views', '/front/email/admin_reset_password');
		return this.mailByNormalTemplateSystem(mailOptions, req.lang, adminResetPasswordEmailTemplate);
	}
}
module.exports = new Mail();