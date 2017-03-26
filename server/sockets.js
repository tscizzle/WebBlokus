const _ = require('lodash');


module.exports = function(io) {

  let savedTurns = [];

  io.on('connection', function(socket) {

    // catch up the new client

    socket.emit('take:turn', {turns: savedTurns});


    // register listeners

    socket.on('take:turn', function({turns}) {
      const previousTurns = turns.slice(0, turns.length - 1);
      if (_.isEqual(previousTurns, savedTurns)) {
        savedTurns = turns;
        socket.broadcast.emit('take:turn', {turns});
      }
    });

    socket.on('new:game', function() {
      savedTurns = [];
      socket.broadcast.emit('new:game');
    });

  });

};
