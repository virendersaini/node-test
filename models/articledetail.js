"use strict";

module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("articledetail", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        languageId: {
            type: DataTypes.INTEGER
        },
        articleId: {
            type: DataTypes.INTEGER
        },
        title: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        body: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        }
    },{
        tableName: 'article_details',
        timestamps: false,
    });
    return Model;
};

