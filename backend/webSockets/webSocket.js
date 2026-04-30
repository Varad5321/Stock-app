const WebSocket = require('ws');

let apiSocket = null;

const initWebSocket = (wss) => {
  wss.on('connection', (ws) => {
    console.log("Client connected");

    ws.on('message', (msg) => {
      const { symbol } = JSON.parse(msg);
      const cleanSymbol = symbol.trim();

      if (apiSocket) apiSocket.close();

      apiSocket = new WebSocket(
        `wss://ws.twelvedata.com/v1/quotes/price?apikey=${process.env.API_KEY}`
      );

      apiSocket.on('open', () => {
        apiSocket.send(JSON.stringify({
          action: "subscribe",
          params: { symbols: cleanSymbol }
        }));
      });

      apiSocket.on('message', (data) => {
        ws.send(data.toString());
      });

      apiSocket.on('error', (err) => {
        console.log("API ERROR:", err.message);
      });
    });

    ws.on('close', () => {
      console.log("Client disconnected");
    });
  });
};

module.exports = { initWebSocket };