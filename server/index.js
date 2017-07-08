const express = require('express');
const cors = require('cors');
const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http, { path: '/api' });

app.use(cors());

io.on('connection', (socket) => {
  socket.on('score', (username, score) => {
    socket.broadcast.emit('score', username, score);
  });
});

http.listen(8080);
console.log("server up and ready");
