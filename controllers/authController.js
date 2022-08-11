const Farmer = require('../models/Farmer')
const Expert = require('../models/Expert')
const config = require('../config/config')
const client = require("twilio")(config.accountSID, config.authToken);
const jwt=require("jsonwebtoken");
const JWT_SECRET=process.env.JWT_SECRET;


exports.register = async(req, res, next) =>{
    const {username,phone,lat,long} = req.body;
    try{
        const user = await Farmer.create({
            username,
            phone,
            location:{
                type: "Point",
                coordinates: [parseFloat(lat), parseFloat(long)]
            }
        });
        let ph = parseInt("91"+user.phone)
 
        //console.log(config.serviceID)
        await client.verify.services(config.serviceId)
        .verifications
        .create({
            to : `+91${req.body.phone}`,
            channel : "sms"
        })
        .then((data)=>{
            return res.json({success:true})
        });
        
    }
    catch(error){
        return res.json({success:false});
    } 
}

exports.verifyRegister = async(req, res, next)=>{
    const {phone} = req.params;
    const farmer = await Farmer.findOne({phone})

    try{
    await client.verify.services(config.serviceId)
    .verificationChecks.create({
        to : `+91${req.params.phone}`,
        code : req.body.code
    })
    .then((data)=>{
        console.log(data.valid)
        if(data.valid===false){
            return next(new ErrorResponse("Invalid token",400));
        }
        else{
            farmer.verified = true;
            farmer.save();
            return res.json({success:true,message:"Registration Successful"})
        }
    })}
    catch(error){
        next(error)
    }
}

exports.loginFarmer = async(req, res, next) =>{
    const {phone} = req.body
    try{
        const farmer = await Farmer.findOne({phone:phone});
        let ph = parseInt("91"+farmer.phone);
        
        //console.log(config.serviceID)
        await client.verify.services(config.serviceId)
        .verifications
        .create({
            to : `+91${req.body.phone}`,
            channel : "sms"
        })
        .then((data)=>{
            return res.json({success:true})
        })
        
    }
    catch(error){
        next(error)
    } 
}

exports.verifyLoginFarmer = async(req, res, next)=>{
    const {phone} = req.params;
    const farmer = await Farmer.findOne({phone})

    try{
        await client.verify.services(config.serviceId)
        .verificationChecks.create({
            to : `+91${req.params.phone}`,
            code : req.body.code
        })
        .then((data)=>{
            if(data.valid===false){
                res.send("Invalid OTP");
            }
            else{
                const token=jwt.sign({_id:farmer._id},JWT_SECRET)
                return res.json({success:true,message:"Login successful",token:token,user:farmer})
            }
        })
    }
    catch(error){
        next(error)
    }
}

exports.loginExpert = async(req, res, next) =>{
    const {phone} = req.body
    try{
        const expert = await Expert.find({phone:phone});
        let ph = parseInt("91"+expert.phone);
 
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
        
    }
    catch(error){
        next(error)
    } 
}

exports.verifyLoginExpert = async(req, res, next)=>{
    const {phone} = req.params;
    const expert = await Expert.findOne({phone})

    try{
        await client.verify.services(config.serviceId)
        .verificationChecks.create({
            to : `+91${req.params.phone}`,
            code : req.body.code
        })
        .then((data)=>{
            if(data.valid===false){
                res.send("Invalid OTP");
            }
            else{
                const token=jwt.sign({_id:expert._id},JWT_SECRET)
                res.status(200).send(token);
            }
        })
    }
    catch(error){
        next(error)
    }
}

