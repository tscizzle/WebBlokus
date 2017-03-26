module.exports = function(io) {

  io.on('connection', function(socket) {

    socket.on('take:turn', function(placement) {
      io.sockets.emit('take:turn', placement);
    });

    socket.on('new:game', function() {
      io.sockets.emit('new:game');
    });

  });

};
