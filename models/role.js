"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("role", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    slug: {
      type: DataTypes.STRING
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'roles'
  });
  return Model;
};

