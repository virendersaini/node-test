"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("globalcommission", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
    },
    percentage: {
      type: DataTypes.DECIMAL,
    }
  },{
    tableName: 'global_commissions',
  });
  return Model;
};
