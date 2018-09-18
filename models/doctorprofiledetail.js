'use strict';
var mongo = require('../config/mongo');
module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('doctorprofiledetail', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        doctorProfileId: {
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
        about_doctor: {
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
                return sequelize.models.doctorprofile.mongo_update({id: reqData.doctorProfileId, lang: options.lang, langId: options.langId, languageId: options.langId}, options);
             //return sequelize.models.doctorprofile.mongo_update(reqData.doctorProfileId, options);
          }
          },
        tableName: 'doctor_profile_details',
        timestamps: false
    });
    return Model;
};