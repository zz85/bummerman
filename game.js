// Browser-compatible Game class (mirrors src/game.js)
class Game {
  constructor() {
    this.state = Game.STATE.START;
    this.config = {
      players: 2,
      bots: 0,
      gridSize: 13,
    };
    this.scores = {};
    this.winner = null;
  }

  setOption(key, value) {
    if (key in this.config) {
      this.config[key] = value;
    }
  }

  cycleOption(key, options) {
    const current = this.config[key];
    const idx = options.indexOf(current);
    this.config[key] = options[(idx + 1) % options.length];
    return this.config[key];
  }

  start() {
    if (this.state !== Game.STATE.START) return false;
    this.state = Game.STATE.PLAYING;
    this.winner = null;
    return true;
  }

  end(winner = null) {
    if (this.state !== Game.STATE.PLAYING) return false;
    this.state = Game.STATE.GAMEOVER;
    this.winner = winner;
    if (winner) {
      this.scores[winner] = (this.scores[winner] || 0) + 1;
    }
    return true;
  }

  restart() {
    this.state = Game.STATE.START;
    this.winner = null;
    return true;
  }

  getStartScreenText() {
    const { players, bots, gridSize } = this.config;
    return [
      'BUMMERMAN',
      '',
      `Players: ${players}  (press 1)`,
      `Bots: ${bots}  (press 2)`,
      `Grid: ${gridSize}x${gridSize}  (press 3)`,
      '',
      'Press SPACE to start',
    ].join('\n');
  }

  getGameOverText() {
    let text = 'Game Over!\n';
    if (this.winner) {
      text += `${this.winner} won!\n`;
      text += `Score: ${this.scores[this.winner]}`;
    } else {
      text += "It's a Draw!";
    }
    text += '\n\nPress SPACE to continue';
    return text;
  }
}

Game.STATE = {
  START: 'start',
  PLAYING: 'playing',
  GAMEOVER: 'gameover',
};
