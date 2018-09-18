"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("mappedtag", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        specializationTagId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        problemtypeTagId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        }
    },{
        tableName: 'mapped_tags'
    });
    return Model;
};

