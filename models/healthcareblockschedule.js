"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("healthcareblockschedule", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        hospitalDoctorId: {
            type: DataTypes.INTEGER
        },
        healthcareProfileId: {
            type: DataTypes.STRING
        },
        from_date: {
            type: DataTypes.STRING
        },
        to_date: {
            type: DataTypes.STRING
        },
        leave_details: {
            type: DataTypes.STRING
        }
    },{
        tableName: 'healthcare_block_schedules'
    });
    return Model;
};
