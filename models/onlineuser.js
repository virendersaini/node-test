'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('onlineuser', {
		socket: {
			type: DataType.STRING,
			primaryKey: true,
		},
		userId: {
			type: DataType.INTEGER
		},
		type: {
			type: DataType.INTEGER,
		}
	}, {
		timestamps: false,
		tableName: 'online_users'
	});
};