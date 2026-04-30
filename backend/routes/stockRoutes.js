const express = require('express');
const router = express.Router();
const { getStockData } = require('../services/twelveDataService');

router.get('/stock', async (req, res) => {
  try {
    const data = await getStockData(req.query.symbol);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

module.exports = router;