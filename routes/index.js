const express = require("express");
const Multer = require("multer");

const path=require("path");
const farmerController = require("../controllers/farmerController");
const adminController = require("../controllers/adminController");
const audio = require("../config/audio");
const video=require("../config/video");
const middleware = require("../config/middleware");
const router = express.Router();


const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, 
    },
});

router.get('/hello',(req,res)=>{
    res.send("hello");
});


//Admin Routes
router.post('/create/expert',adminController.createNewExpert);
router.get('/create/slots',adminController.createTimeSlots);

router.get("/file", (req, res) => {
    res.sendFile(path.join(__dirname,'..',"views/upload.html"));
});

//Farmer Routes
router.get('/get/nearest',farmerController.findNearestExperts);
router.post('/uploadimg',multer.single("imgfile"),farmerController.uploadImage);
router.get('/slots/:expertID',middleware.getAuthenticatedFarmer,farmerController.findSlots);
router.get('/bookslot/:date/:time/:mode/:expertID',middleware.getAuthenticatedFarmer,farmerController.bookTimeSlot);


//Both Farmer and expert
router.get('/index',(req,res)=>{
    console.log("yo");
    res.sendFile(path.join(__dirname,'..','views/index.html'));
})

router.post("/join-room",audio.joinRoom);
router.post("/room/link",video.addEvent);



module.exports = router;