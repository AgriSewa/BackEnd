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
    if(mode==='physical')
        book_slot=`UPDATE appointments_${state} SET farmerID='${farmer._id}', booked=true, mode='${mode}', link=NULL WHERE book_date='${date}' AND book_time='${time}' AND expertID='${expertID}'`;
    else if(mode==='video'){
        const meet_link = await video.addEvent(expert.email,date,time);
        console.log(meet_link);
        book_slot=`UPDATE appointments_${state} SET farmerID='${farmer._id}', booked=true, mode='${mode}', link='${meet_link}' WHERE book_date='${date}' AND book_time='${time}' AND expertID='${expertID}'`;
    }
            
    //update into database table
    con.query(book_slot,(err,result)=>{
        if(err)
            console.log("Error in booking slot",err);
        res.send("Slot Booking successful!");       
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

module.exports.viewAppointments = async(req,res) => {
    const farmer = req.user
    const state=await findState(farmer.location.coordinates[1],farmer.location.coordinates[0]);
    var date_time = new Date();
    const cur_date = date_time.getFullYear()+"-"+date_time.getMonth()+"-"+date_time.getDay()
    const cur_time = date_time.getHours()+":"+date_time.getMinutes()+":"+date_time.getSeconds()
    const appointments = `SELECT * FROM appointments_${state} WHERE farmerID='${farmer._id}' AND book_date>='${cur_date}' AND book_time>='${cur_time}'`
    con.query(appointments,(err,result)=>{
        if(err)
            console.log("Error finding appointments for the farmer");
        res.send(result);
    });
}