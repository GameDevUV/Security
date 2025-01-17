const express = require("express");
const Auth = require("../middlewares/Auth.middleware");
const {checkOtp} = require("../middlewares/checkOtp.middleware")
const {registerUser , loginUser , logoutUser} = require("../controllers/users/user.controller");
const userAddInfo = require("../controllers/users/verificationDetails/userAddInfo.controller");


const userRoutes = express.Router();

userRoutes.route("/register").post( checkOtp , registerUser);
userRoutes.route("/login").post(checkOtp, loginUser);
userRoutes.route("/logout").post(Auth, logoutUser);
userRoutes.route("/addinfo").post(Auth, userAddInfo);


module.exports = userRoutes;