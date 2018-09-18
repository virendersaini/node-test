"use strict";

module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("countrydetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    countryId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        isUnique: function(value, next){
          if(this.languageId == 1){
            var langCondition = this.languageId;
          }else{
            var langCondition = {$in:[this.languageId, 1]};
          }
          this.Model.find({where:{id:{$ne: this.id}, name:value, languageId:langCondition}}).then(function(data){
            if(data !==null){
              return next('alreadyExist');
            } else{
              return next();
            }
          });
        }
      }
    }
  },{
    tableName: 'country_details',
    timestamps: false,
  });
  return Model;
};

