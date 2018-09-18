'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('fitnesscentertag', {
	fitnesscenterId: {
		type: DataTypes.INTEGER,
		primaryKey: true,
	},
	tagId: {
		type: DataTypes.INTEGER,
		primaryKey: true,
	},
}, {
	tableName: 'fitness_center_tags',
	timestamps: false,
});