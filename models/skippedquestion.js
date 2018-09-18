"use strict";

module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("skippedquestion", {
        doctorprofileId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        patientquestionId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
    },{
        tableName: 'skipped_questions',
        timestamps: false,
    });
    return Model;
};

