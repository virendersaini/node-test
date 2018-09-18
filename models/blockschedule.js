"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("blockschedule", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        hospitalDoctorId: {
            type: DataTypes.INTEGER
        },
        doctorProfileId: {
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
        tableName: 'block_schedules'
    });
    return Model;
};
