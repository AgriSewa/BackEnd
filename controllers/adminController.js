const Expert=require("../models/Expert");
const con=require("../config/db");
const scheduler=require("node-cron");

const end_time=17;

async function findState(lat,long){
    const fetched_data=await axios.get(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=pjson&featureTypes=&location=${long},${lat}`);
    const location=fetched_data.data.address;
    let state=location.Region;
    state=state.replace(" ","");
    return state;
}

module.exports.createTimeSlots=async (date,state,expertID)=>{

    
    //create table if not already exists for appointments in that particular state
    return new Promise(function(resolve,reject){
        const sql_create_appointmentTable=`CREATE TABLE IF NOT EXISTS appointments_${state}(id int primary key auto_increment,book_date date,booked boolean,book_time time, farmerID varchar(50), expertID varchar(50), mode varchar(10), link varchar(50), unique(book_date,book_time,expertID))`;
        
        con.query(sql_create_appointmentTable, function (err, result) {
            
            if(err)
                return console.log("Error in creating Appointments table",err);

            //create all the time slots for current date
             

            const slot_exist=`SELECT * FROM appointments_${state} WHERE book_date='${date}' AND expertID='${expertID}'`;
            con.query(slot_exist,(err,result)=>{
                if(err)
                    return ("Error while qyerying database");
                if(result.length===0){
                     //create all the time slots for current date
                    for(let i=10;i<=end_time;i++){
                        const time=(i+':00:00');
                        const time_slot=`INSERT INTO appointments_${state}(id,book_date,booked,book_time,expertID) VALUES(DEFAULT,'${date}',FALSE,'${time}','${expertID}')`;
                        
                        //insert into database table
                        con.query(time_slot,(err,res)=>{
                            
                            if(err)
                                console.log("Error in inserting time slot into db",err);
                            if(i==end_time)
                                resolve();
                        });
                    }
                }else
                    resolve();
            });

        });
    });
    
}

module.exports.createResultsTable = async(date,state,expertID)=>{
    const sql_create_resultTable=`CREATE TABLE IF NOT EXISTS results_${state}(id int primary key auto_increment,slotID int UNIQUE,farmerID varchar(50), expertID varchar(50), image varchar(1000) DEFAULT 'https://thumbs.dreamstime.com/b/no-image-available-icon-flat-vector-no-image-available-icon-flat-vector-illustration-132482953.jpg', book_date date,feedback int,advice varchar(100) DEFAULT 'Yet to be uploaded',problem varchar(100) DEFAULT 'Yet to be uploaded',update_expert boolean DEFAULT FALSE,update_farmer boolean DEFAULT FALSE)`;
    
    con.query(sql_create_resultTable, function (err, result) {
            
        if(err)
            console.log("Error in creating Results table",err);

        const slot_exist = `SELECT * FROM results_${state} WHERE book_date='${date}' AND expertID='${expertID}'`;
        con.query(slot_exist,(err,result)=>{
            if(err)
                console.log("Error in querying database");
            if(result.length===0){
                //create all the time slots for current date
                const slots_sql=`SELECT * FROM appointments_${state} WHERE book_date='${date}' AND expertID='${expertID}'`;
                con.query(slots_sql,(err,result)=>{
                    if(err)
                        console.log(err);
                    for(let i=0;i<result.length;i++){
                        let slot=result[i];
                        const result_slot=`INSERT INTO results_${state}(id,slotID,expertID,book_date) VALUES(DEFAULT,'${slot.id}','${expertID}','${date}')`;
                        con.query(result_slot,(err,res)=>{
                            
                            //Duplicate Slots for the date
                            if(err && err.errno===1062);
                                //console.log("Slot already exists");
                            else if(err)
                                console.log("Error in inserting time slot into db",err);
                        });
                    }
                });
            }
        });

    });
}

module.exports.createNewExpert=async (req,res)=>{
    const expert=req.body;
    const newExpert=await Expert.create({
        name:expert.name,
        email:expert.email,
        phone:expert.phone,
        location:{
            type: "Point",
            coordinates: [parseFloat(expert.lat), parseFloat(expert.long)]
        }
    });
    res.send(newExpert);
}

module.exports.updateResult=async (req,res)=>{
    const {problem,advice,image}=req.body;
    const farmer = req.user;
    const state = await findState(
        farmer.location.coordinates[1],
        farmer.location.coordinates[0]
    );
    console.log(req.body);
    submit_advice=`INSERT INTO results_${state}(problem,advice,image) VALUES('${problem}','${advice}','${image}');`;
    con.query(submit_advice,(err,result)=>{
        if(err)
            return res.status(500).json({message:"Error in saving feedback"});
        res.json({"message":"Successfully submitted Feedback"});
    });
}