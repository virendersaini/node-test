"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("language", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isExist: function(value , next){
          this.Model.find({where:{id:{$ne: this.id}, name:value}}).then(function(data){
            if (data !== null) {
                next('isUnique');
            } else {
                next();
            }
          });
        }
      }
    },
    code: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isExist: function(value , next){
          this.Model.find({where:{id:{$ne: this.id}, code:value}}).then(function(data){
            if (data !== null) {
                next('isUnique');
            } else {
                next();
            }
          });
        }
      }
    },
    direction: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    is_active: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'languages'
  });
  return Model;
};

