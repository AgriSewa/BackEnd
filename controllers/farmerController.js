const { Storage } = require("@google-cloud/storage");
const moment=require("moment");
const axios=require('axios').default;


const Expert=require("../models/Expert");
const con=require("../config/db");
const adminController = require("./adminController");
const video = require("../config/video");


const projectId=process.env.projectId;
let keyFilename = "accesskeys.json"; 
const storage = new Storage({
  projectId,
  keyFilename,
});
const bucketName=process.env.bucketName;
const bucket = storage.bucket(bucketName);


async function findState(lat,long){
    const fetched_data=await axios.get(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=pjson&featureTypes=&location=${long},${lat}`);
    const location=fetched_data.data.address;
    let state=location.Region;
    state=state.replace(" ","");
    return state;
}

module.exports.bookTimeSlot = async (req,res)=>{
    const {date,time,mode,expertID} = req.params;
    const expert = await Expert.findById(expertID);
    const farmer = req.user;
    //call the function to fetch link
    let book_slot;

    const state=await findState(farmer.location.coordinates[1],farmer.location.coordinates[0]);

    if(mode==='physical'){
        const meet_link=`https://www.google.com/maps?q=${expert.location.coordinates[1]},${expert.location.coordinates[0]}`;
        book_slot=`UPDATE appointments_${state} SET farmerID='${farmer._id}', booked=true, mode='${mode}', link='${meet_link}' WHERE book_date='${date}' AND book_time='${time}' AND expertID='${expertID}'`;
    }        
    else if(mode==='video'){
        const meet_link = await video.addEvent(expert.email,date,time);
        console.log(meet_link);
        book_slot=`UPDATE appointments_${state} SET farmerID='${farmer._id}', booked=true, mode='${mode}', link='${meet_link}' WHERE book_date='${date}' AND book_time='${time}' AND expertID='${expertID}'`;
    }else if(mode==='audio'){
        const meet_link=expert.id+farmer._id;
        book_slot=`UPDATE appointments_${state} SET farmerID='${farmer._id}', booked=true, mode='${mode}', link='${meet_link}' WHERE book_date='${date}' AND book_time='${time}' AND expertID='${expertID}'`;
    }
            
    //update into database table
    con.query(book_slot,(err,result)=>{
        if(err)
            console.log("Error in booking slot",err);
        res.send("Slot Booking successful!");       
    });
}

module.exports.uploadFeedback = async (req,res)=>{
    const {feedback} = req.body;
    const {resultID} = req.params;
    const farmer = req.user;
    try {
        if (req.file) {
            const url=`https://storage.googleapis.com/${bucketName}/${req.file.originalname}`
            const blob = bucket.file(req.file.originalname);
            const blobStream = blob.createWriteStream();
    
            blobStream.on("finish", () => {
                console.log(url)
                submit_feedback=`UPDATE result_${state} SET feedback='${feedback}',farmerID='${farmer._id}',image='${url}' WHERE id=${resultID}`;
                con.query(submit_feedback,(err,result)=>{
                    if(err)
                        return res.json({success:false,message:"Error in saving feedback"});
                    return res.json({success:true,message:"Successfully submitted Feedback"});
                });
            });
            blobStream.end(req.file.buffer);
        }else {
            return res.json({success:false,message:"Error in saving feedback"});
        }
    }catch (error) {
        return res.json({success:false,message:"Error in saving feedback"});
    }
    
}

module.exports.findAppointments = async (req,res)=>{

    const farmer = req.user;
    const state=await findState(farmer.location.coordinates[1],farmer.location.coordinates[0]);
    const today = new Date().toISOString().slice(0, 10);
    console.log(today);
    const sql=`SELECT * FROM appointments_${state} WHERE farmerID='${farmer._id}' AND book_date>='${today}'`; 
    
    con.query(sql,(err,result)=>{
        if(err)
            console.log("Error in finding appointment slots",err);
        res.send(result);       
    });
}

module.exports.findNearestExperts=async (req,res)=>{
    var options={
        location:{ 
            $near :
            {
               $geometry: { type: "Point",  coordinates: [ -73.856077, 40.848449 ] },
               $maxDistance: 5000
            }
        }
    }
    const result=await Expert.find(options);
    res.send(result);
}

module.exports.findSlots= async (req,res)=>{
    const farmer = req.user;
    const {expertID} = req.params;
    
    //getting state information from farmer's latitude, longitude
    const state=await findState(farmer.location.coordinates[1],farmer.location.coordinates[0]);
    const date=req.body.date;

    //creating time slots of that date if it already doesn't exist
    await adminController.createTimeSlots(date,state,expertID);
    adminController.createResultsTable(date,state,expertID);
    
    // Finding slots of that particular date
    const find_slots=`SELECT * FROM appointments_${state} WHERE book_date='${date}' AND expertID='${expertID}'`;
    con.query(find_slots,(err,result)=>{
        if(err)
            console.log("Error finding slots for the farmer");
        res.send(result);
    });
}

module.exports.uploadImage=async (req, res) => {
    try {
        if (req.file) {
            const url=`https://storage.googleapis.com/${bucketName}/${req.file.originalname}`
            const blob = bucket.file(req.file.originalname);
            const blobStream = blob.createWriteStream();
    
            blobStream.on("finish", () => {
                console.log(url)
                res.status(200).send(url);
            });
            blobStream.end(req.file.buffer);
        }else {
            throw "error with img";
        }
    }catch (error) {
      res.status(500).send(error);
    }
}


module.exports.viewResults = async(req,res) => {
    const farmer = req.user;
    const state=await findState(farmer.location.coordinates[1],farmer.location.coordinates[0]);
    const appointments = `SELECT * FROM results_${state} WHERE farmerID='${farmer._id}' ORDER BY book_date DESC`;
    con.query(appointments,(err,result)=>{
        if(err)
            console.log("Error finding appointments for the farmer");
        return res.json({results:result})
    });
}