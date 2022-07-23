const User = require('../models/User')
const config = require('../config/config')
const client = require("twilio")(config.accountSID, config.authToken)


exports.register = async(req, res, next) =>{
    const {username,phone,address} = req.body
    try{
        const user = await User.create({username,phone,address})
        let ph = parseInt("91"+user.phone)
 
    //console.log(config.serviceID)
    await client.verify.services(config.serviceId)
    .verifications
    .create({
        to : `+91${req.body.phone}`,
        channel : "sms"
    })
    .then((data)=>{
        res.status(200).send("Success")
    })
       console.log("Hello")  
        
    }
    catch(error){
        next(error)
    } 
}

exports.verify = async(req, res, next)=>{
    const {phone} = req.params;
    const user = await User.findOne({phone})

    try{
    await client.verify.services(config.serviceId)
    .verificationChecks.create({
        to : `+91${req.params.phone}`,
        code : req.body.code
    })
    .then((data)=>{
        console.log(data.valid)
        if(data.valid===false){
            console.log("asdbjasdhgjsda")
            return next(new ErrorResponse("Invalid token",400));
        }
        else{
        user.verified = true;
        res.status(200).send("Done");
        user.save()
        console.log(user)
        }
    })}
    catch(error){
        next(error)
    }
}

