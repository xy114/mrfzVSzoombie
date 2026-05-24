import { SUN_CONFIG } from './constants.js';
import { drawSun } from './ProjectileRenderer.js';

export class Sun {
  constructor(x, y, targetY) {
    this.x = x;
    this.y = y;
    this.targetY = targetY;
    this.width = 40;
    this.height = 40;
    this.active = true;
    this.lifetime = 10000;
    this.timer = 0;
    this.falling = true;
    this.speed = 1.5;
    this.dimStart = 2000;
    this.alpha = 1;
  }

  update(deltaTime) {
    this.timer += deltaTime;

    if (this.falling) {
      this.y += this.speed;
      if (this.y >= this.targetY) {
        this.falling = false;
      }
    }

    if (this.timer >= this.dimStart && this.timer < this.lifetime) {
      const dimProgress = (this.timer - this.dimStart) / 3000;
      this.alpha = Math.max(0.3, 1 - dimProgress);
    }

    if (this.timer >= this.lifetime) {
      this.active = false;
    }
  }

  collect() {
    this.active = false;
    return SUN_CONFIG.SUN_VALUE;
  }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    drawSun(ctx, this.x + 20, this.y + 20, 18);
    ctx.restore();
  }
}
