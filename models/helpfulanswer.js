"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("helpfulanswer", {
    patientId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    questionanswerId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    is_helpful: {
      type: DataTypes.INTEGER,
    },
  },{
    tableName: 'helpful_answers',
    timestamps: false,
  });
  return Model;
};
