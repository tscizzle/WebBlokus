import React, { Component, PropTypes } from 'react';
import './app.css';

import _ from 'lodash';
import blokus from 'blokus';


class App extends Component {
  render() {
    return (
      <div>
        <Banner/>
        <Arena/>
      </div>
    );
  }
}


class Banner extends Component {
  render() {
    return (
      <div className="banner">
        <h1 className="bannerHeader"> Blokus </h1>
        <span className="blokusPronunciation"> [<b>blohk</b>-<i>koos</i>] </span>
      </div>
    );
  }
}


class Arena extends Component {
  constructor() {
    super();
    this.blokus = blokus();
  }

  render() {
    const players = this.blokus.players();
    const board = this.blokus.board();
    const playerList = _.map(players, player => <li>{player.name}</li>);
    return (
      <div>
        <ul>
          {playerList}
        </ul>
        <Board board={board}/>
      </div>
    );
  }
}


class Board extends Component {
  render() {
    const rowList = _.map(this.props.board, row => <Row row={row}/>);
    return (
      <div>
        {rowList}
      </div>
    );
  }
}

Board.propTypes = {
  board: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
};


class Row extends Component {
  render() {
    const cellList = _.map(this.props.row, cell => <span>{cell || '( )'}</span>);
    return (
      <div className="boardRow">
        {cellList}
      </div>
    );
  }
}

Row.propTypes = {
  row: PropTypes.arrayOf(PropTypes.number),
};


export default App;
