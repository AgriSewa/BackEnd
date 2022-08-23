const express = require("express");
const Multer = require("multer");

const path=require("path");
const farmerController = require("../controllers/farmerController");
const adminController = require("../controllers/adminController");
const expertController = require("../controllers/expertController");
const audio = require("../config/audio");
const video = require("../config/video");
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


//Farmer Routes
router.get('/get/nearby',middleware.getAuthenticatedFarmer,farmerController.findNearestExperts);
router.post('/uploadimg',middleware.getAuthenticatedFarmer,multer.single("imgfile"),farmerController.uploadImage);
router.post('/slots/:expertID',middleware.getAuthenticatedFarmer,farmerController.findAllSlots);
router.get('/bookslot/:date/:time/:mode/:expertID',middleware.getAuthenticatedFarmer,farmerController.bookTimeSlot);
router.get('/farmer/viewResults',middleware.getAuthenticatedFarmer,farmerController.viewResults);
router.get('/farmer/upcoming',middleware.getAuthenticatedFarmer,farmerController.findAppointments);
router.post('/feedback/:resultID',middleware.getAuthenticatedFarmer,multer.single("imgfile"),farmerController.uploadFeedback);
router.post('/AI/result',middleware.getAuthenticatedFarmer,farmerController.updateResult);

//Expert Routes
router.get('/expert/upcoming',middleware.getAuthenticatedExpert,expertController.viewAppointments);
router.post('/solution/:resultID',middleware.getAuthenticatedExpert,expertController.submitAdvice);
router.get('/expert/viewResults',middleware.getAuthenticatedExpert,expertController.viewResults);


//Both Farmer and expert
router.post("/join-room",audio.joinRoom);
router.post("/room/link",video.addEvent);


//AI
router.post("/result",adminController.updateResult);

//Business
router.get("/agrisewa/central/repo/data",adminController.getItems);

module.exports = router;