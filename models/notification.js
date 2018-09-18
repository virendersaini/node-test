"use strict";
module.exports=  function(sequelize, DataTypes){
	var Model = sequelize.define("notification", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		senderId: {
			type: DataTypes.INTEGER
		},
		type: {
			type: DataTypes.STRING
		},
		message: {
			type: DataTypes.STRING
		},
		meta: {
			type: DataTypes.STRING
		}
	},{
		tableName: 'notifications'
	});
	return Model;
};

