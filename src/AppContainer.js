import React, { Component } from 'react';
import io from 'socket.io-client';
const socket = io('http://192.168.2.74:3000', {path: '/api/socket.io'});

class AppContainer extends Component {

  constructor(props) {
    super(props);

    socket.on('newPlayer', (msg) => {
      console.log(msg);
    });
  }

  componentDidMount() {
    socket.emit('connection');
    console.info('EMIT, connection');
  }

  startGame() {
    socket.emit('startGame');
    console.info('EMIT, startGame');
  }

  endGame() {
    socket.emit('endGame');
    console.info('EMIT, endGame');
  }

  render() {
    return (
      <div>
        <button onClick={ () => this.startGame()}>
          Start Game
        </button>
        <button onClick={ () => this.endGame()}>
          End Game
        </button>

      </div>
    );
  }
}

export default AppContainer;