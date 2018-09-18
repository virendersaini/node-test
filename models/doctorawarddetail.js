module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('doctorawarddetail', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        doctorAwardId: {
            type: DataTypes.INTEGER
        },
        languageId: {
            type: DataTypes.INTEGER
        },
        award_gratitude_title: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        }
    }, {
        tableName: 'doctor_award_details'
    });
    return Model;
};