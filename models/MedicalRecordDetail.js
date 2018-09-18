"use strict";
module.exports = function (sequelize, DataTypes) {
    var Model = sequelize.define("MedicalRecordDetail", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        languageId: {
            type: DataTypes.INTEGER
        },
        medicalRecordId: {
            type: DataTypes.INTEGER
        },
        title	: {
            type: DataTypes.INTEGER,
            validate: {
              notEmpty: {
                msg:'isRequired'
              }
            }
          },
          patient_name	: {
            type: DataTypes.INTEGER,
            validate: {
              notEmpty: {
                msg:'isRequired'
              }
            }
          },
    }, {
        tableName: 'medical_record_details',
    });
    return Model;
};
