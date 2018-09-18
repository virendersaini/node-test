'use strict';

module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('doctortags', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        doctorProfileId: {
            type: DataTypes.INTEGER
        },
        tagId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        tagtypeId: {
            type: DataTypes.INTEGER
        },
        is_created_after_live: {
            type: DataTypes.INTEGER  
        }
    }, {
        tableName: 'doctor_tags'
    });
    return Model;
};