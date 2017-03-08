import React, { Component, PropTypes } from 'react';
import './app.css';

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
    this.blokus = blokus();
  }

  render() {
    return (
      const players = this.blokus.players();
      const board = this.blokus.board();
      const playerList = _.map(players, player => <li>{player.name}</li>)
      <div>
        <ul> {playerList} </ul>
        <Board board={board}/>
      </div>
    );
  }
}


class Board extends Component {
  render() {
    return (
      <div>
        <ul> {playerList} </ul>
        <Board/>
      </div>
    );
  }
}

Board.propTypes = {
  board: React.PropTypes.arrayOf(React.PropTypes.arrayOf(
    React.PropTypes.number,
  )),
}


export default App;
