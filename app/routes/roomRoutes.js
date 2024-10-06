// roomRoutes.js
const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const { authenticate } = require("../utils/authenticateUser");

router.post("/rooms", roomController.createRoom);
// router.get('/',authenticate,roomController.getRoomsList);
router.get("/", roomController.getRoomsList);
//roomId in params (id)
router.put("/updateRow/:id", roomController.updateRoomRow);

router.get("/messages/:roomId",roomController.getRoomMessages)

module.exports = router;
