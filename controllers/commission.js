'use strict';

const models = require('../models'),
language = require('./language'),
utils = require('./utils'),
mail = require('./mail');

models.doctorspecificcommission.belongsTo(models.doctorprofile);
models.doctorprofile.belongsTo(models.user);
models.user.hasMany(models.userdetail);

models.doctorprofile.hasMany(models.doctorprofiledetail, {
	as: 'doctorprofiledetails',
	foreignKey: 'doctorProfileId',
});
exports.commissionList = req => {
	return Promise.all([
		models.globalcommission.findAll({
			where: {
				type: {$in:['chat_consult','healthcare_consult']}
			},
			order: [[models.sequelize.fn('FIELD', models.sequelize.col('type'),'chat_consult','healthcare_consult')]]
		}),
		models.doctorspecificcommission.findAll({
			include: [{
				model: models.doctorprofile,
				attributes: ['id'],
				include: [{
					model: models.user,
					attributes: ['id']
				}, {
					model: models.doctorprofiledetail,
					attributes: ['doctorProfileId','name'],
					as: 'doctorprofiledetails',
					where: language.buildLanguageQuery(
						{}, req.langId, '`doctorprofile`.`id`', models.doctorprofiledetail, 'doctorProfileId'
					)
				}]
			}],
			attributes: ['id', 'doctorprofileId', 'percentage'],
			where: {
				type: 'chat_consult'
			}
		})
	])
	.then(([chat_consult, dscs]) => ({
		status: true,
		chat_consult: chat_consult ? chat_consult[0].percentage:0,
		healthcare_consult: chat_consult ? chat_consult[1].percentage:0,
		dscs
	}));
};

exports.saveGlobalCommission = req => {
	return models.globalcommission.findOne({
		where: {
			type: req.type
		}
	}).then(result => {
		if(result){
			return models.globalcommission.update({
				percentage: req.percentage
			}, {
				where: {
					id: result.id
				}
			}).then(() => ({
				status: true,
				message:language.lang({key: "Commission Updated", lang: req.lang})
			}));
		} else {
			return models.globalcommission.create({
				percentage: req.percentage,
				type: req.type
			}).then(() => ({
				status: true,
				message: language.lang({key: "Commission Updated", lang: req.lang})
			}));
		}
	});
}

exports.savedsc = req => {
	return Promise.all([
		models.doctorspecificcommission.findOne({
			where: {
				doctorprofileId: req.doctorprofileId,
				type: req.type
			}
		}),
		models.doctorprofile.count({
			where:{
				id: req.doctorprofileId,
				is_live: 1
			}
		})
	]).then(([result, isDoctor]) => {
		if(isDoctor){
			if(result){
				return models.doctorspecificcommission.update({
					percentage: req.percentage
				}, {
					where: {
						id: result.id
					}
				}).then(() => ({
					status: true,
					messages: language.lang({key: "Commission Updated", lang: req.lang})
				}));
			} else {
				return models.doctorspecificcommission.create({
					doctorprofileId: req.doctorprofileId,
					percentage: req.percentage,
					type: req.type
				}).then(() => ({
					status: true,
					messages: language.lang({key: "Commission Added", lang: req.lang})
				}));
			}
		} else {
			return {
				status: false,
				message:language.lang({key: "Doctor ID is not lived or not exist", lang: req.lang})
			};
		}
	});
}

exports.deletecommission = req => {
	return models.doctorspecificcommission.destroy({
		where: {
			id: req.id
		}
	}).then(() => ({
		status: true,
		message: language.lang({key: "Commission Deleted", lang: req.lang})
	})).catch(() => ({
		status: false,
		message: 'Error'
	}));
}

exports.getCommissionRate = req => {
	return models.doctorspecificcommission.findOne({
		attributes: ['percentage'],
		where: {
			doctorprofileId: req.doctorprofileId,
			type: 'chat_consult'
		}
	}).then(result => {
		if(result){
			return result.percentage;
		} else {
			return models.globalcommission.findOne({
				attributes: ['percentage'],
				where: {
					type: 'chat_consult'
				}
			}).then(data => {
				if(data){
					return data.percentage;
				} else {
					return 0;
				}
			}).catch(console.log);
		}
	}).catch(console.log);
}