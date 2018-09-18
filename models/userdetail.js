"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("userdetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    fullname: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
  },{
    tableName: 'user_details',
    timestamps: false,
  });
  return Model;
};
