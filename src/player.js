import { CONFIG } from './config.js';

export class Player {
  constructor(x, y, name = 'Player', color = '#fff', color2 = '#ccc') {
    this.x = x || 0;
    this.y = y || 0;
    this.bombsLimit = 1;
    this.bombStrength = 1;
    this.bombsUsed = 0;
    this.SPEED = CONFIG.PLAYER_SPEED;
    this.name = name;
    this.direction = [0, 0];
    this.lastAngle = 0;
    this.SHRINK = 0.0;
    this.color = color;
    this.color2 = color2;
    this.died = null;
    this.world = null;
  }

  aabb(x = this.x, y = this.y) {
    return [x, x + 1 - this.SHRINK * 2, y, y + 1 - this.SHRINK * 2];
  }

  smallerAabb() {
    const THRESHOLD = 0.25;
    return [
      this.x + THRESHOLD,
      this.x + 1 - THRESHOLD * 2,
      this.y + THRESHOLD,
      this.y + 1 - THRESHOLD * 2,
    ];
  }

  corners([x1, x2, y1, y2]) {
    return [[x1, y1], [x2, y1], [x1, y2], [x2, y2]];
  }

  collision([ax1, ax2, ay1, ay2], [bx1, bx2, by1, by2]) {
    return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
  }

  isIn(x, y) {
    if (this.died) return false;
    return this.collision(this.aabb(), this.aabb(x, y));
  }

  isInSmaller(x, y) {
    if (this.died) return false;
    return this.collision(this.smallerAabb(), this.aabb(x, y));
  }

  targetBy(dx, dy) {
    if (this.died) return;
    this.lastAngle = Math.atan2(dx, dy);
    const clamp = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);
    this.direction = [clamp(dx), clamp(dy)];
  }

  moveStop() {
    this.direction = [0, 0];
  }

  moveUp() {
    this.targetBy(0, -1);
  }

  moveDown() {
    this.targetBy(0, 1);
  }

  moveLeft() {
    this.targetBy(-1, 0);
  }

  moveRight() {
    this.targetBy(1, 0);
  }

  canDropBomb() {
    return !this.died && this.bombsUsed < this.bombsLimit;
  }

  die() {
    this.died = Date.now();
  }

  gridPosition() {
    return [(this.x + 0.5) | 0, (this.y + 0.5) | 0];
  }
}
