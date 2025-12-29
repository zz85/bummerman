import { WALL } from './config.js';

export class Walls {
  constructor(columns, rows) {
    this.columns = columns;
    this.rows = rows;
    this.cells = new Array(columns * rows).fill(0);
  }

  get(x, y) {
    return this.cells[this.index(x, y)];
  }

  set(x, y, v) {
    this.cells[this.index(x, y)] = v;
  }

  index(x, y) {
    return x + this.columns * y;
  }

  coords(i) {
    const x = i % this.columns;
    const y = (i / this.columns) | 0;
    return [x, y];
  }

  defaultWalls(blockedIndices = []) {
    this.forEach((x, y) => {
      if (
        x === 0 ||
        x === this.columns - 1 ||
        y === 0 ||
        y === this.rows - 1 ||
        (x % 2 === 0 && y % 2 === 0)
      ) {
        this.cells[this.index(x, y)] = WALL.HARD;
      }
    });

    this.buildMaze(blockedIndices);
  }

  emptyWalls() {
    this.forEach((x, y) => {
      if (
        x === 0 ||
        x === this.columns - 1 ||
        y === 0 ||
        y === this.rows - 1
      ) {
        this.cells[this.index(x, y)] = WALL.HARD;
      }
    });
  }

  blow(x, y) {
    if (x < 0 || y < 0 || x > this.columns - 1 || y > this.rows - 1) return;
    if (this.cells[this.index(x, y)] === WALL.SOFT) {
      this.cells[this.index(x, y)] = WALL.EMPTY;
      return true;
    }
  }

  buildMaze(blockedIndices = []) {
    const exceptions = new Set(blockedIndices);

    this.cells
      .map((c, i) => (c === 0 ? i : false))
      .filter((v) => v !== false && !exceptions.has(v))
      .forEach((a) => {
        if (Math.random() < 0.9) {
          this.cells[a] = WALL.SOFT;
        }
      });
  }

  forEach(cb) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        cb(col, row, this.get(col, row));
      }
    }
  }

  debugWalls() {
    let s = '';
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        s += this.get(col, row) ? '#' : '.';
      }
      s += '\n';
    }
    return s;
  }
}
