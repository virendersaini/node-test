const models = require('../models');

function Manager() {
  /*
   * list of all manager
  */
 this.list = function(req, res) {
    models.manager.findAll().then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
}

module.exports = new Manager();
