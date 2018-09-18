"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("doctorspecificcommission", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    doctorprofileId: {
      type: DataTypes.INTEGER,
    },
    percentage: {
      type: DataTypes.DECIMAL,
    },
    type: {
      type: DataTypes.STRING,
    }
  },{
    tableName: 'doctor_specific_commissions',
  });
  return Model;
};
