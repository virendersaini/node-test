"use strict";

module.exports= function(sequelize, DataTypes){
	var Model = sequelize.define("notificationreceiver", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		receiverId: {
			type: DataTypes.INTEGER
		},
		status: {
			type: DataTypes.STRING
		},
	},{
		tableName: 'notification_receivers',
		timestamps: false,
	});
	return Model;
};
