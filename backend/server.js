const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
require('dotenv').config();

const stockRoutes = require('./routes/stockRoutes');
const { initWebSocket } = require('./websockets/webSocket.js');

const app = express();
app.use(cors());

app.use('/api', stockRoutes);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

initWebSocket(wss);   // 🔥 clean call

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});