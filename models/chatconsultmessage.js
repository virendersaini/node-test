'use strict';
const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;
module.exports = (sequelize, DataTypes) => sequelize.define('chatconsultmessage', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	chatconsultId: {
		type: DataTypes.INTEGER,
	},
	sender: {
		type: DataTypes.INTEGER,
	},
	status: {
		type: DataTypes.INTEGER,
	},
	type: {
		type: DataTypes.INTEGER,
	},
	data: {
		type: DataTypes.TEXT,
	},
}, {
	tableName: 'chat_consult_messages'
});