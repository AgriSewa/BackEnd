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
    const cur_date = date_time.getFullYear()+"-"+date_time.getMonth()+"-"+date_time.getDay()
    const cur_time = date_time.getHours()+":"+date_time.getMinutes()+":"+date_time.getSeconds()
    const appointments = `SELECT * FROM appointments_${state} WHERE expertID='${expert._id}' AND book_date>='${cur_date}' AND book_time>='${cur_time}'`
    con.query(appointments,(err,result)=>{
        if(err)
            console.log("Error finding appointments for the expert");
        res.send(result);
    });
}