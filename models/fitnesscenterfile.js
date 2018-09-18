'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('fitnesscenterfile', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	fitnesscenterId: {
		type: DataTypes.INTEGER,
	},
	path: {
		type: DataTypes.INTEGER,
	},
	original_name: {
		type: DataTypes.STRING,
	},
	is_active: {
		type: DataTypes.INTEGER,
	},
}, {
	tableName: 'fitness_center_files',
});