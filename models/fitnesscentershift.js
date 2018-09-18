'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('fitnesscentershift', {
	fitnesscenterId: {
		type: DataTypes.INTEGER,
		primaryKey: true,
	},
	day: {
		type: DataTypes.INTEGER,
		primaryKey: true,
	},
	type: {
		type: DataTypes.INTEGER,
		primaryKey: true,
	},
	start: {
		type: DataTypes.TIME,
	},
	end: {
		type: DataTypes.TIME,
	},
}, {
	tableName: 'fitness_center_shifts',
});