'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('chatconsult', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	doctorprofileId: {
		type: DataTypes.INTEGER,
	},
	patientId: {
		type: DataTypes.INTEGER,
	},
	tagId: {
		type: DataTypes.INTEGER,
	},
	name: {
		type: DataTypes.STRING,
	},
	age: {
		type: DataTypes.INTEGER,
	},
	gender: {
		type: DataTypes.INTEGER,
	},
	contact: {
		type: DataTypes.STRING,
	},
	title: {
		type: DataTypes.STRING,
	},
	description: {
		type: DataTypes.TEXT,
	},
	image: {
		type: DataTypes.STRING,
	},
}, {
	tableName: 'chat_consults',
});