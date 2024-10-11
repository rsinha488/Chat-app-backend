const express = require("express");
const router = express.Router();
const advertisementController = require("../controllers/advertisementController");
const { authenticate } = require("../utils/authenticateUser");

router.post("/", authenticate,advertisementController.createAdvertisement);
router.get("/", authenticate,advertisementController.getAllAdvertisements);

router.get("/status=:status", authenticate,advertisementController.getAllAdvertisements);
router.get("/:id", authenticate,advertisementController.getAdvertisementDetail);
router.delete("/:id", authenticate,advertisementController.softDeleteAdvertisement);
router.put("/:id", authenticate,advertisementController.updateAdvertisement);
router.get("/ad/active", authenticate,advertisementController.getAllActiveAdvertisements);

module.exports = router;
