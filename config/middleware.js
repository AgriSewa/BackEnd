const jwt=require('jsonwebtoken')
const JWT_SECRET=process.env.JWT_SECRET;
const mongoose=require('mongoose');
const Farmer = require('../models/Farmer');
const Expert = require('../models/Expert');

module.exports.getAuthenticatedFarmer=(req,res,next)=>{
    const {auth}=req.headers;
    if(!auth)
        return res.json({success:false,message:"Farmer not signed in"})
    const token=auth.replace("Bearer ","")
    jwt.verify(token,JWT_SECRET,(err,payload)=>{
        if(err)
            return res.json({success:false,message:"Farmer not signed in"})
        const {_id}=payload
        Farmer.findById(_id).then(userdata=>{
            req.user=userdata
            next();
        })
    })
}

module.exports.getAuthenticatedExpert=(req,res,next)=>{
    const {auth}=req.headers;
    if(!auth)
        return res.json({success:false,message:"Expert not signed in"})
    const token=auth.replace("Bearer ","")
    jwt.verify(token,JWT_SECRET,(err,payload)=>{
        if(err)
            return res.json({success:false,message:"Expert not signed in"})
        const {_id}=payload
        Expert.findById(_id).then(userdata=>{
            req.user=userdata
            next();
        })
    })
}