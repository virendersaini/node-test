"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("subscriptionplandetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    subscriptionplanId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    features: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
  },{
    tableName: 'subscription_plan_details',
    timestamps: false,
  });
  return Model;
};
