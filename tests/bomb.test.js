import { describe, test, expect } from 'bun:test';
import { Bomb } from '../src/bomb.js';

describe('Bomb', () => {
  test('snaps position to grid', () => {
    const bomb = new Bomb(2.7, 3.6);
    expect(bomb.x).toBe(3);
    expect(bomb.y).toBe(4);
  });

  test('snaps render position to grid center', () => {
    const bomb = new Bomb(2.7, 3.6);
    expect(bomb.rx).toBe(3);
    expect(bomb.ry).toBe(4);
  });

  test('starts in CREATED state', () => {
    const bomb = new Bomb(0, 0);
    expect(bomb.state).toBe(Bomb.CREATED);
  });

  test('plant changes state to EXPLODING', () => {
    const bomb = new Bomb(0, 0);
    bomb.plant();
    expect(bomb.state).toBe(Bomb.EXPLODING);
    expect(bomb.planted).not.toBeNull();
  });

  test('explode changes state to EXPLODED', () => {
    const bomb = new Bomb(0, 0);
    bomb.plant();
    expect(bomb.explode()).toBe(true);
    expect(bomb.state).toBe(Bomb.EXPLODED);
  });

  test('cannot explode twice', () => {
    const bomb = new Bomb(0, 0);
    bomb.plant();
    bomb.explode();
    expect(bomb.explode()).toBe(false);
  });

  test('explode decrements owner bombsUsed', () => {
    const owner = { bombsUsed: 1 };
    const bomb = new Bomb(0, 0, 1, owner);
    bomb.plant();
    bomb.explode();
    expect(owner.bombsUsed).toBe(0);
  });
});

describe('Bomb Kick', () => {
  test('starts stationary', () => {
    const bomb = new Bomb(5, 5);
    expect(bomb.isMoving()).toBe(false);
    expect(bomb.vx).toBe(0);
    expect(bomb.vy).toBe(0);
  });

  test('kick sets velocity', () => {
    const bomb = new Bomb(5, 5);
    bomb.kick(1, 0);
    expect(bomb.isMoving()).toBe(true);
    expect(bomb.vx).toBe(8);
    expect(bomb.vy).toBe(0);
  });

  test('kick with custom speed', () => {
    const bomb = new Bomb(5, 5);
    bomb.kick(0, -1, 10);
    expect(bomb.vy).toBe(-10);
  });

  test('stop halts movement and snaps to grid', () => {
    const bomb = new Bomb(5.3, 5.7);
    bomb.kick(1, 0);
    bomb.stop();
    expect(bomb.isMoving()).toBe(false);
    expect(bomb.x).toBe(5);
    expect(bomb.y).toBe(6);
    expect(bomb.rx).toBe(5);
    expect(bomb.ry).toBe(6);
  });

  test('update moves bomb', () => {
    const bomb = new Bomb(5, 5);
    bomb.kick(1, 0);
    const world = { isBlocked: () => false, hasBomb: () => false, hasItem: () => false, hasPlayer: () => false };
    bomb.update(0.1, world);
    expect(bomb.rx).toBeGreaterThan(5);
  });

  test('update stops at wall', () => {
    const bomb = new Bomb(5, 5);
    bomb.kick(1, 0);
    const world = { isBlocked: (x) => x >= 6, hasBomb: () => false, hasItem: () => false, hasPlayer: () => false };
    bomb.update(0.5, world);
    expect(bomb.isMoving()).toBe(false);
  });

  test('update stops at another bomb', () => {
    const bomb = new Bomb(5, 5);
    const otherBomb = new Bomb(6, 5);
    bomb.kick(1, 0);
    const world = { isBlocked: () => false, hasBomb: (x, y) => x === 6 && y === 5 ? otherBomb : false, hasItem: () => false };
    // Move in small steps to reach grid 6
    bomb.update(0.1, world);
    bomb.update(0.1, world);
    expect(bomb.isMoving()).toBe(false);
  });

  test('update stops at item', () => {
    const bomb = new Bomb(5, 5);
    bomb.kick(1, 0);
    const world = { isBlocked: () => false, hasBomb: () => false, hasItem: (x, y) => x === 6 && y === 5, hasPlayer: () => false };
    bomb.update(0.1, world);
    bomb.update(0.1, world);
    expect(bomb.isMoving()).toBe(false);
  });

  test('update stops at player', () => {
    const bomb = new Bomb(5, 5);
    bomb.kick(1, 0);
    const world = { isBlocked: () => false, hasBomb: () => false, hasItem: () => false, hasPlayer: (x, y) => x === 6 && y === 5 };
    bomb.update(0.1, world);
    bomb.update(0.1, world);
    expect(bomb.isMoving()).toBe(false);
  });
});
