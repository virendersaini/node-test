'use strict';
module.exports = function (sequelize, DataTypes) {
    var OAuthClient = sequelize.define('oauthclient', {}, {
        classMethods: {
            associate: function (models) {
                // associations can be defined here
            }
        },
        freezeTableName: true,
        tableName: 'oauth_clients'
    });
    return  OAuthClient;
};
