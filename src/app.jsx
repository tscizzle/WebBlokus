import React, { Component, PropTypes } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import io from 'socket.io-client';
import _ from 'lodash';
import classNames from 'classnames';
import { FaRotateLeft,
         FaArrowsH     } from 'react-icons/lib/fa';
import Alert from 'react-s-alert';
import 'react-s-alert/dist/s-alert-default.css';
import 'react-s-alert/dist/s-alert-css-effects/slide.css';

const socketServer = window.location.hostname === 'localhost' ? 'localhost:9000' : undefined;
const socket = io(socketServer);

import { game, transform } from 'blokus';
const { flip, rotate } = transform;
import '../public/stylesheets/app.css';
import { playerShape,
         pieceShape } from './blokusObjects.js';
import { Board } from './board.jsx';


class App extends Component {
  render() {
    return (
      <div className="app-container">
        <Router>
          <div>
            <Route path="*" component={Banner} />
            <div className="content-container">
              <Route exact path="/" component={GameSelection} />
              <Route path="/:gameID" component={Arena} />
            </div>
          </div>
        </Router>
        <Alert stack={true} position="top-right" effect="slide" />
      </div>
    );
  }
}


class Banner extends Component {
  render() {
    return (
      <div className="banner-container">
        <div className="banner-left">
          <h1> Blokus </h1>
          <span className="blokus-pronunciation"> [<b>blohk</b>-<i>koos</i>] </span>
        </div>
        <div className="banner-right">
          <Route path="/:gameID" component={LeaveGameButton} />
        </div>
      </div>
    );
  }
}


class LeaveGameButton extends Component {
  navigateToGameSelection = () => {
    this.props.history.push('/');
  }

  render() {
    return (
      <div className="leave-game-button"
           onClick={this.navigateToGameSelection}>
        Leave Game
      </div>
    );
  }
}


class GameSelection extends Component {
  constructor(props) {
    super(props);
    this.newGameID = Math.random().toString(36).substr(2, 10);
    this.state = {
      joinGameID: '',
    };
  }

  navigateToJoinedGame = () => {
    this.props.history.push(`/${this.state.joinGameID}`);
  }

  navigateToNewGame = () => {
    socket.emit('create:game', {gameID: this.newGameID});
    this.props.history.push(`/${this.newGameID}`);
  }

  render() {
    const joinGameClasses = classNames('join-game-button', {
      'disabled': _.isEmpty(this.state.joinGameID),
    });
    return (
      <div className="game-selection-container">
        <div className="new-game-container">
          <div className="new-game-button"
               onClick={this.navigateToNewGame}>
            New Game
          </div>
        </div>
        <div className="join-game-container">
          <input className="join-game-input"
                 type="text"
                 value={this.state.joinGameID}
                 onChange={e => this.setState({joinGameID: e.target.value})} />
          <div className={joinGameClasses}
               onClick={this.navigateToJoinedGame}>
            Join Game
          </div>
        </div>
      </div>
    );
  }
}


class Arena extends Component {
  constructor(props) {
    super(props);
    this.gameID = this.props.match.params.gameID;
    this.state = {
      joined: true,
      clientPlayer: null,
      ...this.getInitialGameState(),
    };
  }

  componentDidMount() {
    this.setState({joined: false});
    socket.emit('join:game', {gameID: this.gameID});

    // register socket listeners

    socket.on('joined:game', ({player}) => {
      const players = this.game.players();
      const clientPlayer = _.find(players, {id: player}) || null;
      this.setState({joined: true, clientPlayer});
    });

    socket.on('nonexistant:game', ({gameID}) => {
      Alert.warning(`Game ${gameID} does not exist`);
      this.props.history.push('/');
    });

    socket.on('take:turn', ({turns}) => {
      this.catchUpTurns(turns);
      this.updateStateAfterTurn();
    });
  }

  componentWillUnmount() {
    socket.emit('leave:game');

    // unregister socket listeners

    socket.off('joined:game');

    socket.off('nonexistant:game');

    socket.off('take:turn');
  }

  getInitialGameState = () => {
    this.game = game();
    const board = this.game.board();
    const currentPlayer = this.game.currentPlayer();
    const clientPlayer = (this.state || {}).clientPlayer;
    const selectedPiece = clientPlayer ? _.maxBy(this.game.availablePieces({player: clientPlayer.id}), 'id') : null;
    const arenaState = {
      board,
      currentPlayer,
      selectedPiece,
      selectedFlipped: false,
      selectedRotations: 0,
      highlightedPositions: [],
    };
    return arenaState;
  }

  updateStateAfterTurn = () => {
    const board = this.game.board();
    const currentPlayer = this.game.currentPlayer();
    const clientPlayer = this.state.clientPlayer;
    const selectedPiece = clientPlayer ? _.maxBy(this.game.availablePieces({player: clientPlayer.id}), 'id') : null;
    this.setState({
      board,
      currentPlayer,
      selectedPiece,
    });
  }

  catchUpTurns = turns => {
    const previousSavedTurns = turns.slice(0, turns.length-1);
    const clientTurns = this.game.turns();
    let turnsToCatchUp;
    if (!_.isEqual(clientTurns, previousSavedTurns)) {
      this.game = game();
      turnsToCatchUp = turns;
    } else {
      turnsToCatchUp = turns.slice(turns.length-1);
    }
    _.each(turnsToCatchUp, turn => {
      if (turn.isPass) {
        this.game.pass();
      } else {
        const catchUpPlacement = _.pick(turn, ['piece', 'flipped', 'rotations', 'position']);
        this.game.place(catchUpPlacement);
      }
    });
  }

  placeSelectedPiece = position => {
    const currentPlayer = this.state.currentPlayer;
    const clientPlayer = this.state.clientPlayer;
    if (currentPlayer && clientPlayer && currentPlayer.id === clientPlayer.id) {
      if (this.state.selectedPiece) {
        const placement = {
          piece: this.state.selectedPiece.id,
          flipped: this.state.selectedFlipped,
          rotations: this.state.selectedRotations,
          position,
        };
        const placementResult = this.game.place(placement);
        if (placementResult.success) {
          socket.emit('take:turn', {turns: this.game.turns()});
          this.updateStateAfterTurn();
          this.hoverPosition(false, position);
        }
      }
    }
  }

  passTurn = () => {
    const currentPlayer = this.state.currentPlayer;
    const clientPlayer = this.state.clientPlayer;
    if (currentPlayer && clientPlayer && currentPlayer.id === clientPlayer.id) {
      const passResult = this.game.pass();
      if (passResult.success) {
        socket.emit('take:turn', {turns: this.game.turns()});
        this.updateStateAfterTurn();
      }
    }
  }

  hoverPosition = (showHover, position) => {
    if (!this.game.isOver()) {
      if (this.state.selectedPiece) {
        if (showHover) {
          const probeResult = this.game.place({
            piece: this.state.selectedPiece.id,
            flipped: this.state.selectedFlipped,
            rotations: this.state.selectedRotations,
            position,
            probe: true,
          });
          if (probeResult.success) {
            this.setState({highlightedPositions: probeResult.positions});
          }
        } else {
          this.setState({highlightedPositions: []});
        }
      }
    }
  }

  setSelectedPiece = piece => {
    this.setState({selectedPiece: piece});
  }

  setSelectedFlipped = flipped => {
    this.setState({selectedFlipped: flipped});
  }

  setSelectedRotations = rotations => {
    this.setState({selectedRotations: rotations});
  }

  render() {
    const clientPlayer = this.state.clientPlayer;
    const clientPlayerID = !_.isNull(clientPlayer) ? clientPlayer.id : null;
    const currentPlayer = this.state.currentPlayer;
    const players = _.map(this.game.players(), player => {
      return {
        id: player.id,
        score: this.game.numRemaining({player: player.id}),
        pieces: !_.isNull(currentPlayer) ? this.game.availablePieces({player: player.id}) : [],
      };
    });
    const pieceLists = _.map(players, player => {
      if (player.id !== clientPlayerID) {
        return <PieceList pieces={player.pieces}
                          player={player}
                          currentPlayer={this.state.currentPlayer}
                          key={player.id} />
      }
    });
    const clientPlayerPieces = !_.isNull(clientPlayerID) ? _.find(players, {id: clientPlayerID}).pieces : [];
    const isOver = this.game.isOver();
    const gameView = (
      <div className="arena-container">
        <div className="other-player-pieces">
          { pieceLists }
        </div>
        <Board board={this.state.board}
               highlightedPositions={this.state.highlightedPositions}
               placeSelectedPiece={this.placeSelectedPiece}
               hoverPosition={this.hoverPosition}
               isMainBoard={true}
               clientPlayer={this.state.clientPlayer} />
        {!isOver ?
          <div className="piece-control-container">
            <PieceList pieces={clientPlayerPieces}
                       selectedPiece={this.state.selectedPiece}
                       setSelectedPiece={this.setSelectedPiece}
                       player={this.state.clientPlayer}
                       currentPlayer={this.state.currentPlayer} />
            {/* TODO: extract piece control into a component */}
            {/* TODO: hide piece control when currentPlayer.id !== clientPlayer.id */}
            {this.state.selectedPiece &&
              <div>
                <div className="piece-control-display">
                  <Piece piece={this.state.selectedPiece}
                         flipped={this.state.selectedFlipped}
                         rotations={this.state.selectedRotations} />
                </div>
                <div className="piece-control-buttons">
                  <PieceTransform flipped={this.state.selectedFlipped}
                                  rotations={this.state.selectedRotations}
                                  setSelectedFlipped={this.setSelectedFlipped}
                                  setSelectedRotations={this.setSelectedRotations} />
                  <PassButton passTurn={this.passTurn} />
                </div>
              </div>
            }
          </div> :
          <b> The game is over! </b>
        }
      </div>
    );
    return this.state.joined ? gameView : <div></div>;
  }
}


class PieceList extends Component {
  oneIndex = n => n + 1;

  render() {
    const sortedPieces = _.sortBy(this.props.pieces, piece => -piece.id);
    const pieceList = _.map(sortedPieces, piece => {
      return <Piece piece={piece}
                    selectedPiece={this.props.selectedPiece}
                    setSelectedPiece={this.props.setSelectedPiece}
                    key={piece.id} />;
    });
    const playerClass = this.props.player ? 'player-' + this.oneIndex(this.props.player.id) : '';
    const pieceListClasses = classNames('piece-list-container', playerClass, {
      'current-player-piece-list': (this.props.player || {}).id === this.props.currentPlayer.id,
    });
    return <div className={pieceListClasses}> {pieceList} </div>
  }
}

PieceList.propTypes = {
  pieces: PropTypes.arrayOf(pieceShape).isRequired,
  selectedPiece: pieceShape,
  setSelectedPiece: PropTypes.func,
  player: PropTypes.shape({
    id: PropTypes.number.isRequired,
  }),
  currentPlayer: playerShape.isRequired,
};


class Piece extends Component {
  clickPiece = () => {
    if (this.props.setSelectedPiece) {
      this.props.setSelectedPiece(this.props.piece);
    }
  }

  render() {
    const playerID = this.props.piece.player;
    const shape = this.props.piece.shape;
    const flippedShape = this.props.flipped ? flip(shape) : shape;
    const flippedRotatedShape = this.props.rotations ? rotate(flippedShape, this.props.rotations) : flippedShape;
    const shapeBoard = _.map(flippedRotatedShape, row => _.map(row, cell => cell === 'X' ? playerID : null));
    const pieceClasses = classNames('piece-container', {
      'selected-piece': this.props.selectedPiece && this.props.piece.id === this.props.selectedPiece.id,
    });
    return (
      <div className={pieceClasses}
           onClick={this.clickPiece}>
        <Board board={shapeBoard} />
      </div>
    );
  }
}

Piece.propTypes = {
  piece: pieceShape.isRequired,
  selectedPiece: pieceShape,
  setSelectedPiece: PropTypes.func,
  flipped: PropTypes.bool,
  rotations: PropTypes.number,
};


class PieceTransform extends Component {
  toggleFlipped = () => {
    const newFlipped = !this.props.flipped;
    this.props.setSelectedFlipped(newFlipped);
    // if the piece is rotated an odd number of times (i.e. onto its side),
    // it will get flipped vertically instead of horizontally.
    // to make the flip horizontal in this case, rotate the piece twice.
    if (this.props.rotations % 2 === 1) {
      const newRotations = (this.props.rotations + 2) % 4;
      this.props.setSelectedRotations(newRotations);
    }
  }

  incrementRotations = () => {
    const newRotations = (this.props.rotations + 1) % 4;
    this.props.setSelectedRotations(newRotations);
  }

  render() {
    return (
      <div className="piece-transform-container">
        <div className="piece-transform-icon"
             onClick={this.toggleFlipped}>
          <FaArrowsH size={30} />
        </div>
        <div className="piece-transform-icon"
             onClick={this.incrementRotations}>
          <FaRotateLeft size={30} />
        </div>
      </div>
    );
  }
}

PieceTransform.propTypes = {
  flipped: PropTypes.bool.isRequired,
  rotations: PropTypes.number.isRequired,
  setSelectedFlipped: PropTypes.func.isRequired,
  setSelectedRotations: PropTypes.func.isRequired,
};


class PassButton extends Component {
  render() {
    return (
      <div className="pass-button"
           onClick={this.props.passTurn}>
        Pass
      </div>
    );
  }
}

PassButton.propTypes = {
  passTurn: PropTypes.func.isRequired,
}


class PlayerList extends Component {
  render() {
    const playerList = _.map(this.props.players, player => {
      const score = _.find(this.props.playerScores, {player: player.id}).score;
      return <Player player={player}
                     currentPlayer={this.props.currentPlayer}
                     score={score}
                     key={player.id} />;
    });
    return <div className="player-list-container"> {playerList} </div>;
  }
}

PlayerList.propTypes = {
  players: PropTypes.arrayOf(playerShape).isRequired,
  playerScores: PropTypes.arrayOf(PropTypes.shape({
    player: PropTypes.number.isRequired,
    score: PropTypes.number.isRequired,
  })).isRequired,
  currentPlayer: playerShape,
};


class Player extends Component {
  render() {
    const colorClass = 'player-' + (this.props.player.id + 1);
    const playerClasses = classNames('player-container', colorClass, {
      'selected-player': this.props.player.id === (this.props.currentPlayer || {}).id,
    });
    const playerNameClasses = classNames({'player-passed': this.props.player.hasPassed});
    return (
      <div className={playerClasses}
           key={this.props.player.id}>
        <b className={playerNameClasses}> {this.props.player.name} </b>
        <PlayerScore score={this.props.score} />
      </div>
    );
  }
}

Player.propTypes = {
  player: playerShape.isRequired,
  currentPlayer: playerShape,
  score: PropTypes.number.isRequired,
};


class PlayerScore extends Component {
  render() {
    return <div className="player-score"> {this.props.score} </div>
  }
}

PlayerScore.propTypes = {
  score: PropTypes.number.isRequired,
};


export default App;
