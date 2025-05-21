const express = require('express');
const router = express.Router();
const {
  uploadFile,
  detectMarketplace,
  processImport
} = require('../controllers/importController');

// @route   POST /api/import/upload
// @desc    Upload CSV file
// @access  Private
router.post('/upload', uploadFile);

// @route   POST /api/import/detect
// @desc    Detect marketplace from CSV file
// @access  Private
router.post('/detect', detectMarketplace);

// @route   POST /api/import/process
// @desc    Process CSV file and import data
// @access  Private
router.post('/process', processImport);

module.exports = router;
