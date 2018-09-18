'use strict';
const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;
module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('doctoreducation', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        doctorProfileId: {
            type: DataTypes.INTEGER,
        },
        is_new: {
            type: DataTypes.INTEGER,
        },
        tagtypeId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        year_of_passing: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        college_name: {
            type: DataTypes.VIRTUAL,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        edu_proof: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        edu_proof_file_name: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }  
        },
        is_created_after_live: {
            type: DataTypes.INTEGER
        }
    }, {
        tableName: 'doctor_educations',
        hooks: {
            beforeUpdate: [makeOptimizerHook('edu_proof', false)],
            beforeCreate: [makeOptimizerHook('edu_proof', false)]
        },
    });
    return Model;
};