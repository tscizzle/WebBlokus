const _ = require('lodash');


module.exports = function(io) {

  const savedGames = {};

  io.on('connection', function(socket) {

    let clientGameID;

    socket.on('joined:game', function({gameID}) {
      _.each(socket.rooms, room => socket.leave(room));
      socket.join(gameID);
      clientGameID = gameID;

      if (!_.has(savedGames, clientGameID)) {
        savedGames[clientGameID] = [];
      }
      const savedTurns = savedGames[clientGameID];
      socket.emit('take:turn', {turns: savedTurns});
    });

    socket.on('take:turn', function({turns}) {
      const savedTurns = savedGames[clientGameID];
      const clientPreviousTurns = turns.slice(0, turns.length - 1);
      if (_.isEqual(clientPreviousTurns, savedTurns)) {
        savedGames[clientGameID] = turns;
        io.to(clientGameID).emit('take:turn', {turns});
      }
    });

    socket.on('left:game', function({gameID}) {
      socket.leave(gameID);
    });

  });

};
