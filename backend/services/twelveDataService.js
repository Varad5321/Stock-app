const axios = require('axios');

const getStockData = async (symbol) => {
  const response = await axios.get(
    `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&apikey=${process.env.API_KEY}`
  );

  return response.data;
};

module.exports = { getStockData };