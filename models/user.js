"use strict";

const makeOptimizerHook = require('../controllers/image').makeOptimizerHook;

function convertId(x) {
  var res = 1;
  while(x > 0) {
    if (x & 1) {
      res += 0x6c0c296;
    }
    res = (res << 1) % 0x1ffffffd;
    x = (x >> 1);
  }
  return res;
}

var bcrypt = require('bcrypt-nodejs');
module.exports=  function(sequelize, DataTypes){
  var Model = sequelize.define("user", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    roleId: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        }
      }
    },
    mobile: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        is: {
          args: /^\d{6,15}$/,
          msg: 'Invalid Mobile Number.'
        },
        isUnique: sequelize.validateIsUnique('mobile', 'Mobile number is already exist.')
      }
    },
    phone_code: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        isEmail:{
          msg: 'Email is not valid.'
        },
       /* isFun : function (value, next){
          var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          if(value !=='' && !re.test(value)){
            return next('isEmail');
          }
          return next();
        },*/
          isUnique: sequelize.validateIsUnique('email', 'Email id is already exist.')
      }
    },

    user_name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        isUnique: sequelize.validateIsUnique('user_name', 'un_isUnique')
      }
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        len:{
          args: [6, 60],
          msg: 'isLength'
        },
      }
    },
    curr_password: {
      type: DataTypes.VIRTUAL,
      validate: {
        correct: function (value, next) {
          if(value !== ''){
            this.Model.find({
              where: {
                id: this.id,
              },
              attributes: ['password'],
            })
            .then(user => {
              if (user && bcrypt.compareSync(value, user.password))
                next();
              else
                next('Please enter correct password.');
            });
          } else {
            next('isRequired');
          }
        }
      },
    },
    new_password: {
      type: DataTypes.VIRTUAL,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        len:{
          args: [6, 60],
          msg: 'isLength'
        },
      },
    },
    confirm_new_password: {
      type: DataTypes.VIRTUAL,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        confirmed: function (value, next) {
          if (value !=='' && value !== this.new_password)
            next('passwordNotConfrm');
          else
            next();
        },
      }
    },
    user_type: {
      type: DataTypes.INTEGER
    },
    default_lang: {
      type: DataTypes.INTEGER
    },
    is_active: {
      type: DataTypes.STRING
    },
    is_notification: {
      type: DataTypes.STRING
    },
    is_email_verified: {
      type: DataTypes.INTEGER
    },
    device_id: {
      type: DataTypes.STRING
    },
    device_type: {
      type: DataTypes.STRING
    },
    user_image: {
     type: DataTypes.STRING
    },
    reset_password_token: {
      type: DataTypes.STRING
    },
    token: {
      type: DataTypes.STRING
    },
    agreed_to_terms: {
      type: DataTypes.INTEGER,
      validate: {
        isAgree: function(value, next) {
          if(value == 0) {
            return next('isAgreeToTerms');
          }
          return next();
        }
      }
    },
    confirm_password: {
      type: DataTypes.VIRTUAL,
      validate: {
        notEmpty: {
          msg: 'isRequired'
        },
        isConfrm: function(value, next){
          if (value !=='' && this.password && value !== this.password) {
            return next('passwordNotConfrm');
          }
          return next();
        }
      }
    },
    feedback_notification: {
      type: DataTypes.INTEGER,  
    }
  },{
    tableName: 'users',
    hooks: {
    //  beforeUpdate: [makeOptimizerHook('user_image', true), makeOptimizerHook('govt_identity_image')],
    //  beforeCreate: [makeOptimizerHook('user_image', true), makeOptimizerHook('govt_identity_image')],
      afterCreate: [function (instance) {
        instance.set('user_name', convertId(instance.id));
        return instance.save({
          validate: false
        });
      }]
    }
  });
  return Model;
};
