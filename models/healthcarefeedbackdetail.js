"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("healthcarefeedbackdetail", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        healthcareFeedbackId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        feedback: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        languageId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
    },{
        tableName: 'healthcare_feedback_details'
    });
    return Model;
};
