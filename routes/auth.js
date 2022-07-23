const express = require("express");
const router = express.Router();

// Controllers
const {
  register,
  verify,
} = require("../controllers/auth");

router.route("/register").post(register);

router.route("/verify/:phone").post(verify)

module.exports = router;