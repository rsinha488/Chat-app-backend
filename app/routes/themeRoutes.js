const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themeController.js');

router.post('/', themeController.createData);
router.post('/applyForAll', themeController.applyForAll);
router.get('/:id', themeController.getDataById);
router.put('/:id', themeController.updateDataById);
router.delete('/:id', themeController.deleteDataById);
router.get('/', themeController.getAllData);

module.exports = router;
