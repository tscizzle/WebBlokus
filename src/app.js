import React, { Component, PropTypes } from 'react';
import io from 'socket.io-client';
const socket = io();
import _ from 'lodash';
import classNames from 'classnames';
import { FaRotateLeft,
         FaArrowsH     } from 'react-icons/lib/fa';

import { game, transform } from 'blokus';
const { flip, rotate } = transform;
import '../public/stylesheets/app.css';
import { playerShape,
         pieceShape,
         boardShape,
         positionShape } from './blokusObjects.js';


class App extends Component {
  render() {
    return (
      <div>
        <Banner />
        <Arena />
      </div>
    );
  }
}


class Banner extends Component {
  render() {
    return (
      <div className="banner-container">
        <h1> Blokus </h1>
        <span className="blokus-pronunciation"> [<b>blohk</b>-<i>koos</i>] </span>
      </div>
    );
  }
}


class Arena extends Component {
  constructor(props) {
    super(props);
    this.game = game();
    const board = this.game.board();
    const currentPlayer = this.game.currentPlayer();
    const selectedPiece = _.maxBy(this.game.availablePieces({player: currentPlayer.id}), 'id');
    this.state = {
      board,
      currentPlayer,
      selectedPiece,
      selectedFlipped: false,
      selectedRotations: 0,
      highlightedPositions: [],
    };
  }

  componentDidMount() {
    socket.on('took:turn', placement => {
      console.log('turn was taken, placement was sent', placement);
      this.game.place(placement);
      const board = this.game.board();
      const currentPlayer = this.game.currentPlayer();
      this.setState({
        board,
        currentPlayer,
      });
    });
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

  placeSelectedPiece = position => {
    const placement = {
      piece: this.state.selectedPiece.id,
      flipped: this.state.selectedFlipped,
      rotations: this.state.selectedRotations,
      position,
    };
    const probePlacement = _.merge(_.cloneDeep(placement), {probe: true});
    const probeResult = this.game.place(probePlacement);
    if (probeResult.success) {
      console.log('taking turn, sending placement', placement);
      socket.emit('take:turn', placement);
      this.hoverPosition(false, position);
    }
  }

  passTurn = () => {
    this.game.pass();
    const currentPlayer = this.game.currentPlayer();
    this.setState({currentPlayer});
  }

  hoverPosition = (showHover, position) => {
    if (!this.game.isOver()) {
      if (showHover) {
        const placementResult = this.game.place({
          piece: this.state.selectedPiece.id,
          flipped: this.state.selectedFlipped,
          rotations: this.state.selectedRotations,
          position,
          probe: true,
        });
        if (placementResult.success) {
          this.setState({highlightedPositions: placementResult.positions});
        }
      } else {
        this.setState({highlightedPositions: []});
      }
    }
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


class Board extends Component {
  render() {
    const rowList = _.map(this.props.board, (row, rowIdx) => {
      return <Row players={this.props.players}
                  row={row}
                  rowIdx={rowIdx}
                  isMainBoard={this.props.isMainBoard}
                  highlightedPositions={this.props.highlightedPositions}
                  placeSelectedPiece={this.props.placeSelectedPiece}
                  hoverPosition={this.props.hoverPosition}
                  getCurrentPlayerID={this.props.getCurrentPlayerID}
                  key={rowIdx} />;
    });
    return <div className="board-container"> {rowList} </div>
  }
}

Board.propTypes = {
  board: boardShape.isRequired,
  highlightedPositions: PropTypes.arrayOf(positionShape),
  placeSelectedPiece: PropTypes.func,
  hoverPosition: PropTypes.func,
  isMainBoard: PropTypes.bool,
  getCurrentPlayerID: PropTypes.func,
};


class Row extends Component {
  render() {
    const cellList = _.map(this.props.row, (playerID, colIdx) => {
      return <Cell playerID={playerID}
                   position={{row: this.props.rowIdx, col: colIdx}}
                   highlightedPositions={this.props.highlightedPositions}
                   placeSelectedPiece={this.props.placeSelectedPiece}
                   hoverPosition={this.props.hoverPosition}
                   getCurrentPlayerID={this.props.getCurrentPlayerID}
                   key={colIdx} />;
    });
    return <div className="board-row"> {cellList} </div>;
  }
}

Row.propTypes = {
  row: PropTypes.arrayOf(PropTypes.number).isRequired,
  rowIdx: PropTypes.number.isRequired,
  placeSelectedPiece: PropTypes.func,
  hoverPosition: PropTypes.func,
  getCurrentPlayerID: PropTypes.func,
};


class Cell extends Component {
  placeSelectedPiece = () => {
    if (this.props.placeSelectedPiece) {
      this.props.placeSelectedPiece(this.props.position);
    }
  }

  hoverPosition = e => {
    if (this.props.hoverPosition) {
      const showHover = e.type === 'mouseenter';
      this.props.hoverPosition(showHover, this.props.position);
    }
  }

  oneIndex = n => n + 1;

  render() {
    const highlighted = !_.isUndefined(_.find(this.props.highlightedPositions, this.props.position));
    return (
      !_.isNull(this.props.playerID)
        ? <PlayerCell playerID={this.props.playerID}
                      placeSelectedPiece={this.placeSelectedPiece}
                      hoverPosition={this.hoverPosition}
                      highlighted={highlighted}
                      key={this.props.position.col} />
        : <EmptyCell placeSelectedPiece={this.placeSelectedPiece}
                     hoverPosition={this.hoverPosition}
                     highlighted={highlighted}
                     getCurrentPlayerID={this.props.getCurrentPlayerID}
                     key={this.props.position.col} />
    );
  }
}

Cell.propTypes = {
  playerID: PropTypes.number,
  position: PropTypes.shape({row: PropTypes.number.isRequired, col: PropTypes.number.isRequired}),
  highlightedPositions: PropTypes.arrayOf(positionShape),
  placeSelectedPiece: PropTypes.func,
  hoverPosition: PropTypes.func,
  getCurrentPlayerID: PropTypes.func,
};


class PlayerCell extends Cell {
  render() {
    const playerClass = "player-" + this.oneIndex(this.props.playerID);
    const playerCellClasses = classNames('board-cell', playerClass, {'highlighted': this.props.highlighted});
    return (
      <div className={playerCellClasses}
           onClick={this.props.placeSelectedPiece}
           onMouseEnter={this.props.hoverPosition}
           onMouseLeave={this.props.hoverPosition}>
      </div>
    );
  }
}

PlayerCell.propTypes = {
  playerID: PropTypes.number.isRequired,
  placeSelectedPiece: PropTypes.func,
  hoverPosition: PropTypes.func,
  highlighted: PropTypes.bool.isRequired,
};


class EmptyCell extends Cell {
  render() {
    const playerClass = this.props.getCurrentPlayerID ? 'player-' + this.oneIndex(this.props.getCurrentPlayerID()) : '';
    const emptyCellClasses = classNames('board-cell', 'empty-cell', {
      'highlighted': this.props.highlighted,
      [playerClass]: this.props.highlighted,
    });
    return (
      <div className={emptyCellClasses}
           onClick={this.props.placeSelectedPiece}
           onMouseEnter={this.props.hoverPosition}
           onMouseLeave={this.props.hoverPosition}>
      </div>
    );
  }
}

EmptyCell.propTypes = {
  placeSelectedPiece: PropTypes.func,
  hoverPosition: PropTypes.func,
  highlighted: PropTypes.bool.isRequired,
  getCurrentPlayerID: PropTypes.func,
};


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
        <b> Pass </b>
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
