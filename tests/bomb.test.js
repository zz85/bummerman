import { describe, test, expect } from 'bun:test';
import { Bomb } from '../src/bomb.js';

describe('Bomb', () => {
  test('snaps position to grid', () => {
    const bomb = new Bomb(2.7, 3.6);
    expect(bomb.x).toBe(3);
    expect(bomb.y).toBe(4);
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
