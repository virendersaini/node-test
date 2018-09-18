"use strict";
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("healthcaremyschedule", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        healthcareProfileId: {
            type: DataTypes.STRING
        },
        patientId: {
            type: DataTypes.STRING
        },
        payment_data: {
            type: DataTypes.STRING
        },
        order_token: {
            type: DataTypes.STRING
        },
        healthcare_refund_status: {
            type: DataTypes.STRING
        },
        is_cancel: {
            type: DataTypes.STRING
        },
        admin_pay_ref_no: {
            type: DataTypes.STRING
        },
        admin_pay: {
            type: DataTypes.STRING
        },
        admin_pay_amu: {
            type: DataTypes.STRING
        },
        refund_status: {
            type: DataTypes.STRING
        },
        healthcare_refund_status: {
            type: DataTypes.STRING
        },
        refund_ref_no: {
            type: DataTypes.STRING
        },
        pay_status: {
            type: DataTypes.STRING
        },
        service_type: {
            type: DataTypes.STRING
        },
        avb_on: {
            type: DataTypes.STRING
        },
        refund_amount: {
            type: DataTypes.STRING
        },
        refund_before_start: {
            type: DataTypes.STRING
        },
        total_amu: {
            type: DataTypes.STRING
        },
        com_amu: {
            type: DataTypes.STRING
        },
        final_amu: {
            type: DataTypes.STRING
        },
        refund_reason: {
            type: DataTypes.STRING
        },
        concern: {
            type: DataTypes.STRING
        },
        pay: {
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
        suggestion: {
            type: DataTypes.STRING
        },
        time_sec: {
            type: DataTypes.STRING
        }

    },{
        tableName: 'healthcare_myschedules'
    });
    return Model;
};
