"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("emailprovider", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email_provider: {
      type: DataTypes.STRING
    },
    display_name: {
      type: DataTypes.STRING
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'email_providers',
    timestamps: false
  });
  return Model;
};

