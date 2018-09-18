"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("state", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    countryId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    code: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    alias: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isUnique: sequelize.validateIsUnique('alias', 'alreadyExist')
      }
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'states'
  });
  return Model;
};

