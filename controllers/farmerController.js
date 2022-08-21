const { Storage } = require("@google-cloud/storage");
const moment = require("moment");
const axios = require("axios").default;
const AWS = require('aws-sdk');

const Expert = require("../models/Expert");
const con = require("../config/db");
const redis = require("../config/redis");
const adminController = require("./adminController");
const video = require("../config/video");

const projectId = process.env.projectId;
let keyFilename = "accesskeys.json";
// const storage = new Storage({
//   projectId,
//   keyFilename,
// });

const s3=new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET
})
const bucketName = process.env.bucketName;
const resultbucketName = process.env.resultbucketName;
// const bucket = storage.bucket(bucketName);


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
  
  let book_slot;

  const state = await findState(
    farmer.location.coordinates[1],
    farmer.location.coordinates[0]
  );

  redis.del(`${farmer._id} appointments`);
  redis.del(`${farmer._id} results`);

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
      redis.del(`${farmer._id} results`);
      // const url = `https://storage.googleapis.com/${bucketName}/${req.file.originalname}`;
      // const blob = bucket.file(req.file.originalname);
      // const blobStream = blob.createWriteStream();
      const params = {
        Bucket: resultbucketName,
        Key: req.file.originalname,
        Body: req.file.buffer
      }
      s3.upload(params, (err,data)=>{
        if(err)
          return res.json({success: false, message: "Error in saving feedback"});
        submit_feedback = `UPDATE results_${state} SET feedback=${feedbackInt},image='${data.Location}',update_farmer=TRUE WHERE id=${resultID}`;
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
      })
      // blobStream.on("finish", () => {
      //   console.log(url);
      // });
      // blobStream.end(req.file.buffer);
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
  redis.get(`${farmer._id} appointments`).then((data)=>{
    if(data){
      res.send(JSON.parse(data));
    }
    else{
      const today = new Date().toISOString().slice(0, 10);
      const sql = `SELECT * FROM appointments_${state} WHERE farmerID='${farmer._id}' AND book_date>='${today}'`;

      con.query(sql, (err, result) => {
        if (err) console.log("Error in finding appointment slots", err);
        redis.set(`${farmer._id} appointments`,JSON.stringify(result)).then((data)=>{
          console.log(data);
        });
        res.send(result);
      });
    }
  });
}

module.exports.findNearestExperts = async (req, res) => {
    const farmer = req.user;
    const state=await findState(farmer.location.coordinates[1],farmer.location.coordinates[0]);
    var options = {
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [farmer.location.coordinates[0], farmer.location.coordinates[1]] },
          $maxDistance: 50000,
        },
      },
    };
    const result = await Expert.find(options);
    if(result.length==0)return res.json(null);
    res.json(result);
};

module.exports.findRating = async (state,expertID)=>{
  return new Promise((resolve,reject)=>{
    const sql=`SELECT AVG(feedback) AS rating from results_${state} WHERE expertID='${expertID}';`
      con.query(sql,(err,result)=>{
        if(err)
          reject(err);
        else
          resolve(result);  
      });
  });
}
module.exports.findAllSlots = async (req,res)=>{
    try {
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
      const rating=await this.findRating(state,expertID);
      res.json({list1,list2,list3,rating});
    } catch (error) {
      res.json({success:false,message:"Cannot find slots"});
    }
}

module.exports.findSlots=  (date,state,expertID)=>{

    return new Promise( async (resolve,reject) => {
        await adminController.createTimeSlots(date,state,expertID);
        adminController.createResultsTable(date,state,expertID);
        // Finding slots of that particular date
        const find_slots=`SELECT * FROM appointments_${state} WHERE book_date='${date}' AND expertID='${expertID}'`;
        con.query(find_slots,(err,result)=>{
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
      // const url = `https://storage.googleapis.com/${bucketName}/${req.file.originalname}`;
      // const blob = bucket.file(req.file.originalname);
      // const blobStream = blob.createWriteStream();

      // blobStream.on("finish", () => {
      //   console.log(url);
      //   return res.json({success:true});
      // });
      // blobStream.end(req.file.buffer);
      // const ext = req.file.originalname.split(".")[1];
      const params = {
        Bucket: bucketName,
        Key: req.file.originalname,
        Body: req.file.buffer
      }
      s3.upload(params, (err,data)=>{
        if(err)
          return res.json({success:false});
        return res.json({success:true, image:data.Location});
      })
    } else {
        return res.json({success:false});
    }
  } catch (error) {
    return res.json({success:false});
  }
};

module.exports.getExpertName = async (expertID)=>{
  return new Promise((resolve,reject)=>{
      if(expertID){
        redis.get(`${expertID}`).then(async (expert)=>{
          if(expert){
              resolve(expert);
          }else{
              const farmer = await Expert.findById(expertID);
              redis.set(`${expertID}`,expert.name);
              resolve(expert.name);
          }
        });
      }
      else resolve('Artificial Intelligence')
  }); 
};
  


module.exports.viewResults = async (req, res) => {
  const farmer = req.user;
  const state = await findState(
    farmer.location.coordinates[1],
    farmer.location.coordinates[0]
  );

  //results of previous meetings 

  redis.get(`${farmer._id} results`).then((data)=>{
    if(data){
      res.json({results:JSON.parse(data)});
    }else{
      const today = new Date().toISOString().slice(0, 10);
      const appointments = `SELECT * FROM results_${state} WHERE farmerID='${farmer._id}' AND book_date<='${today}' ORDER BY book_date`;      
      con.query(appointments, async (err, result) => {
        if(err) return res.json({message:"Error finding results for the farmer"});
        if(result.length==0)return res.json({ results: null });
        for(let i=0;i<result.length;i++){

          result[i].expertName = await this.getExpertName(result[i].expertID);
          if(i===(result.length-1)){
            redis.set(`${farmer._id} results`,JSON.stringify(result)).then((data)=>{
              console.log(data);
            });
            return res.json({ results: result });
          }
        }
      });
    }
  });
  
};

module.exports.updateResult=async (req,res)=>{
  const {problem,advice,image}=req.body;
  const advic=advice.slice(0,Math.min(advice.length,90));
  const farmer = req.user;
  redis.del(`${farmer._id} results`);
  const state = await findState(
      farmer.location.coordinates[1],
      farmer.location.coordinates[0]
  );
  const today = new Date().toISOString().slice(0, 10);
  submit_advice=`INSERT INTO results_${state}(farmerID,problem,advice,image,update_farmer,book_date) VALUES('${farmer._id}','${problem}','${advic}','${image}',TRUE,'${today}');`;
  con.query(submit_advice,(err,result)=>{
      if(err){console.log(err);
          return res.status(500).json({message:"Error in saving feedback"});
      }
      return res.json({success:true});
  });
}





module.exports.setRedis = async(req,res)=>{
  const farmer=req.user;
  const s=JSON.stringify(farmer);
  redis.set('farmer',s).then((data)=>{
    console.log(data);
  });
}

module.exports.getRedis = async(req,res)=>{
  redis.get('farmers').then((data)=>{
    const d=JSON.parse(data);
    res.send(d);
    console.log(data);
  });
}
