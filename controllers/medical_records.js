var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var country = require('./country');
var state = require('./state');
var city = require('./city');
var _ = require('lodash');
//var patienttag = require('./patienttag');


function MedicalRecords() {

    /*
    Get medical history record
    */
    this.list = function(req, res) {
        var pageSize = req.app.locals.site.page, // number of items per page
            page = req.query.page || 1;

        var reqData = req.body.data ? JSON.parse(req.body.data) : req.body,
            where = {
                MedicalRecordDetail: {},
            };
        /* if (req.query) {
          Object.keys(req.query).forEach(key => {
            if (req.query[key] === '') return;
            var modalKey = key.split('__');
            if (modalKey[0] in where) {
              where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
            } else {
              where[modalKey[0]] = {};
              where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
            }
          });
        }
    */
        where.MedicalRecordDetail = language.buildLanguageQuery(
            where.MedicalRecordDetail, reqData.langId, '`MedicalRecord`.`id`', models.MedicalRecordDetail, 'medicalRecordId'
        );
        models.MedicalRecord.hasMany(models.MedicalRecordDetail);
        models.MedicalRecord.hasMany(models.MedicalRecordItem);
        models.MedicalRecordItem.belongsTo(models.tag, {
            foreignKey: 'medical_record_type'
        });
        models.tag.hasMany(models.tagdetail);

        models.MedicalRecord.findAll({
                attributes: ['id', 'patientId', 'date'],
                include: [
                    {
                        model: models.MedicalRecordDetail,
                        where: where.MedicalRecordDetail,
                        attributes: ['id', 'languageId', 'title', 'patient_name']
                    },
                    //{ model: models.MedicalRecordItem,include:[models.tag], required:false},
                    //{ model: models.MedicalRecordItem,include:[{model:models.tag,include:[{model:models.tagdetail,attributes: ['id','title']}],attributes: ['id']}],attributes: ['id', 'medical_record_type',[models.sequelize.fn('COUNT', models.sequelize.col('*')), 'record_count']], required:false},
                    {
                        model: models.MedicalRecordItem,
                        include: [{
                            model: models.tag,
                            include: [{
                                model: models.tagdetail,
                                attributes: ['id', 'title'],
                                where: language.buildLanguageQuery(
                                    {}, reqData.langId, '`MedicalRecordItems.tag`.`id`', models.tagdetail, 'tagId'
                                )
                            }],
                            attributes: ['id']
                        }],
                        attributes: ['id', 'medical_record_type'],
                        required: false
                    },

                ],
                distinct: true,
                where: {
                    patientId: reqData.patientId
                },
                //group: [[models.MedicalRecordItem, 'medical_record_type']],
                order: 'date DESC',
                required: false,
                limit: pageSize,
                offset: (page - 1) * pageSize,
                logging: true
                //raw: true,
                // subQuery:false
            })
            .then(result => {
                var result1 = [];
                async.forEachOf(result, function(entry, index, callback) {
                    result1.push(entry);
                    var MedicalRecordItemsNew = {};
                    var itemKeyValuePair = {};
                    //result.MedicalRecordItemNew = MedicalRecordItemNew;

                    async.forEachOf(entry.MedicalRecordItems, function(entrynew, index1, callback1) {

                        if (typeof itemKeyValuePair[entrynew.medical_record_type] != 'undefined') {
                            itemKeyValuePair[entrynew.medical_record_type] = itemKeyValuePair[entrynew.medical_record_type] + 1;
                            result1[index].MedicalRecordItems[index1].dataValues.count = itemKeyValuePair[entrynew.medical_record_type];
                        } else {

                            result1[index].MedicalRecordItems[index1].dataValues.count = 1;
                            itemKeyValuePair[entrynew.medical_record_type] = 1;
                        }
                        MedicalRecordItemsNew[entrynew.medical_record_type] = result1[index].MedicalRecordItems[index1];

                        callback1(null, result1);
                    }, function(err) {
                        result1[index].dataValues.MedicalRecordItemsNew = MedicalRecordItemsNew;
                        delete result1[index].dataValues.MedicalRecordItems;
                        callback();
                    });

                }, function(err, res11) {

                    res({
                        status: true,
                        message: language.lang({
                            key: "item_list",
                            lang: reqData.lang
                        }),
                        data: result1,
                    });

                });

            })
        // .catch(() => res({
        //   status:false,
        //   error: true,
        //   error_description: language.lang({key: "Internal Error",lang: req.lang}),
        //   url: true
        // }));
    };


    /*
     * save
     */
    this.save = function(req, res) {
        var medicalRecordDetailHasOne = models.MedicalRecord.hasOne(models.MedicalRecordDetail, {
            as: 'medical_record_details'
        });
        var medicalRecordItemlHasOne = models.MedicalRecord.hasOne(models.MedicalRecordItem, {
            as: 'medical_record_items'
        });

        if (typeof req.title != 'undefined') {
            req.medical_record_details = {
                title: req.title,
                languageId: req.langId,
                patient_name: req.patient_name
            };
        } else {
            req.medical_record_details = {
                title: language.lang({
                    key: "Added by you",
                    lang: req.lang
                }),
                languageId: req.langId,
                patient_name: req.patient_name
            };
        }
        req.medical_record_items = {
            img: req.img,
            medical_record_type: req.medical_record_type
        };

        var MedicalRecord = models.MedicalRecord.build(req);
        var MedicalRecordDetail = models.MedicalRecordDetail.build(req.medical_record_details);
        var MedicalRecordItem = models.MedicalRecordItem.build(req.medical_record_items);

        var errors = [];
        // an example using an object instead of an array
        async.parallel([

            function(callback) {
                MedicalRecord.validate().then(function(err) {
                    if (err !== null) {
                        errors = errors.concat(err.errors);
                        callback(null, errors);
                    } else {
                        callback(null, errors);
                    }
                }).catch(() => res({
                    status: false,
                    error: true,
                    error_description: language.lang({
                        key: "Internal Error",
                        lang: req.lang
                    }),
                    url: true
                }));
            },
            function(callback) {
                MedicalRecordDetail.validate().then(function(err) {
                    if (err !== null) {
                        errors = errors.concat(err.errors);
                        callback(null, errors);
                    } else {
                        callback(null, errors);
                    }
                }).catch(() => res({
                    status: false,
                    error: true,
                    error_description: language.lang({
                        key: "Internal Error",
                        lang: req.lang
                    }),
                    url: true
                }));
            },
            function(callback) {
                MedicalRecordItem.validate().then(function(err) {
                    if (err !== null) {
                        errors = errors.concat(err.errors);
                        callback(null, errors);
                    } else {
                        callback(null, errors);
                    }
                }).catch(() => res({
                    status: false,
                    error: true,
                    error_description: language.lang({
                        key: "Internal Error",
                        lang: req.lang
                    }),
                    url: true
                }));
            },
        ], function(err, errors) {
            var merged = [].concat.apply([], errors);
            var uniqueError = merged.filter(function(elem, pos) {
                return merged.indexOf(elem) == pos;
            });
            if (uniqueError.length === 0) {

                if (typeof req.patientId !== 'undefined' && req.patientId !== '') {
                    models.MedicalRecord.find({
                        where: {
                            patientId: req.patientId,
                            date: req.date
                        }
                    }).then(function(medicalData) {
                        if (medicalData !== null) {
                            /*
                            medical_record_details create and update according to languageId
                            */
                            models.MedicalRecordDetail.find({
                                where: {
                                    medicalRecordId: medicalData.id,
                                    languageId: req.langId
                                }
                            }).then(function(resultData) {
                                if (resultData !== null) {
                                    models.MedicalRecordDetail.update(req.medical_record_details, {
                                        where: {
                                            medicalRecordId: medicalData.id,
                                            languageId: req.langId
                                        }
                                    }).then(function(updateData) {
                                        res({
                                            status: true,
                                            message: language.lang({
                                                key: "addedSuccessfully",
                                                lang: req.lang
                                            }),
                                            data: updateData
                                        });
                                    }).catch(() => res({
                                        status: false,
                                        error: true,
                                        error_description: language.lang({
                                            key: "Internal Error",
                                            lang: req.lang
                                        }),
                                        url: true
                                    }));
                                } else {
                                    req.medical_record_details.medicalRecordId = medicalData.id;
                                    models.MedicalRecordDetail.create(req.medical_record_details).then(function(medicalRecordDetailss) {
                                        res({
                                            status: true,
                                            message: language.lang({
                                                key: "addedSuccessfully",
                                                lang: req.lang
                                            }),
                                            data: medicalRecordDetailss
                                        });
                                    }).catch(() => res({
                                        status: false,
                                        error: true,
                                        error_description: language.lang({
                                            key: "Internal Error",
                                            lang: req.lang
                                        }),
                                        url: true
                                    }));
                                }
                            }).catch(() => res({
                                status: false,
                                error: true,
                                error_description: language.lang({
                                    key: "Internal Error",
                                    lang: req.lang
                                }),
                                url: true
                            }));
                            /*
                                End of medical_record_details
                            */
                            /*
                                image upload data
                            */
                            if (typeof req.medical_record_type != 'undefined') {
                                req.medical_record_items.medicalRecordId = medicalData.id;
                                models.MedicalRecordItem.create(req.medical_record_items).then(function(recordItem) {
                                    res({
                                        status: true,
                                        message: language.lang({
                                            key: "addedSuccessfully",
                                            lang: req.lang
                                        }),
                                        data: recordItem
                                    });
                                }).catch(() => res({
                                    status: false,
                                    error: true,
                                    error_description: language.lang({
                                        key: "Internal Error",
                                        lang: req.lang
                                    }),
                                    url: true
                                }));
                            }
                        } else {
                            models.MedicalRecord.create(req, {
                                include: [medicalRecordDetailHasOne, medicalRecordItemlHasOne],
                                individualHooks: true
                            }).then(function(patientData) {

                                res({
                                    status: true,
                                    message: language.lang({
                                        key: "addedSuccessfully",
                                        lang: req.lang
                                    }),
                                    data: patientData
                                });
                            }).catch(() => res({
                                status: false,
                                error: true,
                                error_description: language.lang({
                                    key: "Internal Error",
                                    lang: req.lang
                                }),
                                url: true
                            }));
                        }
                    })
                } else {
                    language.errors({
                        errors: uniqueError,
                        lang: req.lang
                    }, function(errors) {
                        var newArr = {};
                        newArr.errors = errors;
                        res(newArr);
                    });
                }
            } else {
                language.errors({
                    errors: uniqueError,
                    lang: req.lang
                }, function(errors) {
                    var newArr = {};
                    newArr.errors = errors;
                    res(newArr);
                });
            }
        });
    };
    this.delete = function(req, res) {
        //models.MedicalRecord.hasMany(models.MedicalRecordDetail, {foreignKey: 'medicalRecordId', onDelete: 'CASCADE', hooks: true});
        //models.MedicalRecord.hasMany(models.MedicalRecordItem, {foreignKey: 'medicalRecordId', onDelete: 'CASCADE', hooks: true});
        models.MedicalRecordItem.destroy({
            where: {
                medicalRecordId: req.id
            }
        });
        models.MedicalRecordDetail.destroy({
            where: {
                medicalRecordId: req.id
            }
        })
        models.MedicalRecord.destroy({
                where: {
                    id: req.id
                }
            })
            .then(data => res({
                status: true,
                message: language.lang({
                    key: "deletedSuccessfully",
                    lang: req.lang
                }),
                data: data
            }))
            .catch(() => res({
                status: false,
                error: true,
                error_description: language.lang({
                    key: "Internal Error",
                    lang: req.lang
                }),
                url: true
            }));
    }
    this.deleteItem = function(req, res) {
        models.MedicalRecordItem.destroy({
                where: {
                    id: req.id
                }
            })
            .then(data => res({
                status: true,
                message: language.lang({
                    key: "deletedSuccessfully",
                    lang: req.lang
                }),
                data: data
            }))
            .catch(() => res({
                status: false,
                error: true,
                error_description: language.lang({
                    key: "Internal Error",
                    lang: req.lang
                }),
                url: true
            }));
    }




    this.getById = function(req, res) {
        where = {};
        where.MedicalRecordDetail = language.buildLanguageQuery(
            where.MedicalRecordDetail, req.langId, '`MedicalRecord`.`id`', models.MedicalRecordDetail, 'medicalRecordId'
        );
        models.MedicalRecord.hasOne(models.MedicalRecordDetail);
        models.MedicalRecord.hasMany(models.MedicalRecordItem);
        models.MedicalRecordItem.belongsTo(models.tag, {
            foreignKey: 'medical_record_type'
        });
        models.tag.hasOne(models.tagdetail);

        models.MedicalRecord.find({

                include: [{
                        model: models.MedicalRecordDetail,
                        where: where.MedicalRecordDetail,
                        required: false
                    },
                    {
                        model: models.MedicalRecordItem,
                        include: [{
                            model: models.tag,
                            include: [models.tagdetail]
                        }],
                        required: false
                    },
                    // { model: models.tag,include:[models.tagdetail], required:false},
                ],
                distinct: true,
                where: {
                    id: req.id
                },
                required: false,
            })
            .then(result => {
                res({
                    status: true,
                    message: language.lang({
                        key: "item_list",
                        lang: req.lang
                    }),
                    data: result,
                });
            })
        // .catch(() => res({
        //   status:false,
        //   error: true,
        //   error_description: language.lang({key: "Internal Error",lang: req.lang}),
        //   url: true
        // }));
    };
}
module.exports = new MedicalRecords();