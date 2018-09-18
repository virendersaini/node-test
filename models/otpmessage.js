"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("otpmessage", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    mobile: {
      type: DataTypes.INTEGER,
    },
    otp: {
      type: DataTypes.INTEGER,
    },
    attempt: {
      type: DataTypes.INTEGER,
    }
  },{
    tableName: 'otp_messages',
  });
  return Model;
};
