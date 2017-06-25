import React, { Component } from 'react';
import Ship from './Ship';
import Asteroid from './Asteroid';
import ControlButton from './ControlButton';
import { randomNumBetweenExcluding } from './helpers'
import io from 'socket.io-client';
const socket = io(document.location.origin, {path: '/api/socket.io'});

const KEY = {
  LEFT:  37,
  RIGHT: 39,
  UP: 38,
  A: 65,
  D: 68,
  W: 87,
  SPACE: 32
};

export class Reacteroids extends Component {
  constructor() {
    super();
    this.state = {
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
      context: null,
      keys : {
        left  : 0,
        right : 0,
        up    : 0,
        down  : 0,
        shoot : 0,
      },
      asteroidCount: 3,
      currentScore: 0,
      topScore: localStorage['topscore'] || 0,
      inGame: false,
      beginning: false,
      username: 'Unknown player',
      otherUser: null,
      otherScore: null,
    }
    this.ship = [];
    this.asteroids = [];
    this.bullets = [];
    this.particles = [];

    socket.on('score', (username, score) => {
      console.log(username, score);
      this.setState({otherScore:score,otherUser:username});
    });
  }

  handleResize() {
    this.setState({
      screen : {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      }
    });
  }

  handleKeys(value, e) {
    let keys = this.state.keys;
    if(e.keyCode === KEY.LEFT   || e.keyCode === KEY.A) keys.left  = value;
    if(e.keyCode === KEY.RIGHT  || e.keyCode === KEY.D) keys.right = value;
    if(e.keyCode === KEY.UP     || e.keyCode === KEY.W) keys.up    = value;
    if(e.keyCode === KEY.SPACE) keys.shoot = value;
    this.setState({
      keys : keys
    });
  }

  handlePress(action , e) {
    e.preventDefault();
    console.log('press', action);

    let keys = this.state.keys;
    keys[action] = true;
    this.setState({
      keys: keys
    });
  }

  handleRelease(action, e) {
    e.preventDefault();
    console.log('release', action);

    let keys = this.state.keys;
    keys[action] = false;
    this.setState({
      keys: keys
    });
  }

  componentDidMount() {
    window.addEventListener('keyup',   this.handleKeys.bind(this, false));
    window.addEventListener('keydown', this.handleKeys.bind(this, true));
    window.addEventListener('resize',  this.handleResize.bind(this));

    const context = this.refs.canvas.getContext('2d');
    this.setState({ context: context });
    this.askForUserName();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleKeys);
    window.removeEventListener('resize', this.handleKeys);
    window.removeEventListener('resize', this.handleResize);
  }

  update() {
    const context = this.state.context;

    context.save();
    context.scale(this.state.screen.ratio, this.state.screen.ratio);

    // Motion trail
    context.fillStyle = '#000';
    context.globalAlpha = 0.4;
    context.fillRect(0, 0, this.state.screen.width, this.state.screen.height);
    context.globalAlpha = 1;

    // Next set of asteroids
    if(!this.asteroids.length){
      let count = this.state.asteroidCount + 1;
      this.setState({ asteroidCount: count });
      this.generateAsteroids(count)
    }

    // Check for colisions
    this.checkCollisionsWith(this.bullets, this.asteroids);
    this.checkCollisionsWith(this.ship, this.asteroids);

    // Remove or render
    this.updateObjects(this.particles, 'particles')
    this.updateObjects(this.asteroids, 'asteroids')
    this.updateObjects(this.bullets, 'bullets')
    this.updateObjects(this.ship, 'ship')

    context.restore();

    // Next frame
    requestAnimationFrame(() => {this.update()});
  }

  addScore(points){
    if(this.state.inGame){
      this.setState({
        currentScore: this.state.currentScore + points,
      });
    }
  }

  askForUserName() {
    this.setState({ beginning: true });
  }

  startFirstGame() {
    this.setState({ beginning: false });
    this.startGame();
    requestAnimationFrame(() => {this.update()});
  }

  startGame(){
    socket.emit('startGame');

    this.setState({
      inGame: true,
      currentScore: 0,
      keys: {
        up: false,
        left: false,
        right: false,
        shoot: false
      }
    });


    // Make ship
    let ship = new Ship({
      position: {
        x: this.state.screen.width/2,
        y: this.state.screen.height/2
      },
      create: this.createObject.bind(this),
      onDie: this.gameOver.bind(this)
    });
    this.createObject(ship, 'ship');

    // Make asteroids
    this.asteroids = [];
    this.generateAsteroids(this.state.asteroidCount)
  }

  gameOver(){
    socket.emit('score', this.state.username, this.state.currentScore);
    this.setState({
      inGame: false,
    });

    socket.emit('endGame', this.state.currentScore);

    // Replace top score
    if(this.state.currentScore > this.state.topScore){
      this.setState({
        topScore: this.state.currentScore,
      });
      localStorage['topscore'] = this.state.currentScore;
    }
  }

  generateAsteroids(howMany){
    let ship = this.ship[0];
    for (let i = 0; i < howMany; i++) {
      let asteroid = new Asteroid({
        size: 80,
        position: {
          x: randomNumBetweenExcluding(0, this.state.screen.width, ship.position.x-60, ship.position.x+60),
          y: randomNumBetweenExcluding(0, this.state.screen.height, ship.position.y-60, ship.position.y+60)
        },
        create: this.createObject.bind(this),
        addScore: this.addScore.bind(this)
      });
      this.createObject(asteroid, 'asteroids');
    }
  }

  createObject(item, group){
    this[group].push(item);
  }

  updateObjects(items, group){
    let index = 0;
    for (let item of items) {
      if (item.delete) {
        this[group].splice(index, 1);
      }else{
        items[index].render(this.state);
      }
      index++;
    }
  }

  checkCollisionsWith(items1, items2) {
    var a = items1.length - 1;
    var b;
    for(a; a > -1; --a){
      b = items2.length - 1;
      for(b; b > -1; --b){
        var item1 = items1[a];
        var item2 = items2[b];
        if(this.checkCollision(item1, item2)){
          item1.destroy();
          item2.destroy();
        }
      }
    }
  }

  checkCollision(obj1, obj2){
    var vx = obj1.position.x - obj2.position.x;
    var vy = obj1.position.y - obj2.position.y;
    var length = Math.sqrt(vx * vx + vy * vy);
    if(length < obj1.radius + obj2.radius){
      return true;
    }
    return false;
  }

  setUsername(username: string) {
    this.setState({ username });
  }

  render() {
    let message;

    if (this.state.currentScore <= 0) {
      message = '0 points... So sad.';
    } else if (this.state.currentScore >= this.state.topScore){
      message = 'Top score with ' + this.state.currentScore + ' points. Woo!';
    } else {
      message = this.state.currentScore + ' Points though :)'
    }

    return (
      <div>
        { this.state.beginning &&
          <div className="endgame">
            <p>Welcome, please enter your name!</p>
            <input onChange={(e) => this.setUsername(e.target.value)}/>

            <button
              onClick={ this.startFirstGame.bind(this) }>
              Start
            </button>
          </div>
        }
        { !this.state.inGame && !this.state.beginning &&
          <div className="endgame">
            <p>Game over, man!</p>
            <p>{message}</p>
            <button
              onClick={ this.startGame.bind(this) }>
              try again?
            </button>
          </div>
        }
        <span className="score current-score" >Score: {this.state.currentScore}</span>
        <span className="score top-score" >Top Score: {this.state.topScore}</span>
        {
          this.state.inGame && this.state.otherUser &&
          <div style={{
            position: 'absolute',
            top: '40px',
            right: '0',
            zIndex: 1,
            fontSize: 30,
          }}>
            {this.state.otherUser} scored {this.state.otherScore} !
          </div>
        }
        {
          this.state.inGame &&
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            zIndex: 1,
            width: '100%',
          }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <ControlButton
                onPress={this.handlePress.bind(this, 'up')}
                onRelease={this.handleRelease.bind(this, 'up')}
                text={'[↑]'}
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
              }}
            >
              <ControlButton
                onPress={this.handlePress.bind(this, 'left')}
                onRelease={this.handleRelease.bind(this, 'left')}
                text={'[←]'}
              />
              <ControlButton
                onPress={this.handlePress.bind(this, 'shoot')}
                onRelease={this.handleRelease.bind(this, 'shoot')}
                text={'SHOOT'}
              />
              <ControlButton
                onPress={this.handlePress.bind(this, 'right')}
                onRelease={this.handleRelease.bind(this, 'right')}
                text={'[→]'}
              />
            </div>
          </div>
        }
        <canvas ref="canvas"
          width={this.state.screen.width * this.state.screen.ratio}
          height={this.state.screen.height * this.state.screen.ratio}
        />
      </div>
    );
  }
}
