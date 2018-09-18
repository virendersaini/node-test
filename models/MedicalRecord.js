"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("MedicalRecord", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    patientId	: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    date	: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
  },{
    tableName: 'medical_records',
  });
  return Model;
};
