var async = require('async');
const models = require('../models');
var language = require('./language');
var moment = require('moment');
var mail = require('./mail');

function Utils() {
    /*
     * Get all tagtype with ID
     */
    this.getAllTagTypeId = function(req, res) {
        return {
            ServiceTagId: 1,
            SpecializationTagId: 2,
            EducationQualificationTagId: 3,
            EducationCollegetagId: 4,
            RegistrationCluncilTagId: 5,
            MembershipCouncilTagId: 6,
            ChronicDiseaseTagId: 7,
            ArticleHealthIntrestTopicsTagId: 8,
            SymptomsforDoctorsClinicTagId: 9,
            ProbleTypeTagId: 10,
            InsuranceCompaniesTagId: 11,
            MembershipsTagId: 12,
            AllergiesTagId: 13,
            InjuriesTagId: 14,
            SurgeriestagId: 15,
            Occupation: 16,
            FoodPreferenceTagId: 17,
            LifestyleTagId: 18,
            AlcoholConsumptionTagId: 19,
            CigaretteSmokeTagId: 20,
            MedicalRecordTypeTagId: 21,
            hhcEducation:22,
            hhcService:24,
            hhcSpecializations:23,
            Amneties: 25,
            Equipments: 26,
        }
    }

    /*
     * for hospital profile
     */
    this.updateProfileStatusWhileUpdate = function(req, res) {
        models.hospital.hasMany(models.hospitaldetail);
        models.hospital.hasMany(models.hospitalfile);
        models.hospital.hasMany(models.hospital_doctors);
        models.hospital.hasMany(models.hospital_timings);
        models.hospital.hasMany(models.hospitalservice);
        models.hospital.hasMany(models.hospitalaward);
        
        var isWhere = {};
        isWhere.hospitaldetail = language.buildLanguageQuery(isWhere.hospitaldetail, req.langId, '`hospital`.`id`', models.hospitaldetail, 'hospitalId');
        isWhere.countrydetail = language.buildLanguageQuery(isWhere.countrydetail, req.langId, '`country`.`id`', models.countrydetail, 'countryId');
        isWhere.statedetail = language.buildLanguageQuery(isWhere.statedetail, req.langId, '`state`.`id`', models.statedetail, 'stateId');
        isWhere.citydetail = language.buildLanguageQuery(isWhere.citydetail, req.langId, '`city`.`id`', models.citydetail, 'cityId');
        isWhere.hospitalawarddetail = language.buildLanguageQuery(isWhere.hospitalawarddetail, req.langId, '`hospital_awards`.`id`', models.hospitalawarddetail, 'hospitalAwardId');

        models.hospital.findOne({
            where: {id: req.id},
            include: [{
                model: models.hospitaldetail,
                where: isWhere.hospitaldetail
            }, {
                model: models.hospitalfile,
                where: {},
                required: false
            }, {
                model: models.hospital_timings,
                required: false
            }, {
                model: models.hospital_doctors,
                required: false
            }, {
                model: models.hospitalservice,
                where: isWhere.hospitalservice,
                required: false
            }, {
                model: models.hospitalaward,
                required: false
            }],
        }).then(function(result) {
            if(result != null) {
                let tagTypeIds = module.exports.getAllTagTypeId()

                let servicesTagStatus = result.hospitalservices.some((item) => { return item.tagtypeId == tagTypeIds.ServiceTagId })
                let specializationTagStatus = result.hospitalservices.some((item) => { return item.tagtypeId == tagTypeIds.SpecializationTagId })
                let filesStatus = result.hospitalfiles.some((item) => ["commercial_register", "municipal_license", "prescription_pad", "clinic_reg_proof", "zakat_certificate"].indexOf(item.document_type) !== -1)
                let timingStatus = result.is_freeze === 1;

                let profileCompletionStatus = servicesTagStatus && specializationTagStatus && filesStatus && timingStatus;

                if(!profileCompletionStatus) {
                    models.hospital.update({is_complete: 0, is_live: 0, verified_status: 'incomplete-profile'}, {
                        where: {id: req.id}
                    }).then(function(updateStatus) {
                        models.hospitalfile.update({is_created_after_live: 0}, {where: {hospitalId: req.id}});
                        res({status: true, data: result});    
                    }).catch(() => res({status: false}));
                } else {
                    let updatedValues = {};
                    if("incomplete-profile" === result.verified_status) {
                        updatedValues = {verified_status: "pending", is_live: 0, is_complete: 1}
                        models.hospital.update(updatedValues, { where: {id: req.id}}).then(function(updateStatus) {
                            res({status: true, data: result});
                        }).catch(() => res({status: false}));
                    } else {
                        res({status: true, data: result});
                    }
                }
            } else {
                res({status: true, data: {}});
            }
        })
    }

    this.getNationalities = function(req, res) {
        return [
            {value: "bangladeshi", label: language.lang({lang:req.lang, key:"Bangladeshi"})},
            {value: "egyptian", label: language.lang({lang:req.lang, key:"Egyptian"})},
            {value: "filipino", label: language.lang({lang:req.lang, key:"Filipino"})},
            {value: "indian", label: language.lang({lang:req.lang, key:"Indian"})},
            {value: "jordanian", label: language.lang({lang:req.lang, key:"Jordanian"})},
            {value: "lebanese", label: language.lang({lang:req.lang, key:"Lebanese"})},
            {value: "pakistani", label: language.lang({lang:req.lang, key:"Pakistani"})},
            {value: "saudi", label: language.lang({lang:req.lang, key:"Saudi"})},
            {value: "sudanese", label: language.lang({lang:req.lang, key:"Sudanese"})},
            {value: "syrian", label: language.lang({lang:req.lang, key:"Syrian"})},
            {value: "yemenite", label: language.lang({lang:req.lang, key:"Yemenite"})}
        ];
    }

    this.getAppVersion = function(req) {
        console.log(req)
        let qry = 'SELECT app_version FROM app_versions WHERE `app_versions`.`version_for` = ? ORDER BY `app_versions`.`id` DESC LIMIT 1;';
        return models.sequelize.query(qry, { replacements: [req.version_for], type: models.sequelize.QueryTypes.SELECT }).then(d => ({status: true, data: d.length ? d[0] : null}))
    }

    this.saveAppVersion = function(req) {
        let qry = 'INSERT INTO app_versions (app_version, version_for) VALUES (?, ?);';
        return models.sequelize.query(qry, { replacements: [req.app_version.trim(), req.version_for], type: models.sequelize.QueryTypes.INSERT }).then(r => ({status: true, message: 'Version updated.'}))
    }

    this.updateVideoFile = req => {
        if(typeof req.modelTo === "undefined" || req.modelTo == "") return;
        let fieldName;
        req.modelTo === "doctorfile" && (fieldName = "doctor_files");
        req.modelTo === "hospitalfile" && (fieldName = "hospital_files");

        if(!fieldName) return;
        return models[req.modelTo].update({[fieldName]: req.newFile}, {where: {[fieldName]: req.file}}).then(() => true)
    }
}

// async function test (model, detailModel, detailModelName) {
//   model.hasMany(detailModel);
//   let items = await model.findAll({
//     include: detailModel,
//     order: [
//       [detailModel, 'languageId'],
//     ],
//     logging: true
//   });

//   return Promise.all(items.map(async item => {
//     if (item[detailModelName].length === 1) {
//       return detailModel.create({
//         ...item[detailModelName][0].toJSON(),
//         id: '',
//         languageId: 2,
//       }, {logging: true, validate: false});
//     }
//   }));
// }

module.exports = new Utils();
