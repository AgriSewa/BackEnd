const mongoose=require('mongoose');
var mysql = require('mysql2');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345678",
  database:"agrisewa"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("MySQL Connected!");
});

const uri=process.env.MONGO_URI;

mongoose.connect(uri)
.then(()=>console.log("MongoDB Connected!"))
.catch((err)=>console.log(err));

module.exports=con;