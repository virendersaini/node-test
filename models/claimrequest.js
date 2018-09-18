'use strict';

module.exports = function(sequelize, DataTypes) {
    var Model = sequelize.define('claimrequest', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER
        },
        keyId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        model: {
            type: DataTypes.STRING
        },
        status: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'claim_requests'
    });
    return Model;
};