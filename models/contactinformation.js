'use strict';
var _ = require('lodash');
module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('contactinformation', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        key: {
            type: DataTypes.INTEGER,
        },
        model: {
            type: DataTypes.STRING,
        },
        type: {
            type: DataTypes.STRING,
        },
        value: {
            type: DataTypes.STRING,
            validate: {
                isValid: function(value, next) {
                    if(this.type === "email") {
                        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        if(value !=='' && !re.test(value)){
                            return next('isEmail');
                        }
                        return next();
                    }
                    if(this.type === "mobile") {
                        if(isNaN(value)) {
                            return next('notValidMobile');
                        }
                        return next();
                    }
                },
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        status: {
            type: DataTypes.INTEGER
        },
        is_primary: {
            type: DataTypes.INTEGER
        }
    }, {
        tableName: 'contact_informations'
    });
    return Model;
};
