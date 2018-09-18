"use strict";

module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("hospital_doctors", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        doctorProfileId	: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        hospitalId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        consultation_charge : {
            type: DataTypes.DECIMAL,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                },
                correct: function(value, next) {
                    if(isNaN(value)) next('Please enter a valid amount.');
                    if(!/^\d{1,6}$/.test(value)) next('File Fees cannot be more than 6 digits.');
                    next();
                }
            }
        },
        appointment_duration: {
            type: DataTypes.DECIMAL,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        available_on_req: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        }
    }, {
        engine: 'InnoDB',
        tableName: 'hospital_doctors',
        hooks: {
            afterCreate: function(reqData, options){
                //Model.mongo_update(reqData,options);
            }
        },
        classMethods:{
            checkLiveHospital:function(req,res){
                Model.sequelize.query(
                    'SELECT count(*) as live_hospital from hospital_doctors left join hospitals'
                    +' on(hospital_doctors.hospitalId = hospitals.id)'
                    +' where hospital_doctors.doctorProfileId=' + req.id 
                    +' hospital_doctors.doctorProfileId=' + req.hospitalId
                    +' and hospitals.is_active=1 and hospitals.is_live=1', {
                        type: Model.sequelize.QueryTypes.SELECT
                    }).then(function(data) {
                    res(data);
                })
            },
        }
    });
    return Model;
};
