"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("country", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    currencyId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    code: {
      type: DataTypes.STRING(2),
      allowNull: true,
      isUnique: true,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isUnique: sequelize.validateIsUnique('code', 'alreadyExist')
      }
    },
    iso_code: {
      type: DataTypes.STRING(2),
      allowNull: true,
      isUnique: true,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isUnique: sequelize.validateIsUnique('iso_code', 'alreadyExist')
      }
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'countries'
  });
  return Model;
};

