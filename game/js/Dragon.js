import { GAME_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';

export class Dragon {
  constructor(cartY, speed = 5) {
    this.width = 1300;
    this.height = 300;
    this.active = true;

    // Stationary — centered horizontally and vertically on screen
    this.x = (GAME_CONFIG.CANVAS_WIDTH - this.width) / 2;
    this.y = (GAME_CONFIG.CANVAS_HEIGHT - this.height) / 2;

    this._animator = assetManager.createAnimator('dragon');
    if (this._animator) this._animator.setLoop(false);  // Single play

    this._killed = false;

    // Hold the final frame after animation ends for dramatic lingering effect
    this._holdTimer = 0;
    this._holdDuration = 500; // ms — 龙炎余韵停留时间
    this._animFinished = false;
  }

  update(deltaTime, game) {
    if (!this.active) return;

    // Animation phase: play at 1/4 speed for dramatic pacing
    if (!this._animFinished) {
      if (this._animator && this._animator.isActive) {
        // 前半段稍快（出场），后半段极慢（爆发），制造蓄力→爆发的节奏
        const progress = this._animator._currentIndex / Math.max(this._animator.frameCount, 1);
        const speedFactor = progress < 0.3 ? 0.3 : 0.15; // 出场30%速度，爆发15%速度
        this._animator.update(deltaTime * speedFactor);
      }

      // Animation just finished — begin hold phase
      if (!this._animator || !this._animator.isActive) {
        this._animFinished = true;
        this._holdTimer = 0;
      }
    }

    // Hold phase: accumulate timer for fade-out
    if (this._animFinished) {
      this._holdTimer += deltaTime;
      if (this._holdTimer >= this._holdDuration) {
        this.active = false;
      }
    }

    // Kill all zombies on first frame
    if (!this._killed) {
      this._killed = true;
      this._hitAllZombies(game);
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

    // Fade-out alpha during hold phase: 1 → 0 over _holdDuration
    let alpha = 1;
    if (this._animFinished) {
      alpha = Math.max(0, 1 - this._holdTimer / this._holdDuration);
    }

    // Flip horizontally — original GIF faces left, need facing right
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x + this.width, this.y);
    ctx.scale(-1, 1);
    ctx.drawImage(frame, 0, 0, this.width, this.height);
    ctx.restore();
  }
}
