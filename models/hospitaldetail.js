"use strict";
var mongo = require('../config/mongo');
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("hospitaldetail", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    hospitalId: {
      type: DataTypes.INTEGER
    },
    languageId: {
      type: DataTypes.INTEGER
    },
    hospital_name: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    about_hospital: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    address: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    contact_emails: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    contact_mobiles: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
  
  },{

    hooks: {
      afterUpdate: function(reqData, options){
        //return sequelize.models.hospital.mongo_update(reqData.hospitalId, options);
       return sequelize.models.hospital.mongo_update({id: reqData.hospitalId, lang: reqData.lang, langId: reqData.langId}, options);
    }
    },
    tableName: 'hospital_details',
    timestamps: false,
  });
  return Model;
};

