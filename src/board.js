import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { boardShape,
         positionShape } from './blokusObjects.js';

export class Board extends Component {
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
    const playerClass = 'player-' + this.oneIndex(this.props.playerID);
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
