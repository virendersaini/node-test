'use strict';

const models = require('../models'),
	language = require('./language');

models.user.hasOne(models.fitnesscenter);
models.fitnesscenter.belongsTo(models.user);
models.fitnesscenter.belongsTo(models.city);
models.fitnesscenter.belongsTo(models.state);
models.fitnesscenter.hasMany(models.fitnesscenterdetail);
models.fitnesscenter.hasMany(models.fitnesscentercontact);
models.fitnesscenter.hasMany(models.fitnesscentertag);
models.fitnesscenter.hasMany(models.fitnesscenterfile);
models.fitnesscenter.hasMany(models.fitnesscenterfeedback);
models.fitnesscentermembership.hasMany(models.fitnesscentermembershipdetail);
models.fitnesscenter.hasMany(models.fitnesscentermembership);
models.fitnesscenter.hasMany(models.fitnesscentershift);
models.fitnesscentertag.belongsTo(models.tag);
models.fitnesscenterfeedback.belongsTo(models.patient);
models.fitnesscenterfeedback.belongsTo(models.fitnesscenter);

exports.findFitnessCenter = userId =>
	models.user.findById(userId, {
		include: {
			model: models.fitnesscenter,
			attributes: ['id'],
		},
		attributes: ['id'],
	});

const fitnesscenterprofileAttributes = 
	Object.keys(models.fitnesscenter.attributes).concat([
		[
			models.sequelize.literal(
				'(SELECT COUNT(*) FROM `fitness_center_feedbacks` WHERE '
				+ '`fitnesscenterId` = `fitnesscenter`.`id` AND `is_approved` = 1)'
			),
			'num_ratings'
		],
		[
			models.sequelize.literal(
				'(SELECT ROUND(AVG(`rating`), 2) FROM `fitness_center_feedbacks` WHERE '
				+ '`fitnesscenterId` = `fitnesscenter`.`id` AND `is_approved` = 1)'
			),
			'avg_ratings'
		],
	]);

exports.profile = req =>
	models.fitnesscenter.findById(req.fitnesscenterId, {
		include: [
			{
				model: models.fitnesscenterdetail,
				where: language.buildLanguageQuery(
					null,
					req.langId,
					'`fitnesscenter`.`id`',
					models.fitnesscenterdetail,
					'fitnesscenterId'
				),
			},
			{
				model: models.fitnesscentercontact,
			},
			{
				model: models.city,
				include: [
					{
						model: models.citydetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`city`.`id`',
							models.citydetail,
							'cityId'
						),
					}
				],
				attributes: ['id'],
			},
			{
				model: models.state,
				include: [
					{
						model: models.statedetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`state`.`id`',
							models.statedetail,
							'stateId'
						),
					}
				],
				attributes: ['id'],
			},
			{
				model: models.fitnesscentertag,
				include: [
					{
						model: models.tag,
						include: {
							model: models.tagdetail,
							where: language.buildLanguageQuery(
								null,
								req.langId,
								'`fitnesscentertags.tag`.`id`',
								models.tagdetail,
								'tagId'
							),
							attributes: ['title'],
							required: false,
						},
						attributes: ['id', 'tagtypeId'],
						required: false,
					},
				],
				attributes: ['tagId'],
				required: false,
			},
			{
				model: models.fitnesscenterfile,
				attributes: ['id', 'path', 'original_name']
			},
			{
				model: models.fitnesscentermembership,
				include: {
					model: models.fitnesscentermembershipdetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`fitnesscentermemberships`.`id`',
						models.fitnesscentermembershipdetail,
						'fitnesscentermembershipId'
					),
					required: false,
				},
				required: false,
			},
			{
				model: models.fitnesscentershift,
				required: false,
				attributes: ['day', 'type', 'start', 'end'],
			},
			{
				model: models.fitnesscenterfeedback,
				include: [
					{
						model: models.patient,
						include: [{
							model: models.user,
							include: [{
								model: models.userdetail,
								where: language.buildLanguageQuery(
									null,
									req.langId,
									'`patient.user`.`id`',
									models.userdetail,
									'userId'
								),
								attributes: ['fullname'],
							}],
							attributes: ['id', 'user_image'],
						}],
						attributes: ['id'],
					}
				],
				limit: 1,
				separate: true,
				where: {
					is_approved: 1,
				},
				required: false,
			}
		],
		order: [
			[models.fitnesscentercontact, 'primary', 'DESC'],
			[models.fitnesscentercontact, 'type'],
			[models.fitnesscentermembership, 'cost'],
			[models.fitnesscentershift, 'day'],
			[models.fitnesscentershift, 'type'],
		],
		attributes: fitnesscenterprofileAttributes,
	});

exports.search = req => {
	let limit = parseInt(req.limit),
		offset = parseInt(req.offset),
		options = {
			include: [
				{
					model: models.fitnesscenterdetail,
					where: language.buildLanguageQuery(
						{name: {'like': '%' + req.keyword + '%'}},
						req.langId,
						'`fitnesscenter`.`id`',
						models.fitnesscenterdetail,
						'fitnesscenterId'
					),
					attributes: ['name', 'address'],
				},
				{
					model: models.fitnesscentercontact,
					where: {
						type: 0,
						primary: 1,
					},
					attributes: ['value']
				},
			],
			where: {
				is_live: 1,
				is_active: 1,
				location: models.sequelize.where(
					models.sequelize.fn(
						'ST_Distance_Sphere',
						models.sequelize.fn(
							'ST_GeomFromText',
							'POINT(' + parseFloat(req.latitude) + ' '
								+ parseFloat(req.longitude) + ')'
						),
						models.sequelize.col('`fitnesscenter`.`location`')
					),
					'<',
					80467.2
				)
			},	
			attributes: [
				'id',
				'type',
				'profile_pic',
				[
					models.sequelize.fn(
						'ST_Distance_Sphere',
						models.sequelize.fn(
							'ST_GeomFromText',
							'POINT(' + parseFloat(req.latitude) + ' '
								+ parseFloat(req.longitude) + ')'
						),
						models.sequelize.col('`fitnesscenter`.`location`')
					),
					'distance'
				],
				[
					models.sequelize.literal(
						'(SELECT COUNT(*) FROM `fitness_center_feedbacks` WHERE '
						+ '`fitnesscenterId` = `fitnesscenter`.`id` AND `is_approved` = 1)'
					),
					'num_ratings'
				],
				[
					models.sequelize.literal(
						'(SELECT ROUND(AVG(`rating`)) FROM `fitness_center_feedbacks` WHERE '
						+ '`fitnesscenterId` = `fitnesscenter`.`id` AND `is_approved` = 1)'
					),
					'avg_ratings'
				],
			],
			order: [
				[
					models.sequelize.col('`distance`'),
				]
			],
		};
	limit = isNaN(limit) ? 10 : limit,
	offset = isNaN(offset) ? 0 : offset;
	return Promise.all([
		models.fitnesscenter.count(options),
		models.fitnesscenter.findAll(Object.assign({limit, offset}, options)),
	])
		.then(([count, data]) => ({
			data,
			count,
			status: true,
			message: data.length !== 0 ? undefined : language.lang({
				lang: req.lang,
				key: 'No records found',
			}),
		}))
};

exports.suggestions = req =>
	models.fitnesscenter.findAll({
		include: [
			{
				model: models.fitnesscenterdetail,
				where: language.buildLanguageQuery(
					{name: {'like': '%' + req.keyword + '%'}},
					req.langId,
					'`fitnesscenter`.`id`',
					models.fitnesscenterdetail,
					'fitnesscenterId'
				),
				attributes: ['name'],
			},
		],
		where: {
			is_live: 1,
			is_live: 1,
			location: models.sequelize.where(
				models.sequelize.fn(
					'ST_Distance_Sphere',
					models.sequelize.fn(
						'ST_GeomFromText',
						'POINT(' + parseFloat(req.latitude) + ' '
							+ parseFloat(req.longitude) + ')'
					),
					models.sequelize.col('`fitnesscenter`.`location`')
				),
				'<',
				80467.2
			)
		},
		attributes: ['id'],
		limit: req.limit,
	})
		.then(data => ({
			data,
			status: true,
			message: data.length !== 0 ? undefined : language.lang({
				lang: req.lang,
				key: 'No records found',
			}),
		}))

exports.saveProfileDetail = req => {
	if (req.fitnesscenter.lat && req.fitnesscenter.lng)
		req.fitnesscenter.location = {
			type: 'Point',
			coordinates: [req.fitnesscenter.lat, req.fitnesscenter.lng],
		};
	req.fitnesscenterdetail.languageId = req.languageId;
	const
		fitnesscenter = models.fitnesscenter.build(req.fitnesscenter),
		fitnesscenterdetail = models.fitnesscenterdetail.build(req.fitnesscenterdetail),
		fitnesscentercontacts = req.fitnesscentercontacts.map(
			item => models.fitnesscentercontact.build(item)
		);


	return Promise.all([
		Promise.all([
			fitnesscenter.validate(),
			fitnesscenterdetail.validate(),
		])
			.then(err => language.makeErrors(err, req.lang)),
		Promise.all(fitnesscentercontacts.map(item => item.validate()))
			.then(err => err.map(item => language.makeErrors([item], req.lang)))
			.then(errors => {
				let result = [];
				for (let i = 0; i < errors.length; i++) {
					if (! errors[i]) continue;
					let err = errors[i];
					err.forEach(error => {
						error.path = error.path + '__' + i;
						result.push(error);
					});
				}
				return result.length !== 0 && result;
			})
	])
		.then(([err1, err2]) => err1 ? (err2 ? err1.concat(err2) : err1) : err2)
		.then(errors => {
			if (errors) {
				return {status: false, errors};
			} else if (req.fitnesscenter.id) {
				req.fitnesscenterdetail.fitnesscenterId = req.fitnesscenter.id;
				return Promise.all([				
					models.fitnesscenter.update(req.fitnesscenter, {
						where: {id: req.fitnesscenter.id}
					}),
					models.fitnesscenterdetail.find({
						where: {
							languageId: req.languageId,
							fitnesscenterId: req.fitnesscenter.id,
						},
						attributes: ['id']
					})
						.then(fitnesscenterdetail => fitnesscenterdetail === null ?
							models.fitnesscenterdetail.create(req.fitnesscenterdetail) :
							fitnesscenterdetail.update(req.fitnesscenterdetail)
						),
					models.fitnesscentercontact.findAll({
						where: {fitnesscenterId: req.fitnesscenter.id}
					})
						.then(oldcontacts => {
							req.fitnesscentercontacts.forEach((item, index) => {
								item.primary = !!item.primary;
								item.fitnesscenterId = req.fitnesscenter.id;
								if (oldcontacts[index])
									item.id = oldcontacts[index].id;
							});
							const toBeDeleted = [];
							for (let i = req.fitnesscentercontacts.length; i < oldcontacts.length; i++)
								toBeDeleted.push(oldcontacts[i].id);
							return Promise.all([
								models.fitnesscentercontact.bulkCreate(req.fitnesscentercontacts, {
									ignoreDuplicates: true,
									updateOnDuplicate: ['type', 'value', 'primary'],
								}),
								toBeDeleted.length !== 0 &&
									models.fitnesscentercontact.destroy({
										where: {id: toBeDeleted},
									}),
							]);
						}),
				])
					.then(() => updateCompleteness(req.fitnesscenter.id))
					.then(() => ({
						status: true,
						message: language.lang({key: 'updatedSuccessfully', lang: req.lang})
					}));

			} else {
				let data = req.fitnesscenter;
				data.fitnesscenterdetails = [req.fitnesscenterdetail];
				if (req.languageId != 1) {
					data.fitnesscenterdetails.push(
						Object.assign(
							{},
							req.fitnesscenterdetail,
							{languageId: 1}
						)
					);
				}
				data.fitnesscentercontacts = req.fitnesscentercontacts;
				return models.fitnesscenter.create(data, {
					include: [models.fitnesscenterdetail, models.fitnesscentercontact],
				})
					.then(({id}) => ({
						id,
						status: true,
						message: language.lang({key: 'addedSuccessfully', lang: req.lang})
					}));
			}
		});
};

exports.saveProfileTags = req =>
	models.fitnesscentertag.destroy({
		where: {
			tagId: {
				$notIn: req.tags,
			},
			fitnesscenterId: req.fitnesscenterId,
		}
	})
		.then(() => models.fitnesscentertag.bulkCreate(
			req.tags.map(tagId => ({tagId, fitnesscenterId: req.fitnesscenterId})),
			{ignoreDuplicates: true}
		))
		.then(() => ({
			status: true,
			message: language.lang({key: 'Saved Successfully', lang: req.lang})
		}));

exports.addFile = req =>
	models.fitnesscenterfile.create(req)
		.then(data => ({status: true, data}));

exports.removeFile = req =>
	models.fitnesscenterfile.destroy({where: {id: req.id}})
		.then(() => ({
			status: true,
			message: language.lang({key: 'deletedSuccessfully', lang: req.lang})
		}));

exports.addMembership = req =>
	Promise.all([
		models.fitnesscentermembership.build({
			cost: req.cost,
			duration: req.duration,
			fitnesscenterId: req.fitnesscenterId,
		}).validate(),
		models.fitnesscentermembershipdetail.build({
			title: req.title, languageId: req.languageId
		}).validate(),
	])
		.then(err => language.makeErrors(err, req.lang))
		.then(errors => errors ?
			({status: false, errors}) :
			models.fitnesscentermembership.create({
				cost: req.cost,
				duration: req.duration,
				fitnesscenterId: req.fitnesscenterId,
				fitnesscentermembershipdetails: req.languageId != 1 ? [
					{title: req.title, languageId: 1},
					{title: req.title, languageId: req.languageId}
				] : [{title: req.title, languageId: 1}]
			}, {include: [models.fitnesscentermembershipdetail]})
				.then(data => updateCompleteness(req.fitnesscenterId) && data)
				.then(data => ({status: true, data}))
		);

exports.removeMembership = req =>
	models.fitnesscentermembership.destroy({
		where: {
			id: req.id,
			fitnesscenterId: req.fitnesscenterId,
		}
	})
		.then(data => updateCompleteness(req.fitnesscenterId) && data)
		.then(data => ({status: true, data}));

exports.saveTimings = req => {
	req.timings.forEach(shift => shift.fitnesscenterId = req.fitnesscenterId);
	return models.fitnesscentershift.destroy({
		where: {$not: {$or: req.timings.map(
			({day, type, fitnesscenterId}) => ({day, type, fitnesscenterId})
		)}}
	})
		.then(() => models.fitnesscentershift.bulkCreate(req.timings, {
			ignoreDuplicates: true,
			updateOnDuplicate: ['start', 'end'],
		}))
		.then(() => updateCompleteness(req.fitnesscenterId))
		.then(() => ({
			status: true,
			message: language.lang({key: 'Saved Successfully', lang: req.lang})
		}))
};

exports.list = req => {
	const pageSize = req.app.locals.site.page, // number of items per page
		page = +req.query.page || 1,
		where = {
			fitnesscenter: {},
			fitnesscenterdetail: {},
		};

	if (req.query.is_live) where.fitnesscenter.is_live = req.query.is_live;
	if (req.query.is_active) where.fitnesscenter.is_live = req.query.is_active;
	if (req.query.verified_status) where.fitnesscenter.verified_status = req.query.verified_status;
	if (req.query.name) where.fitnesscenterdetail.name = {
		$like: '%' + req.query.name + '%'
	};

	return models.fitnesscenter.findAndCountAll({
		include: [
			{
				model: models.user,
				attributes: ['mobile', 'email'],
			},
			{
				model: models.city,
				include: [
					{
						model: models.citydetail,
						where: language.buildLanguageQuery(
							null,
							req.langId,
							'`city`.`id`',
							models.citydetail,
							'cityId'
						),
					}
				],
			},
			{
				model: models.fitnesscenterdetail,
				where: language.buildLanguageQuery(
					where.fitnesscenterdetail,
					req.langId,
					'`fitnesscenter`.`id`',
					models.fitnesscenterdetail,
					'fitnesscenterId'
				),
				attributes: ['name'],
			},
		],
		attributes: [
			'id',
			'is_active',
			'verified_status',
			'is_live',
		],
		where: where.fitnesscenter,
	})
		.then(result => ({
			status: true,
			data: result.rows,
			totalData: result.count,
			pageCount: Math.ceil(result.count / pageSize),
			pageLimit: pageSize,
			currentPage: page,
		}))
};

exports.status = req =>
	models.fitnesscenter.update({is_active: req.status}, {
		where: {
			id: req.fitnesscenterId
		},
	})
		.then(() => ({
			status: true,
			message: language.lang({
				key: "updatedSuccessfully",
				lang: req.lang
			}),
		}));

exports.verificationStatus = req =>
	models.fitnesscenter.update({
		is_live: 1,
		verified_status: req.status,
	}, {
		where: {
			id: req.fitnesscenterId
		},
	})
		.then(() => ({
			status: true,
			message: language.lang({
				key: "updatedSuccessfully",
				lang: req.lang
			}),
		}));

function updateCompleteness(fitnesscenterId) {
	return Promise.all([
		models.fitnesscenter.findById(fitnesscenterId, {
			include: [
				{
					model: models.fitnesscentertag,
					include: {
						model: models.tag,
						attributes: [],
					},
					required: true,
					attributes: ['tagId'],
				},
				{
					model: models.fitnesscentermembership,
					required: true,
					attributes: ['id'],
				},
				{
					model: models.fitnesscentershift,
					required: true,
					attributes: [],
				},
			],
			group: [
				[models.fitnesscentertag, models.tag, 'tagtypeId'],
			],
			attributes: ['id', 'is_complete', 'verified_status'],
		}),
		models.fitnesscenter.findById(fitnesscenterId, {
			attributes: ['id', 'verified_status'],
		}),
	])
		.then(([fitnesscenter, fitnesscenter1]) => {
			let verified_status = fitnesscenter1 && fitnesscenter1.verified_status;
			if (verified_status === 'pending') {
				if (fitnesscenter === null || fitnesscenter.fitnesscentertags.length < 2)
					return fitnesscenter1.update({
						is_complete: 0,
						verified_status: 'incomplete-profile',
					});
			} else if (verified_status === 'incomplete-profile') {
				if (fitnesscenter === null) return;
				if (fitnesscenter.fitnesscentertags.length < 2) return;
				return fitnesscenter1.update({
					is_complete: 1,
					verified_status: 'pending',
				});
			}
		});
};

exports.feedbackList = req => {
	const pageSize = req.app.locals.site.page, // number of items per page
		page = +req.query.page || 1,
		where = {
			fitnesscenterId: req.fitnesscenterId,
		};

	return Promise.all([
		models.fitnesscenterfeedback.findAndCountAll({
			include: [{
				model: models.patient,
				include: [{
					model: models.user,
					include: [{
						model: models.userdetail,
						where: language.buildLanguageQuery(
							null,
							req.body.langId,
							'`patient.user`.`id`',
							models.userdetail,
							'userId'
						),
						attributes: ['fullname'],
					}],
					attributes: ['id', 'user_image'],
				}],
				attributes: ['id'],
			}],
			order: [
				['createdAt', req.query.date || 'asc'],
			],
			where: req.query.rating ? {rating: req.query.rating} : undefined,
		}),
		models.fitnesscenterfeedback.aggregate('rating', 'AVG', {
			where: {
				fitnesscenterId: req.body.fitnesscenterId,
			},
		}),
	])
		.then(([result, avg_ratings]) => ({
			status: true,
			data: result.rows,
			totalData: result.count,
			pageCount: Math.ceil(result.count / pageSize),
			pageLimit: pageSize,
			currentPage: page,
			avg_ratings,
		}))
};


exports.adminFeedbackList = req => {
	const pageSize = req.app.locals.site.page, // number of items per page
		page = +req.query.page || 1,
		where = {
			fitnesscenterId: req.fitnesscenterId,
		};

	return models.fitnesscenterfeedback.findAndCountAll({
			include: [
				{
					model: models.patient,
					include: [{
						model: models.user,
						include: [{
							model: models.userdetail,
							where: language.buildLanguageQuery(
								null,
								req.body.langId,
								'`patient.user`.`id`',
								models.userdetail,
								'userId'
							),
							attributes: ['fullname'],
						}],
						attributes: ['id', 'email'],
					}],
					attributes: ['id'],
				},
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
			order: [
				['id', 'DESC'],
			],
		})
		.then((result) => ({
			status: true,
			data: result.rows,
			totalData: result.count,
			pageCount: Math.ceil(result.count / pageSize),
			pageLimit: pageSize,
			currentPage: page,
		}))
};

exports.feedbackStatus = req => 
	models.fitnesscenterfeedback.update({is_approved: req.status}, {
		where: {
			id: req.fitnesscenterfeedbackId,
		},
	})
		.then(() => ({
			status: true,
			message: language.lang({
				key: "updatedSuccessfully",
				lang: req.lang
			}),
		}));

exports.feedbacks = req => {
	const pageSize = req.pageSize, // number of items per page
		page = +req.page || 1,
		where = {
			is_approved: 1,
			fitnesscenterId: req.fitnesscenterId,
		};

	return models.fitnesscenterfeedback.findAndCountAll({
		include: [{
			model: models.patient,
			include: [{
				model: models.user,
				include: [{
					model: models.userdetail,
					where: language.buildLanguageQuery(
						null,
						req.langId,
						'`patient.user`.`id`',
						models.userdetail,
						'userId'
					),
					attributes: ['fullname'],
				}],
				attributes: ['id', 'user_image'],
			}],
			attributes: ['id'],
		}],
		order: [
			['createdAt'],
		],
		where,
	})
	.then(result => ({
		status: true,
		data: result.rows,
		totalData: result.count,
		pageCount: Math.ceil(result.count / pageSize),
		pageLimit: pageSize,
		currentPage: page,
	}))
};