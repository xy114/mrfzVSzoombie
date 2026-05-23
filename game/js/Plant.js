import { GAME_CONFIG } from './constants.js';

export class Plant {
  constructor(x, y, starLevel = 1) {
    this.x = x;
    this.y = y;
    this.width = GAME_CONFIG.CELL_WIDTH;
    this.height = GAME_CONFIG.CELL_HEIGHT;
    this.baseMaxHealth = 100;
    this.starLevel = starLevel;
    this.maxHealth = 100;
    this.health = 100;
    this.alive = true;
    this._doHealthScaling();
  }

  _doHealthScaling() {
    const mults = { 1: 1.0, 2: 1.25, 3: 1.6 };
    const m = mults[this.starLevel] || 1.0;
    this.maxHealth = Math.floor(this.baseMaxHealth * m);
    this.health = this.maxHealth;
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
