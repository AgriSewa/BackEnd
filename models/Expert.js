const mongoose=require('mongoose');

const expertSchema=new mongoose.Schema({
    name:{
        type:String
    },
    email:{
        type:String,
        required:true
    },
    phone: {
        type : String,
        required : [true,"Please provide a phone no."],
        unique: [true,"Number already registered"]
    },
    location:{
        type:Object
    }
});

expertSchema.index({"location":"2dsphere"});

const expert=mongoose.model('expert',expertSchema);
module.exports=expert;