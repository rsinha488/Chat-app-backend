const express = require("express");
const router = express.Router();
const hashtagController = require("../controllers/hashTagController");

//get all hashtag
router.get("/rid=:roomId", hashtagController.getHashTagList);

// Get hashtag details
router.get("/rid=:roomId/hid=:hashtagId", hashtagController.getHashTag);

module.exports = router;