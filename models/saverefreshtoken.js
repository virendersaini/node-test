'use strict';
module.exports = function (sequelize, DataTypes) {
    var SaveRefreshToken = sequelize.define('saverefreshtoken', {
        refresh_token: DataTypes.STRING,
        client_id: DataTypes.STRING,
        user_id: DataTypes.INTEGER,
        expires: DataTypes.DATE,
        device_type: DataTypes.STRING,
    }, {
        classMethods: {
            associate: function (models) {
                SaveRefreshToken.belongsTo(models.oauthclient, {
                    foreignKey: 'client_id',
                });

                SaveRefreshToken.belongsTo(models.user, {
                    foreignKey: 'user_id',
                });
            }
        },
        freezeTableName: true,
        tableName: 'oauth_refresh_tokens'
    });

    SaveRefreshToken.removeAttribute('id');
    return  SaveRefreshToken;
};

