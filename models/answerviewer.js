"use strict";
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("answerviewer", {
    patientId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    questionanswerId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },{
    tableName: 'answer_viewers',
    timestamps: false,
  });
  return Model;
};
