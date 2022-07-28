const Expert=require("../models/Expert");
const con=require("../config/db");

const end_time=17;

module.exports.createTimeSlots=async (date,state)=>{

    
    //create table if not already exists for appointments in that particular state
    const sql_create_table=`CREATE TABLE IF NOT EXISTS appointments_${state}(id int primary key auto_increment,book_date date,booked boolean,book_time time,unique(book_date,book_time))`;
    con.query(sql_create_table, function (err, result) {
        
        if(err)
            console.log("Error in creating Appointments table",err);
        else
            console.log("Table created");

        //create all the time slots for current date
        for(let i=10;i<=end_time;i++){
            const time=(i+':00:00');
            const time_slot=`INSERT INTO appointments_${state} VALUES(DEFAULT,'${date}',FALSE,'${time}')`;
            
            //insert into database table
            con.query(time_slot,(err,res)=>{
                
                //Duplicate Slots for the date
                if(err && err.errno===1062)
                    console.log("Slot already exists");
                else if(err)
                    console.log("Error in inserting time slot into db",err);
                
            });
        }

    });
}


module.exports.createNewExpert=async (req,res)=>{
    const expert=req.body;
    const newExpert=await Expert.create({
        name:expert.name,
        location:{
            type: "Point",
            coordinates: [parseFloat(expert.lat), parseFloat(expert.long)]
        }
    })
    res.send(newExpert);
}