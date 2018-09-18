"use strict";

const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("hospitalfile", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
      hospitalId: {
      type: DataTypes.INTEGER
    },
     hospital_files: {
      type: DataTypes.STRING
    },
    original_name: {
     type: DataTypes.STRING
   },
    file_type: {
      type: DataTypes.STRING,
    },
    document_type: {
      type: DataTypes.STRING,
    },
    is_created_after_live: {
      type: DataTypes.INTEGER,  
    },
    is_active: {
      type: DataTypes.INTEGER,
    },

  },{
    tableName: 'hospital_files',
    hooks: {
      beforeUpdate: [makeOptimizerHook('hospital_files', false)],
      beforeCreate: [makeOptimizerHook('hospital_files', false)],
    }
  });
  return Model;
};
