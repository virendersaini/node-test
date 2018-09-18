'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('fitnesscenterfeedback', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	fitnesscenterId: {
		type: DataTypes.INTEGER,
	},
	patientId: {
		type: DataTypes.INTEGER,
	},
	rating: {
	    type: DataTypes.FLOAT,
	    validate: {
	        notEmpty: {
	            msg:'isRequired'
	        }
	    }
	},
	feedback: {
	    type: DataTypes.STRING,
	},
	is_approved: {
	    type: DataTypes.INTEGER,
	},
}, {
	tableName: 'fitness_center_feedbacks',
});