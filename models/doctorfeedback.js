"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("doctorfeedback", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        doctorProfileId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        hospitalId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        patientId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        appointmentId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        rating: {
            type: DataTypes.FLOAT,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        feedback: {
            type: DataTypes.STRING,
        },
        is_approved: {
            type: DataTypes.STRING,
        }
    },{
        tableName: 'doctor_feedbacks'
    });
    return Model;
};
