"use strict";

const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("healthcarefile", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        healthcareProfileId: {
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
        is_active: {
            type: DataTypes.INTEGER,
        },
    },{
        tableName: 'healthcare_files',
        hooks: {
            // beforeUpdate: [makeOptimizerHook('doctor_files', false)],
            // beforeCreate: [makeOptimizerHook('doctor_files', false)]
        }
    });
    return Model;
};
