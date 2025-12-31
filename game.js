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
    this.stats = {};  // { playerName: { wins: 0, kills: 0, deaths: 0 } }
    this.winner = null;
  }

  initStats(playerNames) {
    for (const name of playerNames) {
      if (!this.stats[name]) {
        this.stats[name] = { wins: 0, kills: 0, deaths: 0 };
      }
    }
  }

  recordKill(killer, victim) {
    if (killer && killer !== victim && this.stats[killer]) this.stats[killer].kills++;
    if (victim && this.stats[victim]) this.stats[victim].deaths++;
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
      if (this.stats[winner]) this.stats[winner].wins++;
    }
    return true;
  }

  restart() {
    this.state = Game.STATE.START;
    this.winner = null;
    return true;
  }

  getStatsText() {
    const lines = [];
    for (const [name, s] of Object.entries(this.stats)) {
      lines.push(`${name}: ${s.wins}W ${s.kills}K ${s.deaths}D`);
    }
    return lines.join('  |  ');
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
      'Press M to toggle music',
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
