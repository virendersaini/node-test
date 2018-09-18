"use strict";
module.exports=  function(sequelize, DataTypes){
	var Model = sequelize.define("onlineconsultsetting", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		doctorprofileId: {
			type: DataTypes.INTEGER,
		},
		available_for_consult: {
			type: DataTypes.STRING,
		},
		freeqa_notification: {
			type: DataTypes.STRING,
		},
		chat_notification: {
			type: DataTypes.STRING,
		},
		account_holder_name: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		account_number: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				},
				correct: function(value, next) {
                    if(isNaN(value)) next('Please enter a valid number.');
                    next();
                }
			}
		},
		account_type: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		bank_name: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		bank_branch_city: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		bank_ifsc_code: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
		consultation_fee: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				},
				correct: function(value, next) {
                    if(isNaN(value)) next('Please enter a valid amount.');
                    if(!/^\d{1,6}$/.test(value)) next('Consultation Fees cannot be more than 6 digits.');
                    next();
                }
			}
		},
		iban_number: {
			type: DataTypes.STRING,
			validate: {
				notEmpty: {
					msg:'isRequired'
				}
			}
		},
	},{
		tableName: 'online_consult_settings'
	});
	return Model;
};
