import { CONFIG } from './config.js';

export class Bomb {
  static CREATED = 0;
  static PLANTED = 1;
  static EXPLODING = 2;
  static EXPLODED = 3;

  constructor(x, y, strength = 1, owner = null) {
    this.rx = x;
    this.ry = y;
    this.x = (this.rx + 0.5) | 0;
    this.y = (this.ry + 0.5) | 0;
    this.strength = strength;
    this.owner = owner;
    this.state = Bomb.CREATED;
    this.planted = null;
  }

  plant(onExplode) {
    this.planted = Date.now();
    this.state = Bomb.EXPLODING;
    if (onExplode) {
      setTimeout(() => onExplode(this), CONFIG.BOMB_FUSE_TIME);
    }
  }

  explode() {
    if (this.state > Bomb.EXPLODING) return false;
    this.state = Bomb.EXPLODED;
    if (this.owner) this.owner.bombsUsed--;
    return true;
  }
}
