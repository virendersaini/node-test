'use strict';
module.exports = function (sequelize, DataTypes) {
    var OAuthAccessToken = sequelize.define('oauthaccesstoken', {
        access_token: DataTypes.STRING,
        client_id: DataTypes.STRING,
        user_id: DataTypes.INTEGER,
        expires: DataTypes.DATE,
        device_type: DataTypes.STRING,
    }, {
        classMethods: {
            associate: function (models) {
                OAuthAccessToken.belongsTo(models.oauthclient, {
                    foreignKey: 'client_id',
                });

                OAuthAccessToken.belongsTo(models.user, {
                    foreignKey: 'user_id',
                });
            }
        },
        freezeTableName: true,
        tableName: 'oauth_access_tokens'
    });

    OAuthAccessToken.removeAttribute('id');
    return  OAuthAccessToken;
};

