'use strict';

const email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

module.exports = (sequelize, DataTypes) => sequelize.define('fitnesscentercontact', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	fitnesscenterId: {
		type: DataTypes.INTEGER,
	},
	type: {
		type: DataTypes.INTEGER,
	},
	value: {
		type: DataTypes.STRING,
		validate: {
			notEmpty: {
				msg: 'isRequired',
			},
			validateformat: function (value, next) {
				if (!value) {
					next();
					return;
				}
				if (this.type == 0 && !/\d{6,15}$/.test(value)) {
					next('notValidMobile');
					return;
				}
				if (this.type == 1 && !email.test(value)) {
					next('Email is not valid.');
				}
				next();
			}
		},
	},
	primary: {
		type: DataTypes.BOOLEAN,
	},
}, {
	tableName: 'fitness_center_contacts',
	timestamps: false,
});