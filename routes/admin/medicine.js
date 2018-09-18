'use strict';

const router = require('express').Router()
, oauth = require('../../config/oauth').oauth
, authorise = oauth.authorise()
, auth = require('../../config/auth')
, medicine = require('../../controllers/medicine')
, tagtype = require('../../controllers/tagtype')
, multer = require('multer')
, formData = require('multer')().array();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //var destFolder = tmpDir;
        var destFolder = 'public/uploads/';
        if (!fs.existsSync(destFolder+file.fieldname)) {
            fs.mkdirSync(destFolder+file.fieldname);
        }
        cb(null, destFolder);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname+'/'+Date.now() + '.' + mime.extension(file.mimetype));
    }
});
var uploadFile = multer({
  storage: storage,
	fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            cb(language.lang({key:"Only image files are allowed!",lang:req.body.lang}), false);
        } else {
            cb(null, true);
        }
    },
    limits: {fileSize: 10000000}
}).any();

/**
 * @api {get} /admin/medicine Search List Of Medicines
 * @apiName medicine
 * @apiGroup Medicine
 * @apiParam {string} medicinedetail__title optional
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
*/

router.post('/', /*authorise,*/ formData, (req, res) => {
	//req.roleAccess = {model:'patient', action:'add'};
	//auth.checkPermissions(req, isPermission => {
		//if (isPermission.status === true) {
			medicine.list(req, result => res.send(result));
		//} else {
		//	res.send(isPermission);
		//}
	//});
});



/**
 * @api {get} /admin/cart_list Patient Cart list
 * @apiName cart-list
 * @apiGroup Medicine
 * @apiParam {integer} patientId required
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
*/

router.post('/cart_list', /*authorise,*/ formData, (req, res) => {
	//req.roleAccess = {model:'patient', action:'add'};
	//auth.checkPermissions(req, isPermission => {
		//if (isPermission.status === true) {
			medicine.cart_list(req, result => res.send(result));
		//} else {
		//	res.send(isPermission);
		//}
	//});
});

/**
 * @api {get} /admin/add_to_cart Add to cart list
 * @apiName add_to_cart
 * @apiGroup Medicine
 * @apiParam {integer} id optional
 * @apiParam {integer} patientId required
 * @apiParam {integer} medicineId required
 * @apiParam {integer} qty Required
 * @apiParam {String} prescription_image Optional
 * @apiParam {integer} langId required
 * @apiParam {String} lang required
*/

router.post('/add_to_cart', /*authorise,*/  (req, res) => {
	uploadFile(req,res,function(err){
		if(err){
			 if (err.code === 'LIMIT_FILE_SIZE') err = language.lang({key:"Image size should less than 10 MB",lang:req.body.lang});
            return res.send({status: false,errors:[{path:'prescription_image',message:err}], message: err, data: []});
		}
		if(req.files.length>0){
			req.body['prescription_image'] = req.files[0].path
		}
		//console.log(req)
		medicine.add_to_cart(req, result => res.send(result));
	})
});
/**
 * @api {post} /admin/tag/tagtypes Get tagType list
 * @apiName tagtypes
 * @apiGroup Tag

 *
 * @apiParam {integer} langId required
 *
 */

router.post('/categoryList', authorise, formData, (req, res) => {
	//req.roleAccess = {model:'tagtype', action:'view'};
	//auth.checkPermissions(req, isPermission => {
		//if (isPermission.status === true) {
			medicine.categoryList(req, result => res.send(result));
		//} else {
		////	res.send(isPermission);
		//}
	//});
});
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
router.post('/savePriceQty', authorise, formData, (req, res) => {
			medicine.savePriceQty(req, result => res.send(result));
		
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
			medicine.getById(data, result => res.send(result));
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
			medicine.save(data, result => res.send(result))
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
			medicine.status(data, result => res.send(result));
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
