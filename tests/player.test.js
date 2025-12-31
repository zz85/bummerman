import { describe, test, expect } from 'bun:test';
import { Player } from '../src/player.js';

describe('Player', () => {
  test('initializes at given position', () => {
    const player = new Player(5, 7, 'Test');
    expect(player.x).toBe(5);
    expect(player.y).toBe(7);
    expect(player.name).toBe('Test');
  });

  test('starts with default stats', () => {
    const player = new Player(0, 0);
    expect(player.bombsLimit).toBe(1);
    expect(player.bombStrength).toBe(1);
    expect(player.bombsUsed).toBe(0);
  });

  test('gridPosition snaps to nearest cell', () => {
    const player = new Player(2.7, 3.6);
    expect(player.gridPosition()).toEqual([3, 4]);
  });

  test('movement directions', () => {
    const player = new Player(0, 0);
    player.moveUp();
    expect(player.direction).toEqual([0, -1]);
    player.moveDown();
    expect(player.direction).toEqual([0, 1]);
    player.moveLeft();
    expect(player.direction).toEqual([-1, 0]);
    player.moveRight();
    expect(player.direction).toEqual([1, 0]);
    player.moveStop();
    expect(player.direction).toEqual([0, 0]);
  });

  test('canDropBomb checks limits', () => {
    const player = new Player(0, 0);
    expect(player.canDropBomb()).toBe(true);
    player.bombsUsed = 1;
    expect(player.canDropBomb()).toBe(false);
  });

  test('dead player cannot drop bombs', () => {
    const player = new Player(0, 0);
    player.die();
    expect(player.canDropBomb()).toBe(false);
  });

  test('aabb returns bounding box', () => {
    const player = new Player(2, 3);
    const [x1, x2, y1, y2] = player.aabb();
    expect(x1).toBe(2);
    expect(x2).toBe(3);
    expect(y1).toBe(3);
    expect(y2).toBe(4);
  });

  test('collision detection', () => {
    const player = new Player(0, 0);
    expect(player.collision([0, 1, 0, 1], [0.5, 1.5, 0.5, 1.5])).toBe(true);
    expect(player.collision([0, 1, 0, 1], [2, 3, 2, 3])).toBe(false);
  });

  test('hasKick returns canKick state', () => {
    const player = new Player(0, 0);
    expect(player.hasKick()).toBe(false);
    player.canKick = true;
    expect(player.hasKick()).toBe(true);
  });
});
