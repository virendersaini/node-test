var async = require('async');
const models = require('../models');
var language = require('./language');
var oauth = require('./oauth');
var tagtype = require('./tagtype');
var utils = require('./utils');
var moment=require('moment');
var notification=require('./notification');
var braintree = require('braintree'),
config = require('../config/config')[process.env.NODE_ENV || 'development'];

let gateway = braintree.connect({
	accessToken: config.paypal ? config.paypal.accessToken:null
});

function healthcaremyschedule() {


	this.getList = function(req, res) {


		var setPage = req.app.locals.site.page;
		var currentPage = 1;
		var pag = 1;
		if (typeof req.query.page !== 'undefined') {
			currentPage = +req.query.page;
			pag = (currentPage - 1)* setPage;
			delete req.query.page;
		} else {
			pag = 0;
		}
		/*
		* for  filltering
		*/
		var reqData = req.body;
		if(typeof req.body.data !== 'undefined'){
			reqData = JSON.parse(req.body.data);
		}
		var isWhere = {};
		var orderBy = '';
		if (req.query) {
			var responseData = {};
			responseData.articledetail = {};
			async.forEach(Object.keys(req.query), function (item, callback) {
				if (req.query[item] !== ''){
					var modelKey = item.split('__');
					if(typeof responseData[modelKey[0]] =='undefined'){
						var col = {};
						col[modelKey[1]] = {$like: '%' + req.query[item] + '%'};
						responseData[modelKey[0]] = col;
					} else {
						responseData[modelKey[0]][modelKey[1]] = {$like: '%' + req.query[item] + '%'};
					}
				}
				callback();
			}, function () {
				isWhere = responseData;
			});
		}

		orderBy = 'id DESC';

		var mysqlBy='where';

		where ={healthcareProfileId:req.body.doctorProfileId};

		if(req.query.hospital_id){
			where["hospitalId"]=req.query.hospital_id;
		}

		if (req.query.view === 'completed') {
			//where.status = {$in: [0, 3, 4]};
			mysqlBy='having';
			where = models.sequelize.and(
				models.sequelize.or(
				models.sequelize.where(models.sequelize.fn('max', models.sequelize.col('book_date')),{
            	$lt: models.sequelize.fn('curdate')
          		}),models.sequelize.where(models.sequelize.fn('max', models.sequelize.col('status')),3)
			)
       		,models.sequelize.where(models.sequelize.fn('max', models.sequelize.col('healthcaremyschedule.healthcareProfileId')),req.body.doctorProfileId)	
			);
		} else if(req.query.view === 'upcoming') {
			mysqlBy='having';
			where = models.sequelize.and(
				models.sequelize.where(models.sequelize.fn('max', models.sequelize.col('book_date')),{
            	$gte: models.sequelize.fn('curdate')
          		}),
          		models.sequelize.or(models.sequelize.where(models.sequelize.fn('max', models.sequelize.col('status')),1),models.sequelize.where(models.sequelize.fn('max', models.sequelize.col('status')),2))
          		,models.sequelize.where(models.sequelize.fn('max', models.sequelize.col('healthcaremyschedule.healthcareProfileId')),req.body.doctorProfileId)
          		);
			//where.status = {$in: [1, 2]};
		}else if(req.query.view === 'refund') {
			//where.refund_status = {$in: [1, 2,3]};
			mysqlBy='where';
			where = {refund_status:{$in: [1,2,3]},is_cancel:0,refund_before_start:{$ne:1},healthcareProfileId:req.body.doctorProfileId};
		}

		if(req.query.status_id){
			where["status"]=req.query.status_id;
		}


		//where ={healthcareProfileId:req.body.doctorProfileId};

		if(req.body.isAdmin==1){
			where={};
			if (req.query.view === 'completed') {
				mysqlBy='having';
				where = models.sequelize.or(models.sequelize.where(models.sequelize.fn('max', models.sequelize.col('book_date')),{
            	$lt: models.sequelize.fn('curdate')
          		}),models.sequelize.where(models.sequelize.fn('max', models.sequelize.col('status')),3));
			} else if(req.query.view === 'upcoming') {

				mysqlBy='having';
				where = models.sequelize.and(models.sequelize.where(models.sequelize.fn('max', models.sequelize.col('book_date')),{
	            $gt: models.sequelize.fn('curdate')
	          	}),models.sequelize.or(models.sequelize.where(models.sequelize.fn('max', models.sequelize.col('status')),1),models.sequelize.where(models.sequelize.fn('max', models.sequelize.col('status')),2)));

				//mysqlBy='where';
				//where.status = {$in: [1, 2]};
			}else if(req.query.view === 'refund') {
				mysqlBy='where';
				where.refund_status = {$in: [1,2,3]};
			}
		}


		if (req.query.view === 'sr') {
			where={};
			mysqlBy='where';	
			where.id={$in:req.query.ids.split(',')};
			//req.query.ids
		}

		var whereHd=models.sequelize.fn('IF',models.sequelize.literal('`hospital.hospitaldetails`.`languageid`='+req.body.langId+','+req.body.langId+',1'));
		var whereHpd=models.sequelize.fn('IF',models.sequelize.literal('`healthcareprofile.healthcareprofiledetails`.`languageId`='+req.body.langId+','+req.body.langId+',1'));

		models.healthcaremyschedule.belongsTo(models.hospital);
		models.hospital.hasMany(models.hospitaldetail);
		models.healthcaremyschedule.belongsTo(models.healthcareprofile);
		models.healthcareprofile.hasMany(models.healthcareprofiledetail);
		models.healthcaremyschedule.belongsTo(models.patient);
		models.patient.belongsTo(models.user);
		
		models.healthcaremyschedule.findAndCountAll({
			attributes: ["id","com_amu","final_amu","is_cancel","refund_ref_no","total_amu","patientId","healthcareProfileId","hospitalId","to_time","patient_name","patient_mobile",
						"patient_email","status_updated_by","status","refund_status","pay_status","service_type","avb_on",
						"pay","refund_amount","refund_reason","concern","healthcare_refund_status","admin_pay",
						"admin_pay_amu","admin_pay_time","admin_pay_ref_no","order_token","createdAt", "time_sec",
						[models.sequelize.fn('group_concat', models.sequelize.col('book_date')), 'book_date'],
						[models.sequelize.fn('group_concat', models.sequelize.col('from_time')), 'from_time']
			],
			include: [
			   { model: models.hospital,include:[{model: models.hospitaldetail,where:{languageId:whereHd},required: false}]},
			   { model: models.healthcareprofile,include:[{model: models.healthcareprofiledetail,where:{languageId:whereHpd}}]},
			   { 
			   		model: models.patient, 
			   		attributes: ["id", "userId"],
			   		include: [
			   			{model: models.user, attributes: ["id", "user_image"]}
			   		]
			   }
			],
			//where: where,
			[mysqlBy]:where,
			//having: [[models.sequelize.fn('max', models.sequelize.col('book_date'))], < curdate()]
			order: [
				['id', 'DESC']
			],
			distinct: true,
			group:['order_token'],
			limit: setPage,
			offset: pag, //subQuery: false
		}).then(function(result){

			var totalData = result.rows.length;
			var pageCount = Math.ceil(totalData / setPage);

			//-------------For manage data------------------
			var finalArr=[];
			for(var i=0; i<result.rows.length;i++){
					var finalObj={};
					finalObj=result.rows[i].toJSON();;
					var dateArr=result.rows[i]['book_date'].split(',');
				if(result.rows[i]['service_type']==3){
					var timeArr=result.rows[i]['from_time'].split(',');
					var objDates={};
					var arrTime=[];
					for(var j=0; j<dateArr.length;j++){
						if(objDates[dateArr[j]]){
							var getOldArr=objDates[dateArr[j]];
							getOldArr.push(timeArr[j]);	
						 	objDates[dateArr[j]]=getOldArr;
						}else{
						 var arrOfTime=[];
						 arrOfTime.push(timeArr[j]);	
						 objDates[dateArr[j]]=arrOfTime;	
						}
						arrTime.push(timeArr[j]);
					}
					finalObj['booked_date']=objDates;
				}else{
					finalObj['booked_date']=dateArr;
				}

				finalArr.push(finalObj);
			}
			//--------------------------------------------------

			var bankDetails={};
			var qryBank=' select * from healthcare_profiles where id=? ';
			models.sequelize.query(qryBank, {
				replacements: [req.body.doctorProfileId],type: models.sequelize.QueryTypes.SELECT
			}).then(function(bankData) {

			if(bankData.length)	
			bankDetails=bankData[0];

			const articleTagtypeId = utils.getAllTagTypeId()['ArticleHealthIntrestTopicsTagId'];
			tagtype.listByTypeIDForWeb({langId: reqData.langId, lang: reqData.lang, id: articleTagtypeId}, function(tagdata){
				res({bankDetails:bankDetails,data:finalArr, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage, article_tags: tagdata.data }); 
			});
			});
		})//.catch(() => res({status:false, error: true, error_description: language.lang({key: "Internal Error", lang: reqData.lang}), url: true}));
	}

	this.duePayment = function(req, res) {

		var where={};
		var groupArr=[];
		var mysqlBy='where';

		var qry = " select group_concat(tab2.order_tokens) order_tokens from (SELECT group_concat(distinct order_token)  order_tokens,admin_pay,pay_status,status  ";
		qry += " FROM healthcare_myschedules group by order_token ";
		qry += " having max(book_date) < (curdate() + interval 1 day) and admin_pay=0 and pay_status=2 and status=1) tab2  ";
		models.sequelize.query(qry, {
				replacements: [],type: models.sequelize.QueryTypes.SELECT
		}).then(function(findData) {

		var vaildTokens=[];
			

		if(req.body.tab==1){
			if(findData.length && findData[0]['order_tokens'])
			vaildTokens=findData[0]['order_tokens'].split(',');
			var curdate=moment().add(1,'days').format('YYYY-MM-DD');
			// mysqlBy='having';
			//where = models.sequelize.and(models.sequelize.where(models.sequelize.col('book_date'),{
   			//$gt: models.sequelize.fn('date_add',models.sequelize.fn('curdate'),models.sequelize.fn('Internal 1 DAY'))
   			//}),models.sequelize.where(models.sequelize.col('admin_pay'),3),models.sequelize.where(models.sequelize.col('pay_status'),2));
			where={admin_pay:0,pay_status:2,order_token:{$in:vaildTokens}};
			groupArr.push('healthcaremyschedule.healthcareProfileId');
		}else{
			where={admin_pay:1,pay_status:2};
			groupArr.push('healthcaremyschedule.admin_pay_ref_no');
		}

		var serch={};
		if(req.body.healthcarename && req.body.healthcarename !=''){
			serch['name']={$like:'%'+req.body.healthcarename+'%'}
		}

		var setPage = req.app.locals.site.page;
		var currentPage = 1;
		var pag = 1;
		if (typeof req.query.page !== 'undefined') {
			currentPage = +req.query.page;
			pag = (currentPage - 1)* setPage;
			delete req.query.page;
		} else {
			pag = 0;
		}


		var whereHd=models.sequelize.fn('IF',models.sequelize.literal('`healthcareprofile.hospital.hospitaldetails`.`languageId`='+req.body.langId+','+req.body.langId+',1'));
		serch['languageId']=models.sequelize.fn('IF',models.sequelize.literal('`healthcareprofile.healthcareprofiledetails`.`languageId`='+req.body.langId+','+req.body.langId+',1'));

		
		models.healthcaremyschedule.belongsTo(models.patient);
		models.patient.belongsTo(models.user);
		models.healthcaremyschedule.belongsTo(models.healthcareprofile,{foreignKey:'healthcareProfileId',sourceKey:'id'});
		models.healthcareprofile.hasMany(models.healthcareprofiledetail);

		models.healthcareprofile.belongsTo(models.hospital);
		models.hospital.hasMany(models.hospitaldetail);

		models.healthcaremyschedule.findAndCountAll({
		include: [
			   
			   { model: models.healthcareprofile,
			   	include:[
			   	{model: models.healthcareprofiledetail,where:serch},
			   	{ model: models.hospital,include:[{model: models.hospitaldetail,where:{languageId:whereHd},attributes: ['hospital_name'],}]}
			   	]
			   	},
			   { 
			   	model: models.patient, 
			   	attributes: ["id", "userId"],
			   	include: [
			   		{model: models.user, attributes: ["id", "user_image"]}
			   	]
			   }
			],
			attributes: ['id','patientId','healthcareProfileId','hospitalId','admin_pay','admin_pay_ref_no','admin_pay_amu', 
			[models.sequelize.fn('sum', models.sequelize.col('healthcaremyschedule.final_amu')), 'total_cost'],
			[models.sequelize.fn('count', models.sequelize.fn('DISTINCT', models.sequelize.col('order_token'))),'total_count'],
			[models.sequelize.fn('group_concat', models.sequelize.col('healthcaremyschedule.id')), 'sh_ids'],
			[models.sequelize.fn('group_concat', models.sequelize.fn('DISTINCT', models.sequelize.col('order_token'))),'order_tokens'],
			],
			where: where,
			order: [
				['id', 'DESC']
			],
			distinct: true,
			group:groupArr,
			limit: setPage,
			offset: pag, //subQuery: false
		}).then(function(result){
			var totalData = result.count;
			var pageCount = Math.ceil(totalData / setPage);
			res({data:result.rows, totalData: totalData, pageCount: pageCount,  pageLimit: setPage, currentPage:currentPage});
		});


		});
	}


	this.pay = function(req, res) {
		var updateObj={};
		updateObj['admin_pay_ref_no']=req.pay_ref_no;
		updateObj['admin_pay_amu']=req.total_cost;
		updateObj['admin_pay']=1;
		var idsArr=req.sh_ids.split(',');
		updateObj['admin_pay_time']==moment().format('YYYY-MM-DD HH:mm');
		models.healthcaremyschedule.update(updateObj,{where: {order_token:{$in:idsArr}}}).then(function(data){
			res({status: true, message: language.lang({key: "updatedSuccessfully", lang: req.lang})})
		});	
	}


	this.chageStatus=function(req,res){

		 var updateObj={}
		 if(req.status !== undefined){
			updateObj.status=req.status;
		 }

		 if (req.doctorProfileId) updateObj.status_updated_by = req.doctorProfileId;
		 if (req.hospitalProfileId) updateObj.status_updated_by = req.hospitalProfileId;

		 if(req.suggestion){
			updateObj.suggestion=req.suggestion;
		 }

		 if(req.pay_status==2 && req.status==3){
		 	updateObj['is_cancel']=1;
			updateObj['refund_status']=1;
			updateObj['refund_amount']=req.total_amu;
			updateObj['refund_reason']="Service Request cancelled by Provider";
		 }

		 models.healthcaremyschedule.update(updateObj,{where: {order_token:req.sid}}).then(function(data){
			if(updateObj.status === 3){
				req.myscheduleId = req.sid;
				//module.exports.cancle_notify(req, 'doctor');
			} else {
				//module.exports.notify(req);
			}
			res({status: true, message: language.lang({key: "updatedSuccessfully", lang: req.lang})})
		});
	}



	this.chageStatusRefund=function(req,res){

		var qry = " SELECT * FROM healthcare_myschedules where order_token=? "
		models.sequelize.query(qry, {
				replacements: [req.sid],
				type: models.sequelize.QueryTypes.SELECT
		}).then(function(payData) {

		 var updateObj={}

		 if(req.status==0){
		 	updateObj['concern']=req.suggestion
		 	updateObj['healthcare_refund_status']=3
		 }
		 if(req.status){
		 	updateObj['healthcare_refund_status']=2
		 }


		 if(req.isAdmin==1){
		 	updateObj={};
		 	updateObj['refund_status']=req.status;

		 	if(req.status!=3){

		 		gateway.transaction.refund(payData[0]['payment_data'], function (err, result) {

		 		console.log(result);

		 		if(err) {
					res({status: false,message: language.lang({key: "Refund failed", lang: req.lang})});
				} else {

					if(result.success){

					updateObj['refund_ref_no']=result.transaction.id;
			 		models.healthcaremyschedule.update(updateObj,{where: {order_token:req.sid}}).then(function(data){
						res({status: true, message: language.lang({key: "updatedSuccessfully", lang: req.lang})});
			 		});

					}else{

						res({status: false,message: language.lang({key: "Refund failed", lang: req.lang})});
					}

			 		
		 		}
		 	});

		 	}else{

			 	models.healthcaremyschedule.update(updateObj,{where: {order_token:req.sid}}).then(function(data){
					res({status: true, message: language.lang({key: "updatedSuccessfully", lang: req.lang})});
			 	});

		 	}
		 	//console.log(payData[0]['payment_data']);

		 	
		 }else{

		 	models.healthcaremyschedule.update(updateObj,{where: {order_token:req.sid}}).then(function(data){
			 res({status: true, message: language.lang({key: "updatedSuccessfully", lang: req.lang})});
		 	});

		 }
		 
		 

		 

		}); 
	}


	this.refundRefAdd=function(req,res){

		var updateObj={}
		updateObj['refund_ref_no']=req.pay_ref_no

		models.healthcaremyschedule.update(updateObj,{where: {order_token:req.order_token}}).then(function(data){
		  res({status: true, message: language.lang({key: "updatedSuccessfully", lang: req.lang})});
		});
	}


	this.addBlock=function(req,res){

		var qry = " SELECT id FROM healthcare_block_schedules where (from_date between ? and ?) or (to_date between ? and ?) or (? between from_date and to_date) or (? between from_date and to_date) "
		models.sequelize.query(qry, {
				replacements: [
				req.from_date,
				req.to_date,
				req.to_date,
				req.from_date,
				req.from_date,
				req.to_date
				],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {

				if(data.length){
					res({status: false, message: language.lang({key: "This Block Schedule already added in your list", lang: req.lang})})
				}else{
				var qry = " SELECT id FROM healthcare_myschedules where healthcareProfileId=? and book_date between ? and ? "
				models.sequelize.query(qry, {
				replacements: [
				req.doctorProfileId,
				req.from_date,
				req.to_date,
				],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(alreadyBooked) {	
				
				if(alreadyBooked.length){
				 res({status:false, message: language.lang({key: "Your schedule already booked for this date.", lang: req.lang})});
				}else{
				 req.healthcareProfileId=req.doctorProfileId;		
				 models.healthcareblockschedule.create(req).then(function(data){
				  res({status:true, message: language.lang({key: "Your schedule has been blocked successfully.", lang: req.lang})});
				 });	
				}
				
			});

		 }
				
		});
	}

	this.getHospital=function(req,res){

		var qry = " SELECT hds.hospitalId id,hds.hospital_name FROM hospital_doctors hd left join hospital_details hds on hd.hospitalId=hds.hospitalId and hds.languageId=? where doctorProfileId=? "
		models.sequelize.query(qry, {
				replacements: [req.body.languageId,req.body.doctorProfileId],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {

				res(data);
		});
	}

	this.getDoctor=function(req,res){

		var qry = " SELECT hds.doctorProfileId id,hds.name hospital_name FROM hospital_doctors hd left join doctor_profile_details hds on hd.doctorProfileId=hds.doctorProfileId and hds.languageId=? where hospitalId=? "
		models.sequelize.query(qry, {
				replacements: [req.body.languageId,req.body.doctorProfileId],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {

				res(data);
		});
	}

	this.getSchedule=function(req,res){

		var qry = " SELECT * from healthcare_block_schedules where healthcareProfileId=?  order by id desc"
		models.sequelize.query(qry, {
				replacements: [req.doctorProfileId],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {

				res(data);
		});
	}

	// this.getSchedulePatient = function (req, res) {
	// 	var day = moment(req.date, "YYYY-MM-DD").format('ddd').toLowerCase()

	// 	let specTagtypeId = utils.getAllTagTypeId()['SpecializationTagId'];
	// 	var qryBooked = " SELECT group_concat(from_time) booked FROM myschedules where book_date=? and doctorProfileId=? and hospitalId=? and status !=3  "
	// 	models.sequelize.query(qryBooked, {
	// 		replacements: [req.date, req.doctorProfileId, req.hospitalId],
	// 		type: models.sequelize.QueryTypes.SELECT
	// 	}).then(function (booked) {
	// 		var qry = "";
	// 		qry += "  SELECT dpp.doctor_profile_pic,hospitalDoctorId,days,appointment_duration,hp.hospital_name,hp.address,dp.name,dpp.salutation,td.title,"
	// 		qry += "  shift_1_from_time,"
	// 		qry += "  shift_1_to_time,"
	// 		qry += "  shift_2_from_time,"
	// 		qry += "  shift_2_to_time, "
	// 		qry += "  (SELECT group_concat(title) FROM doctor_tags dt left join tag_details td on dt.tagId=td.tagId WHERE tagtypeId = ? AND `doctorProfileId` = ?) doctor_tag "
	// 		qry += "  FROM "
	// 		qry += "  hospital_doctors hd left join hospital_doctor_timings hdt on hd.id=hdt.hospitalDoctorId and days=?"
	// 		qry += "  left join hospital_details hp on hp.hospitalId=hd.hospitalId "
	// 		qry += "  left join doctor_profile_details dp on dp.doctorProfileId=hd.doctorProfileId "
	// 		qry += "  left join doctor_profiles dpp on dpp.id=hd.doctorProfileId "
	// 		qry += "  left join doctor_educations de on dpp.id=de.doctorProfileId "
	// 		qry += "  left join tag_details td on de.tagtypeId=td.tagId and td.languageId = 1 "
	// 		qry += "  where hd.id=? ";

	// 		Promise.all([
	// 			models.sequelize.query(qry, {
	// 				replacements: [specTagtypeId, req.doctorProfileId, day, req.hospitalDoctorId],
	// 				type: models.sequelize.QueryTypes.SELECT
	// 			}),
	// 			models.blockschedule.count({
	// 				where: {
	// 					doctorProfileId: req.doctorProfileId,
	// 					from_date: {$lte: req.date},
	// 					to_date: {$gte: req.date}
	// 				}
	// 			})
	// 		]).then(([data, blockedSchedules]) => {

	// 			var final_obj = {};
				
	// 			if (data.length) {
	// 				var travelTime;
	// 				var dur = (data[0]["appointment_duration"] * 60);
	// 				var start_time = data[0]['shift_1_from_time'];
	// 				var shift_1_arr = [];

	// 				for (var i = 1; i < 100; i++) {
	// 					travelTime = parseInt(start_time) + parseInt(dur);
	// 					start_time = travelTime;
	// 					if (start_time > data[0]['shift_1_to_time']) {
	// 						break;
	// 					}
	// 					shift_1_arr.push(travelTime);
	// 				}


	// 				start_time = data[0]['shift_2_from_time'];
	// 				for (var i = 1; i < 100; i++) {
	// 					travelTime = parseInt(start_time) + parseInt(dur);
	// 					start_time = travelTime;
	// 					if (start_time > data[0]['shift_2_to_time']) {
	// 						break;
	// 					}
	// 					shift_1_arr.push(travelTime);
	// 				}


	// 				var bookedArr = [];

	// 				if (booked.length && booked[0]['booked'])
	// 					bookedArr = booked[0]['booked'].split(",");

	// 				var app1 = [];
	// 				var app2 = [];
	// 				var app3 = [];
	// 				var app4 = [];

	// 				if(!blockedSchedules){
	// 					var shiftObj = {};
	// 					var shiftArr = [];
	// 					for (var i = 0; i < shift_1_arr.length; i++) {

	// 						var time_format = moment().startOf('day').seconds(shift_1_arr[i]).format('hh:mm');

	// 						shiftObj = {};
	// 						shiftObj['booked'] = 0;
	// 						if (bookedArr.indexOf(time_format.toString()) != -1)
	// 							shiftObj['booked'] = 1;


	// 						time_format = moment().startOf('day').seconds(shift_1_arr[i]).format('hh:mm');


	// 						shiftObj['time'] = shift_1_arr[i];

	// 						shiftObj['time_format'] = time_format;


	// 						if (shiftObj['time'] > "0" && shiftObj['time'] <= "43140") {
	// 							app1.push(shiftObj);
	// 						}

	// 						if (shiftObj['time'] > "43140" && shiftObj['time'] <= "57600") {
	// 							app2.push(shiftObj);
	// 						}


	// 						if (shiftObj['time'] > "57600" && shiftObj['time'] <= "72000") {
	// 							app3.push(shiftObj);
	// 						}


	// 						if (shiftObj['time'] > "72000" && shiftObj['time'] <= "86400") {
	// 							app4.push(shiftObj);
	// 						}

	// 					}
	// 				}

	// 				final_obj = {
	// 					"appointment_duration": data[0]["appointment_duration"],
	// 					"doctor_profile_pic": data[0]['doctor_profile_pic'],
	// 					"doctor_name": data[0]['name'],
	// 					"salutation": data[0]['salutation'],
	// 					"doctor_education": data[0]['title'],
	// 					"doctor_tag": data[0]['doctor_tag'],
	// 					"hospital_name": data[0]['hospital_name'],
	// 					"hospital_address": data[0]['address'],
	// 					'appointment1': app1,
	// 					'appointment2': app2,
	// 					'appointment3': app3,
	// 					'appointment4': app4
	// 				};
	// 			}
	// 			res({
	// 				status: true,
	// 				data: final_obj,
	// 				message: language.lang({
	// 					key: "",
	// 					lang: req.lang
	// 				})
	// 			});
	// 		});

	// 	});
	// }

	this.addSchedule=function(req,res){

		var qry = " SELECT id FROM myschedules where hospitalDoctorId=? and book_date=? and from_time=? "
		models.sequelize.query(qry, {
				replacements: [
				req.hospitalDoctorId,
				req.book_date,
				req.time
				],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {

				if(data.length){
					res({status: true, message: language.lang({key: "This Schedule already have been taken", lang: req.lang})})
				}else{
				
				req.time_sec=req.time;
				req.from_time=moment().startOf('day').seconds(req.time).format('hh:mm');
				req.appointment_duration=parseInt(req.appointment_duration)*60;
				var endTime = parseInt(req.time_sec)+parseInt(req.appointment_duration);
				req.to_time=moment().startOf('day').seconds(endTime).format('hh:mm');

				models.myschedule.create(req).then(function(data){
					req.status = 2;
					req.appointmentId = data.id;
					module.exports.book_notify(req);
					res({status: true, message: language.lang({key: "Service Booked Successfully.", lang: req.lang})});

				});

			   }
				
			});
	}


	this.addRefund=function(req,res){

		var dateTime=req.min_book_date;			
		var startTime=moment(dateTime, "YYYY-MM-DD");
		var endTime=moment();
		var duration = moment.duration(endTime.diff(startTime));
		var hours = parseInt(duration.asHours());
		var minutes = parseInt(duration.asMinutes())-hours*60;

		//if(minutes < 61){
		if(startTime < endTime){	
			res({status: false, message: language.lang({key: "Schedule is not cancled", lang: req.lang})});
		}else{
		var updateData={};
		updateData['status']=3;
		updateData['status_updated_by']=req.patientId;

		if(req.pay_status==2){
			updateData['refund_status']=1;
			updateData['refund_amount']=req.total_amu;
			updateData['refund_reason']="Service Request cancelled by Patient";
		}

		models.healthcaremyschedule.update(updateData,{where: {order_token: req.order_token}}).then(function(response) {
			//module.exports.cancle_notify(req, 'patient');
			res({status: true, message: language.lang({key: "Schedule Cancled", lang: req.lang})});
		});



		}   
	}



	this.cancleScheduleHealthcare=function(req,res){

		module.exports.getShByToken(req,function(shData){
			var dateTime=req.min_book_date;			
			var startTime=moment(dateTime, "YYYY-MM-DD");
			var endTime=moment();
			var duration = moment.duration(endTime.diff(startTime));
			var hours = parseInt(duration.asHours());
			var minutes = parseInt(duration.asMinutes())-hours*60;


			var dateTimeRe=req.max_book_date;			
			var startTimeRe=moment(dateTimeRe, "YYYY-MM-DD").add(1, 'days').format('YYYY-MM-DD');
			var endTimeRe=moment().format('YYYY-MM-DD');

			//if(minutes < 61){
			if(startTime < endTime && req.is_refund!=1){	
				res({status: false, message: language.lang({key: "Schedule is not cancled", lang: req.lang})});
			}else if(startTimeRe < endTimeRe && req.is_refund==1){
				res({status: false, message: language.lang({key:"Refund not allowed", lang: req.lang})});
			}else{
				var updateData={};
				updateData['status']=3;
				updateData['status_updated_by']=req.patientId;
				if(req.pay_status==2){
					updateData['refund_status']=1;
					updateData['refund_amount']=req.total_amu;
					updateData['refund_reason']="Service Request cancelled by Patient";
				}

				var msgSend="Service Request cancelled Successfully.";
				if(req.is_refund){
					updateData['refund_reason']=req.refund_reason;
					msgSend="Refund request sent successfully";
				}else{
				  updateData['is_cancel']=1;		
				}


				if(shData.length){
					var startOn=moment(shData[0]['min_date'],"YYYY-MM-DD").format('YYYY-MM-DD');
					if(startOn>endTimeRe){
						updateData['refund_before_start']=1;
					}else{
					  updateData['refund_before_start']=2;	
					}
				}

				models.healthcaremyschedule.update(updateData,{where: {order_token: req.order_token}}).then(function(response) {
					//module.exports.cancle_notify(req, 'patient');
					res({status: true, message: language.lang({key:msgSend, lang: req.lang})});
				});
			} 

		});  
	}



	this.getShByToken=(req,res)=>{

		var qry = " SELECT max(book_date) max_date,min(book_date) min_date FROM healthcare_myschedules where order_token=? group by order_token"
		models.sequelize.query(qry, {
			replacements: [
				req.order_token
			],
			type: models.sequelize.QueryTypes.SELECT
		}).then(function(data) {

				res(data);
		});

	}


	this.getScheduleList = (req, res) => {

			var qry="";
			var where="";
			var parArr=[];

			if(req.patientId && req.patientId !=""){
			  where+=" and hms.patientId=? "
			  parArr.push(req.patientId);
			}
			
			if(req.type==1){
			   where+="  and ((Max(book_date) >= Curdate()) and hms.status in (1,2)) "	
			}

			if(req.type==2){
			   where+="  and (max(status)=3 or Max(book_date) < Curdate()) "	
			}

			if(req.id){
			   where+="  and hms.id=? "	
			   parArr.push(req.id);
			}

			//Add lang--------------
			 req.langId = parseInt(req.langId);
  			 if (isNaN(req.langId)) req.langId = 1;
			 parArr.push(req.langId,req.langId,req.langId,req.langId,req.langId,req.langId);			 
			//----------------------

			// qry +=" select  hms.*,hms.id id,order_token,group_concat(hms.book_date) book_date,group_concat(hms.from_time) from_time "
			// //qry +=" ,hpd.healthcareprofileId,ht.fee,ht.type,hpd.name,doctor_profile_pic,hp.id healthcareprofileId "
			// qry +="  "
			// qry +=" from healthcare_myschedules hms "
			// //qry +=" left join  healthcare_profiles hp on hms.healthcareProfileId=hp.id "
			// //qry +=" left join healthcare_profile_details hpd on hp.id=hpd.healthcareprofileId "
			// //qry +=" left join healthcare_educations hedu on hp.id=hedu.healthcareprofileId "
			// //qry +=" left join tag_details tagd on hedu.tagtypeId=tagd.tagId "
			// //qry +="  left join healthcare_tags htag on hp.id=htag.healthcareprofileId "
			// //qry += " left join tag_details tagd2 on htag.tagId=tagd2.tagId "
			// //qry += " left join healthcare_timings ht on hp.id=ht.healthcareprofileId "
			// //qry += " left join healthcare_feedbacks hfed on hp.id=hfed.healthcareprofileId "
			// qry += " where 1=1 "+where
			// qry += " group by order_token  "
			// qry += " order by hms.id desc "


			qry +=" select *,if(hfd.id,1,0) feedback,tab1.order_token order_token,tab1.patientId patientId,tab2.healthcareProfileId healthcareProfileId,tab1.id id from (SELECT max(book_date) max_book_date,min(book_date) min_book_date,hms.healthcareProfileId,patient_name,patient_mobile,patient_email,refund_before_start, "
			qry +=" hms.id id,hms.status,hms.refund_status,hms.pay_status,hms.avb_on,hms.total_amu,hms.service_type,patientId,refund_reason,healthcare_refund_status,concern, "
			qry +=" hms.order_token,status_updated_by, "
			qry +=" group_concat(hms.book_date) book_date, "
			qry +=" group_concat(hms.from_time) from_time "
			qry +="	FROM healthcare_myschedules hms "
			
			//qry +="		AND      hms.patientid='2' "
			//qry +="		AND      hms.status IN (1,2) "
			qry +="	GROUP BY order_token "
			qry +="	having 1=1 "+ where

			qry +="	ORDER BY hms.id DESC ) tab1  left join  "
			qry +="	(select * from (select sum(distinct duration_to-duration_from) experience,hp.id healthcareProfileId,hp.doctor_profile_pic,hpd.name,avg(ifnull(rating,0)) rating,count(distinct hfed.id) reviews,GROUP_CONCAT(distinct tagd.title) tags "
			qry +="	from healthcare_profiles hp "
			qry +="	left join healthcare_profile_details hpd on hp.id=hpd.healthcareprofileId and hpd.languageId=if(hpd.languageId=?,?,1) "
			qry +="	left join healthcare_educations hedu on hp.id=hedu.healthcareprofileId "
			qry +="	left join healthcare_experiences hexp on hp.id=hexp.healthcareprofileId "
			qry +="	left join tag_details tagd on hedu.tagtypeId=tagd.tagId and tagd.languageId=if(tagd.languageId=?,?,1) "
			qry +="	left join healthcare_tags htag on hp.id=htag.healthcareprofileId "
			qry +="	left join tag_details tagd2 on htag.tagId=tagd2.tagId and tagd2.languageId=if(tagd2.languageId=?,?,1) "
			qry +="	left join healthcare_timings ht on hp.id=ht.healthcareprofileId "
			qry +="	left join healthcare_feedbacks hfed on hp.id=hfed.healthcareprofileId "
			qry +="	group by hp.id ) tab3) tab2 on tab1.healthcareProfileId=tab2.healthcareProfileId "

			qry +=" left join healthcare_feedbacks hfd  on hfd.order_token=tab1.order_token "

			models.sequelize.query(qry, {
				replacements: parArr,
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(data) {


			//-------------For manage data------------------
			var finalArr=[];
			for(var i=0; i<data.length;i++){
					var finalObj={};
					finalObj=data[i];
					var dateArr=data[i]['book_date'].split(',');
				if(data[i]['service_type']==3){
					var timeArr=data[i]['from_time'].split(',');
					var objDates={};
					var arrTime=[];
					for(var j=0; j<dateArr.length;j++){
						if(objDates[dateArr[j]]){
							var getOldArr=objDates[dateArr[j]];
							getOldArr.push(timeArr[j]);	
						 	objDates[dateArr[j]]=getOldArr;
						}else{
						 var arrOfTime=[];
						 arrOfTime.push(timeArr[j]);	
						 objDates[dateArr[j]]=arrOfTime;	
						}
						arrTime.push(timeArr[j]);
					}
					finalObj['booked_date']=objDates;
				}else{
					finalObj['booked_date']=dateArr;
				}
				finalObj['avb_on_txt']="";
				if(data[i]['service_type']==1){
					finalObj['avb_on_txt']="24x7 (Stay at home with Patient)"
				}else if(data[i]['service_type']==2){
					finalObj['avb_on_txt']=data[i]['avb_on']==1 ? "Morning hours(8Am to 8Pm)" : "Evening hours(8Pm to 8Am)";
				}

				finalArr.push(finalObj);
			}
			//--------------------------------------------------

			res({
				status: true,
				data:finalArr,
				message:language.lang({key: "list", lang: req.lang})
			});

			}); 	

	}


	this.getReport=function(req,res){

		console.log(req);

		var where=''
		if(req.report_type==2){
			where=" and pay_status=2 "
		}

		//[req.from_date_r,req.to_date_r,req.healthcareProfileId]
		var qry_sum1=" SELECT count(*) total_count,sum(ifnull(total_amu,0)) amu,sum(ifnull(com_amu,0)) wiki_amu,sum(ifnull(final_amu,0)) pro_amu from ( ";
		var qry = " SELECT *,max(book_date) max_book_date,min(book_date) min_book_date "
		qry +=" FROM healthcare_myschedules group by order_token having max_book_date <= curdate() and max_book_date between ? and ? and healthcareProfileId=? "+where;
		qry_sum2=" ) sumqry";
		models.sequelize.query(qry, {
				replacements: [req.from_date_r,req.to_date_r,req.healthcareProfileId],
				type: models.sequelize.QueryTypes.SELECT
		}).then(function(data) {

			models.sequelize.query(qry_sum1+qry+qry_sum2, {
				replacements: [req.from_date_r,req.to_date_r,req.healthcareProfileId],
				type: models.sequelize.QueryTypes.SELECT
			}).then(function(totalData) {

				res({status:true,doctors:data,total:totalData[0]});
			});	
		});
	}



	// this.getSchedulePatientList = (req, res) => {
	// 	let qry ='SELECT ms.id myscheduleId, ms.suggestion, ms.book_date, ms.from_time, ms.to_time, ms.time_sec, dp.name, ms.status,';
	// 		qry += ' ms.hospitalDoctorId, ms.doctorProfileId, ms.hospitalId, ms.patient_name, ms.patient_mobile, ms.patient_email,';
	// 		qry += ' hp.hospital_name, hp.address, dpp.salutation, dpp.doctor_profile_pic';
	// 		qry += " FROM myschedules ms left join hospitals h on ms.hospitalId=h.id";
	// 		qry += " left join hospital_details hp on h.id=hp.hospitalId";
	// 		qry += " left join doctor_profile_details dp on dp.doctorProfileId=ms.doctorProfileId";
	// 		qry += " left join doctor_profiles dpp on dp.doctorProfileId=dpp.id";
	// 		qry += " where patientId=? and status IN (?) ORDER BY book_date DESC";
	// 	Promise.all([
	// 		models.sequelize.query(qry, {
	// 			replacements: [req.patientId, [0, 3, 4]],
	// 			type: models.sequelize.QueryTypes.SELECT,
	// 		}),
	// 		models.sequelize.query(qry, {
	// 			replacements: [req.patientId, [1,2]],
	// 			type: models.sequelize.QueryTypes.SELECT,
	// 		})
	// 	]).then(([completed, upcoming]) => {
	// 		res({
	// 			status: true,
	// 			data:{upcoming, completed},
	// 			message: language.lang({key: "addedSuccessfully", lang: req.lang})
	// 		});
	// 	}).catch(console.log)
	// }


	const experienceAttribute = models.sequelize.literal(
		'IFNULL(SUM('
			+ '`doctorprofile.doctorexperiences`.`duration_to`'
			+ ' - `doctorprofile.doctorexperiences`.`duration_from`'
		+ '), 0)'
	);
	const SpecializationTagId = require('./utils').getAllTagTypeId()['SpecializationTagId'];

}
module.exports = new healthcaremyschedule();