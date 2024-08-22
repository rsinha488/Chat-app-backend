const express = require('express');
const router = express.Router();
const themeController = require('../controllers/themeController.js');

router.post('/theme', themeController.createData);
router.get('/theme/:id', themeController.getDataById);
router.put('/theme/:id', themeController.updateDataById);
router.delete('/theme/:id', themeController.deleteDataById);
router.get('/theme', themeController.getAllData);

module.exports = router;
