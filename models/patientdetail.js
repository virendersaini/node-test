"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("patientdetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },

    address: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    current_medication: {
      type: DataTypes.INTEGER
    },
    past_medication: {
      type: DataTypes.INTEGER
    },


  },{
    tableName: 'patient_details',
    timestamps: false,
  });
  return Model;
};
