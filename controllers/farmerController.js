const { Storage } = require("@google-cloud/storage");
const moment = require("moment");
const axios = require("axios").default;

const Expert = require("../models/Expert");
const con = require("../config/db");
const adminController = require("./adminController");
const video = require("../config/video");

const projectId = process.env.projectId;
let keyFilename = "accesskeys.json";
const storage = new Storage({
  projectId,
  keyFilename,
});
const bucketName = process.env.bucketName;
const bucket = storage.bucket(bucketName);


async function findState(lat,long){
    const fetched_data=await axios.get(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=pjson&featureTypes=&location=${long},${lat}`);
    const location=fetched_data.data.address;
    let state=location.Region;
    state=state.replace(" ","");
    return state;
}



module.exports.bookTimeSlot = async (req, res) => {
  const { date, time, mode, expertID } = req.params;
  const expert = await Expert.findById(expertID);
  const farmer = req.user;
  //call the function to fetch link
  console.log(`${date} ${time} ${mode} ${expertID}`);
  let book_slot;

  const state = await findState(
    farmer.location.coordinates[1],
    farmer.location.coordinates[0]
  );

  if (mode === "physical") {
    const meet_link = `https://www.google.com/maps?q=${expert.location.coordinates[1]},${expert.location.coordinates[0]}`;
    book_slot = `UPDATE appointments_${state} SET farmerID='${farmer._id}', booked=true, mode='${mode}', link='${meet_link}' WHERE book_date='${date}' AND book_time='${time}' AND expertID='${expertID}'`;
  } else if (mode === "video") {
   
    const meet_link = await video.addEvent(expert.email, date, time);
    console.log(meet_link);
    book_slot = `UPDATE appointments_${state} SET farmerID='${farmer._id}', booked=true, mode='${mode}', link='${meet_link}' WHERE book_date='${date}' AND book_time='${time}' AND expertID='${expertID}'`;
  } else if (mode === "audio") {
    const meet_link = expert.id + farmer._id;
    book_slot = `UPDATE appointments_${state} SET farmerID='${farmer._id}', booked=true, mode='${mode}', link='${meet_link}' WHERE book_date='${date}' AND book_time='${time}' AND expertID='${expertID}'`;
  }

  const find_slot=`SELECT * FROM appointments_${state} WHERE book_date='${date}' AND book_time='${time}' AND expertID='${expertID}'`;
  con.query(find_slot,(err,result)=>{
    if(err)
        console.log("Error in querying database");
    if(result.length){
        const slot=result[0];
        const update_result=`UPDATE results_${state} SET farmerID='${farmer._id}' WHERE slotID='${slot.id}'`;
        con.query(update_result,(err,result)=>{
            if(err)
                console.log("Error in updating farmer database");
        });
    }
  });

  //update into database table
  con.query(book_slot, (err, result) => {
    if (err) console.log("Error in booking slot", err);
    res.send("Slot Booking successful!");
  });
};

module.exports.uploadFeedback = async (req, res) => {
  const { feedback } = req.body;
  const { resultID } = req.params;
  const farmer = req.user;

  const state = await findState(
    farmer.location.coordinates[1],
    farmer.location.coordinates[0]
  );
  const feedbackInt=parseInt(feedback);
  try {
    if (req.file) {
      const url = `https://storage.googleapis.com/${bucketName}/${req.file.originalname}`;
      const blob = bucket.file(req.file.originalname);
      const blobStream = blob.createWriteStream();

      blobStream.on("finish", () => {
        console.log(url);
        submit_feedback = `UPDATE results_${state} SET feedback=${feedbackInt},image='${url}',update_farmer=TRUE WHERE id=${resultID}`;
        con.query(submit_feedback, (err, result) => {
          if (err)
            return res.json({
              success: false,
              message: "Error in saving feedback",
            });
          return res.json({
            success: true,
            message: "Successfully submitted Feedback",
          });
        });
      });
      blobStream.end(req.file.buffer);
    } else {
      return res.json({ success: false, message: "Error in saving feedback" });
    }
  } catch (error) {
    return res.json({ success: false, message: "Error in saving feedback" });
  }
};

module.exports.findAppointments = async (req, res) => {
  const farmer = req.user;
  const state = await findState(
    farmer.location.coordinates[1],
    farmer.location.coordinates[0]
  );
  const today = new Date().toISOString().slice(0, 10);
  const sql = `SELECT * FROM appointments_${state} WHERE farmerID='${farmer._id}' AND book_date>='${today}'`;

  con.query(sql, (err, result) => {
    if (err) console.log("Error in finding appointment slots", err);
    res.send(result);
  });
}

module.exports.findNearestExperts = async (req, res) => {
    const farmer = req.user;
  var options = {
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [farmer.location.coordinates[0], farmer.location.coordinates[1]] },
        $maxDistance: 20000,
      },
    },
  };
  const result = await Expert.find(options);
  res.send(result);
};

module.exports.findAllSlots=async (req,res)=>{
    const farmer = req.user;
    const {expertID} = req.params;
    
    //getting state information from farmer's latitude, longitude
    const state=await findState(farmer.location.coordinates[1],farmer.location.coordinates[0]); 

    const date1=req.body.date1;
    const date2=req.body.date2;
    const date3=req.body.date3;
    const list1=await this.findSlots(date1,state,expertID);
    const list2=await this.findSlots(date2,state,expertID);
    const list3=await this.findSlots(date3,state,expertID);
    res.json({list1,list2,list3});
}

module.exports.findSlots=  (date,state,expertID)=>{
    console.log("yo");
    return new Promise(async(resolve,reject)=>{
        await adminController.createTimeSlots(date,state,expertID);
        adminController.createResultsTable(date,state,expertID);
        // Finding slots of that particular date
        const find_slots=`SELECT * FROM appointments_${state} WHERE book_date='${date}' AND expertID='${expertID}'`;
        con.query(find_slots,(err,result)=>{
            console.log(result);
            if(err)
                console.log("Error finding slots for the farmer");
            resolve(result);
        });
    })
    //creating time slots of that date if it already doesn't exist
   
}

module.exports.uploadImage = async (req, res) => {
  try {
    if (req.file) {
      const url = `https://storage.googleapis.com/${bucketName}/${req.file.originalname}`;
      const blob = bucket.file(req.file.originalname);
      const blobStream = blob.createWriteStream();

      blobStream.on("finish", () => {
        console.log(url);
        return res.json({success:true});
      });
      blobStream.end(req.file.buffer);
    } else {
        return res.json({success:false});
    }
  } catch (error) {
    return res.json({success:false});
  }
};

module.exports.viewResults = async (req, res) => {
  const farmer = req.user;
  const state = await findState(
    farmer.location.coordinates[1],
    farmer.location.coordinates[0]
  );
  const sql = `SELECT * FROM results_${state} WHERE farmerID='${farmer._id}' ORDER BY book_date DESC`;
  con.query(sql, (err, result) => {
    if (err) console.log("Error finding results for the farmer");
    return res.json({ results: result });
  });
};
