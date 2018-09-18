'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('bug', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		events: {
			type: DataType.JSON,
		},
		initialState: {
			type: DataType.JSON,
		},
		error: {
			type: DataType.JSON,
		},
	}, {
		tableName: 'bugs',
	});
};