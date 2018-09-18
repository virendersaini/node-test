'use strict';

module.exports = function (sequelize, DataType) {
	return sequelize.define('classreport', {
		id: {
			type: DataType.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		userId: {
			type: DataType.INTEGER
		},
		masterId: {
			type: DataType.INTEGER
		},
		academicSessionId: {
			type: DataType.INTEGER
		},
		bcsMapId: {
			type: DataType.INTEGER
		},
		subjectId: {
			type: DataType.INTEGER
		},
		date: {
			type: DataType.DATEONLY
		},
		order: {
			type: DataType.INTEGER
		},
		time: {
			type: DataType.STRING(30)
		},
		content: {
			type: DataType.TEXT
		},
		is_locked: {
			type: DataType.INTEGER(6)
		}
	}, {
		tableName: 'class_reports',
		indexes: [{
			name: 'class_time',
			type: 'UNIQUE',
			fields: ['academicSessionId', 'userId', 'bcsMapId', 'subjectId', 'date', 'order']
		}]
	});
};
