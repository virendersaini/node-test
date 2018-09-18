'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('fitnesscenterdetail', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	fitnesscenterId: {
		type: DataTypes.INTEGER,
	},
	languageId: {
		type: DataTypes.INTEGER,
	},
	name: {
		type: DataTypes.STRING,
		validate: {
			notEmpty: {
				msg: 'isRequired',
			}
		},
	},
	address: {
		type: DataTypes.STRING,
		validate: {
			notEmpty: {
				msg: 'isRequired',
			}
		},
	},
	about: {
		type: DataTypes.STRING,
		validate: {
			notEmpty: {
				msg: 'isRequired',
			}
		},
	},
	registration_name: {
		type: DataTypes.STRING,
		validate: {
			notEmpty: {
				msg: 'isRequired',
			}
		},
	},
}, {
	tableName: 'fitness_center_details',
	timestamps: false,
});