"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("currency", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    currency_name: {
      type: DataTypes.STRING
    },
    currency_symbol: {
      type: DataTypes.STRING
    },
    display_name: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'currencies',
    timestamps: false
  });
  return Model;
};

