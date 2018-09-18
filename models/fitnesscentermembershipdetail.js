'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('fitnesscentermembershipdetail', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	fitnesscentermembershipId: {
		type: DataTypes.INTEGER,
	},
	languageId: {
		type: DataTypes.INTEGER,
	},
	title: {
		type: DataTypes.INTEGER,
		validate: {
			notEmpty: {
				msg: 'isRequired'
			}
		}
	},
}, {
	tableName: 'fitness_center_membership_details',
	timestamps: false,
});