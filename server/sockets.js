module.exports = function(io) {
  io.on('connection', function(socket) {
    socket.join('community blokus');

    socket.on('take:turn', function(placement) {
      io.in('community blokus').emit('took:turn', placement);
    });
  });
};
