import { CONFIG } from './config.js';

export class Bomb {
  static CREATED = 0;
  static PLANTED = 1;
  static EXPLODING = 2;
  static EXPLODED = 3;

  constructor(x, y, strength = 1, owner = null) {
    this.x = (x + 0.5) | 0;
    this.y = (y + 0.5) | 0;
    this.rx = this.x;
    this.ry = this.y;
    this.strength = strength;
    this.owner = owner;
    this.state = Bomb.CREATED;
    this.planted = null;
    this.vx = 0;
    this.vy = 0;
  }

  kick(dx, dy, speed = CONFIG.BOMB_KICK_SPEED || 8) {
    this.vx = dx * speed;
    this.vy = dy * speed;
  }

  stop() {
    this.vx = 0;
    this.vy = 0;
    this.x = (this.rx + 0.5) | 0;
    this.y = (this.ry + 0.5) | 0;
    this.rx = this.x;
    this.ry = this.y;
  }

  isMoving() {
    return this.vx !== 0 || this.vy !== 0;
  }

  update(dt, world) {
    if (!this.isMoving()) return;
    const nx = this.rx + this.vx * dt;
    const ny = this.ry + this.vy * dt;
    const gx = (nx + 0.5) | 0;
    const gy = (ny + 0.5) | 0;
    const otherBomb = world.hasBomb(gx, gy);
    if (world.isBlocked(gx, gy) || (otherBomb && otherBomb !== this) || world.hasItem(gx, gy) || world.hasPlayer(gx, gy)) {
      this.stop();
      return;
    }
    this.rx = nx;
    this.ry = ny;
    this.x = gx;
    this.y = gy;
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
