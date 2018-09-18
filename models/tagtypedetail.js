'use strict';

module.exports = function (sequalize, DataTypes) {
	return sequalize.define('tagtypedetail', {
		id: {
			type: DataTypes.INTEGER
			, primaryKey: true
			, autoIncrement: true
		}
		, tagtypeId: {
			type: DataTypes.INTEGER
		}
		, languageId: {
			type: DataTypes.INTEGER
		}
		, title: {
			type: DataTypes.STRING(100)
			, validate: {
				valid: function (value, next) {
					value = value.trim();
					if (value.length === 0) {
						next('isRequired');
					} else if (value.length > 100) {
						next('Title length can not be more than 100');
					} else {
						next();
					}
				}
			}
		}

	}, {
		tableName: 'tagtype_details'
		, timestamps: false
	});
};
