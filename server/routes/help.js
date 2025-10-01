const express = require('express');
const router = express.Router();


const HelpRequest = require('../models/HelpRequest');

// POST /api/help
router.post('/', async (req, res) => {
  const { phone, email } = req.body;
  if (!phone || !email) {
    return res.status(400).json({ message: 'Phone number and email are required.' });
  }
  try {
    const helpRequest = new HelpRequest({ phone, email });
    await helpRequest.save();
    res.json({ message: 'Help request received. We will reach out to you soon.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save help request.' });
  }
});

module.exports = router;
