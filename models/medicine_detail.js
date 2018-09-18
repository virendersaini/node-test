'use strict';

module.exports = function (sequelize, DataTypes) {
	return sequelize.define('medicinedetail', {
		id: {
			type: DataTypes.INTEGER
			, primaryKey: true
			, autoIncrement: true
		}
		, medicineId: {
			type: DataTypes.INTEGER
		}
		, languageId: {
			type: DataTypes.INTEGER
		}
		, title: {
			type: DataTypes.STRING(140)
			, validate: {
				valid: function (value, next) {
					value = value.trim();
					if (value.length === 0) {
						next('isRequired');
					} else if (value.length > 140) {
						next('Please enter no more than 140 characters');
					} else {
						next();
					}
				},
				//isUnique: sequelize.validateIsUnique('title', 'isUniqueTitle'),
			}
		}
		, description : {
			type: DataTypes.TEXT
			, validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				isValid:function(value, next){
					if (value !== '' && value.length > 200) {
					  next('Please enter no more than 200 characters');
					} else {
					  next();
					}
				}
			}
		},
		manufacturer_company : {
			type: DataTypes.STRING(200)
			, validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				isValid:function(value, next){
					if (value !== '' && value.length > 200) {
					  next('Please enter no more than 200 characters');
					} else {
					  next();
					}
				}
			}
		}
	}, {
		tableName: 'medicine_details'
		, timestamps: false
	});
};