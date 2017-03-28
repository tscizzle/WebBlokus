const _ = require('lodash');


module.exports = function(io) {

  const savedGames = {};

  io.on('connection', function(socket) {

    let clientGameID = null;
    let clientPlayer = null;

    socket.on('create:game', function({gameID}) {
      savedGames[gameID] = {
        savedTurns: [],
        connectedPlayers: [],
      };
    });

    socket.on('join:game', function({gameID}) {
      if (_.has(savedGames, gameID)) {
        _.each(socket.rooms, room => socket.leave(room));
        socket.join(gameID);
        clientGameID = gameID;

        const connectedPlayers = savedGames[gameID].connectedPlayers;
        clientPlayer = connectedPlayers.length >= 4 ? null : _.min(_.difference(_.range(4), connectedPlayers));
        if (!_.isNull(clientPlayer)) {
          savedGames[gameID].connectedPlayers.push(clientPlayer);
        }

        socket.emit('joined:game', {player: clientPlayer});

        const savedTurns = savedGames[gameID].savedTurns;
        socket.emit('take:turn', {turns: savedTurns});
      } else {
        socket.emit('nonexistant:game', {gameID});
      }
    });

    socket.on('take:turn', function({turns}) {
      const savedTurns = savedGames[clientGameID].savedTurns;
      const clientPreviousTurns = turns.slice(0, turns.length - 1);
      if (_.isEqual(clientPreviousTurns, savedTurns)) {
        savedGames[clientGameID].savedTurns = turns;
        io.to(clientGameID).emit('take:turn', {turns});
      }
    });

    const tearDown = function() {
      socket.leave(clientGameID);
      if (_.has(savedGames, clientGameID)) {
        _.pull(savedGames[clientGameID].connectedPlayers, clientPlayer);
      }
      clientGameID = null;
      clientPlayer = null;
    };
    socket.on('leave:game', tearDown);
    socket.on('disconnect', tearDown);

  });

};
