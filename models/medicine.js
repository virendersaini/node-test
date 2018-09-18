'use strict';

module.exports = function (sequalize, DataTypes) {
	return sequalize.define('medicine', {
		id: {
			type: DataTypes.INTEGER
			, primaryKey: true
			, autoIncrement: true
		},
		product_code : {
			type: DataTypes.STRING(100)
			, validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		categoryId : {
			type: DataTypes.INTEGER(11)
			, validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		product_uom : {
			type: DataTypes.INTEGER(11)
			, validate: {
				notEmpty: {
					msg: 'isRequired'
				}
			}
		},
		per_uom_qty : {
			type: DataTypes.INTEGER
			, validate: {
				notEmpty: {
					msg: 'isRequired'
				},
				is:{
					args:/^\+?([1-9]\d*)$/,
					msg : 'Number is not valid.Only positive number valid'
				},
			}
		},
		product_price_uom_qty : {
			type: DataTypes.FLOAT
			, validate: {
				notEmpty: {
					msg: 'isRequired'
				},
			 is: {
		          args: /^\d+(\.\d{1,2})?$/,
		          msg: 'Number is not valid.Only positive number valid'
		        },
			}
		},
		is_prescription: {
			type: DataTypes.INTEGER(6)
			, validate: {
				isIn: {
					args: [[0, 1]]
					, msg: 'Invalid Status'
				}
			}
		}
		, is_active: {
			type: DataTypes.INTEGER(6)
			, validate: {
				isIn: {
					args: [[0, 1]]
					, msg: 'Invalid Status'
				}
			}
		}
	}, {
		tableName: 'medicines'
	});
};
