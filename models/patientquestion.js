"use strict";
const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;
module.exports=  function(sequelize, DataTypes){
    var Model = sequelize.define("patientquestion", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        patientId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        tagId: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        age: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        gender: {
            type: DataTypes.INTEGER,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        patient_name: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        problem_title: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        description: {
            type: DataTypes.STRING,
            validate: {
                notEmpty: {
                    msg:'isRequired'
                }
            }
        },
        contact: {
            type: DataTypes.STRING,
            validate: {
              notEmpty: {
                msg: 'isRequired'
              },
              is: {
                args: /^\d{6,15}$/,
                msg: 'notValidMobile'
              },
              //isUnique: sequelize.validateIsUnique('emergency_contact', 'isUnique')
            }
          },
          image: {
            type: DataTypes.STRING
          },
          is_active: {
            type: DataTypes.STRING
          }
    },{
        tableName: 'patient_questions',
        hooks: {
            beforeCreate: [makeOptimizerHook('image', false)]
        },
    });
    return Model;
};
