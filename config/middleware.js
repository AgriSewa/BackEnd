const jwt=require('jsonwebtoken')
const JWT_SECRET=process.env.JWT_SECRET;
const mongoose=require('mongoose');
const Farmer = require('../models/Farmer');

module.exports.getAuthenticatedFarmer=(req,res,next)=>{
    const {auth}=req.headers;
    if(!auth)
        return res.json({success:false,message:"User not signed in"})
    const token=auth.replace("Bearer ","")
    jwt.verify(token,JWT_SECRET,(err,payload)=>{
        if(err)
            return res.json({success:false,message:"User not signed in"})
        const {_id}=payload
        Farmer.findById(_id).then(userdata=>{
            req.user=userdata
            console.log(req.user);
            next();
        })
    })
}