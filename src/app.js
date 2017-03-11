import React, { Component, PropTypes } from 'react';
import './app.css';
import { playerShape,
         pieceShape,
         boardShape    } from './blokusObjects.js';
import { playerToColor } from './playerColors.js';

import _ from 'lodash';
import blokus from 'blokus';


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
    this.blokus = blokus();
    const board = this.blokus.board();
    const selectedPlayer = _.find(this.blokus.players(), {id: 0});
    const selectedPiece = _.find(this.blokus.pieces(), {id: 20, player: 0});
    this.state = {
      board,
      selectedPlayer,
      selectedPiece,
    };
  }

  setSelectedPlayer = player => {
    if (player) this.setState({selectedPlayer: player});
  }

  setSelectedPiece = piece => {
    this.setState({selectedPiece: piece});
  }

  placeSelectedPiece = (position) => {
    this.blokus.place({
      player: this.state.selectedPlayer.id,
      piece: this.state.selectedPiece.id,
      position,
    });
    const board = this.blokus.board();
    this.setState({board: board});
  }

  render() {
    const players = this.blokus.players();
    const availablePieces = this.blokus.availablePieces({player: this.state.selectedPlayer.id});
    return (
      <div className="arena-container">
        <Board board={this.state.board}
               placeSelectedPiece={this.placeSelectedPiece}
               isMainBoard={true} />
        <PieceList pieces={availablePieces}
                   selectedPiece={this.state.selectedPiece}
                   setSelectedPiece={this.setSelectedPiece} />
        <PlayerList players={players}
                    selectedPlayer={this.state.selectedPlayer}
                    setSelectedPlayer={this.setSelectedPlayer} />
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
                  key={rowIdx}
                  placeSelectedPiece={this.props.placeSelectedPiece} />;
    });
    const mainBoardClass = (_.isBoolean(this.props.isMainBoard) && this.props.isMainBoard) ? 'main-board' : '';
    const boardContainerProps = {
      className: "board-container " + mainBoardClass,
    };
    if (this.props.placeSelectedPiece) {
      boardContainerProps.onClick = this.placePiece;
    };
    return <div {...boardContainerProps}> {rowList} </div>
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
    this.props.placeSelectedPiece(this.props.position);
  }

  render() {
    return (!_.isNull(this.props.playerID)
      ? <PlayerCell playerID={this.props.playerID}
                    placeSelectedPiece={this.placeSelectedPiece}
                    key={this.props.position.col} />
      : <EmptyCell placeSelectedPiece={this.placeSelectedPiece}
                   key={this.props.position.col} />);
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
                    setSelectedPiece={this.props.setSelectedPiece}
                    key={piece.id} />;
    });
    return <div className="piece-list-container"> {pieceList} </div>
  }
}

PieceList.propTypes = {
  pieces: PropTypes.arrayOf(pieceShape).isRequired,
  selectedPiece: pieceShape.isRequired,
  setSelectedPiece: PropTypes.func.isRequired,
};


class Piece extends Component {
  clickPiece = () => {
    this.props.setSelectedPiece(this.props.piece);
  }

  render() {
    const playerID = this.props.piece.player;
    const shape = this.props.piece.shape;
    const shapeBoard = _.map(shape, row => _.map(row, cell => cell === 'X' ? playerID : null));
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
};


class PlayerList extends Component {
  render() {
    const playerList = _.map(this.props.players, player => {
      return <Player player={player}
                     selectedPlayer={this.props.selectedPlayer}
                     setSelectedPlayer={this.props.setSelectedPlayer}
                     key={player.id} />;
    });
    return <div className="player-list-container"> {playerList} </div>;
  }
}

PlayerList.propTypes = {
  players: PropTypes.arrayOf(playerShape).isRequired,
  selectedPlayer: playerShape.isRequired,
  setSelectedPlayer: PropTypes.func.isRequired,
};


class Player extends Component {
  clickPlayer = () => {
    this.props.setSelectedPlayer(this.props.player);
  }

  render() {
    const color = playerToColor[this.props.player.id];
    const selected = this.props.player.id === this.props.selectedPlayer.id;
    const selectedClass = selected ? 'selected-player' : '';
    return (
      <div className={"player-container " + selectedClass}
           style={{backgroundColor: color}}
           onClick={this.clickPlayer}
           key={this.props.player.id}>
        <b> {this.props.player.name} </b>
      </div>
    );
  }
}

Player.propTypes = {
  player: playerShape.isRequired,
  selectedPlayer: playerShape.isRequired,
  setSelectedPlayer: PropTypes.func.isRequired,
};


export default App;
