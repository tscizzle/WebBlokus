const express = require('express');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';


const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);


// sockets

require('./sockets')(io);


// serving assets

if (isProduction) {

  // serve static assets
  app.use(express.static(path.resolve(__dirname, '..', 'build')));

  // serve the main file
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'build', 'index.html'));
  });

}


// start server

const PORT = process.env.PORT || 9000;

server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
