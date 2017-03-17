import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import { FaRotateLeft,
         FaArrowsH     } from 'react-icons/lib/fa';

import { game, transform } from 'blokus';
const { flip, rotate } = transform;

import './app.css';
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
        <img className="banner-img"
             src="./favicon.ico"
             alt="" />
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
    const selectedPiece = _.find(this.game.pieces(), {id: 20, player: currentPlayer.id});
    this.state = {
      board,
      currentPlayer,
      selectedPiece,
      selectedFlipped: false,
      selectedRotations: 0,
      highlightedPositions: [],
    };
  }

  getCurrentPlayerID = () => {
    return this.game.currentPlayer().id;
  }

  setBoard = board => {
    this.setState({board});
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
    this.game.place({
      piece: this.state.selectedPiece.id,
      flipped: this.state.selectedFlipped,
      rotations: this.state.selectedRotations,
      position,
    });
    const board = this.game.board();
    const currentPlayer = this.game.currentPlayer();
    this.setState({
      board,
      currentPlayer,
    });
  }

  hoverPosition = (showHover, position) => {
    if (showHover) {
      var placementResult = this.game.place({
        piece: this.state.selectedPiece.id,
        flipped: this.state.selectedFlipped,
        rotations: this.state.selectedRotations,
        position,
        probe: true,
      });
      if (placementResult.success) {
        this.setState({highlightedPositions: placementResult.positions});
      }
    }
    else {
      this.setState({highlightedPositions: []});
    }
  }

  render() {
    const players = this.game.players();
    const availablePieces = this.game.availablePieces({player: this.state.currentPlayer.id});
    return (
      <div className="arena-container">
        <Board board={this.state.board}
               highlightedPositions={this.state.highlightedPositions}
               placeSelectedPiece={this.placeSelectedPiece}
               hoverPosition={this.hoverPosition}
               isMainBoard={true}
               getCurrentPlayerID={this.getCurrentPlayerID} />
        <div className="piece-control-container">
          <PieceList pieces={availablePieces}
                     selectedPiece={this.state.selectedPiece}
                     flipped={this.state.selectedFlipped}
                     rotations={this.state.selectedRotations}
                     setSelectedPiece={this.setSelectedPiece} />
          <PieceTransform flipped={this.state.selectedFlipped}
                          rotations={this.state.selectedRotations}
                          setSelectedFlipped={this.setSelectedFlipped}
                          setSelectedRotations={this.setSelectedRotations} />
        </div>
        <PlayerList players={players}
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
    const mainBoardClass = (_.isBoolean(this.props.isMainBoard) && this.props.isMainBoard) ? 'main-board' : '';
    return <div className={"board-container " + mainBoardClass}> {rowList} </div>
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

  oneIndex = n => {
    return n + 1;
  }

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
    const highlightedClass = this.props.highlighted ? "highlighted" : "";
    return (
      <div className={"board-cell " + playerClass + " " + highlightedClass}
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
    const playerClass = this.props.getCurrentPlayerID ? "player-" + this.oneIndex(this.props.getCurrentPlayerID()) : "";
    const highlightedClass = this.props.highlighted ? "highlighted " + playerClass : "";
    return (
      <div className={"board-cell empty-cell " + highlightedClass}
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
    const selected = this.props.piece.id === this.props.selectedPiece.id;
    const selectedClass = selected ? 'selected-piece' : '';
    return (
      <div className={"piece-container " + selectedClass}
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


class PlayerList extends Component {
  render() {
    const playerList = _.map(this.props.players, player => {
      return <Player player={player}
                     currentPlayer={this.props.currentPlayer}
                     key={player.id} />;
    });
    return <div className="player-list-container"> {playerList} </div>;
  }
}

PlayerList.propTypes = {
  players: PropTypes.arrayOf(playerShape).isRequired,
  currentPlayer: playerShape.isRequired,
};


class Player extends Component {
  render() {
    const colorClass = "player-" + (this.props.player.id + 1);
    const selected = this.props.player.id === this.props.currentPlayer.id;
    const selectedClass = selected ? 'selected-player' : '';
    return (
      <div className={"player-container " + colorClass + " " + selectedClass}
           key={this.props.player.id}>
        <b> {this.props.player.name} </b>
      </div>
    );
  }
}

Player.propTypes = {
  player: playerShape.isRequired,
  currentPlayer: playerShape.isRequired,
};


export default App;
