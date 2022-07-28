const { Storage } = require("@google-cloud/storage");
const moment=require("moment");
const axios=require('axios').default;


const Expert=require("../models/Expert");
const con=require("../config/db");
const adminController = require("./adminController");


const projectId=process.env.projectId;
let keyFilename = "accesskeys.json"; 
const storage = new Storage({
  projectId,
  keyFilename,
});
const bucketName=process.env.bucketName;
const bucket = storage.bucket(bucketName);





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

    //getting state information from farmer's latitude, longitude
    const fetched_data=await axios.get(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=pjson&featureTypes=&location=${farmer.location.coordinates[0]},${farmer.location.coordinates[1]}`);
    const location=fetched_data.data.address;
    let state=location.Region;
    const date=req.body.date;
    state=state.replace(" ","");

    //creating time slots of that date if it already doesn't exist
    adminController.createTimeSlots(date,state);
    
    // Finding slots of that particular date
    const find_slots=`SELECT * FROM appointments_${state} WHERE book_date='${date}'`;
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