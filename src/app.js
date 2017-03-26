import React, { Component, PropTypes } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import io from 'socket.io-client';
import _ from 'lodash';
import classNames from 'classnames';
import { FaRotateLeft,
         FaArrowsH     } from 'react-icons/lib/fa';

const socketServer = window.location.hostname === 'localhost' ? 'localhost:9000' : undefined;
const socket = io(socketServer);

import { game, transform } from 'blokus';
const { flip, rotate } = transform;
import '../public/stylesheets/app.css';
import { playerShape,
         pieceShape   } from './blokusObjects.js';
import { Board } from './board.js';


class App extends Component {
  render() {
    return (
      <Router>
        <div>
          <Route path="*" component={Banner} />
          <Route exact path="/" component={GameSelection} />
          <Route path="/:gameID" component={Arena} />
        </div>
      </Router>
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
          <Route path="/:gameID" component={DifferentGameButton} />
        </div>
      </div>
    );
  }
}


class DifferentGameButton extends Component {
  navigateToGameSelection = () => {
    this.props.history.push('/');
  }

  render() {
    return (
      <div className="different-game"
           onClick={this.navigateToGameSelection}>
        Different Game
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
    this.props.history.push(`/${this.newGameID}`);
  }

  render() {
    const joinGameClasses = classNames('join-game-button', {
      'disabled': _.isEmpty(this.state.joinGameID),
    });
    return (
      <div className="game-selection-container">
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
        <div className="new-game-button"
             onClick={this.navigateToNewGame}>
          New Game
        </div>
      </div>
    );
  }
}


class Arena extends Component {
  constructor(props) {
    super(props);
    this.state = this.getInitialGameState();
  }

  componentDidMount() {
    socket.on('take:turn', ({turns}) => {
      this.catchUpTurns(turns);
      this.updateStateAfterTurn();
    });
  }

  getInitialGameState = () => {
    this.game = game();
    const board = this.game.board();
    const currentPlayer = this.game.currentPlayer();
    const selectedPiece = _.maxBy(this.game.availablePieces({player: currentPlayer.id}), 'id');
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
    this.setState({
      board,
      currentPlayer,
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
    const placement = {
      piece: this.state.selectedPiece.id,
      flipped: this.state.selectedFlipped,
      rotations: this.state.selectedRotations,
      position,
    };
    const placementResult = this.game.place(placement);
    if (placementResult.success) {
      const turns = this.game.turns();
      socket.emit('take:turn', {turns});
      this.updateStateAfterTurn();
      this.hoverPosition(false, position);
    }
  }

  passTurn = () => {
    const passResult = this.game.pass();
    if (passResult.success) {
      const turns = this.game.turns();
      socket.emit('take:turn', {turns});
      this.updateStateAfterTurn();
    }
  }

  hoverPosition = (showHover, position) => {
    if (!this.game.isOver()) {
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

  getCurrentPlayerID = () => {
    const currentPlayer = this.game.currentPlayer();
    return !_.isNull(currentPlayer) ? currentPlayer.id : null;
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
    const players = this.game.players();
    const playerScores = _.map(players, player => {
      return {
        player: player.id,
        score: this.game.numRemaining({player: player.id}),
      };
    });
    const currentPlayer = this.state.currentPlayer;
    const availablePieces = !_.isNull(currentPlayer) ? this.game.availablePieces({player: currentPlayer.id}) : [];
    const isOver = this.game.isOver();
    return (
      <div className="arena-container">
        <Board board={this.state.board}
               highlightedPositions={this.state.highlightedPositions}
               placeSelectedPiece={this.placeSelectedPiece}
               hoverPosition={this.hoverPosition}
               isMainBoard={true}
               getCurrentPlayerID={this.getCurrentPlayerID} />
        {!isOver ?
          <div className="piece-control-container">
            <PieceList pieces={availablePieces}
                       selectedPiece={this.state.selectedPiece}
                       flipped={this.state.selectedFlipped}
                       rotations={this.state.selectedRotations}
                       setSelectedPiece={this.setSelectedPiece} />
            <div className="piece-control-bottom-row">
              <PieceTransform flipped={this.state.selectedFlipped}
                              rotations={this.state.selectedRotations}
                              setSelectedFlipped={this.setSelectedFlipped}
                              setSelectedRotations={this.setSelectedRotations} />
              <PassButton passTurn={this.passTurn} />
            </div>
          </div> :
          <b> The game is over! </b>
        }
        <PlayerList players={players}
                    playerScores={playerScores}
                    currentPlayer={this.state.currentPlayer} />
      </div>
    );
  }
}


class PieceList extends Component {
  render() {
    const sortedPieces = _.sortBy(this.props.pieces, piece => -piece.id);
    const pieceList = _.map(sortedPieces, piece => {
      return <Piece piece={piece}
                    selectedPiece={this.props.selectedPiece}
                    flipped={this.props.flipped}
                    rotations={this.props.rotations}
                    setSelectedPiece={this.props.setSelectedPiece}
                    key={piece.id} />;
    });
    return <div className="piece-list-container"> {pieceList} </div>
  }
}

PieceList.propTypes = {
  pieces: PropTypes.arrayOf(pieceShape).isRequired,
  selectedPiece: pieceShape.isRequired,
  flipped: PropTypes.bool.isRequired,
  rotations: PropTypes.number.isRequired,
  setSelectedPiece: PropTypes.func.isRequired,
};


class Piece extends Component {
  clickPiece = () => {
    this.props.setSelectedPiece(this.props.piece);
  }

  render() {
    const playerID = this.props.piece.player;
    const shape = this.props.piece.shape;
    const flippedShape = this.props.flipped ? flip(shape) : shape;
    const flippedRotatedShape = rotate(flippedShape, this.props.rotations);
    const shapeBoard = _.map(flippedRotatedShape, row => _.map(row, cell => cell === 'X' ? playerID : null));
    const pieceClasses = classNames('piece-container', {
      'selected-piece': this.props.piece.id === this.props.selectedPiece.id,
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
  selectedPiece: pieceShape.isRequired,
  setSelectedPiece: PropTypes.func.isRequired,
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
