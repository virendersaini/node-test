"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("patientcart", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
   patientId: {
      type: DataTypes.INTEGER
    }, 
    medicineId: {
      type: DataTypes.INTEGER
    },
    qty: {
      type: DataTypes.INTEGER
    },
    prescription_image: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'patient_carts',
  });
  return Model;
};
