"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("releaseamountrecord", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    releaseamountId: {
      type: DataTypes.INTEGER,
    },
    transactionId: {
      type: DataTypes.INTEGER,
    }
  },{
    tableName: 'release_amount_records',
    timestamps: false,
  });
  return Model;
};
