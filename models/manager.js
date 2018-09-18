"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("manager", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    module_name: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'managers',
    timestamps: false
  });
  return Model;
};

