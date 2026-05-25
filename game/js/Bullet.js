import { assetManager } from './AssetManager.js';
import { drawPea, drawWishadelPea } from './ProjectileRenderer.js';

export class Bullet {
  constructor(x, y, row, damage = 20) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.speed = 5;
    this.damage = damage;
    this.damageType = 'physical';
    this.width = 20;
    this.height = 20;
    this.active = true;
  }

  update(deltaTime) {
    this.x += this.speed * (deltaTime / 16);
  }

  render(ctx) {
    const img = assetManager.getImage('pea');
    if (img) {
      ctx.drawImage(img, this.x, this.y, 20, 20);
    } else {
      drawPea(ctx, this.x + 10, this.y + 10, 10);
    }
  }
}

// Wishadel normal attack — purple-red shell, direct hit
export class WishadelPea {
  constructor(x, y, row, damage = 25, speed = 6) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.speed = speed;
    this.damage = damage;
    this.damageType = 'magic';
    this.width = 30;
    this.height = 16;
    this.active = true;
    this.skipCollisionCheck = true;
  }

  update(deltaTime, game) {
    this.x += this.speed * (deltaTime / 16);
    if (this.x > game.canvas.width) {
      this.active = false;
      return;
    }
    const hit = game.zombies.find(z =>
      z.alive && z.row === this.row &&
      Math.abs(z.x + z.width / 2 - (this.x + this.width / 2)) < 35
    );
    if (hit) {
      this.active = false;
      hit.takeDamage(this.damage, 'magic');
    }
  }

  render(ctx) {
    drawWishadelPea(ctx, this.x, this.y, this.width, this.height);
  }
}

// Wishadel skill — homing cannonball, 21-cell thermobaric explosion, 3-stage animation
export class WishadelShell {
  constructor(x, y, row, target, damage = 120, speed = 12) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.speed = speed;
    this.damage = damage;
    this.damageType = 'magic';
    this.width = 30;
    this.height = 15;
    this.active = true;
    this.exploded = false;
    this.skipCollisionCheck = true;
    this.target = target;
    this._explosionStage = 0; // 0=flight, 1=flash, 2=shockwave, 3=afterglow
    this._stageTimer = 0;
  }

  update(deltaTime, game) {
    if (this.exploded) {
      this._stageTimer -= deltaTime;
      if (this._stageTimer <= 0) {
        this._explosionStage++;
        if (this._explosionStage === 1) {
          this._stageTimer = 100; // Flash: 100ms
        } else if (this._explosionStage === 2) {
          this._stageTimer = 250; // Shockwave: 250ms
        } else if (this._explosionStage === 3) {
          this._stageTimer = 300; // Afterglow: 300ms
        } else {
          this.active = false;
        }
      }
      return;
    }

    // Home toward target
    if (this.target && this.target.alive) {
      const tx = this.target.x + this.target.width / 2;
      const ty = this.target.y + this.target.height / 2;
      const dx = tx - (this.x + this.width / 2);
      const dy = ty - (this.y + this.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const step = this.speed * (deltaTime / 16);
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }
    } else {
      // Target lost, fly straight
      this.x += this.speed * (deltaTime / 16);
    }

    // Hit detection
    const hit = game.zombies.find(z =>
      z.alive &&
      Math.abs(z.x + z.width / 2 - (this.x + this.width / 2)) < 35 &&
      Math.abs(z.y + z.height / 2 - (this.y + this.height / 2)) < 50
    );
    if (hit || this.x > game.canvas.width + 100) {
      this.explode(game);
    }
  }

  explode(game) {
    this.exploded = true;
    this._explosionStage = 1;
    this._stageTimer = 100;

    const sc = game.lawn.standardCell;
    const cellSize = Math.max(sc.w, sc.h);
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    // 21-cell area (5x5 minus corners)
    const hitSet = new Set();
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        // Skip 4 corners
        if ((dr === -2 || dr === 2) && (dc === -2 || dc === 2)) continue;
        const row = this.row + dr;
        const tgtCol = Math.floor(cx / 100) + dc;
        for (const z of game.zombies) {
          if (hitSet.has(z)) continue;
          if (z.alive && z.row === row) {
            const zCol = Math.floor((z.x + z.width / 2) / 100);
            if (Math.abs(zCol - tgtCol) <= 1) {
              hitSet.add(z);
              z.takeDamage(this.damage, 'magic');
              z._pauseTimer = 150;
            }
          }
        }
      }
    }
  }

  render(ctx) {
    if (this.exploded) {
      this._renderExplosion(ctx);
      return;
    }
    // Cannonball image
    const img = assetManager.getImage('wishadel_shell');
    ctx.save();
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    // Rotate toward target
    let angle = 0;
    if (this.target && this.target.alive) {
      const tx = this.target.x + this.target.width / 2;
      const ty = this.target.y + this.target.height / 2;
      angle = Math.atan2(ty - cy, tx - cx);
    }
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    if (img) {
      ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      drawWishadelPea(ctx, -this.width / 2, -this.height / 2, this.width, this.height);
    }
    ctx.restore();
  }

  _renderExplosion(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    ctx.save();
    if (this._explosionStage === 1) {
      // Stage 1: White flash at core
      const progress = 1 - this._stageTimer / 100;
      const r = 10 + progress * 40;
      const alpha = 1 - progress * 0.5;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
      grad.addColorStop(0.3, `rgba(255,220,230,${alpha * 0.7})`);
      grad.addColorStop(0.7, 'rgba(200,0,60,0.3)');
      grad.addColorStop(1, 'rgba(100,0,30,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (this._explosionStage === 2) {
      // Stage 2: Purple-red shockwave expanding outward
      const progress = this._stageTimer / 250; // 1 → 0
      const r = 30 + (1 - progress) * 130;
      const alpha = progress;
      const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
      grad.addColorStop(0, `rgba(255,230,240,${alpha * 0.4})`);
      grad.addColorStop(0.15, `rgba(240,60,110,${alpha * 0.7})`);
      grad.addColorStop(0.4, `rgba(180,20,70,${alpha * 0.8})`);
      grad.addColorStop(0.7, `rgba(120,10,40,${alpha * 0.5})`);
      grad.addColorStop(1, 'rgba(60,0,20,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Secondary ring
      const r2 = r * 0.65;
      ctx.strokeStyle = `rgba(255,140,180,${alpha * 0.7})`;
      ctx.lineWidth = 4 * alpha;
      ctx.beginPath();
      ctx.arc(cx, cy, r2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this._explosionStage === 3) {
      // Stage 3: Afterglow — fading purple-red haze
      const progress = this._stageTimer / 300;
      const r = 120 + (1 - progress) * 50;
      const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      grad.addColorStop(0, `rgba(200,40,80,${progress * 0.6})`);
      grad.addColorStop(0.4, `rgba(150,20,50,${progress * 0.4})`);
      grad.addColorStop(0.7, `rgba(80,10,25,${progress * 0.2})`);
      grad.addColorStop(1, 'rgba(30,0,10,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Flickering embers
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + progress * 2;
        const er = 15 + Math.random() * 20;
        const ex = cx + Math.cos(a) * (r * 0.3 + Math.random() * r * 0.5);
        const ey = cy + Math.sin(a) * (r * 0.3 + Math.random() * r * 0.5);
        ctx.fillStyle = `rgba(255,${60 + Math.random() * 80},${100 + Math.random() * 60},${progress * 0.7})`;
        ctx.beginPath();
        ctx.arc(ex, ey, er * progress, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
