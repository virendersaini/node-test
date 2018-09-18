'use strict';

const models = require('../models'),
language = require('./language'),
commission = require('./commission'),
utils = require('./utils');

exports.check_availability = function(req) {
	return models.onlineconsultsetting.findOne({
		where: {
			doctorprofileId: req.doctorprofileId,
			available_for_consult: 1
		}
	})
	.then(result => {
		if(!result){
			return {status: false, chat:false};
		} else {
			if(result.account_holder_name && result.account_number && result.consultation_fee){
				return {status: true, chat:true};
			} else {
				return {status: true, chat:false};
			}
		}
	});
};

exports.getStart = function(req) {
	return models.onlineconsultsetting.findOne({
		attributes: ['id'],
		where: {
			doctorprofileId: req.doctorprofileId
		}
	})
	.then((result) => {
		if(result){
			return models.onlineconsultsetting.update(
				{
					available_for_consult: req.available_for_consult
				}, {
					where: {
						id: result.id
					}
				}
			)
			.then(() => ({status: true}))
			.catch(() => ({status: false}));
		} else {
			return models.onlineconsultsetting.create(
				{
					available_for_consult: req.available_for_consult,
					doctorprofileId: req.doctorprofileId 
				}
			)
			.then(() => ({status: true}))
			.catch(() => ({status: false}));
		}
	});
};

exports.editSetting = function(req) {
	return Promise.all([
		models.onlineconsultsetting.findOne({
			where: {
				doctorprofileId: req.doctorprofileId
			}
		}),
		commission.getCommissionRate({doctorprofileId: req.doctorprofileId})
	]).then(([data, commission])=> {
		if(data.dataValues) data.dataValues.commission = commission;
		return {status: true, data};
	});
};

exports.saveSetting = function(req) {
	return Promise.all([
		models.onlineconsultsetting.build(req).validate()
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
				language.errors(
					{errors, lang: req.lang}
					, errors => resolve({errors})
				);
			});
		}

		return models.onlineconsultsetting.update(
			req,
			{
				where: {
					id: req.id
				}
			}
		)
		.then(() => ({status: true}))
	})
};

exports.notificationFreeQA = function(req){
	return models.onlineconsultsetting.update(
		req
		, {
			where: {
				id: req.id
			}
		}
	)
	.then(() => ({status: true}))
	.catch(() => ({status: false}));
}