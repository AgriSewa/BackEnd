const express=require('express');
const app=express();
require('dotenv').config({path:'config.env'});
const bodyParser=require('body-parser');
const morgan=require('morgan');
const cors=require('cors');
const path=require('path');
const Test = require('./models/Loc');
app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({limit:'50mb', extended:true}));

app.use(cors());
app.use(morgan("dev"));

require('./config/db');

const port=process.env.PORT || 5000;


app.post('/postloc',async(req,res)=>{
    const {long,lat}=req.body;
    const data = await new Test({ location: {type: "Point", coordinates: [
        long,lat
    ] }})
     await data.save();
    res.status(201).json({ message: "Data created!" });
})

app.post('/test',async (req,res)=>{
    console.log(req.body);
    const {long,lat}=req.body;
     const options = {
        location: {
            $geoWithin: {
                $centerSphere: [[long,lat], 15 / 3963.2]
            }
        }
    }
    Test.find(options).then(data => {
        res.send({data});
    })
})

app.use('/api/auth',require('./routes/auth'))

app.listen(port,()=>{
    console.log(`Server is running at http://localhost:${port}`);
})