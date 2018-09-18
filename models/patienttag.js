"use strict";

//const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("patienttag", {
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
  tagId	: {
  type: DataTypes.INTEGER,
  /*validate: {
    notEmpty: {
      msg:'isRequired'
    }
  }*/
},
tagtypeId	: {
type: DataTypes.INTEGER,
/*validate: {
  notEmpty: {
    msg:'isRequired'
  }
}*/
},
  },{
    tableName: 'patient_tags',
  });
  return Model;
};
