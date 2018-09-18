'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('fitnesscenter', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	userId: {
		type: DataTypes.INTEGER,
	},
	countryId: {
		type: DataTypes.INTEGER,
		validate: {
			notEmpty: {
				msg: 'isRequired',
			}
		},
	},
	stateId: {
		type: DataTypes.INTEGER,
		validate: {
			notEmpty: {
				msg: 'isRequired',
			}
		},
	},
	cityId: {
		type: DataTypes.INTEGER,
		validate: {
			notEmpty: {
				msg: 'isRequired',
			}
		},
	},
	type: {
		type: DataTypes.INTEGER,
		validate: {
			notEmpty: {
				msg: 'isRequired',
			}
		},
	},
	zipcode: {
		type: DataTypes.INTEGER,
		validate: {
			notEmpty: {
				msg: 'isRequired',
			}
		},
	},
	location: {
		type: DataTypes.GEOMETRY,
	},
	registration_number: {
		type: DataTypes.STRING,
		validate: {
			notEmpty: {
				msg: 'isRequired',
			}
		},
	},
	registration_date: {
		type: DataTypes.DATEONLY,
		validate: {
			notEmpty: {
				msg: 'isRequired',
			}
		},
	},
	profile_pic: {
		type: DataTypes.STRING,
		validate: {
			notEmpty: {
				msg: 'isRequired',
			}
		},
	},
	is_active: {
		type: DataTypes.INTEGER,
	},
	is_complete: {
		type: DataTypes.INTEGER,
	},
	is_live: {
	    type: DataTypes.INTEGER,
	},
	verified_status: {
		type: DataTypes.STRING,
	},
	live_from: {
		type: DataTypes.DATEONLY
	},
}, {
	tableName: 'fitness_centers',
});