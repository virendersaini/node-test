'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('healthcarechat', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		healthcareprofileId: {
			type: DataType.INTEGER
		},
		patientId: {
			type: DataType.INTEGER
		},
		unread_of_patient: {
			type: DataType.INTEGER
		},
		unread_of_healthcare: {
			type: DataType.INTEGER
		},
		lastmessageId: {
			type: DataType.INTEGER
		},
	}, {
		tableName: 'healthcare_chats',
		timestamps: false,
	});
};