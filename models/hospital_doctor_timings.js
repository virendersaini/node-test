"use strict";

module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("hospital_doctor_timings", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        hospitalDoctorId: {
            type: DataTypes.INTEGER,
            // validate: {
            //     notEmpty: {
            //         msg: 'isRequired'
            //     }
            // }
            
        },
        days: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        shift_1_from_time: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        shift_1_from_key: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        shift_1_to_time: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        shift_1_to_key: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        shift_2_from_time: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        shift_2_from_key: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        shift_2_to_time: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
        shift_2_to_key: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg: 'isRequired'
                }
            }
        },
    }, {
        engine: 'InnoDB',
        tableName: 'hospital_doctor_timings',
    });
    return Model;
};
