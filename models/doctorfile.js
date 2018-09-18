"use strict";

const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("doctorfile", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        doctorProfileId: {
            type: DataTypes.INTEGER
        },
        document_type: {
            type: DataTypes.STRING  
        },
        doctor_files: {
            type: DataTypes.STRING
        },
        original_name: {
            type: DataTypes.STRING
        },
        file_type: {
            type: DataTypes.STRING,
        },
        is_created_after_live: {
            type: DataTypes.INTEGER,  
        },
        is_active: {
            type: DataTypes.INTEGER,
        },
    },{
        tableName: 'doctor_files',
        hooks: {
            beforeUpdate: [makeOptimizerHook('doctor_files', false)],
            beforeCreate: [makeOptimizerHook('doctor_files', false)]
        }
    });
    return Model;
};
