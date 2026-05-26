import { assetManager } from './AssetManager.js';

export class SlashEffect {
  constructor(x, y, w, h, isPassive = true) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.isPassive = isPassive;
    this.active = true;
    this.life = 0;
    this.maxLife = isPassive ? 2100 : 200;
    this.angles = isPassive ? [] : [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
    if (!isPassive) {
      const cx = x + w / 2, cy = y + h / 2;
      this.trails = [{
        x: cx,
        y: cy,
        angle: Math.PI / 4,
        alpha: 1
      }];
    }
  }

  update(deltaTime) {
    this.life += deltaTime;
    if (this.life >= this.maxLife) {
      this.active = false;
    }
  }

  render(ctx) {
    const progress = this.life / this.maxLife;
    const alpha = 1 - progress;
    const slashImg = assetManager.getImage('visitor_slash');

    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.isPassive && slashImg) {
      ctx.drawImage(slashImg, this.x, this.y, this.w, this.h);
    } else if (!this.isPassive && slashImg && this.trails) {
      for (const t of this.trails) {
        ctx.save();
        ctx.globalAlpha = alpha * t.alpha;
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle);
        const sz = Math.min(this.w, this.h) * 0.6;
        ctx.drawImage(slashImg, -sz / 2, -sz / 2, sz, sz);
        ctx.restore();
      }
    } else {
      const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      if (this.isPassive) {
        ctx.beginPath();
        ctx.moveTo(this.x, cy);
        ctx.lineTo(this.x + this.w, cy + this.h * 0.3);
        ctx.moveTo(this.x + this.w, cy);
        ctx.lineTo(this.x, cy + this.h * 0.3);
        ctx.stroke();
      } else {
        for (const t of this.trails) {
          ctx.beginPath();
          ctx.moveTo(t.x - 10, t.y - 15);
          ctx.lineTo(t.x + 10, t.y + 15);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
}
