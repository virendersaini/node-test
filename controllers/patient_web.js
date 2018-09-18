'use strict';

const models = require('../models'),
	language = require('./language'),
	utils = require('./utils'),
	mail = require('./mail'),
	tagtype = require('./tagtype'),
	chat = require('./chat'),
	moment = require('moment');

models.doctorprofile.hasMany(models.doctorprofiledetail, {as: 'doctorprofiledetails'});
models.doctorprofile.hasMany(models.doctorfile, {as: 'doctorfiles'});
models.doctorprofile.hasMany(models.doctoreducation, {as: 'doctoreducations'});
models.doctorprofile.hasMany(models.hospital_doctors, {as: 'hospital_doctors'});
models.doctorprofile.hasMany(models.doctortags, {as: 'doctortags'});
models.doctorprofile.belongsTo(models.city);
models.doctorprofile.belongsTo(models.state);
models.doctorprofile.hasMany(models.doctorexperience, {
	as: 'doctorexperiences',
	foreignKey: 'doctorProfileId',
});

models.doctortags.belongsTo(models.tag,{foreignKey:'tagId'});

models.doctoreducation.hasMany(models.doctoreducationdetail);
models.doctoreducation.belongsTo(models.tag, {foreignKey: 'tagtypeId'});

models.doctorregistration.hasMany(models.doctorregistrationdetail, {foreignKey: 'doctorRegistrationId'});
models.doctorexperience.hasMany(models.doctorexperiencedetail, {foreignKey: 'doctorExperienceId'});
models.doctoraward.hasMany(models.doctorawarddetail, {foreignKey: 'doctorAwardId'});

models.hospital_doctors.belongsTo(models.hospital, {as:'hospital'});
models.hospital_doctors.hasMany(models.hospital_doctor_timings);
models.hospital_doctors.belongsTo(models.doctorprofile);

models.hospital.hasMany(models.hospitaldetail);
models.hospital.hasMany(models.contactinformation, {
	foreignKey: 'key',
	sourceKey: 'id'
});
models.hospital.hasMany(models.hospitalfile, {as: 'hospitalfiles'});
models.hospital.belongsTo(models.city);
models.hospital.belongsTo(models.state);
models.hospital.belongsTo(models.country);
models.hospital.hasMany(models.hospitalservice);
models.hospital.hasMany(models.hospital_timings, {as:'hospital_timings'});
models.hospital.hasMany(models.hospitalaward);
models.hospitalaward.hasMany(models.hospitalawarddetail);

models.city.hasMany(models.citydetail);
models.city.belongsTo(models.state);

models.state.hasMany(models.statedetail);
models.state.hasMany(models.statedetail);

models.country.hasMany(models.countrydetail);

models.doctorfeedback.belongsTo(models.patient);
models.patient.belongsTo(models.user);

models.article.hasMany(models.articledetail);
models.article.belongsTo(models.doctorprofile, {foreignKey: 'keyId'});

models.user.hasMany(models.userdetail);
models.user.hasOne(models.doctorprofile, {foreignKey: 'userId', as: 's_doctorprofile'});
models.user.hasOne(models.hospital, {foreignKey: 'userId', as: 's_hospital'});

models.doctorfeedback.belongsTo(models.doctorprofile, {foreignKey: 'doctorProfileId'});
models.doctorfeedback.belongsTo(models.hospital);
models.article.hasMany(models.articlelike);
models.article.hasMany(models.starredarticle);
models.healthcarefeedback.belongsTo(models.healthcareprofile, {foreignKey: 'healthcareProfileId'});

exports.getCitiesByCountryId = function (req) {
	var isWhere = {};
	isWhere.citydetail = language.buildLanguageQuery(
		isWhere.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId'
	);
	isWhere.statedetail = language.buildLanguageQuery(
		isWhere.statedetail, req.langId, '`state`.`id`', models.statedetail, 'stateId'
	);
	return models.city.findAll({
		include: [
			{
				model: models.citydetail,
				where:isWhere.citydetail
			}, {
				model: models.state,
				attributes: ['id'],
				include: [{
					model: models.statedetail,
					attributes: ['name'],
					where: isWhere.statedetail
				}]
			}
		],
		where:{
			is_active:1,
			countryId:req.countryId
		},
		order: [
			[models.citydetail, 'name', 'ASC']
		]
	}).then(data => ({data}))
};

exports.doctorById = req => {
	let patientId = null;
	if(req.patientId) {
		patientId = req.patientId;
	}
	return Promise.all([
		models.doctorprofile.find({
			attributes: [
				'id',
				'userId',
				'mobile',
				'email',
				'salutation',
				'doctor_profile_pic',
				'latitude',
				'longitude',
				[
					models.sequelize.literal(
						'(SELECT SUM(duration_to-duration_from) FROM doctor_experiences WHERE doctor_experiences.doctorProfileId = doctorprofile.id)'
					), 'total_exp'
				],
				[
					models.sequelize.literal(
						'(SELECT ROUND(AVG(doctor_feedbacks.rating)) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id AND doctor_feedbacks.is_approved = 1)'
					), 'avg_rating'
				],
				[models.sequelize.literal('(SELECT COUNT(*) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id AND doctor_feedbacks.is_approved=1)'), 'count_rating'],
				[
					models.sequelize.literal(
						'(SELECT COUNT(`doctor_feedbacks`.`id`) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id AND doctor_feedbacks.is_approved=1)'
					), 'feedbacks'
				],
				[
					models.sequelize.literal(
						'(SELECT COUNT(*) FROM online_consult_settings WHERE doctorprofileId = doctorprofile.id'+
						' AND account_holder_name IS NOT NULL'+
						' AND account_number IS NOT NULL'+
						' AND consultation_fee IS NOT NULL'+
						' AND available_for_consult=1)'
					), 'available_for_consult'
				],
				[
					models.sequelize.literal(
						'(SELECT consultation_fee FROM online_consult_settings WHERE doctorprofileId = doctorprofile.id)'
					), 'consultation_fee'
				],
				[
					models.sequelize.literal(
						'(SELECT COUNT(`favourite_doctors`.`id`) FROM favourite_doctors'+
						' WHERE favourite_doctors.doctorProfileId = doctorprofile.id'+
						' AND favourite_doctors.patientId='+patientId+')'
					), 'is_favourite'
				],
			],
			include: [{
				model: models.doctorprofiledetail,
				as: 'doctorprofiledetails',
				attributes: ['about_doctor', 'address_line_1', 'name'],
				where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
			}, {
				model: models.doctorfile,
				as: 'doctorfiles',
				attributes: ['document_type', 'doctor_files', 'original_name', 'file_type'],
				required: false,
				where: {
					is_active: 1,
					$or: [
						{document_type: 'public_photos'},
						{file_type: 'video'}
					]
				}
			}, {
				model: models.doctoreducation,
				as: 'doctoreducations',
				attributes: ['id', 'tagtypeId'],
				include: [{
					model: models.doctoreducationdetail,
					attributes: ['college_name'],
					where: language.buildLanguageQuery({}, req.langId, '`doctoreducations`.`id`', models.doctoreducationdetail, 'doctorEducationId'),
					required: false
				}, {
					model: models.tag,
					attributes: ['id'],
					required: false,
					include: [{
						model: models.tagdetail,
						attributes: ['title'],
						where: language.buildLanguageQuery({}, req.langId, '`doctoreducations.tag`.`id`', models.tagdetail, 'tagId'),
						required: false
					}]
				}],
				required: false
			}, {
				model: models.city,
				attributes: ['id'],
				required: false,
				include: [{
					model: models.citydetail,
					attributes: ['name'],
					required: false,
					where: language.buildLanguageQuery({}, req.langId, '`city`.`id`', models.citydetail, 'cityId')
				}],
			}, {
				model: models.state,
				attributes: ['id'],
				required: false,
				include: [{
					model: models.statedetail,
					attributes: ['name'],
					required: false,
					where: language.buildLanguageQuery({}, req.langId, '`state`.`id`', models.statedetail, 'stateId')
				}],
			}],
			where: {
				id: req.id,
				is_active: 1,
				is_live: 1
			}
		}),
		models.doctortags.findAll({
			attributes: ['tagId'],
			where: {
				doctorProfileId: req.id
			}
		}),
		models.doctorregistration.findAll({
			attributes: ['council_registration_number', 'year_of_registration'],
			include: [{
				model: models.doctorregistrationdetail,
				attributes: ['council_name'],
				where: language.buildLanguageQuery({}, req.langId, '`doctorregistration`.`id`', models.doctorregistrationdetail, 'doctorRegistrationId'),
			}],
			where: {
				doctorProfileId: req.id
			}
		}),
		models.doctorexperience.findAll({
			attributes: ['designation', 'duration_from', 'duration_to'],
			include: [{
				model: models.doctorexperiencedetail,
				attributes: ['clinic_hospital_name', 'city_name'],
				where: language.buildLanguageQuery({}, req.langId, '`doctorexperience`.`id`', models.doctorexperiencedetail, 'doctorExperienceId'),
			}],
			where: {
				doctorProfileId: req.id
			}
		}),
		models.doctoraward.findAll({
			attributes: ['award_year'],
			include: [{
				model: models.doctorawarddetail,
				attributes: ['award_gratitude_title'],
				where: language.buildLanguageQuery({}, req.langId, '`doctoraward`.`id`', models.doctorawarddetail, 'doctorAwardId'),
			}],
			where: {
				doctorProfileId: req.id
			}
		}),
		models.hospital_doctors.findOne({
			attributes:[
				'consultation_charge',
				'available_on_req',
				'id',
				'hospitalId',
			],
			include:[{
				model: models.hospital_doctor_timings,
				attributes: [
					[
						models.sequelize.fn(
							'DATE_FORMAT', models.sequelize.fn(
								'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
							), "%h:%i %p"
						),
						'shift_1_from_time'
					],
					[
						models.sequelize.fn(
							'DATE_FORMAT', models.sequelize.fn(
								'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
							), "%h:%i %p"
						), 'shift_1_to_time'
					],
					[
						models.sequelize.fn(
							'DATE_FORMAT', models.sequelize.fn(
								'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
							), "%h:%i %p"
						),
						'shift_2_from_time'
					],
					[
						models.sequelize.fn(
							'DATE_FORMAT', models.sequelize.fn(
								'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
							), "%h:%i %p"
						),
						'shift_2_to_time'
					],
					'days'
				],
				required: false
			}, {
				model: models.hospital,
				as: 'hospital',
				attributes:[
					'id',
					'active_schedule',
					'shift_24X7',
					'cityId',
					'stateId',
					'countryId',
					'latitude',
					'longitude',
					[
						models.sequelize.literal(
							'(SELECT IFNULL(ROUND(AVG(`doctor_feedbacks`.`rating`)),0) FROM `doctor_feedbacks` WHERE `doctor_feedbacks`.`hospitalId` = `hospital`.`id`)'
						),
						'avg_rating'
					],
					[
						models.sequelize.literal(
							'(SELECT COUNT(*) FROM `doctor_feedbacks` WHERE `doctor_feedbacks`.`hospitalId` = `hospital`.`id`)'
						),
						'count_rating'
					]
				],
				include:[
					{
						model:models.hospitaldetail,
						where: language.buildLanguageQuery(
							{}, req.langId, '`hospital.id`', models.hospitaldetail, 'hospitalId'
						),
						attributes:['hospital_name', 'address'],
					}, {
						model: models.contactinformation,
						attributes:['value'],
						where:{
							type:'mobile',
							is_primary:1
						},
						required: false
					}, {
						model: models.city,
						attributes: ['id'],
						include: [{
							model: models.citydetail,
							attributes: ['name'],
							where: language.buildLanguageQuery({}, req.langId, '`hospital.cityId`', models.citydetail, 'cityId')
						}]
					}, {
						model: models.state,
						attributes: ['id'],
						include: [{
							model: models.statedetail,
							attributes: ['name'],
							where: language.buildLanguageQuery({}, req.langId, '`hospital.stateId`', models.statedetail, 'stateId')
						}]
					}, {
						model: models.country,
						attributes: ['id'],
						include: [{
							model: models.countrydetail,
							attributes: ['name'],
							where: language.buildLanguageQuery({}, req.langId, '`hospital.countryId`', models.countrydetail, 'countryId')
						}]
					}
				],
				where: {
					is_active:1,
					$or: [
						{is_live: 1},
						{is_dummy: 1}
					]
				}
			}],
			where: {
				status:1,
				doctorProfileId: req.id
			},
			order: [
				['id', 'DESC']
			],
		})
	]).then(([info, doctortags, registrations, experiences, awards, hospital_doctors]) => {
		let arrtag = doctortags.map(item => item.tagId);
		if (info) {
			info = JSON.parse(JSON.stringify(info));
		} else {
			return {
				info
			};
		}
		info.registrations = registrations;
		info.experiences = experiences;
		info.awards = awards;
		info.hospital_doctors = hospital_doctors;
		return Promise.all([
			tagtype.listByTypeAndTagsNew({
				body: {
					id: 2,
					tagIDS: arrtag,
					langId: req.langId
				}
			}),
			tagtype.listByTypeAndTagsNew({
				body: {
					id: 1,
					tagIDS: arrtag,
					langId: req.langId
				}
			}),
			tagtype.listByTypeAndTagsNew({
				body: {
					id: 12,
					tagIDS: arrtag,
					langId: req.langId
				}
			}),
		]).then(([specializations, services, memberships]) =>{
			if(specializations){
				info.specializations = specializations.tags;
			}
			if(services){
				info.services = services.tags;
			}
			if(memberships){
				info.memberships = memberships.tags;
			}
			return {
				info
			}
		});
	});
};

exports.practices = req => {
	return models.hospital_doctors.findAll({
		include: [{
			model: models.hospital_doctor_timings,
			attributes: [
				[
					models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
						), "%h:%i %p"
					),
					'shift_1_from_time'
				],
				[
					models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
						), "%h:%i %p"
					), 'shift_1_to_time'
				],
				[
					models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
						), "%h:%i %p"
					),
					'shift_2_from_time'
				],
				[
					models.sequelize.fn(
						'DATE_FORMAT', models.sequelize.fn(
							'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
						), "%h:%i %p"
					),
					'shift_2_to_time'
				],
				'days'
			],
			required: false
		}, {
			model: models.hospital,
			as: 'hospital',
			where: {is_active: 1},
			attributes: [
				'id',
				'latitude',
				'longitude',
				'hospital_logo',
				'active_schedule',
				'shift_24X7',
				'is_dummy',
				'is_live'
			],
			include: [{
				model: models.hospitaldetail,
				attributes: ['about_hospital', 'address', 'hospital_name', 'contact_emails', 'contact_mobiles'],
				where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
			}, {
				model: models.contactinformation,
				where: {
					model: 'hospital',
					type: 'mobile',
					is_primary: 1
				},
				attributes: ["value"]
			}, {
				model: models.hospitalfile,
				as: 'hospitalfiles',
				separate: true,
				attributes: ['hospitalId', 'hospital_files', 'file_type'],
				where: {
					is_active: 1,
					$or: [
						{document_type: 'public_photos'},
						{file_type: 'video'}
					]
				},
				limit: 4,
				required: false
			}, {
				model: models.city,
				attributes: ['id'],
				include: [{
					model: models.citydetail,
					attributes: ['name'],
					where: language.buildLanguageQuery({}, req.langId, '`hospital.city`.`id`', models.citydetail, 'cityId')
				}]
			}, {
				model: models.state,
				attributes: ['id'],
				include: [{
					model: models.statedetail,
					attributes: ['name'],
					where: language.buildLanguageQuery({}, req.langId, '`hospital.state`.`id`', models.statedetail, 'stateId')
				}]
			}, {
				model: models.country,
				attributes: ['id'],
				include: [{
					model: models.countrydetail,
					attributes: ['name'],
					where: language.buildLanguageQuery({}, req.langId, '`hospital.country`.`id`', models.countrydetail, 'countryId')
				}]
			}]
		}],
		attributes: [
			'id',
			'hospitalId',
			'doctorProfileId',
			'consultation_charge',
			'available_on_req'
		],
		where: {
			doctorProfileId: req.id
		}
	}).then(data => ({data}));
};

exports.feedbacks = req => {
	return models.doctorfeedback.findAll({	
		attributes: ['id', 'rating', 'feedback', 'createdAt'],
		include: [{
			model: models.patient,
			attributes: ['id'],
			include: [{
				model: models.user,
				attributes: ['id', 'user_image'],
				include: [{
					model: models.userdetail,
					attributes: ['fullname'],
					where: language.buildLanguageQuery({}, req.langId, '`patient.user`.`id`', models.userdetail, 'userId')
				}]
			}]
		}],
		where: {
			doctorProfileId: req.id,
			is_approved: 1
		}
	}).then(data => ({data}));
};

exports.articles = req => {
	let patientId = null;
	if(req.patientId) {
		patientId = req.patientId;
	}
	return models.article.findAll({	
		attributes: [
			'id',
			'article_tags',
			'article_image',
			[
				models.sequelize.literal(
					'(SELECT COUNT(article_likes.id) FROM article_likes WHERE article_likes.articleId = article.id'+
					' AND article_likes.keyId = '+patientId+')'
				),
				'likes'
			]
		],
		include: [{
			model: models.articledetail,
			attributes: ['title', 'body'],
			where: language.buildLanguageQuery({}, req.langId, '`article`.`id`', models.articledetail, 'articleId')
		}, {
			model: models.doctorprofile,
			attributes: ['id', 'salutation'],
			include: [{
				model: models.doctorprofiledetail,
				as: 'doctorprofiledetails',
				attributes: ['name'],
				where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
			}]
		}],
		where: {
			keyId: req.id,
			is_active: 1,
			status: 1
		}
	}).then(data => ({data}));
};

exports.hospitalById = req => {
	return Promise.all([
		models.hospital.find({
			attributes: [
				'id',
				'hospital_logo',
				'active_schedule',
				'latitude',
				'longitude', 
				'shift_24X7',
				[
					models.sequelize.literal(
						'(SELECT ROUND(AVG(doctor_feedbacks.rating)) FROM doctor_feedbacks WHERE doctor_feedbacks.hospitalId = hospital.id AND doctor_feedbacks.is_approved = 1)'
					), 'avg_rating'
				],
				[
					models.sequelize.literal(
						'(SELECT COUNT(*) FROM doctor_feedbacks WHERE doctor_feedbacks.hospitalId = hospital.id AND doctor_feedbacks.is_approved = 1)'
					), 'count_rating'
				]
			],
			include: [{
				model: models.hospitaldetail,
				attributes: [
					'id',
					'hospital_name',
					'about_hospital',
					'address'
				],
				where: language.buildLanguageQuery({}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId')
			}, {
				model: models.hospitalfile,
				as: 'hospitalfiles',
				attributes: ['id', 'hospitalId', 'hospital_files', 'file_type', 'document_type'],
				where: {
					is_active: 1,
					$or: [
						{document_type: 'public_photos'},
						{file_type: 'video'}
					]
				},
				required: false
			}, {
				model: models.contactinformation,
				attributes: [
					'type',
					'value',
					'is_primary'
				],
				where: {
					is_primary: 1,
					model: 'hospital'
				},
				required: false
			}, {
				model: models.hospitalservice,
				attributes: [
					'id',
					'tagId'
				],
				required: false
			}, {
				model: models.city,
				required: false,
				attributes: ['id'],
				include: [{
					model: models.citydetail,
					attributes: ['name'],
					required: false,
					where: language.buildLanguageQuery({}, req.langId, '`city`.`id`', models.citydetail, 'cityId')
				}]
			}, {
				model: models.state,
				required: false,
				attributes: ['id'],
				include: [{
					model: models.statedetail,
					attributes: ['name'],
					required: false,
					where: language.buildLanguageQuery({}, req.langId, '`state`.`id`', models.statedetail, 'stateId')
				}]
			}, {
				model: models.hospitalaward,
				attributes: ["award_year"],
				include: [{
					model: models.hospitalawarddetail,
					attributes: ["award_gratitude_title"],
					where: language.buildLanguageQuery({}, req.langId, '`hospitalawards`.`id`', models.hospitalawarddetail, 'hospitalAwardId'),
					required: false
				}],
				required: false
			}],
			where: {
				id: req.id,
				is_active: 1,
				is_live: 1
			}
		}),
		models.hospital_timings.findAll({
			as: 'hospital_timings',
			attributes: [
				[models.sequelize.fn(
					'DATE_FORMAT', models.sequelize.fn(
						'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
					), "%h:%i %p"
				), 'shift_1_from_time'],
				[models.sequelize.fn(
					'DATE_FORMAT', models.sequelize.fn(
						'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
					), "%h:%i %p"
				), 'shift_1_to_time'],

				[models.sequelize.fn(
					'DATE_FORMAT', models.sequelize.fn(
						'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
					), "%h:%i %p"
				), 'shift_2_from_time'],

				[models.sequelize.fn(
					'DATE_FORMAT', models.sequelize.fn(
						'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
					), "%h:%i %p"
				), 'shift_2_to_time'],
				'days'
			],
			where: {
				hospitalId: req.id
			}
		}),
		models.hospital_doctors.findAll({
			attributes: [
				'id',
				'consultation_charge',
				'available_on_req',
				'hospitalId',
				[
					models.sequelize.literal(
						'(SELECT `active_schedule` FROM `hospitals` WHERE `hospitals`.`id` = `hospital_doctors`.`hospitalId`)'
					),
					'active_schedule'
				]
			],
			include: [{
				model: models.hospital_doctor_timings,
				attributes: [
					[
						models.sequelize.fn(
							'DATE_FORMAT', models.sequelize.fn(
								'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
							), "%h:%i %p"
						),
						'shift_1_from_time'
					],
					[
						models.sequelize.fn(
							'DATE_FORMAT', models.sequelize.fn(
								'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
							), "%h:%i %p"
						), 'shift_1_to_time'
					],
					[
						models.sequelize.fn(
							'DATE_FORMAT', models.sequelize.fn(
								'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
							), "%h:%i %p"
						),
						'shift_2_from_time'
					],
					[
						models.sequelize.fn(
							'DATE_FORMAT', models.sequelize.fn(
								'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
							), "%h:%i %p"
						),
						'shift_2_to_time'
					],
					'days'
				],
				required: false
			}, {
				model: models.doctorprofile,
				where: {
					is_active: 1,
					is_live: 1
				},
				attributes: [
					'id',
					'salutation',
					'doctor_profile_pic', 
					[
						models.sequelize.literal(
							'(SELECT IFNULL(ROUND(AVG(doctor_feedbacks.rating)),0) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id AND doctor_feedbacks.is_approved = 1)'
						), 'avg_rating'
					],
					[
						models.sequelize.literal(
							'(SELECT COUNT(*) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id AND doctor_feedbacks.is_approved = 1)'
						), 'count_rating'
					],
					[
						models.sequelize.literal(
							'(SELECT SUM(duration_to-duration_from) FROM doctor_experiences WHERE doctor_experiences.doctorProfileId = doctorprofile.id)'
						), 'total_exp'
					],
					[
						models.sequelize.literal(
							'(SELECT COUNT(*) FROM online_consult_settings WHERE doctorprofileId = doctorprofile.id'+
							' AND account_holder_name IS NOT NULL'+
							' AND account_number IS NOT NULL'+
							' AND consultation_fee IS NOT NULL'+
							' AND available_for_consult=1)'
						), 'available_for_consult'
					]
				],
				include: [{
					model: models.doctorprofiledetail,
					as: 'doctorprofiledetails',
					attributes: [
						'id',
						'name',
						'address_line_1'
					],
					where: language.buildLanguageQuery({}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId')
				}, {
					model: models.doctoreducation,
					as: 'doctoreducations',
					attributes: ['id'],
					include: [{
						model: models.tag,
						attributes: ['id'],
						include: [{
							model: models.tagdetail,
							attributes: ['title'],
							where: language.buildLanguageQuery({}, req.langId, '`doctorprofile.doctoreducations.tag`.`id`', models.tagdetail, 'tagId'),
							required: false
						}],
						required: false
					}],
					required: false
				}, {
					model: models.doctortags,
					as : 'doctortags',
					attributes: ['id'],
					include: [{
						model: models.tag,
						attributes: ['id'],
						include: [{
							model: models.tagdetail,
							attributes: ['title'],
							where: language.buildLanguageQuery({}, req.langId, '`doctorprofile.doctortags.tag`.`id`', models.tagdetail, 'tagId'),
							required: false
						}],
						required: false,
					}],
					required: false,
					where: {
						tagtypeId: 2
					},
				}, {
					model: models.city,
					attributes: ['id'],
					required: false,
					include: [{
						model: models.citydetail,
						attributes: ['name'],
						required: false,
						where: language.buildLanguageQuery({}, req.langId, '`doctorprofile.city`.`id`', models.citydetail, 'cityId')
					}],
				}],
				required: false
			}],
			where: {
				hospitalId: req.id
			}
		}),
		models.doctorfeedback.findAll({	
			attributes: ['id', 'rating', 'feedback', 'createdAt'],
			include: [{
				model: models.patient,
				attributes: ['id'],
				include: [{
					model: models.user,
					attributes: ['id', 'user_image'],
					include: [{
						model: models.userdetail,
						attributes: ['fullname'],
						where: language.buildLanguageQuery({}, req.langId, '`patient.user`.`id`', models.userdetail, 'userId')
					}]
				}]
			}],
			where: {
				hospitalId: req.id,
				is_approved: 1
			}
		})
	]).then(([info, hospital_timings, doctors, feedbacks]) => {
		let arrtag = [];
		if (info) {
			info = JSON.parse(JSON.stringify(info));
			if(info.hospitalservices){
				arrtag = info.hospitalservices.map(item => item.tagId);
			}
		} else {
			return {
				info
			}
		}
		info.hospital_timings = hospital_timings;
		info.doctors = doctors;
		info.feedbacks = feedbacks;
		return Promise.all([
			tagtype.listByTypeAndTagsNew({body: {id: 1,tagIDS:arrtag, langId: req.langId}}),
			tagtype.listByTypeAndTagsNew({body: {id: 11,tagIDS:arrtag, langId: req.langId}})
		]).then(([services, insurance_tags]) => {
			if(services){
				info.services = services.tags;
			}
			if(insurance_tags){
				info.insurance_tags = insurance_tags.tags;
			}
			return {
				info
			}
		}).catch(console.log);
	})
};

exports.searchlist = req => {
	let pageSize = req.app.locals.site.page;
	req = req.body;
	let	page = req.page || 1;

	let whereHospital = {
			is_active:1,
			is_live:1
		},
		isCondition = {
			status:1
		},
		user_type = {$in:['hospital', 'doctor', 'doctor_clinic_both']},
		whereDoctor = {
			is_live: 1,
			is_active: 1,
			cityId: req.cityId,
			tagId: models.sequelize.literal(
			  '((SELECT COUNT("doctorProfileId") FROM `doctor_tags` WHERE `doctor_tags`.`doctorProfileId` = `s_doctorprofile`.`id`'+
			  ' AND `doctor_tags`.`tagId` = '+req.tagId+') != 0)'
			)
		};

	if('undefined'!==typeof req.consultation_charge){
		let feeArray = req.consultation_charge.split("-");
		isCondition.consultation_charge = {$between:feeArray};

		whereDoctor.is_hospitaldoctor = models.sequelize.literal(
			'((SELECT COUNT(*) FROM `hospital_doctors` INNER JOIN `hospitals`'+
			' ON `hospitals`.`id` = `hospital_doctors`.`hospitalId`'+
			' WHERE `hospital_doctors`.`doctorProfileId` = `s_doctorprofile`.`id`'+
			' AND `hospitals`.`is_active` = 1'+
			' AND `hospitals`.`is_live` = 1'+
			' AND  (`hospital_doctors`.`consultation_charge` BETWEEN '+feeArray[0]+' AND '+feeArray[1]+')'+
			' AND `hospitals`.`active_schedule` = 1) > 0)'
		);

		user_type = 'doctor';
	}

	if(req.gender) {
		whereDoctor.gender = req.gender;
		user_type = 'doctor';
	}

	isCondition.check = models.sequelize.literal('(SELECT COUNT(*) FROM `hospitals` WHERE `id` = `hospital_doctors`.`hospitalId` AND `is_active` = 1 AND `is_live` = 1)');

	return Promise.all([
		models.user.findAndCountAll({
			attributes: ['id', 'user_type'],
			include: [{
				model: models.doctorprofile,
				as: 's_doctorprofile',
				attributes: [
					'id',
					'doctor_profile_pic',
					'salutation',
					'gender',
					[
						models.sequelize.literal(
							'(SELECT SUM(duration_to-duration_from) FROM `doctor_experiences` WHERE `doctor_experiences`.`doctorProfileId` = `s_doctorprofile`.`id`)'
						),'total_exp'
					],
					[
						models.sequelize.literal(
							'(SELECT IFNULL(ROUND(AVG(`doctor_feedbacks`.`rating`)),0) FROM `doctor_feedbacks` WHERE `doctor_feedbacks`.`doctorProfileId` = `s_doctorprofile`.`id`)'
						), 'avg_rating'
					],
					[
						models.sequelize.literal(
							'(SELECT COUNT(*) FROM `doctor_feedbacks` WHERE `doctor_feedbacks`.`doctorProfileId` = `s_doctorprofile`.`id`)'
						), 'count_rating'
					],
					[
						models.sequelize.literal(
							'(SELECT COUNT(*) FROM `hospital_doctors` INNER JOIN `hospitals`'+
							' ON `hospitals`.`id` = `hospital_doctors`.`hospitalId`'+
							' WHERE `hospital_doctors`.`doctorProfileId` = `s_doctorprofile`.`id`'+
							' AND `hospital_doctors`.`status` = 1 AND `hospitals`.`is_active` = 1'+
							' AND `hospitals`.`is_live` = 1)'
						),
						'hospital_count',
					],
					[
						models.sequelize.literal(
							'(SELECT COUNT(*) FROM online_consult_settings WHERE doctorprofileId = s_doctorprofile.id'+
							' AND account_holder_name IS NOT NULL'+
							' AND account_number IS NOT NULL'+
							' AND consultation_fee IS NOT NULL'+
							' AND available_for_consult=1)'
						), 'available_for_consult'
					]
				],
				required: false,
				include: [{
					model: models.doctorprofiledetail,
					as: 'doctorprofiledetails',
					attributes: ['name', 'address_line_1'],
					required: false,
					where: language.buildLanguageQuery(
						{}, req.langId, '`s_doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'
					)
				}, {
					model: models.hospital_doctors,
					separate: true,
					as: 'hospital_doctors',
					attributes:[
						'consultation_charge',
						'available_on_req',
						'id',
						'hospitalId',
						'doctorprofileId'
					],
					include:[{
						model: models.hospital_doctor_timings,
						attributes: [
							[
								models.sequelize.fn(
									'DATE_FORMAT', models.sequelize.fn(
										'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
									), "%h:%i %p"
								),
								'shift_1_from_time'
							],
							[
								models.sequelize.fn(
									'DATE_FORMAT', models.sequelize.fn(
										'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
									), "%h:%i %p"
								), 'shift_1_to_time'
							],
							[
								models.sequelize.fn(
									'DATE_FORMAT', models.sequelize.fn(
										'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
									), "%h:%i %p"
								),
								'shift_2_from_time'
							],
							[
								models.sequelize.fn(
									'DATE_FORMAT', models.sequelize.fn(
										'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
									), "%h:%i %p"
								),
								'shift_2_to_time'
							],
							'days'
						],
						required: false
					}, {
						model: models.hospital,
						as: 'hospital',
						attributes:['id','active_schedule'],
						include:[{
							model:models.hospitaldetail,
							attributes:['hospital_name'],
						}, {
							model: models.contactinformation,
							attributes:['value'],
							where:{
								type:'mobile',
								is_primary:1
							},
							required: false
						}],
						where: whereHospital
					}],
					where:isCondition,
					order: [['id', 'DESC']],
					limit: 1
				}, {
					model: models.doctoreducation,
					attributes: ['tagtypeId'],
					as: 'doctoreducations',
					include: [{
							model: models.tag,
							attributes: ['id'],
							required: false,
							include: [{
								model: models.tagdetail,
								attributes: ['title'],
								required: false,
								where: language.buildLanguageQuery({}, req.langId, '`s_doctorprofile.doctoreducations.tag`.`id`', models.tagdetail, 'tagId')
							}]
						},

					],
					required: false
				}, {
					model: models.doctortags,
					as: 'doctortags',
					attributes: ['tagId'],
					required: false,
					include: [{
						model: models.tag,
						attributes: ['id'],
						required: false,
						where: {
							tagtypeId: 2
						},
						include: [{
							model: models.tagdetail,
							attributes: ['title'],
							required: false,
							where: language.buildLanguageQuery(
								{}, req.langId, '`s_doctorprofile.doctortags.tag`.`id`', models.tagdetail, 'tagId'
							)
						}]
					}],
				}, {
					model: models.doctorfile,
					as: 'doctorfiles',
					separate: true,
					attributes: ['doctorprofileId', 'doctor_files', 'file_type'],
					required: false,
					where: {
						is_active: 1,
						$or: [
							{document_type: 'public_photos'},
							{file_type: 'video'}
						]
					},
					limit: 4
				}, {
					model: models.city,
					attributes: ['id'],
					required: false,
					include: [{
						model: models.citydetail,
						attributes: ['name'],
						required: false,
						where: language.buildLanguageQuery({}, req.langId, '`s_doctorprofile.city`.`id`', models.citydetail, 'cityId')
					}],
				}],
				where: whereDoctor
			}, {
				model: models.hospital,
				as: 's_hospital',
				attributes: [
					'id',
					'hospital_logo',
					'zipcode',
					'is_live',
					'is_active',
					'shift_24X7',
					[
						models.sequelize.literal(
							'(SELECT IFNULL(ROUND(AVG(`doctor_feedbacks`.`rating`)),0) FROM `doctor_feedbacks` WHERE `doctor_feedbacks`.`hospitalId` = `s_hospital`.`id`)'
						),
						'avg_rating'
					],
					[
						models.sequelize.literal(
							'(SELECT COUNT(*) FROM `doctor_feedbacks` WHERE `doctor_feedbacks`.`hospitalId` = `s_hospital`.`id`)'
						),
						'count_rating'
					]
				],
				include: [{
					model: models.hospital_timings,
					as: 'hospital_timings',
					attributes: [
						[
							models.sequelize.fn(
								'DATE_FORMAT', models.sequelize.fn(
									'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
								), "%h:%i %p"
							),
							'shift_1_from_time'
						],
						[
							models.sequelize.fn(
								'DATE_FORMAT', models.sequelize.fn(
									'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
								), "%h:%i %p"
							), 'shift_1_to_time'
						],
						[
							models.sequelize.fn(
								'DATE_FORMAT', models.sequelize.fn(
									'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
								), "%h:%i %p"
							),
							'shift_2_from_time'
						],
						[
							models.sequelize.fn(
								'DATE_FORMAT', models.sequelize.fn(
									'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
								), "%h:%i %p"
							),
							'shift_2_to_time'
						],
						'days'
					],
					required: false
				}, {
					model: models.hospitaldetail,
					attributes: ['hospital_name', 'address'],
					required: false,
					where: language.buildLanguageQuery(
						{}, req.langId, '`s_hospital`.`id`', models.hospitaldetail, 'hospitalId'
					)
				}, {
					model: models.hospitalfile,
					as: 'hospitalfiles',
					separate: true,
					attributes: ['hospitalId', 'hospital_files', 'file_type'],
					where: {
						is_active: 1,
						$or: [
							{document_type: 'public_photos'},
							{file_type: 'video'}
						]
					},
					limit: 4,
					required: false
				}, {
					model: models.city,
					attributes: ['id'],
					include: [{
						model: models.citydetail,
						attributes: ['name'],
						required: false,
						where: language.buildLanguageQuery({}, req.langId, '`s_hospital.city`.`id`', models.citydetail, 'cityId')
					}],
					required: false
				}, {
					model: models.state,
					attributes: ['id'],
					include: [{
						model: models.statedetail,
						attributes: ['name'],
						required: false,
						where: language.buildLanguageQuery({}, req.langId, '`s_hospital.state`.`id`', models.statedetail, 'stateId')
					}],
					required: false
				}, {
					model: models.country,
					attributes: ['id'],
					include: [{
						model: models.countrydetail,
						attributes: ['name'],
						required: false,
						where: language.buildLanguageQuery({}, req.langId, '`s_hospital.country`.`id`', models.countrydetail, 'countryId')
					}],
					required: false
				}, {
					model: models.contactinformation,
					attributes: ['value'],
					where: {
						type: 'mobile',
						is_primary: 1
					},
					required: false
				}],
				required: false,
				where: {
					is_live: 1,
					is_active: 1,
					cityId: req.cityId,
					tagId: models.sequelize.literal(
						'((SELECT COUNT("hospitalId") FROM `hospital_services` WHERE `hospital_services`.`hospitalId` = `s_hospital`.`id`'+
						' AND `hospital_services`.`tagId` = '+req.tagId+') != 0)'
					)
				}
			}],
			where: {
				user_type,
				check: models.sequelize.literal('( CASE WHEN (`user_type`= "doctor_clinic_both") THEN `s_hospital`.`id` IS NOT NULL AND `s_doctorprofile`.`id` IS NOT NULL ELSE `s_hospital`.`id` IS NOT NULL OR `s_doctorprofile`.`id` IS NOT NULL END)')
			},
			//group:['user.id'],
			//distinct: true,
			/*limit: pageSize,
			offset: (page - 1) * pageSize,*/
			//subQuery: false,
			//logging: true
		}),
		models.city.find({
			attributes: ['id'],
			include: [{
				model: models.citydetail,
				attributes: ['name'],
				where: language.buildLanguageQuery({}, req.langId, '`city`.`id`', models.citydetail, 'cityId')
			}],
			where: {
				id: req.cityId
			}
		}),
		models.tag.find({
			attributes: ['id'],
			include: [{
				model: models.tagdetail,
				attributes: ['title'],
				where: language.buildLanguageQuery({}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId')
			}],
			where: {
				id: req.tagId
			}
		})
	]).then(([data, city, tag]) => {
		return {
			status: true,
			data: data.rows,
			totalData: data.count.length,
			pageCount: Math.ceil(data.count.length / pageSize),
			pageLimit: pageSize,
			currentPage: parseInt(page),
			searchin: {city, tag}
		}
	})
};

exports.chatTags = req => {
	return models.tag.findAll({
		attributes: ['id'],
		include: [{
			model: models.tagdetail,
			attributes: ['title'],
			where: language.buildLanguageQuery({}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId')
		}],
		where: {
			is_active: 1,
			is_approved: 1,
			tagtypeId: {$in: [2,10]}
		}
	}).then(data => ({status: true, data}))
};

exports.onlineDoctors = req => {

	req.problemtypeTagId = req.tagId;

	return models.tag.findOne({
		attributes: ['tagtypeId'],
		where: {
			id: req.tagId
		},
	}).then(data => {
		if(data) {
			req.SpecializationTagId === data.tagtypeId;
			if(data.tagtypeId === 2) {
				req.specializationId = req.tagId;
			}

			return Promise.all([
				chat.doctors(req),
				models.tag.findOne({
					attributes: ['id'],
					include: [{
						model: models.tagdetail,
						attributes: ['title'],
						where: language.buildLanguageQuery({}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId')
					}],
					where: {
						id: req.tagId
					},
				})
			]).then(([doctors, tags]) => ({
				status: true,
				message: 'success',
				data: doctors.data,
				tags
			}));
		} else {
			return {status: false, message: 'Error'}
		}
	});
};

const experienceAttributeProfile = models.sequelize.literal(
	'IFNULL(SUM('
		+ '`doctorexperiences`.`duration_to`'
		+ ' - `doctorexperiences`.`duration_from`'
	+ '), 0)'
);

exports.chatConsult = req => {

	let tagIds = models.sequelize.literal('(SELECT DISTINCT `problemtypeTagId` FROM `mapped_tags`'+
		' WHERE FIND_IN_SET(`specializationTagId`, (SELECT GROUP_CONCAT(`tagId`) from `doctor_tags`'+
		' WHERE `doctorProfileId` = '+req.doctorprofileId+
		' AND `tagtypeId` = '+utils.getAllTagTypeId()['SpecializationTagId']+')))');
	return Promise.all([
		models.doctorprofile.findOne({
			include: [
				{
					model: models.doctorprofiledetail,
					as: 'doctorprofiledetails',
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`doctorprofile`.`id`',
						models.doctorprofiledetail,
						'doctorprofileId'
					),
					attributes: ['name'],
				},
				{
					model: models.onlineconsultsetting,
					where: {
						available_for_consult: 1,
						consultation_fee: {$ne: null},
					},
					attributes: ['consultation_fee'],
				},
				{
					model: models.doctorexperience,
					as: 'doctorexperiences',
					attributes: [],
				},
				{
					model: models.doctoreducation,
					as: 'doctoreducations',
					include: [ 
						{
							model: models.tag,
							attributes: ['id'],
							include: [
								{
									model: models.tagdetail,
									attributes: ['title'],
									where: language.buildLanguageQuery(
										{},
										req.langId,
										'`doctoreducations.tag`.`id`',
										models.tagdetail,
										'tagId'
									),
									required: false,
								}
							],
							required: false,
						},
					],
					attributes: ['id'],
					required: false
				},
				{
					model: models.doctortags,
					as: 'doctortags',
					attributes: ['tagId'],
					required: false,
					include: [{
						model: models.tag,
						attributes: ['id'],
						required: false,
						where: {
							tagtypeId: 2
						},
						include: [{
							model: models.tagdetail,
							attributes: ['title'],
							required: false,
							where: language.buildLanguageQuery(
								{}, req.langId, '`doctortags.tag`.`id`', models.tagdetail, 'tagId'
							)
						}]
					}],
				}
			],
			where: {
				id: req.doctorprofileId
			},
			attributes: [
				'id',
				'salutation',
				'doctor_profile_pic',
				[experienceAttributeProfile ,'experience'],
				[models.sequelize.literal('(SELECT ROUND(AVG(doctor_feedbacks.rating)) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id AND doctor_feedbacks.is_approved = 1)'), 'avg_rating'],
				[models.sequelize.literal('(SELECT COUNT(*) FROM doctor_feedbacks WHERE doctor_feedbacks.doctorProfileId = doctorprofile.id AND doctor_feedbacks.is_approved = 1)'), 'count_rating']
			],
			group: [
				[
					{
						as: 'doctorexperiences',
						model: models.doctorexperience,
					},
					'doctorprofileId'
				],
				[
					{
						as: 'doctorexperiences',
						model: models.doctorexperience,
					},
					'id'
				],
			],
		}),
		models.tag.findAll({
			attributes: ['id'],
			include: [{
				model: models.tagdetail,
				attributes: ['title'],
				where: language.buildLanguageQuery(
					{}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
				)
			}],
			where: {
				id: {$in: tagIds}
			}
		})
	]).then(([info, tags]) => {
		let data = {};
		if(info){
			data = JSON.parse(JSON.stringify(info));
		}
		data.tags = tags;
		return {
			status: true,
			data
		}
	}).catch(console.log);
};

exports.saveProfile = req => {
	let user = models.user.build({
			id: req.userId,
			user_image: req.user_image,
			email: req.email,
			mobile: req.mobile,
		}),
		userdetail = models.userdetail.build({
			userId: req.userId,
			fullname: req.name,
		}),
		patient = models.patient.build({
			id: req.patientId,
			emergency_contact: req.emergency_contact,
			gender: req.gender,
			merital_status: req.merital_status,
			height: req.height,
			weight: req.weight,
			blood_group: req.blood_group,
			dob: req.dob,
			countryId: req.countryId,
			stateId: req.stateId,
			cityId: req.cityId,
			zipcode: req.zipcode,
		}),
		patientdetail = models.patientdetail.build({
			patientId: req.patientId,
			address: req.address,
		});

	return Promise.all([
		user.validate(),
		userdetail.validate(),
		patient.validate(),
		patientdetail.validate(),
	])
	.then(err => {
		let errors = [];
		for (let i = err.length - 1; i >= 0; i--) {
			if (err[i])
				errors.push(...err[i].errors);
		}
		if (errors.length !== 0) {
			return new Promise(resolve => {
				language.errors({
					errors,
					lang: req.lang
				}, errors => resolve({status: false, errors}));
			});
		}

		return Promise.all([
			models.user.update(user.toJSON(), {where: {id: req.userId}}),
			models.userdetail.find({
				where: {
					userId: req.userId,
					languageId: [1, req.langId],
				},
				order: [['languageId', 'DESC']],
			})
				.then(olduserdetail => {
					if (olduserdetail.languageId == req.langId) {
						return olduserdetail.update(userdetail.toJSON());
					} else {
						let data = olduserdetail.toJSON();
						Object.assign(data, userdetail.toJSON());
						delete data.id;
						return models.userdetail.create(data);
					}
				}),
			models.patient.update(patient.toJSON(), {where: {id: req.patientId}}),
			models.patientdetail.find({
				where: {
					patientId: req.patientId,
					languageId: [1, req.langId],
				},
				order: [['languageId', 'DESC']],
			})
				.then(oldpatientdetail => {
					if (oldpatientdetail.languageId == req.langId) {
						return oldpatientdetail.update(patientdetail.toJSON());
					} else {
						let data = oldpatientdetail.toJSON();
						Object.assign(data, patientdetail.toJSON());
						delete data.id;
						return models.patientdetail.create(data);
					}
				}),
		])
			.then(() => ({
				status: true,
				message: language.lang({
					key: "updatedSuccessfully",
					lang: req.lang
				}),
				data: {
					user: user.toJSON(),
					userdetail: userdetail.toJSON(),
					patient: patient.toJSON(),
					patientdetail: patientdetail.toJSON(),
				},
			}));
	});
};

exports.feedbackList = req => {
	const pageSize = req.pageSize,
		page = req.page ? parseInt(req.page) : 1;
	return models.doctorfeedback.findAndCountAll({
		include: [
			{
				model: models.doctorprofile,
				include: {
					model: models.doctorprofiledetail,
					as: 'doctorprofiledetails',
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`doctorprofile`.`id`',
						models.doctorprofiledetail,
						'doctorProfileId'
					),
					required: false,
					attributes: ['name'],
				},
				attributes: ['id', 'salutation'],
				required: false,
			},
			{
				model: models.hospital,
				include: {
					model: models.hospitaldetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`hospital`.`id`',
						models.hospitaldetail,
						'hospitalId'
					),
					attributes: ['hospital_name'],
					required: false,
				},
				attributes: ['id'],
				required: false,
			},
		],
		where: {
			patientId: req.patientId,
		},
		limit: pageSize,
		offset: (page - 1) * pageSize,
		order: [
			['id', 'DESC']
		],
	})
		.then(({rows: data, count: totalData}) => ({
			page,
			data,
			totalData,
			status: true,
			currentPage: page,
			pageLimit: pageSize,
			pageCount: Math.ceil(totalData / pageSize),
		}));
};

exports.removeFeedback = req =>
	models.doctorfeedback.destroy({
		where: {id: req.id}
	})
		.then(() => ({
			status: true,
			message: language.lang({
				key: "deletedSuccessfully",
				lang: req.lang
			}),
		}));

const articleAttributes = Object.keys(models.article.attributes).concat(
	[
		[
			models.sequelize.literal(
				'(SELECT COUNT(article_likes.id) FROM article_likes WHERE article_likes.articleId = article.id)'
			),
			'total_likes'
		],
	]
);

exports.articleList = req => {
	const pageSize = req.pageSize,
		page = req.page ? parseInt(req.page) : 1;
	return models.patienttag.findAll({
		attributes: ['tagId'],
		where: {
			tagtypeId: 8,
			patientId: req.patientId,
		}
	})
		.then(tags => {
			let sorting =  models.sequelize.literal(
				tags.length === 0 ? '1' : 
					'(' + tags.map(({tagId}) => 'FIND_IN_SET(\''+tagId+'\', `article`.`article_tags`) != 0').join(' + ')
					+ ')'
			);
			return models.article.findAndCountAll({
				include: [
					{
						model: models.articledetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`article`.`id`',
							models.articledetail,
							'articleId'
						),
					},
					{
						model: models.articlelike,
						where: {
							keyId: req.patientId,
						},
						attributes: ['id'],
						required: false,
					},
					{
						model: models.starredarticle,
						where: {
							keyId: req.patientId,
						},
						attributes: ['id'],
						required: false,
					},
					{
						model: models.doctorprofile,
						include: [
							{
								model: models.doctortags,
								as: 'doctortags',
								attributes: ['tagId'],
								required: false,
								include: [
									{
										model: models.tag,
										attributes: ['id'],
										required: false,
										where: {
											tagtypeId: 2
										},
										include: {
											model: models.tagdetail,
											attributes: ['title'],
											required: false,
											where: language.buildLanguageQuery(
												null,
												req.langId,
												'`doctorprofile.doctortags.tag`.`id`',
												models.tagdetail,
												'tagId'
											)
										}
									}
								],
							},
							{
								model: models.doctorprofiledetail,
								as: 'doctorprofiledetails',
								where: language.buildLanguageQuery(
									null,
									req.langId,
									'`doctorprofile`.`id`',
									models.doctorprofiledetail,
									'doctorProfileId'
								),
								required: false,
								attributes: ['name'],
							},
						],
						attributes: ['id', 'salutation'],
						required: false,
					},
				],
				attributes: articleAttributes,
				distinct: true,
				where: {
					status: 1,
					is_active: 1,
				},
				limit: pageSize,
				offset: (page - 1) * pageSize,
				order: [
					[sorting, 'DESC'],
					['id', 'DESC'],
				],
			})
				.then(({rows: data, count: totalData}) => ({
					page,
					data,
					totalData,
					status: true,
					currentPage: page,
					pageLimit: pageSize,
					pageCount: Math.ceil(totalData / pageSize),
				}));
		});
};

const {
	SpecializationTagId,
	ArticleHealthIntrestTopicsTagId,
} = utils.getAllTagTypeId();

exports.addArticleInterest = req =>
	models.patienttag.findCreateFind({
		where: {
			tagId: req.tagId,
			patientId: req.patientId,
			tagtypeId: ArticleHealthIntrestTopicsTagId,
		},
	})
		.then(() => ({
			status: true,
			message: language.lang({key:"addedSuccessfully",lang: req.lang})
		}));

exports.removeArticleInterest = req =>
	models.patienttag.destroy({
		where: {
			patientId: req.patientId,
			tagId: req.tagId,
			tagtypeId: ArticleHealthIntrestTopicsTagId,
		},
	})
		.then(() => ({
			status: true,
			message: language.lang({key:"deletedSuccessfully",lang: req.lang})
		}));


exports.article = req =>
	models.article.findById(req.id, {
		include: [
			{
				model: models.articledetail,
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'`article`.`id`',
					models.articledetail,
					'articleId'
				),
			},
			{
				model: models.articlelike,
				where: {
					keyId: req.patientId,
				},
				attributes: ['id'],
				required: false,
			},
			{
				model: models.starredarticle,
				where: {
					keyId: req.patientId,
				},
				attributes: ['id'],
				required: false,
			},
			{
				model: models.doctorprofile,
				include: [
					{
						model: models.doctortags,
						as: 'doctortags',
						attributes: ['tagId'],
						required: false,
						include: [
							{
								model: models.tag,
								attributes: ['id'],
								required: false,
								where: {
									tagtypeId: SpecializationTagId
								},
								include: {
									model: models.tagdetail,
									attributes: ['title'],
									required: false,
									where: language.buildLanguageQuery(
										null,
										req.langId,
										'`doctorprofile.doctortags.tag`.`id`',
										models.tagdetail,
										'tagId'
									)
								}
							}
						],
					},
					{
						model: models.doctorprofiledetail,
						as: 'doctorprofiledetails',
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`doctorprofile`.`id`',
							models.doctorprofiledetail,
							'doctorProfileId'
						),
						required: false,
						attributes: ['name'],
					},
				],
				attributes: ['id', 'salutation', 'doctor_profile_pic'],
				required: false,
			},
		],
		attributes: articleAttributes,
		where: {
			status: 1,
			is_active: 1,
		},
	})
		.then(article => models.tag.findAll({
			include: [
				{
					model: models.tagdetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`tag`.`id`',
						models.tagdetail,
						'tagId'
					),
					attributes: ['title'],
				}
			],
			where: {
				id: article.article_tags.split(',')
			},
			attributes: ['id'],
		})
		.then(article_tags => {
			article.article_tags = article_tags;
			return article;
		}));

exports.topArticles = req => 
	models.articlelike.findAll({
		limit: req.limit || 3,
		group: [['articleId']],
		order: [[models.sequelize.fn('COUNT', models.sequelize.col('id')), 'DESC']],
		attributes: ['articleId'],
	})
		.then(articlelikes => {
			if (articlelikes.length === 0) return [];
			const ids = articlelikes.map(item => item.articleId);
			return models.article.findAll({
				include: [
					{
						model: models.articledetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`article`.`id`',
							models.articledetail,
							'articleId'
						),
						attributes: ['title'],
					},
					{
						model: models.articlelike,
						where: {
							keyId: req.patientId,
						},
						attributes: ['id'],
						required: false,
					},
				],
				where: {
					id: ids,
					status: 1,
					is_active: 1,
				},
				attributes: [
					'id',
					'article_image',
					articleAttributes[articleAttributes.length - 1],
				],
				order: [
					[models.sequelize.fn('FIELD', models.sequelize.col('`article`.`id`'), ...ids)]
				]
			})
		});

exports.authorArticles = req => 
	models.article.findAll({
		include: [
			{
				model: models.articledetail,
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'`article`.`id`',
					models.articledetail,
					'articleId'
				),
				attributes: ['title'],
			},
			{
				model: models.articlelike,
				where: {
					keyId: req.patientId,
				},
				attributes: ['id'],
				required: false,
			},
		],
		where: {
			status: 1,
			is_active: 1,
			keyId: req.keyId,
		},
		attributes: [
			'id',
			'article_image',
			articleAttributes[articleAttributes.length - 1],
		],
	});

exports.doctors = req => {
	let pageSize = req.app.locals.site.page;
	req = req.body;
	let	page = req.page || 1;

	let whereDoctor = {
			is_live: 1,
			is_active: 1,
			tagId: models.sequelize.literal(
			  '((SELECT COUNT("doctorProfileId") FROM `doctor_tags` WHERE `doctor_tags`.`doctorProfileId` = `doctorprofile`.`id`'+
			  ' AND `doctor_tags`.`tagId` = '+req.tagId+') != 0)'
			)
		};

	let orderBy = [
		[models.sequelize.col('avg_rating'), 'DESC']
	];

	if(req.sort_by && req.sort_by === 'rating_asc') {
		orderBy =  [
			[models.sequelize.col('avg_rating'), 'ASC']
		];
	}

	if(req.sort_by && req.sort_by === 'price_asc') {
		orderBy =  [
			[models.sequelize.col('consultation_charge'), 'ASC']
		];
	}

	if(req.sort_by && req.sort_by === 'price_desc') {
		orderBy =  [
			[models.sequelize.col('consultation_charge'), 'DESC']
		];
	}

	if(req.sort_by && req.sort_by === 'experience') {
		orderBy =  [
			[models.sequelize.col('total_exp'), 'DESC']
		];
	}

	orderBy.push([models.sequelize.col('distance'), 'ASC']);

	whereDoctor.is_hospitaldoctor = models.sequelize.literal(
		'('+getHospitalDoctors('COUNT(*)', req)+' > 0)'
	);

	if(req.gender) {
		whereDoctor.gender = req.gender;
	}

	if(req.nationality) {
		whereDoctor.nationality = req.nationality;
	}


	let distance = '(3959 * acos(cos(radians('+req.latitude+')) * cos(radians(`doctorprofile`.`latitude`)) * cos(radians(`doctorprofile`.`longitude`) - radians('+req.longitude+')) + sin(radians('+req.latitude+')) * sin(radians(`doctorprofile`.`latitude`))))';

	whereDoctor.distance = models.sequelize.literal('('+distance+') < 50');

	models.doctorprofile.hasMany(models.doctorfile, {as: 'doctorfiles'});
	models.doctorprofile.hasMany(models.doctortags, {as: 'doctortags'});

	return Promise.all([
		models.doctorprofile.findAndCountAll({
			attributes: [
				'id',
				'doctor_profile_pic',
				'salutation',
				'gender',
				[
					models.sequelize.literal(
						'(SELECT SUM(duration_to-duration_from) FROM `doctor_experiences` WHERE `doctor_experiences`.`doctorProfileId` = `doctorprofile`.`id`)'
					),'total_exp'
				],
				[
					models.sequelize.literal(
						'(SELECT IFNULL(ROUND(AVG(`doctor_feedbacks`.`rating`)),0) FROM `doctor_feedbacks` WHERE `doctor_feedbacks`.`doctorProfileId` = `doctorprofile`.`id` AND `doctor_feedbacks`.`is_approved` = 1)'
					), 'avg_rating'
				],
				[
					models.sequelize.literal(
						'(SELECT COUNT(*) FROM `doctor_feedbacks` WHERE `doctor_feedbacks`.`doctorProfileId` = `doctorprofile`.`id` AND `doctor_feedbacks`.`is_approved` = 1)'
					), 'count_rating'
				],
				[
					models.sequelize.literal(
						'(SELECT COUNT(*) FROM online_consult_settings WHERE doctorprofileId = doctorprofile.id'+
						' AND account_holder_name IS NOT NULL'+
						' AND account_number IS NOT NULL'+
						' AND consultation_fee IS NOT NULL'+
						' AND available_for_consult=1)'
					), 'available_for_consult'
				],
				[
					models.sequelize.literal(
						getHospitalDoctors('COUNT(*)', req)
					),
					'hospital_count',
				],
				[
					models.sequelize.literal(
						getHospitalDoctors('`hospital_details`.`hospital_name`', req)
					),
					'hospital_name',
				],
				[
					models.sequelize.literal(
						getHospitalDoctors('`hospital_details`.`address`', req)
					),
					'hospital_address',
				],
				[
					models.sequelize.literal(
						getHospitalDoctors('`hospital_doctors`.`consultation_charge`', req)
					),
					'consultation_charge',
				],
				[
					models.sequelize.literal(
						getHospitalDoctors('`hospital_doctors`.`available_on_req`', req)
					),
					'available_on_req',
				],
				[
					models.sequelize.literal(
						getHospitalDoctors('`hospital_doctors`.`id`', req)
					),
					'hospitaldoctorId',
				],
				[
					models.sequelize.literal(
						getHospitalDoctors('`hospital_doctors`.`hospitalId`', req)
					),
					'hospitalId',
				],
				[
					models.sequelize.literal(
						getHospitalDoctors('`hospitals`.`active_schedule`', req)
					),
					'active_schedule',
				],
				[
					models.sequelize.literal(
						getHospitalDoctors('`contact_informations`.`value`', req)
					),
					'hospital_mobile',
				],
				[
					models.sequelize.literal(distance), 'distance',
				]
			],
			include: [
				{
					model: models.doctorprofiledetail,
					as: 'doctorprofiledetails',
					attributes: ['name', 'address_line_1'],
					where: language.buildLanguageQuery(
						{}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'
					)
				}, {
					model: models.doctoreducation,
					attributes: ['tagtypeId'],
					as: 'doctoreducations',
					include: [{
							model: models.tag,
							attributes: ['id'],
							required: false,
							include: [{
								model: models.tagdetail,
								attributes: ['title'],
								required: false,
								where: language.buildLanguageQuery({}, req.langId, '`doctoreducations.tag`.`id`', models.tagdetail, 'tagId')
							}]
						},

					],
					required: false
				}, {
					model: models.doctortags,
					as: 'doctortags',
					separate: true,
					attributes: ['tagId', 'doctorprofileId'],
					include: [{
						model: models.tag,
						attributes: ['id'],
						required: false,
						where: {
							tagtypeId: 2
						},
						include: [{
							model: models.tagdetail,
							attributes: ['title'],
							required: false,
							where: language.buildLanguageQuery(
								{}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId'
							)
						}]
					}],
				}, {
					model: models.doctorfile,
					as: 'doctorfiles',
					separate: true,
					attributes: ['doctorprofileId', 'doctor_files', 'file_type'],
					required: false,
					where: {
						is_active: 1,
						$or: [
							{document_type: 'public_photos'},
							{file_type: 'video'}
						]
					},
					limit: 4
				}
			],
			where: whereDoctor,
			order: orderBy,
			limit: pageSize,
			offset: (page - 1) * pageSize,
			subQuery: false,
			distinct: true
		}),
		models.tag.find({
			attributes: ['id'],
			include: [{
				model: models.tagdetail,
				attributes: ['title'],
				where: language.buildLanguageQuery({}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId')
			}],
			where: {
				id: req.tagId
			}
		}),
		Promise.resolve(utils.getNationalities(req))
	]).then(([data, tag, nationalities]) => {
		return {
			status: true,
			data: data.rows,
			totalData: data.count,
			pageCount: Math.ceil(data.count / pageSize),
			pageLimit: pageSize,
			currentPage: parseInt(page),
			searchin: {nationalities, tag}
		}
	}).catch(console.log)
};

function getHospitalDoctors(column, req) {

	let query = 'SELECT '+column+' FROM `hospital_doctors`';

	query += ' INNER JOIN `hospitals` ON `hospitals`.`id` = `hospital_doctors`.`hospitalId`';
	query += ' INNER JOIN `hospital_details` ON `hospitals`.`id` = `hospital_details`.`hospitalId`';
	query += ' LEFT JOIN `contact_informations` ON `hospitals`.`id` = `contact_informations`.`key`';
	query += ' AND `contact_informations`.`model` = "hospital" AND `contact_informations`.`type` = "mobile"';
	query += ' AND `contact_informations`.`is_primary` = 1';
	query += ' WHERE `hospital_doctors`.`doctorProfileId` = `doctorprofile`.`id`';
	query += ' AND `hospitals`.`is_active` = 1 AND (`hospitals`.`is_live` = 1 OR `hospitals`.`is_dummy` = 1)';
	query += ' AND `hospital_details`.`languageId` = IFNULL((SELECT `languageId` FROM `hospital_details`'
			+' WHERE `hospital_doctors`.`hospitalId` = `hospital_details`.`hospitalId`'
			+' AND `hospital_details`.`languageId`='+req.langId+'),1)';

	if(req.consultation_charge){
		let feeArray = req.consultation_charge.split("-");
		query += ' AND (`hospital_doctors`.`consultation_charge` BETWEEN '+feeArray[0]+' AND '+feeArray[1]+')';
		query += ' AND `hospitals`.`active_schedule` = 1';
	}

	if(req.online_booking) {
		query += ' AND `hospitals`.`active_schedule` = 1';
	}

	if(req.online_booking || (req.availability && req.availability !== 1)) {
		query += ' AND `hospital_doctors`.`available_on_req` = 0';
	}

	if(req.availability && req.availability !== 1){

		query += ' AND ((SELECT COUNT(*) FROM `hospital_doctor_timings` WHERE `hospitalDoctorId` = `hospital_doctors`.`id`';

		if(req.availability === 2){
			query += ' AND `days` IN ("mon","tue","wed","thu","fri","sat","sun")';
		}

		if(req.availability === 4){
			let days = '"'+
				moment(new Date()).format('ddd')
				+'","'+
				moment(new Date()).add(1, 'days').format('ddd')
				+'","'+
				moment(new Date()).add(2, 'days').format('ddd')+'"';

			query += ' AND `days` IN ('+days+')';
		}

		if(req.availability === 3) {
			query += ' AND `days` = "'+moment(new Date()).format('ddd')+'"';
		}

		query += ') > 0)';

	}

	if(column !== 'COUNT(*)') {
		query += ' ORDER BY `hospital_doctors`.`id` DESC LIMIT 1';
	}

	return '('+query+')';
};

exports.hospitals = req => {
	let pageSize = req.app.locals.site.page;
	req = req.body;
	let	page = req.page || 1;

	let whereHospital = {
			is_live: 1,
			is_active: 1,
			tagId: models.sequelize.literal(
				'((SELECT COUNT("hospitalId") FROM `hospital_services` WHERE `hospital_services`.`hospitalId` = `hospital`.`id`'+
				' AND `hospital_services`.`tagId` = '+req.tagId+') != 0)'
			)
		};

	let distance = '(3959 * acos(cos(radians('+req.latitude+')) * cos(radians(`hospital`.`latitude`)) * cos(radians(`hospital`.`longitude`) - radians('+req.longitude+')) + sin(radians('+req.latitude+')) * sin(radians(`hospital`.`latitude`))))';

	whereHospital.distance = models.sequelize.literal('('+distance+') < 50');

	let orderBy = [
		[models.sequelize.col('count_rating'), 'DESC']
	];

	if(req.sort_by && req.sort_by === 'rating_asc') {
		orderBy =  [
			[models.sequelize.col('count_rating'), 'ASC']
		];
	}

	if(req.availability && req.availability !== 1){

		let query = '((SELECT COUNT(*) FROM `hospital_timings` WHERE `hospitalId` = `hospital`.`id`';

		if(req.availability === 2){
			query += ' AND `days` IN ("mon","tue","wed","thu","fri","sat","sun")';
		}

		if(req.availability === 4){
			let days = '"'+
				moment(new Date()).format('ddd')
				+'","'+
				moment(new Date()).add(1, 'days').format('ddd')
				+'","'+
				moment(new Date()).add(2, 'days').format('ddd')+'"';

			query += ' AND `days` IN ('+days+')';
		}

		if(req.availability === 3) {
			query += ' AND `days` = "'+moment(new Date()).format('ddd')+'"';
		}

		query += ') > 0)';

		whereHospital.$or = [
			{check_availability: models.sequelize.literal(query)},
			{shift_24X7: 1}
		]; 

	}

	return Promise.all([
		models.hospital.findAndCountAll({
			attributes: [
				'id',
				'hospital_logo',
				'zipcode',
				'is_live',
				'is_active',
				'shift_24X7',
				[
					models.sequelize.literal(
						'(SELECT IFNULL(ROUND(AVG(`doctor_feedbacks`.`rating`)),0) FROM `doctor_feedbacks` WHERE `doctor_feedbacks`.`hospitalId` = `hospital`.`id` AND `doctor_feedbacks`.`is_approved` = 1)'
					),
					'avg_rating'
				],
				[
					models.sequelize.literal(
						'(SELECT COUNT(*) FROM `doctor_feedbacks` WHERE `doctor_feedbacks`.`hospitalId` = `hospital`.`id` AND `doctor_feedbacks`.`is_approved` = 1)'
					),
					'count_rating'
				],
				[
					models.sequelize.literal(distance), 'distance',
				]
			],
			include: [{
				model: models.hospitaldetail,
				attributes: ['hospital_name', 'address'],
				where: language.buildLanguageQuery(
					{}, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId'
				)
			}, {
				model: models.hospitalfile,
				as: 'hospitalfiles',
				separate: true,
				attributes: ['hospitalId', 'hospital_files', 'file_type'],
				where: {
					is_active: 1,
					$or: [
						{document_type: 'public_photos'},
						{file_type: 'video'}
					]
				},
				limit: 4,
				required: false
			}, {
				model: models.city,
				attributes: ['id'],
				include: [{
					model: models.citydetail,
					attributes: ['name'],
					required: false,
					where: language.buildLanguageQuery({}, req.langId, '`city`.`id`', models.citydetail, 'cityId')
				}],
				required: false
			}, {
				model: models.state,
				attributes: ['id'],
				include: [{
					model: models.statedetail,
					attributes: ['name'],
					required: false,
					where: language.buildLanguageQuery({}, req.langId, '`state`.`id`', models.statedetail, 'stateId')
				}],
				required: false
			}, {
				model: models.country,
				attributes: ['id'],
				include: [{
					model: models.countrydetail,
					attributes: ['name'],
					required: false,
					where: language.buildLanguageQuery({}, req.langId, '`country`.`id`', models.countrydetail, 'countryId')
				}],
				required: false
			}, {
				model: models.contactinformation,
				separate: true,
				attributes: ['value', 'key'],
				where: {
					type: 'mobile',
					is_primary: 1
				},
				required: false
			}],
			where: whereHospital,
			order: orderBy,
			limit: pageSize,
			offset: (page - 1) * pageSize,
			subQuery: false
		}),
		models.tag.find({
			attributes: ['id'],
			include: [{
				model: models.tagdetail,
				attributes: ['title'],
				where: language.buildLanguageQuery({}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId')
			}],
			where: {
				id: req.tagId
			}
		})
	]).then(([data, tag]) => {
		return {
			status: true,
			data: data.rows,
			totalData: data.count,
			pageCount: Math.ceil(data.count / pageSize),
			pageLimit: pageSize,
			currentPage: parseInt(page),
			searchin: {tag}
		}
	})
};

exports.timings = req => {
	return models.hospital_doctor_timings.findAll({
		attributes: [
			[
				models.sequelize.fn(
					'DATE_FORMAT', models.sequelize.fn(
						'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
					), "%h:%i %p"
				),
				'shift_1_from_time'
			],
			[
				models.sequelize.fn(
					'DATE_FORMAT', models.sequelize.fn(
						'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
					), "%h:%i %p"
				), 'shift_1_to_time'
			],
			[
				models.sequelize.fn(
					'DATE_FORMAT', models.sequelize.fn(
						'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
					), "%h:%i %p"
				),
				'shift_2_from_time'
			],
			[
				models.sequelize.fn(
					'DATE_FORMAT', models.sequelize.fn(
						'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
					), "%h:%i %p"
				),
				'shift_2_to_time'
			],
			'days'
		],
		where: {
			hospitalDoctorId: req.id
		}
	}).then(data => ({status: true, data}));
};

exports.hospitalTimings = req => {
	return models.hospital_timings.findAll({
		attributes: [
			[
				models.sequelize.fn(
					'DATE_FORMAT', models.sequelize.fn(
						'SEC_TO_TIME', models.sequelize.col('shift_1_from_time')
					), "%h:%i %p"
				),
				'shift_1_from_time'
			],
			[
				models.sequelize.fn(
					'DATE_FORMAT', models.sequelize.fn(
						'SEC_TO_TIME', models.sequelize.col('shift_1_to_time')
					), "%h:%i %p"
				), 'shift_1_to_time'
			],
			[
				models.sequelize.fn(
					'DATE_FORMAT', models.sequelize.fn(
						'SEC_TO_TIME', models.sequelize.col('shift_2_from_time')
					), "%h:%i %p"
				),
				'shift_2_from_time'
			],
			[
				models.sequelize.fn(
					'DATE_FORMAT', models.sequelize.fn(
						'SEC_TO_TIME', models.sequelize.col('shift_2_to_time')
					), "%h:%i %p"
				),
				'shift_2_to_time'
			],
			'days'
		],
		where: {
			hospitalId: req.id
		}
	}).then(data => ({status: true, data}));
};

exports.fitnesscenterFeedback = req =>
	models.fitnesscenterfeedback.create(req)
		.then(() => ({
			status: true,
			message: language.lang({
				lang: req.lang,
				key: 'addedSuccessfully',
			})
		}));

exports.fitnesscenterFeedbacks = req => {
	const pageSize = req.pageSize,
		page = req.page ? parseInt(req.page) : 1;
	return models.fitnesscenterfeedback.findAndCountAll({
		include: [
			{
				model: models.fitnesscenter,
				include: {
					model: models.fitnesscenterdetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`fitnesscenter`.`id`',
						models.fitnesscenterdetail,
						'fitnesscenterId'
					),
					attributes: ['name'],
				},
			},
		],
		where: {
			patientId: req.patientId,
		},
		limit: pageSize,
		offset: (page - 1) * pageSize,
		order: [
			['id', 'DESC']
		],
	})
		.then(({rows: data, count: totalData}) => ({
			page,
			data,
			totalData,
			status: true,
			currentPage: page,
			pageLimit: pageSize,
			pageCount: Math.ceil(totalData / pageSize),
		}));
};

exports.removeFtcFeedback = req =>
	models.fitnesscenterfeedback.destroy({
		where: {id: req.id}
	})
		.then(() => ({
			status: true,
			message: language.lang({
				key: "deletedSuccessfully",
				lang: req.lang
			}),
		}));

exports.hhcFeedbacks = req => {
	const pageSize = req.pageSize,
		page = req.page ? parseInt(req.page) : 1;
	return models.healthcarefeedback.findAndCountAll({
		include: [
			{
				model: models.healthcareprofile,
				include: {
					model: models.healthcareprofiledetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`healthcareprofile`.`id`',
						models.healthcareprofiledetail,
						'healthcareProfileId'
					),
					attributes: ['name'],
				},
			},
		],
		where: {
			patientId: req.patientId,
		},
		limit: pageSize,
		offset: (page - 1) * pageSize,
		order: [
			['id', 'DESC']
		],
	})
		.then(({rows: data, count: totalData}) => ({
			page,
			data,
			totalData,
			status: true,
			currentPage: page,
			pageLimit: pageSize,
			pageCount: Math.ceil(totalData / pageSize),
		}));
};

exports.removeHhcFeedback = req =>
	models.healthcarefeedback.destroy({
		where: {id: req.id},
	})
		.then(() => ({
			status: true,
			message: language.lang({
				key: "deletedSuccessfully",
				lang: req.lang
			}),
		}));
