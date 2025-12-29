export class World {
  constructor() {
    this.objects = new Set();
    this.bombs = new Set();
    this.flumes = new Set();
    this.items = new Set();
    this.players = new Set();
    this.map = null;
  }

  add(item) {
    this.objects.add(item);
  }

  remove(item) {
    this.objects.delete(item);
  }

  addBomb(bomb) {
    this.bombs.add(bomb);
    this.add(bomb);
  }

  removeBomb(bomb) {
    this.bombs.delete(bomb);
    this.remove(bomb);
  }

  addItem(item) {
    this.items.add(item);
    this.add(item);
  }

  removeItem(item) {
    this.items.delete(item);
    this.remove(item);
  }

  addPlayer(player) {
    player.world = this;
    this.players.add(player);
    this.add(player);
  }

  removePlayer(player) {
    this.players.delete(player);
    this.remove(player);
  }

  addFlumes(flumes) {
    this.flumes.add(flumes);
    this.add(flumes);
  }

  removeFlumes(flumes) {
    this.flumes.delete(flumes);
    this.remove(flumes);
  }

  setMap(map) {
    if (this.map) this.remove(this.map);
    this.map = map;
    this.add(map);
  }

  isBlocked(x, y) {
    return this.map ? !!this.map.get(x, y) : false;
  }

  hasBomb(x, y) {
    for (let bomb of this.bombs) {
      if (bomb.x === x && bomb.y === y) return bomb;
    }
    return false;
  }

  hasItem(x, y) {
    for (let item of this.items) {
      if (item.x === x && item.y === y) return item;
    }
    return null;
  }

  hasPlayer(x, y) {
    for (let player of this.players) {
      if (player.collision(player.smallerAabb(), player.aabb(x, y))) {
        return player;
      }
    }
    return null;
  }

  getAlivePlayers() {
    return [...this.players].filter((p) => !p.died);
  }
}
