"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("healthcarefeedback", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        healthcareProfileId: {
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
        rating: {
            type: DataTypes.FLOAT,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        order_token: {
            type: DataTypes.STRING,
        },
        feedback: {
            type: DataTypes.STRING,
        },
        is_approved: {
            type: DataTypes.STRING,
        }
    },{
        tableName: 'healthcare_feedbacks'
    });
    return Model;
};
