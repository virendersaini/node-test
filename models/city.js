"use strict";
var _ = require('lodash');
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("city", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    countryId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    stateId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg:'isRequired'
        }
      }
    },
    alias: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg:'isRequired'
        },
        //isUnique: sequelize.validateIsUnique('alias', 'alreadyExist')
      }
    },
    is_active: {
      type: DataTypes.STRING
    },
    latitude: {
      type: DataTypes.STRING
    },
    longitude: {
      type: DataTypes.STRING
    }
  },{
    tableName: 'cities',
    classMethods : {
      associate(){
        Model.hasOne(sequelize.models.citydetail, {foreignKey: 'cityId', as: 'citydetail'})
      },
      get_list : function (req, res) {
        
        var citydetail = Model.hasOne(sequelize.models.citydetail, {foreignKey: 'cityId', as: 'citydetail'})

        let cityDetailCond = new Object;

        if(req.language !== undefined && req.language.id > 0){
          cityDetailCond['languageId'] = req.language.id;
        } else {
          cityDetailCond['languageId'] = req.langId;
        }

        Model.findAll({
          attributes: ['id', 'is_active'],
          where : { 'is_active' : 1 },
          distinct: true,
          include : [{
            association: citydetail,
            attributes : ["cityId", "languageId", "name"],
            required: true,
            where : cityDetailCond
          }]
        }).then(function (response) {

          let cityResObj = JSON.parse(JSON.stringify(response)), city_list = [];
          
          if(!_.isEmpty(cityResObj)){

            cityResObj.map(function (single) {
              city_list.push({ value: single.id, label: single.citydetail.name });
            });

            return res({status: true,
              all_city_list: city_list,
            });
          } 

        })//.catch(sequelize.ValidationError, function (err) {
          // return res({status : false, message : err.errors});
        //}).catch(function (err) {
          // return res({status : false, message: "Internal error" });
        //});
      }
    }
  });
  return Model;
};
