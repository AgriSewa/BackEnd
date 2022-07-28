const mongoose=require('mongoose');

const expertSchema=new mongoose.Schema({
    name:{
        type:String
    },
    location:{
        type:Object
    }
});

expertSchema.index({"location":"2dsphere"});

const expert=mongoose.model('expert',expertSchema);
module.exports=expert;