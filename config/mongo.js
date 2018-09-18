var mongoDB = require('./mongo_config');
function Mongo() {
    this.save = function(req,type,res){
      
        var collection = mongoDB.get().collection('records');
        var find_json = { key:req.key,langId:req.langId,type:req.type}
        if(type=='delete'){
            collection.deleteOne( find_json );
            res({status:true});
        }else{
            collection.find(find_json).count(function(err, countData) {
                if(countData!==0){    
                    collection.updateOne(find_json,{ $set: { title: req.title}});
                res({status:true});
                }else{
                    collection.insert(req, function(err, result) {
                        res({status:true,data:result});
                    });
                }
            })
        }
    };
        this.deleteMany = function(req,type,res){
            var collection = mongoDB.get().collection('records');
            collection.deleteOne( req );
            res({status:true});
     
    };
}
module.exports = new Mongo();
