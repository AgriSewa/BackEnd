const redis=require("redis");
const client=redis.createClient();

client.connect()
.then(()=>{
    console.log("Redis connected!");
})
.catch((err)=>{
    console.log("Error in connecting to redis");
})

module.exports=client;