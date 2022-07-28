const express = require("express");
const router = express.Router();

// Controllers
const {
  register,
  verifyRegister,
  login,
  verifyLogin
} = require("../controllers/authController");


//farmer Authentication routes
router.route("/register").post(register);
router.route("/verifyRegister/:phone").post(verifyRegister);
router.post("/login",login);
router.post("/verifyLogin/:phone",verifyLogin);

module.exports = router;