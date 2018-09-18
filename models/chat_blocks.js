'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('chatblock', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		masterId: {
			type: DataType.INTEGER
		},
		userId: {
			type: DataType.INTEGER
		},
		blockedId: {
			type: DataType.INTEGER
		}
	}, {
		updatedAt: false,
		tableName: 'chat_blocks',
		indexes: [{
			name: 'chatblock',
			type: 'UNIQUE',
			fields: ['userId', 'blockedId']
		}]
	});
};