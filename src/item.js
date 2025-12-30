export class Item {
  static SPEED_UP = 0;
  static BOMBS_UP = 1;
  static FIRE_UP = 2;
  static KICK = 3;

  constructor(x, y, type = Item.SPEED_UP) {
    this.x = x;
    this.y = y;
    this.type = type;
  }
}
