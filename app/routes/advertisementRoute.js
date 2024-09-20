const express = require('express');
const router = express.Router();
const advertisementController = require('../controllers/advertisementController');

router.post('/', advertisementController.createAdvertisement);
router.get('/', advertisementController.getAllAdvertisements);
router.get('/:id', advertisementController.getAdvertisementDetail);
router.delete('/:id', advertisementController.softDeleteAdvertisement);
router.put('/:id', advertisementController.updateAdvertisement);

module.exports = router;