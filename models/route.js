"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("route", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    masterId: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        isExist: function(value , next){
          this.Model.find({where:{id:{$ne: this.id}, name:value, masterId:this.masterId}}).then(function(data){
            if (data !== null) {
                next('isUnique');
            } else {
                next();
            }
          });
        },
        isLocation:function(value, next){
          if (value !== '' && this.routeaddresse === '') {
            next('atLeastOneLocation');
          } else {
            next();
          }
        }
      }
    },
    is_active: {
      type: DataTypes.STRING
    },
    routeaddresse: {
      type: DataTypes.VIRTUAL
    }
  },{
    tableName: 'routes'
});
  return Model;
}
