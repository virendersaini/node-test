const models = require('../models'),
language = require('./language');

models.doctorprofile.belongsTo(models.user);
models.hospital.belongsTo(models.user);
models.patient.belongsTo(models.user);

exports.info = function (req) {
	return Promise.all([
		models.doctorprofile.count({
			include:[{
				model: models.user
			}]
		}),
		models.hospital.count({
			include:[{
				model: models.user
			}]
		}),
		models.patient.count({
			include:[{
				model: models.user
			}]
		}),
		models.doctorprofile.count({
			include:[{
				model: models.user
			}],
			where: {
				is_live: 1
			}
		}),
		models.hospital.count({
			include:[{
				model: models.user
			}],
			where: {
				is_live: 1
			}
		}),
		models.user.count(),
	])
	.then(([totalDoctors, totalHospital, totalPatient, totalLiveDoctors, totalLiveHospital, totalUsers]) => ({
		status: true,
		totalDoctors,
		totalHospital,
		totalPatient,
		totalLiveDoctors,
		totalLiveHospital,
		totalUsers: (totalDoctors+totalHospital+totalPatient),
	}))
};
