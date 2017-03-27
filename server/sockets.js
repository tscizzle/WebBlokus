const _ = require('lodash');


module.exports = function(io) {

  const savedGames = {};

  io.on('connection', function(socket) {

    let clientGameID;

    socket.on('create:game', function({gameID}) {
      savedGames[gameID] = [];
    });

    socket.on('join:game', function({gameID}) {
      if (_.has(savedGames, gameID)) {
        _.each(socket.rooms, room => socket.leave(room));
        socket.join(gameID);
        clientGameID = gameID;
        socket.emit('joined:game');

        const savedTurns = savedGames[clientGameID];
        socket.emit('take:turn', {turns: savedTurns});
      } else {
        socket.emit('nonexistant:game', {gameID});
      }
    });

    socket.on('take:turn', function({turns}) {
      const savedTurns = savedGames[clientGameID];
      const clientPreviousTurns = turns.slice(0, turns.length - 1);
      if (_.isEqual(clientPreviousTurns, savedTurns)) {
        savedGames[clientGameID] = turns;
        io.to(clientGameID).emit('take:turn', {turns});
      }
    });

    socket.on('leave:game', function({gameID}) {
      socket.leave(gameID);
    });

  });

};
