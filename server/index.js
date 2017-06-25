const express = require('express');
const cors = require('cors');
const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http, { path: '/api' });

app.use(cors());

// respond with "hello world" when a GET request is made to the homepage
app.get('/', (req, res) => {
  res.send('hello world');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('score', (username, score) => {
    console.log('SCORE', `${username} scored ${score}`);
    socket.broadcast.emit('score', username, score);
  });


  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(8080);
console.log("server up and ready");
