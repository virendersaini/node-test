'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('healthcarechatmessage', {
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
		type: {
			type: DataType.INTEGER
		},
		sender: {
			type: DataType.INTEGER
		},
		status: {
			type: DataType.INTEGER
		},
		data: {
			type: DataType.INTEGER
		},
		deleted: {
			type: DataType.INTEGER
		},
	}, {
		tableName: 'healthcare_chat_messages',
	});
};