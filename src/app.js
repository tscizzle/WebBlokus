import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import { FaRotateLeft,
         FaArrowsH     } from 'react-icons/lib/fa';

import { game, transform } from 'blokus';
const { flip, rotate } = transform;

import './app.css';
import { playerShape,
         pieceShape,
         boardShape    } from './blokusObjects.js';
import { playerToColor } from './playerColors.js';


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
    };
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

  placeSelectedPiece = (position) => {
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

  render() {
    const players = this.game.players();
    const availablePieces = this.game.availablePieces({player: this.state.currentPlayer.id});
    return (
      <div className="arena-container">
        <Board board={this.state.board}
               placeSelectedPiece={this.placeSelectedPiece}
               isMainBoard={true} />
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
                  placeSelectedPiece={this.props.placeSelectedPiece}
                  key={rowIdx} />;
    });
    const mainBoardClass = (_.isBoolean(this.props.isMainBoard) && this.props.isMainBoard) ? 'main-board' : '';
    return <div className={"board-container " + mainBoardClass}> {rowList} </div>
  }
}

Board.propTypes = {
  board: boardShape.isRequired,
  placeSelectedPiece: PropTypes.func,
  isMainBoard: PropTypes.bool,
};


class Row extends Component {
  render() {
    const cellList = _.map(this.props.row, (playerID, colIdx) => {
      return <Cell playerID={playerID}
                   position={{row: this.props.rowIdx, col: colIdx}}
                   placeSelectedPiece={this.props.placeSelectedPiece}
                   key={colIdx} />;
    });
    return <div className="board-row"> {cellList} </div>;
  }
}

Row.propTypes = {
  row: PropTypes.arrayOf(PropTypes.number).isRequired,
  rowIdx: PropTypes.number.isRequired,
  placeSelectedPiece: PropTypes.func,
};


class Cell extends Component {
  placeSelectedPiece = () => {
    if (this.props.placeSelectedPiece) {
      this.props.placeSelectedPiece(this.props.position);
    }
  }

  render() {
    return (
      !_.isNull(this.props.playerID)
        ? <PlayerCell playerID={this.props.playerID}
                      placeSelectedPiece={this.placeSelectedPiece}
                      key={this.props.position.col} />
        : <EmptyCell placeSelectedPiece={this.placeSelectedPiece}
                     key={this.props.position.col} />
    );
  }
}

Cell.propTypes = {
  playerID: PropTypes.number,
  position: PropTypes.shape({row: PropTypes.number.isRequired, col: PropTypes.number.isRequired}),
  placeSelectedPiece: PropTypes.func,
};


class PlayerCell extends Cell {
  render() {
    const color = playerToColor[this.props.playerID];
    return <div className="board-cell" style={{backgroundColor: color}} onClick={this.props.placeSelectedPiece}></div>;
  }
}

PlayerCell.propTypes = {
  playerID: PropTypes.number.isRequired,
  placeSelectedPiece: PropTypes.func,
};


class EmptyCell extends Cell {
  render() {
    return <div className="board-cell empty-cell" onClick={this.props.placeSelectedPiece}></div>;
  }
}

EmptyCell.propTypes = {
  placeSelectedPiece: PropTypes.func,
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
    const color = playerToColor[this.props.player.id];
    const selected = this.props.player.id === this.props.currentPlayer.id;
    const selectedClass = selected ? 'selected-player' : '';
    return (
      <div className={"player-container " + selectedClass}
           style={{backgroundColor: color}}
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
