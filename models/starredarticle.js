"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("starredarticle", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        keyId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        articleId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        }
    },{
        tableName: 'starred_articles'
    });
    return Model;
};
