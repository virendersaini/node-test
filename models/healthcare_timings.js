"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("healthcare_timings", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    healthcareprofileId	: {
      type: DataTypes.INTEGER,
    },
    days : {
      type: DataTypes.STRING,
    },
    from_time	: {
      type: DataTypes.STRING,
    },
    to_time	: {
      type: DataTypes.STRING,
    },
    from_time_sec : {
      type: DataTypes.STRING,
    },
    to_time_sec : {
      type: DataTypes.STRING,
    },
    fee	: {
      type: DataTypes.STRING,
    },
    type	: {
      type: DataTypes.STRING,
    },
    avb_on	: {
      type: DataTypes.STRING,
    }
  },{
    engine: 'InnoDB',
    tableName: 'healthcare_timings',
  });
  return Model;
};
