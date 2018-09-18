var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');

function Tagtype() {

  this.list = function (req, res) {
	var pageSize = req.app.locals.site.page, // number of items per page
	page = req.query.page || 1;

	var reqData = req.body.data ? JSON.parse(req.body.data) : req.body, where = {
	};
	if (req.query) {
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
  where.tagtypedetail = language.buildLanguageQuery(
		where.tagtypedetail, reqData.langId, '`tag`.`id`', models.tagtypedetail, 'tagId'
	);

	models.tagtype.hasMany(models.tagtypedetail);
	models.tagtype.findAndCountAll({
    include: [
			{ model: models.tagtypedetail, where: where.tagtypedetail}
		],
		distinct: true,
		where: where.tagtype,
		order: [
			['id', 'DESC']
		],
		limit: pageSize,
		offset: (page - 1) * pageSize
	})
	.then(result => {
		res({
			status: true,
			data: result.rows,
			totalData: result.count,
			pageCount: Math.ceil(result.count / pageSize),
			pageLimit: pageSize,
			currentPage:page
		});
	})
	.catch(() => res({
		status:false,
		error: true,
		error_description: language.lang({key: "Internal Error",lang: req.lang}),
		url: true
	}));
};

  
 this.listByType = function(req, res) {
    models.tagtype.hasMany(models.tagtypedetail);
    models.tagtype.hasMany(models.tag);
  models.tag.hasMany(models.tagdetail);
    var isWhere = {};
    isWhere.tagtypedetail = language.buildLanguageQuery(
      isWhere.tagtypedetail, req.body.langId, '`tagtype`.`id`', models.tagtypedetail, 'tagtypeId'
    );
 isWhere.tagdetail = language.buildLanguageQuery(
		isWhere.tagdetail, req.body.langId, '`tags`.`id`', models.tagdetail, 'tagId'
	);

  if(typeof req.where === "undefined") {
    req.where = {is_active: 1, is_approved: 1}
  }

    models.tagtype.find({
      include: [
        {model: models.tagtypedetail, where:isWhere.tagtypedetail},
        {model: models.tag, include:[
                {model: models.tagdetail, where:isWhere.tagdetail}
            ], where:req.where
        },
        ],
      where:{is_active:1,id:req.body.id}
    }).then(function(data){
            res({status:true,message:'tag type list',data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.body.lang}), url: true}));
  };



  this.patientTagList = function(req, res) {
    models.tagtype.hasMany(models.tagtypedetail);
    models.tagtype.hasMany(models.tag);
    models.tag.hasMany(models.tagdetail);
    var isWhere = {};
    isWhere.tagtypedetail = language.buildLanguageQuery(
      isWhere.tagtypedetail, req.body.langId, '`tagtype`.`id`', models.tagtypedetail, 'tagtypeId'
    );
    isWhere.tagdetail = language.buildLanguageQuery(
      isWhere.tagdetail, req.body.langId, '`tags`.`id`', models.tagdetail, 'tagId'
    );

    models.tagtype.find({
      attributes: ['id'],
      include: [{
          model: models.tagtypedetail,
          where: isWhere.tagtypedetail
        },
        {
          model: models.tag,
          attributes: ['id'],
          include: [{
            model: models.tagdetail,
            attributes: ['id', 'tagId', 'title'],
            where: isWhere.tagdetail
          }],
          where: isWhere.tag
        },
      ],
      where: {
        is_active: 1,
        id: req.body.id
      },
    }).then(function(data) {
      async.parallel({
        patient_tag: function(callback) {
          models.patienttag.findAll({
            attributes: ["tagId"],
            where: {
              patientId: req.body.patientId
            },
          }).then(function(patientTag) {
            callback(null, patientTag);
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
      }, function(err, result) {
        res({
          status: true,
          message: 'Patient tag list',
          data: data,
          article_tag: result.patient_tag
        });
      });


    }) //.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };


this.listByTypeAndTags = function(req, res) {
    models.tagtype.hasMany(models.tagtypedetail);
    models.tagtype.hasMany(models.tag);
  models.tag.hasMany(models.tagdetail);

    var isWhere = {};
    isWhere.tagtypedetail = language.buildLanguageQuery(
      isWhere.tagtypedetail, req.body.langId, '`tagtype`.`id`', models.tagtypedetail, 'tagtypeId'
    );
 isWhere.tagdetail = language.buildLanguageQuery(
		isWhere.tagdetail, req.body.langId, '`tags`.`id`', models.tagdetail, 'tagId'
	);

    models.tagtype.find({
      attributes:['id'],
      include: [
        {model: models.tagtypedetail, where:isWhere.tagtypedetail, attributes:['title']},
        {model: models.tag,attributes:['id'], include:[{model: models.tagdetail, where:isWhere.tagdetail,attributes:['title']}], where:{id:{$in:req.body.tagIDS}}},
        ],
      where:{is_active:1,id:req.body.id}
    }).then(function(data){
        if(data==null){
            data={}
        }
            res({status:true,message:'tag type list',data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.getAll = function (req, res) {
    let where = {}
    where.tagtypedetail = language.buildLanguageQuery(
      where.tagtypedetail, req.langId, '`tagtype`.`id`', models.tagtypedetail, 'tagtypeId'
    );

    models.tagtype.hasMany(models.tagtypedetail);
    models.tagtype.findAll({
      include: [
        { model: models.tagtypedetail, where: where.tagtypedetail}
      ],
      distinct: true,
      where: where.tagtype,
      order: [
        ['id', 'DESC']
      ]
    })
    .then(result => {
      res({
        status: true,
        data: result
      });
    })
    .catch(() => res({
      status:false,
      error: true,
      error_description: language.lang({key: "Internal Error",lang: req.lang}),
      url: true
    }));
  };

  this.listByTypeIDForWeb = function(req, res) {
    models.tagtype.hasMany(models.tagtypedetail);
    models.tagtype.hasMany(models.tag);
  models.tag.hasMany(models.tagdetail);
    var isWhere = {};
    isWhere.tagtypedetail = language.buildLanguageQuery(
      isWhere.tagtypedetail, req.langId, '`tagtype`.`id`', models.tagtypedetail, 'tagtypeId'
    );
 isWhere.tagdetail = language.buildLanguageQuery(
    isWhere.tagdetail, req.langId, '`tags`.`id`', models.tagdetail, 'tagId'
  );

    models.tagtype.find({
      include: [
        {model: models.tagtypedetail, where:isWhere.tagtypedetail},
        {model: models.tag, include:[{model: models.tagdetail, where:isWhere.tagdetail}], where:isWhere.tag},
        ],
      where:{is_active:1,id:req.id}
    }).then(function(data){
            res({data:data});
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  };

  this.listTagdetailByTagId = function(req, res) {
    models.tag.hasMany(models.tagdetail);
    models.tag.findAll({
      attributes: ["id", "tagtypeId"],
      where: {tagtypeId: req.id},
      include: [
        {
          model: models.tagdetail, attributes: ["title"], where: language.buildLanguageQuery({}, req.langId, '`tag`.`id`', models.tagdetail, 'tagId')
        }
      ]
    }).then(function(result) {
      res(result)
    }).catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: req.lang}), url: true}));
  }

  this.listByTypeAndTagsNew = function(req) {
    models.tagtype.hasMany(models.tagtypedetail);
    models.tagtype.hasMany(models.tag);
    models.tag.hasMany(models.tagdetail);

    var isWhere = {};
    isWhere.tagtypedetail = language.buildLanguageQuery(
      isWhere.tagtypedetail, req.body.langId, '`tagtype`.`id`', models.tagtypedetail, 'tagtypeId'
    );
    isWhere.tagdetail = language.buildLanguageQuery(
      isWhere.tagdetail, req.body.langId, '`tags`.`id`', models.tagdetail, 'tagId'
    );

    return models.tagtype.find({
      attributes:['id'],
      include: [
        {
          model: models.tagtypedetail,
          where:isWhere.tagtypedetail,
          attributes:['title']
        },
        {
          model: models.tag,
          attributes:['id'],
          include:[{
            model: models.tagdetail,
            where:isWhere.tagdetail,
            attributes:['title']
          }],
          where:{
            id:{$in:req.body.tagIDS}
          }
        },
      ],
      where:{
        is_active:1,
        id:req.body.id
      }
    })
  };
}
module.exports = new Tagtype();
