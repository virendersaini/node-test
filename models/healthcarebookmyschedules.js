'use strict';

module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('healthcarebookmyschedules', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        patientId: {
            type: DataTypes.INTEGER
        },
        healthcareProfileId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        total_amu: {
            type: DataTypes.STRING
        },
        status: {
            type: DataTypes.INTEGER
        }
    }, {
        tableName: 'healthcare_book_myschedules'
    });
    return Model;
};