"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("subscriptionplan", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    type: {
      type: DataTypes.STRING,
    },
    monthly_amount: {
      type: DataTypes.DECIMAL,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isValid: function(value, next){
          let val = parseFloat(value);
          if(value !== '' && isNaN(value)) {
            next('Invalid Number.');
          } else {
            next();
          }
        }
      }
    },
    quaterly_amount: {
      type: DataTypes.DECIMAL,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isValid: function(value, next){
          let val = parseFloat(value);
          if(value !== '' && isNaN(value)) {
            next('Invalid Number.');
          } else {
            next();
          }
        }
      }
    },
    yearly_amount: {
      type: DataTypes.DECIMAL,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isValid: function(value, next){
          let val = parseFloat(value);
          if(value !== '' && isNaN(value)) {
            next('Invalid Number.');
          } else {
            next();
          }
        }
      }
    },
  },{
    tableName: 'subscription_plans',
  });
  return Model;
};
