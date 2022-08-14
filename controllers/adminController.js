const Expert=require("../models/Expert");
const con=require("../config/db");
const scheduler=require("node-cron");

const end_time=17;

module.exports.createTimeSlots=async (date,state,expertID)=>{

    
    //create table if not already exists for appointments in that particular state
    return new Promise(function(resolve,reject){
        const sql_create_appointmentTable=`CREATE TABLE IF NOT EXISTS appointments_${state}(id int primary key auto_increment,book_date date,booked boolean,book_time time, farmerID varchar(50), expertID varchar(50), mode varchar(10), link varchar(50), unique(book_date,book_time,expertID))`;
        
        con.query(sql_create_appointmentTable, function (err, result) {
            
            if(err)
                console.log("Error in creating Appointments table",err);

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
                            
                            //Duplicate Slots for the date
                            if(err && err.errno===1062)
                                console.log("Slot already exists");
                            else if(err)
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
    const sql_create_resultTable=`CREATE TABLE IF NOT EXISTS results_${state}(id int primary key auto_increment,slotID int,farmerID varchar(50), expertID varchar(50), image varchar(1000) DEFAULT 'https://thumbs.dreamstime.com/b/no-image-available-icon-flat-vector-no-image-available-icon-flat-vector-illustration-132482953.jpg', book_date date,feedback varchar(100),advice varchar(100) DEFAULT 'Yet to be uploaded',problem varchar(100) DEFAULT 'Yet to be uploaded',update_expert boolean DEFAULT FALSE,update_farmer boolean DEFAULT FALSE)`;
    
    con.query(sql_create_resultTable, function (err, result) {
            
        if(err)
            console.log("Error in creating Results table",err);

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
                    if(err && err.errno===1062)
                        console.log("Slot already exists");
                    else if(err)
                        console.log("Error in inserting time slot into db",err);
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

module.exports.scheduleEvent = (req,res)=>{
    const date=new Date();
    date.setSeconds(date.getSeconds()+5);
    scheduler.schedule(date,()=>{
        console.log("Yo");
    });
    res.send(date.toLocaleString());
};