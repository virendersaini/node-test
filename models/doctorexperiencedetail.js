module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('doctorexperiencedetail', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        doctorExperienceId: {
            type: DataTypes.INTEGER
        },
        languageId: {
            type: DataTypes.INTEGER
        },
        clinic_hospital_name: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        city_name: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        }
    }, {
        tableName: 'doctor_experience_details'
    });
    return Model;
};