"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("routeaddress", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    routeId: {
      type: DataTypes.INTEGER
    },
    address: {
      type: DataTypes.STRING
    },
    lat: {
      type: DataTypes.STRING
    },
    lang: {
      type: DataTypes.STRING
    },
    position: {
      type: DataTypes.INTEGER
    }
  },{
    tableName: 'route_addresses',
    timestamps: false
});
  return Model;
}
