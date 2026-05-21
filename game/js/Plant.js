import { GAME_CONFIG } from './constants.js';

export class Plant {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = GAME_CONFIG.CELL_WIDTH;
    this.height = GAME_CONFIG.CELL_HEIGHT;
    this.health = 100;
    this.maxHealth = 100;
    this.alive = true;
  }

  update(deltaTime, game) {
  }

  render(ctx) {
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.alive = false;
    }
  }
}