"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("roledetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    roleId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        isExist: function(value , next){
          if(this.languageId == 1){
            var langCondition = this.languageId;
          }else{
            var langCondition = {$in:[this.languageId, 1]};
          }
          this.Model.find({where:{id:{$ne: this.id}, name:value, languageId:langCondition, masterId:this.masterId}}).then(function(data){
            if (data !== null) {
                next('isUnique');
            } else {
                next();
            }
          });
        }
      }
    },
    masterId: {
      type: DataTypes.INTEGER
    },
  },{
    tableName: 'role_details',
    timestamps: false,
  });
  return Model;
};
