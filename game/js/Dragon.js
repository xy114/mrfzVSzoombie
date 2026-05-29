import { GAME_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';

export class Dragon {
  constructor(cartY, speed = 5) {
    this.width = 1300;
    this.height = 300;
    this.active = true;

    // Stationary — centered horizontally and vertically on screen
    this.x = (GAME_CONFIG.CANVAS_WIDTH - this.width) / 2 - 100;
    this.y = (GAME_CONFIG.CANVAS_HEIGHT - this.height) / 2;

    this._animator = assetManager.createAnimator('dragon');
    if (this._animator) this._animator.setLoop(false);  // Single play

    this._killed = false;
  }

  update(deltaTime, game) {
    if (!this.active) return;

    // Play at half speed
    if (this._animator) this._animator.update(deltaTime * 0.5);

    // Kill all zombies on first frame
    if (!this._killed) {
      this._killed = true;
      this._hitAllZombies(game);
    }

    // Deactivate when animation finishes
    if (!this._animator || !this._animator.isActive) {
      this.active = false;
    }
  }

  _hitAllZombies(game) {
    for (const z of game.zombies) {
      if (!z.alive || z._deathDeferred) continue;
      z.health = 0;
      z.alive = false;
      z._shouldSpawnDeathEffect = true;
    }
  }

  render(ctx) {
    if (!this.active || !this._animator) return;

    const frame = this._animator.getCurrentCanvas();
    if (!frame) return;

    // Flip horizontally — original GIF faces left, need facing right
    ctx.save();
    ctx.translate(this.x + this.width, this.y);
    ctx.scale(-1, 1);
    ctx.drawImage(frame, 0, 0, this.width, this.height);
    ctx.restore();
  }
}
