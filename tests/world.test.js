import { describe, test, expect } from 'bun:test';
import { World } from '../src/world.js';
import { Player } from '../src/player.js';
import { Bomb } from '../src/bomb.js';
import { Item } from '../src/item.js';
import { Walls } from '../src/walls.js';

describe('World', () => {
  test('adds and removes players', () => {
    const world = new World();
    const player = new Player(0, 0);
    world.addPlayer(player);
    expect(world.players.size).toBe(1);
    expect(player.world).toBe(world);
    world.removePlayer(player);
    expect(world.players.size).toBe(0);
  });

  test('adds and removes bombs', () => {
    const world = new World();
    const bomb = new Bomb(0, 0);
    world.addBomb(bomb);
    expect(world.bombs.size).toBe(1);
    world.removeBomb(bomb);
    expect(world.bombs.size).toBe(0);
  });

  test('adds and removes items', () => {
    const world = new World();
    const item = new Item(0, 0);
    world.addItem(item);
    expect(world.items.size).toBe(1);
    world.removeItem(item);
    expect(world.items.size).toBe(0);
  });

  test('hasBomb finds bomb at position', () => {
    const world = new World();
    const bomb = new Bomb(2.3, 3.7);
    world.addBomb(bomb);
    expect(world.hasBomb(2, 4)).toBe(bomb);
    expect(world.hasBomb(0, 0)).toBe(false);
  });

  test('hasItem finds item at position', () => {
    const world = new World();
    const item = new Item(5, 5);
    world.addItem(item);
    expect(world.hasItem(5, 5)).toBe(item);
    expect(world.hasItem(0, 0)).toBeNull();
  });

  test('isBlocked checks map', () => {
    const world = new World();
    const map = new Walls(5, 5);
    map.set(2, 2, 1);
    world.setMap(map);
    expect(world.isBlocked(2, 2)).toBe(true);
    expect(world.isBlocked(1, 1)).toBe(false);
  });

  test('map must be set before querying', () => {
    const world = new World();
    expect(world.map).toBeNull();
    expect(world.isBlocked(0, 0)).toBe(false);
  });

  test('getAlivePlayers filters dead players', () => {
    const world = new World();
    const p1 = new Player(0, 0, 'P1');
    const p2 = new Player(1, 1, 'P2');
    world.addPlayer(p1);
    world.addPlayer(p2);
    expect(world.getAlivePlayers().length).toBe(2);
    p1.die();
    expect(world.getAlivePlayers().length).toBe(1);
    expect(world.getAlivePlayers()[0].name).toBe('P2');
  });
});
