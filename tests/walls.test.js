import { describe, test, expect } from 'bun:test';
import { Walls } from '../src/walls.js';
import { WALL } from '../src/config.js';

describe('Walls', () => {
  test('creates grid with correct dimensions', () => {
    const walls = new Walls(15, 15);
    expect(walls.columns).toBe(15);
    expect(walls.rows).toBe(15);
    expect(walls.cells.length).toBe(225);
  });

  test('get/set works correctly', () => {
    const walls = new Walls(5, 5);
    walls.set(2, 3, WALL.HARD);
    expect(walls.get(2, 3)).toBe(WALL.HARD);
    expect(walls.get(0, 0)).toBe(WALL.EMPTY);
  });

  test('index converts x,y to array index', () => {
    const walls = new Walls(10, 10);
    expect(walls.index(0, 0)).toBe(0);
    expect(walls.index(5, 0)).toBe(5);
    expect(walls.index(0, 1)).toBe(10);
    expect(walls.index(3, 2)).toBe(23);
  });

  test('coords converts index to x,y', () => {
    const walls = new Walls(10, 10);
    expect(walls.coords(0)).toEqual([0, 0]);
    expect(walls.coords(5)).toEqual([5, 0]);
    expect(walls.coords(10)).toEqual([0, 1]);
    expect(walls.coords(23)).toEqual([3, 2]);
  });

  test('blow destroys soft walls', () => {
    const walls = new Walls(5, 5);
    walls.set(2, 2, WALL.SOFT);
    expect(walls.blow(2, 2)).toBe(true);
    expect(walls.get(2, 2)).toBe(WALL.EMPTY);
  });

  test('blow does not destroy hard walls', () => {
    const walls = new Walls(5, 5);
    walls.set(2, 2, WALL.HARD);
    expect(walls.blow(2, 2)).toBe(undefined);
    expect(walls.get(2, 2)).toBe(WALL.HARD);
  });

  test('emptyWalls creates border only', () => {
    const walls = new Walls(5, 5);
    walls.emptyWalls();
    // corners and edges should be hard walls
    expect(walls.get(0, 0)).toBe(WALL.HARD);
    expect(walls.get(4, 4)).toBe(WALL.HARD);
    expect(walls.get(0, 2)).toBe(WALL.HARD);
    // center should be empty
    expect(walls.get(2, 2)).toBe(WALL.EMPTY);
  });

  test('forEach iterates all cells', () => {
    const walls = new Walls(3, 3);
    let count = 0;
    walls.forEach(() => count++);
    expect(count).toBe(9);
  });
});
