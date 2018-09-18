"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("feedback", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    userId: {
      type: DataTypes.INTEGER
    },
    subject: {
      type: DataTypes.INTEGER
    },
    message: {
      type: DataTypes.INTEGER
    }
  },{
    tableName: 'feedbacks'
  });
  return Model;
};

