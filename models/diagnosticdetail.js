'use strict';
var mongo = require('../config/mongo');
module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('diagnosticdetail', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        diagnosticId: {
            type: DataTypes.INTEGER
        },
        languageId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        about_lab: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        address_line_1: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        }
    }, {
        hooks: {
            afterUpdate: function(reqData, options){
             return sequelize.models.doctorprofile.mongo_update(reqData.doctorProfileId, options);
          }
          },
        tableName: 'diagnostic_details',
        timestamps: false
    });
    return Model;
};