module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('hospitalaward', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        hospitalId: {
            type: DataTypes.INTEGER,
        },
        award_year: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        award_gratitude_title: {
            type: DataTypes.VIRTUAL,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        }
    }, {
        tableName: 'hospital_awards'
    });
    return Model;
};
