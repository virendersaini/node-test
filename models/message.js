'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('message', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		senderId: {
			type: DataType.INTEGER
		},
		receiverId: {
			type: DataType.INTEGER
		},
		masterId: {
			type: DataType.INTEGER
		},
		msg_status: {
			type: DataType.INTEGER
		},
		data: {
			type: DataType.TEXT
		},
		type: {
			type: DataType.INTEGER
		},
		createdAt: {
			type: DataType.VIRTUAL,
			get: function () {
				return Date.parse(this.createdTime);
			}
		},
		updatedAt:  {
			type: DataType.VIRTUAL,
			get: function() {
				return Date.parse(this.updatedTime);
			}
		}
	}, {
		createdAt: 'createdTime',
		updatedAt: 'updatedTime',
		tableName: 'messages'
	});
};