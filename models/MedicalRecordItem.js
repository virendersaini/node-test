"use strict";
module.exports = function (sequelize, DataTypes) {
    var Model = sequelize.define("MedicalRecordItem", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        medical_record_type	: {
            type: DataTypes.INTEGER,
            validate: {
              notEmpty: {
                msg:'isRequired'
              }
            }
          },
          medicalRecordId: {
            type: DataTypes.STRING
        },
        img: {
            type: DataTypes.STRING
        },
    }, {
        tableName: 'medical_record_items',
    });
    return Model;
};
