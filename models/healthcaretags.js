'use strict';

module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('healthcaretags', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        healthcareProfileId: {
            type: DataTypes.INTEGER
        },
        tagId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        tagtypeId: {
            type: DataTypes.INTEGER
        }
    }, {
        tableName: 'healthcare_tags'
    });
    return Model;
};