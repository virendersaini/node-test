'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('grade', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		data: {
			type: DataType.TEXT,
			get: function () {
				return JSON.parse(this.getDataValue('data'));
			},
			set: function (value) {
				this.setDataValue('data', JSON.stringify(value));
			}
		}
	}, {
		tableName: 'grades'
	});
};
