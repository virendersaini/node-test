module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('doctorexperience', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        doctorProfileId: {
            type: DataTypes.INTEGER,
        },
        designation: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        duration_from: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        duration_to: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                },
                isGreaterThanDUrationFrom: function(value, next) {
                    if(this.duration_from && value && this.duration_from > value) {
                        return next('greaterOrEqualToDurationFrom')
                    } else {
                        return next();
                    }
                }
            }
        },
        clinic_hospital_name: {
            type: DataTypes.VIRTUAL,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        city_name: {
            type: DataTypes.VIRTUAL,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        }
    }, {
        tableName: 'doctor_experiences'
    });
    return Model;
};