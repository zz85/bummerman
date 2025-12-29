import { describe, test, expect } from 'bun:test';
import { Game } from '../src/game.js';

describe('Game', () => {
  test('starts in START state', () => {
    const game = new Game();
    expect(game.state).toBe(Game.STATE.START);
  });

  test('has default config', () => {
    const game = new Game();
    expect(game.config.players).toBe(2);
    expect(game.config.bots).toBe(2);
    expect(game.config.gridSize).toBe(15);
  });

  test('setOption updates config', () => {
    const game = new Game();
    game.setOption('players', 4);
    expect(game.config.players).toBe(4);
  });

  test('cycleOption cycles through values', () => {
    const game = new Game();
    game.config.players = 2;
    expect(game.cycleOption('players', [2, 3, 4])).toBe(3);
    expect(game.cycleOption('players', [2, 3, 4])).toBe(4);
    expect(game.cycleOption('players', [2, 3, 4])).toBe(2);
  });

  test('start transitions to PLAYING', () => {
    const game = new Game();
    expect(game.start()).toBe(true);
    expect(game.state).toBe(Game.STATE.PLAYING);
  });

  test('cannot start when not in START state', () => {
    const game = new Game();
    game.start();
    expect(game.start()).toBe(false);
  });

  test('end transitions to GAMEOVER', () => {
    const game = new Game();
    game.start();
    expect(game.end('Player 1')).toBe(true);
    expect(game.state).toBe(Game.STATE.GAMEOVER);
    expect(game.winner).toBe('Player 1');
  });

  test('end tracks scores', () => {
    const game = new Game();
    game.start();
    game.end('Player 1');
    expect(game.scores['Player 1']).toBe(1);

    game.restart();
    game.start();
    game.end('Player 1');
    expect(game.scores['Player 1']).toBe(2);
  });

  test('restart returns to START state', () => {
    const game = new Game();
    game.start();
    game.end();
    game.restart();
    expect(game.state).toBe(Game.STATE.START);
  });

  test('getStartScreenText includes config', () => {
    const game = new Game();
    const text = game.getStartScreenText();
    expect(text).toContain('BUMMERMAN');
    expect(text).toContain('Players: 2');
    expect(text).toContain('Bots: 2');
    expect(text).toContain('Grid: 15x15');
  });

  test('getGameOverText shows winner', () => {
    const game = new Game();
    game.start();
    game.end('Player 1');
    const text = game.getGameOverText();
    expect(text).toContain('Player 1 won');
  });

  test('getGameOverText shows draw', () => {
    const game = new Game();
    game.start();
    game.end(null);
    const text = game.getGameOverText();
    expect(text).toContain('Draw');
  });
});
