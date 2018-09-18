"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("subscriber", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
    },
    subscriptionplanId: {
      type: DataTypes.INTEGER,
    },
    start_date: {
      type: DataTypes.DATE,
       validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    end_date: {
      type: DataTypes.DATE,
       validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    amount: {
      type: DataTypes.DECIMAL,
    },
    transaction_id: {
      type: DataTypes.STRING,
    },
    payment_status: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.STRING,
    }
  },{
    tableName: 'subscribers',
  });
  return Model;
};
