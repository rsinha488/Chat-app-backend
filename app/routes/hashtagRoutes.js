const express = require("express");
const router = express.Router();
const hashtagController = require("../controllers/hashTagController");
const { authenticate } = require("../utils/authenticateUser");

//get all hashtag
router.get('/',authenticate,hashtagController.getAllHashTagList)

//get all hashtag of particular room
router.get("/rid=:roomId", authenticate,hashtagController.getHashTagList);
// Get hashtag details
router.get("/rid=:roomId/hid=:hashtagId", authenticate,hashtagController.getHashTag);
//send HAstag message
router.post("/",authenticate,hashtagController.sendHashtagMessage);

module.exports = router;