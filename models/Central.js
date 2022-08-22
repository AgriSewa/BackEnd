const mongoose=require('mongoose');

const centralSchema=new mongoose.Schema({
    problem:{
        type:String
    },
    advice:{
        type:String
    },
    location:{
        type:Object
    },
    image:{
        type:String
    }
});

centralSchema.index({"location":"2dsphere"});

const central=mongoose.model('central',centralSchema);
module.exports=central;