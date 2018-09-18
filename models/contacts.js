"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("contacts", {
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
        }
      }
    },
    mobile: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isValid:function(value, next){
          if(value !==''){
            var mob = /^\d{6,15}$/;
            if (mob.test(value)===false) {
              next('notValidMobile');
            } else {
              next();
            }
          }else{
            next();
          }
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        isEmail: {
          msg: 'isEmail'
        }
      }
    },
    query: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    }
  },{
    tableName: 'contacts'
  });
  return Model;
};

