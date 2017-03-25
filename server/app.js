const express = require('express');
const path = require('path');


const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);


// Serve static assets

// uses /WebBlokus because of "homepage" in package.json
app.use('/WebBlokus', express.static(path.resolve(__dirname, '..', 'build')));


// sockets

require('./sockets')(io);


// serve main file

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'build', 'index.html'));
});


module.exports = server;
