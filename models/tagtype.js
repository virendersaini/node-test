'use strict';

module.exports = function (sequalize, DataTypes) {
	return sequalize.define('tagtype', {
		id: {
			type: DataTypes.INTEGER
			, primaryKey: true
			, autoIncrement: true
		},
		 is_active: {
			type: DataTypes.INTEGER(6)
			, validate: {
				isIn: {
					args: [[0, 1]]
					, msg: 'Invalid Status'
				}
			}
		}
	}, {
		tableName: 'tagtypes'
	});
};
