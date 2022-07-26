const Expert=require("../models/Expert");
const Farmer=require("../models/Farmer");
const Central=require("../models/Central");
const adminController = require("./adminController");

const axios=require('axios').default;
const redis = require("../config/redis");

const con=require("../config/db");

async function findState(lat,long){
    const fetched_data=await axios.get(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=pjson&featureTypes=&location=${long},${lat}`);
    const location=fetched_data.data.address;
    let state=location.Region;
    state=state.replace(" ","");
    return state;
}

module.exports.viewAppointments = async(req,res) => {
    const expert = req.user
    const state=await findState(expert.location.coordinates[1],expert.location.coordinates[0]);
    const today = new Date().toISOString().slice(0, 10);
    const appointments = `SELECT * FROM appointments_${state} WHERE expertID='${expert._id}' AND book_date>='${today}' AND mode IS NOT NULL`;
    con.query(appointments,(err,result)=>{
        if(err)
            console.log("Error finding appointments for the expert");
        res.send(result);
    });
}
module.exports.getFarmerName = async (farmerID)=>{
    return new Promise((resolve,reject)=>{
        redis.get(`${farmerID}`).then(async (farmer)=>{
            if(farmer){
                resolve(farmer);
            }else{
                const farmer = await Farmer.findById(farmerID);
                redis.set(`${farmerID}`,farmer.username);
                resolve(farmer.username);
            }
        });
    });
    
}

module.exports.viewResults = async(req,res) => {
    const expert = req.user;
    const state=await findState(expert.location.coordinates[1],expert.location.coordinates[0]);
    const sql = `SELECT * FROM results_${state} WHERE expertID='${expert._id}' AND farmerID IS NOT NULL AND update_expert=0 AND update_farmer=1 ORDER BY book_date`;
    con.query(sql,async (err,result)=>{
        if(err)
            console.log("Error finding results for the expert");
        if(result.length==0)return res.json({ results: null });

        const sql2 = `SELECT COUNT(*) AS cnt FROM results_${state} WHERE expertID='${expert._id}' AND update_expert=1`;
        con.query(sql2,async (err,result2)=>{
            if(err)
                console.log("Error finding results for the expert");
            for(let i=0;i<result.length;i++){
                result[i].farmerName = await this.getFarmerName(result[i].farmerID);
                if(i==(result.length-1)){
                    return res.json({ results: result,completed: result2[0].cnt}); 
                }
            }
        });
        
    });
}

module.exports.submitAdvice = async(req,res) =>{
    try {
        const { resultID } = req.params;
        const {problem,advice} = req.body;
        const expert = req.user
        const state = await findState(expert.location.coordinates[1],expert.location.coordinates[0]);
        const sql=`SELECT * FROM results_${state} WHERE id=${resultID}`
        con.query(sql,(err,result)=>{
            if(err)console.log(err);
            redis.del(`${result[0].farmerID} results`);
            Farmer.findById(result[0].farmerID,{location:1},(err,farmer)=>{
                // Central.create({
                //     location:farmer.location,
                //     problem,
                //     advice,
                //     image:result[0].image
                // });
                adminController.addItem(farmer.location, problem, advice, result[0].image);
            });
        })

        submit_advice=`UPDATE results_${state} SET advice='${advice}',problem='${problem}',update_expert=TRUE WHERE id=${resultID}`;

        con.query(submit_advice,(err,result)=>{
            if(err){console.log(err)
                return res.json({
                    success: false,
                    message: "Error in saving advice",
                });}
            return res.json({
                success: true,
                message: "Successfully submitted Advice",
            });
        });
    } catch (error) {
        return res.json({
            success: false,
            message: "Error in saving advice",
        });
    }
}