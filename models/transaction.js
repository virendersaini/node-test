"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("transaction", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    chatconsultId: {
      type: DataTypes.INTEGER,
    },
    transaction_id: {
      type: DataTypes.INTEGER,
    },
    amount: {
      type: DataTypes.DECIMAL,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    meta: {
      type: DataTypes.STRING,
    },
    payment_status: {
      type: DataTypes.STRING,
    },
    is_released: {
      type: DataTypes.INTEGER,
    },
    ref_id: {
      type: DataTypes.STRING,
    }
  },{
    tableName: 'transactions',
  });
  return Model;
};
