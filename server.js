const express=require('express');   
require('dotenv').config({path:'config.env'});   //set config path
const bodyParser=require('body-parser');
const morgan=require('morgan');
const cors=require('cors');

const app=express();
app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({limit:'50mb', extended:true}));
const Expert=require('./models/Expert');
Expert.createIndexes({ "location" : "2dsphere" });

app.use(cors());
app.use(morgan("dev"));

require('./config/db');


//routing
app.use(require('./routes/index'));
app.use('/api/auth',require('./routes/auth'));

const port=5000;



app.listen(port,()=>{
    console.log(`Server is running at http://localhost:${port}`);
})