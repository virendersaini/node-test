"use strict";

//const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("hospitalservice", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    hospitalId: {
     type: DataTypes.STRING
   },
  tagId	: {
  type: DataTypes.INTEGER,
  validate: {
    notEmpty: {
      msg:'isRequired'
    }
  }
},
    tagtypeId: {
     type: DataTypes.STRING
   },
   is_created_after_live: {
    type: DataTypes.INTEGER,
   }
  },{
    tableName: 'hospital_services',
  });
  return Model;
};
