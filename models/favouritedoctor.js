"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("favouritedoctor", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.INTEGER
    },
    doctorProfileId: {
      type: DataTypes.INTEGER
    },
    is_favourite: {
      type: DataTypes.INTEGER
    }
  },{
    tableName: 'favourite_doctors'
  });
  return Model;
};

