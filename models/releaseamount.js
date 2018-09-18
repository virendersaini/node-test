"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("releaseamount", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    doctorprofileId: {
      type: DataTypes.INTEGER,
    },
    total_amount: {
      type: DataTypes.DECIMAL,
    },
    commision_amount: {
      type: DataTypes.DECIMAL,
    },
    release_amount: {
      type: DataTypes.DECIMAL,
    },
    reference_no: {
      type: DataTypes.STRING,
    },
    commission_rate: {
      type: DataTypes.INTEGER,
    },
  },{
    tableName: 'release_amounts',
  });
  return Model;
};
