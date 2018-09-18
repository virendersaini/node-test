"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("rolepermission", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    permissionId: {
      type: DataTypes.INTEGER
    },
    roleId: {
      type: DataTypes.INTEGER
    },
    module_name: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'role_permissions',
    timestamps: false,
  });
  return Model;
};

