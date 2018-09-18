'use strict';

const router = require('express').Router()
, oauth = require('../../config/oauth').oauth
, authorise = oauth.authorise()
, auth = require('../../config/auth')
, category = require('../../controllers/category')
, tagtype = require('../../controllers/tagtype')
, formData = require('multer')().array();

router.post('/', authorise, formData, (req, res) => {
	//req.roleAccess = {model:'patient', action:'add'};
	//auth.checkPermissions(req, isPermission => {
		//if (isPermission.status === true) {
			category.list(req, result => res.send(result));
		//} else {
		//	res.send(isPermission);
		//}
	//});
});
/**
 * @api {post} /admin/tag/tagtypes Get tagType list
 * @apiName tagtypes
 * @apiGroup Tag

 *
 * @apiParam {integer} langId required
 *
 */

/**
 * @api {post} /admin/tag/tagsbyType Get tags by tagTypeId
 * @apiName tagsbyType
 * @apiGroup Tag
 * @apiDescription  {tagTypeId: 21, label: "Medical record type"}
{tagTypeId: 20, label: "Cigarette you smoke perday"}
{tagTypeId: 19, label: "Alchoal Consumption"}
{tagTypeId: 18, label: "Lifestyle"}
{tagTypeId: 17, label: "Food Preference"}
{tagTypeId: 16, label: "Occupation"}
{tagTypeId: 15, label: "Surgeries"}
{tagTypeId: 14, label: "Injuries"}
{tagTypeId: 13, label: "Allergies"}
{tagTypeId: 12, label: "Memberships"}
{tagTypeId: 11, label: "Insurance Companies"}
{tagTypeId: 10, label: "Problem Type"}
{tagTypeId: 9, label: "SYMPTOMS for Doctors Clinic search"}
{tagTypeId: 8, label: "Article Health Intrest Topics"}
{tagTypeId: 7, label: "Chronic Disease"}
{tagTypeId: 6, label: "Membership Councils"}
{tagTypeId: 5, label: "Registration Council"}
{tagTypeId: 4, label: "Education Colleage/University"}
{tagTypeId: 3, label: "Education Qualification"}
{tagTypeId: 2, label: "Specializations"}
{tagTypeId: 1, label: "Services"}
 * @apiParam {integer} id required here id is tagTeypeId (above json shows all tagTypeId and their label)
 * @apiParam {integer} userId required (Only for doctor app) 
 * @apiParam {integer} langId required
 *
 */
router.post('/tagsbyType', authorise, formData, (req, res) => {
//	/req.roleAccess = {model:'patient', action:'add'};
	//auth.checkPermissions(req, isPermission => {
	//	if (isPermission.status === true) {
			req.where = {'$or': [{userId: req.body.userId}, {is_active: 1, is_approved: 1}]};
			tagtype.listByType(req, result => res.send(result));
		/*} else {
			res.send(isPermission);
		}*/
	//});
});
/**
 * @api {post} /admin/tag/articleTagList Get article tags
 * @apiName articleTagList
 * @apiGroup Article
 *
 * @apiParam {integer} langId required
 * @apiParam {integer} id required here id is tagtypeId
 * @apiParam {integer} patientId required
 *
 */

router.post('/articleTagList', authorise, formData, (req, res) => {
	//	/req.roleAccess = {model:'patient', action:'add'};
		//auth.checkPermissions(req, isPermission => {
		//	if (isPermission.status === true) {
				tagtype.patientTagList(req, result => res.send(result));
			/*} else {
				res.send(isPermission);
			}*/
		//});
	});

router.post('/add', authorise, formData, (req, res) => {
	req.roleAccess = {model:'tag', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			res.send({});
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/edit/:id', authorise, formData, (req, res) => {
	req.roleAccess = {model:'tag', action:'edit'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
			var data = req.body.data ? JSON.parse(req.body.data) : req.body;
			data.id = req.params.id;
			category.getById(data, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/save', authorise, formData, (req, res) => {
	req.roleAccess = {model:'tag', action:'add'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
                     var data = req.body.data ? JSON.parse(req.body.data) : req.body;
			category.save(data, result => res.send(result))
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/status/:id/:status', authorise, formData, (req, res) => {
	req.roleAccess = {model:'tag', action:'status'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
                        var data = req.body.data ? JSON.parse(req.body.data) : req.body;
			//var data = JSON.parse(req.body.data);
			data.id = req.params.id;
			data.is_active = req.params.status;
			category.status(data, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/remove/:id', authorise, formData, (req, res) => {
	req.roleAccess = {model:'tag', action:'delete'};
	auth.checkPermissions(req, isPermission => {
		if (isPermission.status === true) {
                    var data = req.body.data ? JSON.parse(req.body.data) : req.body;
			//var data = JSON.parse(req.body.data);
			data.id = req.params.id;
			tag.remove(data, result => res.send(result));
		} else {
			res.send(isPermission);
		}
	});
});

router.post('/list', authorise, formData, (req, res) => {
	Promise.resolve(true)
	.then(() => tag.getAll(req.body.data ? JSON.parse(req.body.data) : req.body))
	.then(result => res.send(result))
	.catch(console.log);
});

router.post('/addByUser', formData, function (req, res) {
    var data = req.body.data ? JSON.parse(req.body.data) : req.body;
    tag.save(data, result => res.send(result))
})

router.post('/for-approval', formData, function (req, res) {
    Promise.resolve(true)
	.then(() => tag.getAllTagForApproval(req))
	.then(result => res.send(result))
	//.catch(console.log);
})

router.post('/approve', formData, function (req, res) {
    var data = req.body.data ? JSON.parse(req.body.data) : req.body;
    tag.approve(data, result => res.send(result))
})

router.use(oauth.errorHandler());
module.exports = router;
