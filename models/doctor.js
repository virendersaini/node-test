"use strict";

const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("hospital", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
      userId: {
      type: DataTypes.INTEGER
    },
      countryId	: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
   stateId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    cityId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    zipcode: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
     hospital_logo: {
      type: DataTypes.STRING
    },
    lat: {
      type: DataTypes.STRING,
    },
    long: {
      type: DataTypes.STRING,
    },
is_active: {
      type: DataTypes.INTEGER,
    },

  },{
    tableName: 'hospitals',
  });
  return Model;
};

