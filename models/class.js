"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("classes", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    display_order: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isInt:{
          min:0,
          msg:'isInt'
        }
      }
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'classes'
  });
  return Model;
};
