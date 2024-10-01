const express = require("express");
const router = express.Router();
const advertisementController = require("../controllers/advertisementController");

router.post("/", advertisementController.createAdvertisement);
router.get("/", advertisementController.getAllAdvertisements);

router.get("/status=:status", advertisementController.getAllAdvertisements);
router.get("/:id", advertisementController.getAdvertisementDetail);
router.delete("/:id", advertisementController.softDeleteAdvertisement);
router.put("/:id", advertisementController.updateAdvertisement);
router.get("/ad/active", advertisementController.getAllActiveAdvertisements);

module.exports = router;
