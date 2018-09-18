"use strict";
module.exports= function(sequelize, DataTypes){
	return sequelize.define("countryisocode", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		iso: {
			type: DataTypes.STRING(2)
		},
		name: {
			type: DataTypes.STRING
		},
		iso3: {
			type: DataTypes.STRING(3)
		}
	},{
		tableName: 'country_iso_codes',
		timestamps: false
	});
};

