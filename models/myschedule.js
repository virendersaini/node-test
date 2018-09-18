"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("myschedule", {
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
        patientId: {
            type: DataTypes.STRING
        },
        hospitalId: {
            type: DataTypes.STRING
        },
        book_date: {
            type: DataTypes.STRING
        },
        from_time: {
            type: DataTypes.STRING
        },
        to_time: {
            type: DataTypes.STRING
        },
        patient_name: {
            type: DataTypes.STRING
        },
        phone_code: {
            type: DataTypes.INTEGER
        },
        patient_mobile: {
            type: DataTypes.STRING
        },
        patient_email: {
            type: DataTypes.STRING
        },
        status: {
            type: DataTypes.STRING
        },
        status_updated_by: {
            type: DataTypes.STRING
        },
        status_update_by_user: {
            type: DataTypes.STRING
        },
        suggestion: {
            type: DataTypes.STRING
        },
        time_sec: {
            type: DataTypes.STRING
        }

    },{
        tableName: 'myschedules'
    });
    return Model;
};
