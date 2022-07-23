
const mongoose = require('mongoose')


const UserSchema = new mongoose.Schema({
    username:{
        type : String,
        required : [true,"Please provide a username"]
    },

    phone: {
        type : String,
        required : [true,"Please provide a phone no."],
    },
    address: {
        type : String,
        required : true,
    },
    verified : {
        type : Boolean,
        default : false
    },

})

const User  = mongoose.model("User",UserSchema)
module.exports = User