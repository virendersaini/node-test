'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('fitnesscentermembership', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	fitnesscenterId: {
		type: DataTypes.INTEGER,
	},
	duration: {
		type: DataTypes.INTEGER,
		validate: {
			notEmpty: {
				msg: 'isRequired',
			},
			is: {
				args: [/^\d\d?$/],
				msg: 'Duration must be in numbers(max 2 digits).',
			}
		}
	},
	cost: {
		type: DataTypes.DECIMAL(10, 2),
		validate: {
			notEmpty: {
				msg: 'isRequired'
			},
			correct: function(value, next) {
				if(!/^\d+(?:\.\d\d?)?$/.test(value)) next('Cost must be numeric.');
                if(!/^\d{1,6}$/.test(value)) next('It cannot be more than 6 digits.');
                next();
            },
		},
	},
}, {
	tableName: 'fitness_center_memberships',
});