const express = require("express");
const router = express.Router();
const hashtagController = require("../controllers/hashTagController");

//get all hashtag
router.get('/',hashtagController.getAllHashTagList)

//get all hashtag of particular room
router.get("/rid=:roomId", hashtagController.getHashTagList);
// Get hashtag details
router.get("/rid=:roomId/hid=:hashtagId", hashtagController.getHashTag);
//send HAstag message
router.post("/",hashtagController.sendHashtagMessage);

module.exports = router;