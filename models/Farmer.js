
const mongoose = require('mongoose')


const FarmerSchema = new mongoose.Schema({
    username:{
        type : String,
        required : [true,"Please provide a username"]
    },

    phone: {
        type : String,
        required : [true,"Please provide a phone no."],
        unique: [true,"Number already registered"]
    },
    location:{
        type:Object
    },
    verified : {
        type : Boolean,
        default : false
    },

})

const Farmer  = mongoose.model("Farmer",FarmerSchema)
module.exports = Farmer;