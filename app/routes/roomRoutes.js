// roomRoutes.js
const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const { authenticate } = require("../utils/authenticateUser");

router.post("/rooms", authenticate, roomController.createRoom);
// router.get('/',authenticate,roomController.getRoomsList);
router.get("/", authenticate, roomController.getRoomsList);
//roomId in params (id)
router.put("/updateRow/:id", authenticate, roomController.updateRoomRow);

router.get("/messages/:roomId",roomController.getRoomMessages)

module.exports = router;
