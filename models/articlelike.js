"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("articlelike", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        keyId: {
            type: DataTypes.INTEGER
        },
        articleId: {
            type: DataTypes.INTEGER
        },
    },{
        tableName: 'article_likes'
    });
    return Model;
};
