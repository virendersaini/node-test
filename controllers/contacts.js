const models = require('../models'),
  bcrypt = require('bcrypt-nodejs'),
  language = require('./language'),
  otpmessage = require('./otpmessage'),
  mail = require('./mail');

exports.list = req => {
  var pageSize = req.app.locals.site.page, // number of items per page
  page = req.query.page || 1;

  var reqData = req.body,
    where = {};

  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (req.query[key] === '') return;
      var modalKey = key.split('__');
      if (modalKey.length === 3) {
        if (modalKey[0] in where) {
          where[modalKey[0]][modalKey[1]] = req.query[key];
        } else {
          where[modalKey[0]] = {};
          where[modalKey[0]][modalKey[1]] = req.query[key];
        }
      } else {
        if (modalKey[0] in where) {
          where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
        } else {
          where[modalKey[0]] = {};
          where[modalKey[0]][modalKey[1]] = {'$like': '%' + req.query[key] + '%'};
        }
      }
    });
  }

  return models.contacts.findAndCountAll({
    where: where.contacts,
    order: [
      ['id', 'DESC']
    ],
    limit: pageSize,
    offset: (page - 1) * pageSize
  }).then((result) => ({
    status: true,
    data: result.rows,
    totalData: result.count,
    pageCount: Math.ceil(result.count / pageSize),
    pageLimit: pageSize,
    currentPage: parseInt(page)
  })).catch(console.log);
};

exports.save = req => {
  return Promise.all([
    models.contacts.build(req).validate(),
  ])
  .then(err => {
    if (err[0]) {
      return err[0].errors;
    } else {
      return [];
    }
  })
  .then(errors => {
    if (errors.length !== 0)
      return new Promise(resolve => {
        language.errors(
          {errors, lang: req.lang},
          errors => resolve({status: false, errors})
        );
      });

    return models.contacts.create(req).then(result => ({status: true, message: "Your Query has been submitted Successfully."}));
  });
};

exports.sendEmail = function(req) {
  return models.contacts.findOne({
    attributes: ['email', 'name'],
    where: {
      id: req.id
    }
  }).then(result => {
    if(result){
      mail.sendMail({
        email: result.email,
        subject: req.subject,
        msg: req.message
      });
    }
    return {status: true, message: language.lang({key: "Email Send Successfully", lang: req.lang})};
  });
};