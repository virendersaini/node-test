const models = require('../models');

function Currency() {
  /*
   * list of all currency
  */
 this.list = function(req, res) {
    models.currency.findAll().then(function(data){
      res(data);
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };
}

module.exports = new Currency();
