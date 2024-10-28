const jwt = require("jsonwebtoken");
const User = require("../models/user");
const moment = require("moment");

const JWT_SECRET = process.env.JWT_SECRET || "ruchi_jwt_secret";

exports.authenticate = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Access token is required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    const user = await User.findOne({
      $or: [
      { _id: decoded.userId },
      { previousId: decoded.userId }
    ] });

    const targetTime = moment(user.blockedEndTime).valueOf();
    const currentTime = moment().valueOf();
    console.log(currentTime < targetTime)
    console.log(currentTime , targetTime)
    if (currentTime < targetTime && user.blockedEndTime) {
      req.app.io.emit("overall_notification", { ...user?._doc, type: "ban" });
      return res.status(403).json({ message: "User is Banned", user: user });
    } else {
      next();
    }
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

exports.verifytoken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: "Access token is required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({
      $or: [
        { _id: decoded.userId },
        { previousId: decoded.userId }
      ]
    });
    res.status(200).json({
      success: user ? true : false,
      data: {
        user: user ? user : decoded.userId,
        token: token,
      },
      status: true,
    });
  } catch (error) {
    res.status(401).json({ status: false, message: "Invalid or expired token" });
  }
};
