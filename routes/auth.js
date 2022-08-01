const express = require("express");
const router = express.Router();

// Controllers
const {
  register,
  verifyRegister,
  loginFarmer,
  verifyLoginFarmer,
  loginExpert,
  verifyLoginExpert
} = require("../controllers/authController");


//farmer Authentication routes
router.route("/register").post(register);
router.route("/verifyRegister/:phone").post(verifyRegister);
router.post("/login",loginFarmer);
router.post("/verifyLogin/:phone",verifyLoginFarmer);

//Expert Routes
router.post("/loginExpert",loginExpert);
router.post("/verifyLoginExpert/:phone",verifyLoginExpert);

module.exports = router;