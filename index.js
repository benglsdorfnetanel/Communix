const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const SocketService = require('./API/services/socketio');
const socketService = new SocketService(server);

server.listen(3000, () => {
  console.log('listening on *:3000');
});