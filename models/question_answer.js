"use strict";
module.exports=  function(sequelize, DataTypes){
	var Model = sequelize.define("question_answer", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		doctorprofileId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
	   
		patientquestionId: {
			type: DataTypes.INTEGER,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		answer: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		is_for_profile: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		type: {
			type: DataTypes.STRING,
		},
	},{
		tableName: 'question_answers'
	});
	return Model;
};
