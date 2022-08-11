const Expert=require("../models/Expert");
const axios=require('axios').default;

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
    var date_time = new Date();
    const cur_date = date_time.getFullYear()+"-"+date_time.getMonth()+"-"+date_time.getDay();
    const appointments = `SELECT * FROM appointments_${state} WHERE expertID='${expert._id}' AND book_date>='${cur_date}'`;
    con.query(appointments,(err,result)=>{
        if(err)
            console.log("Error finding appointments for the expert");
        res.send(result);
    });
}

module.exports.viewResults = async(req,res) => {
    const expert = req.user;
    const state=await findState(expert.location.coordinates[1],expert.location.coordinates[0]);
    const appointments = `SELECT * FROM results_${state} WHERE expertID='${expert._id}' ORDER BY book_date DESC`;
    con.query(appointments,(err,result)=>{
        if(err)
            console.log("Error finding appointments for the farmer");
        res.send(result);
    });
}

module.exports.submitAdvice = async(req,res) =>{
    const {slotId,problem,advice} = req.body;
    const expert = req.user
    const state = await findState(expert.location.coordinates[1],expert.location.coordinates[0]);

    const slotID=parseInt(slotId);

    submit_advice=`UPDATE result_${state} SET advice='${advice}',problem='${problem}',update_expert=TRUE WHERE slotID=${slotID}`;
    con.query(submit_advice,(err,result)=>{
        if(err)
            return res.send("Error in saving feedback");
        res.send("Successfully submitted Feedback");
    });
}