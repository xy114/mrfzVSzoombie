import { assetManager } from './AssetManager.js';
import { GifAnimator } from './GifAnimator.js';
import { drawPea, drawWishadelPea, drawFirePea, drawFireExplosion } from './ProjectileRenderer.js';

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
    this._animator = assetManager.createAnimator('pea');
  }

  update(deltaTime) {
    if (this._animator) this._animator.update(deltaTime);
    this.x += this.speed * (deltaTime / 16);
  }

  render(ctx) {
    if (this._animator) {
      const frame = this._animator.getCurrentCanvas();
      ctx.drawImage(frame, this.x, this.y, this.width, this.height);
      return;
    }
    const img = assetManager.getImage('pea');
    if (img) {
      ctx.drawImage(img, this.x, this.y, 20, 20);
    } else {
      drawPea(ctx, this.x + 10, this.y + 10, 10);
    }
  }
}

// Wishadel normal attack — 70% size shell image, direct hit
export class WishadelPea {
  constructor(x, y, row, damage = 25, speed = 6) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.speed = speed;
    this.damage = damage;
    this.damageType = 'physical';
    this.width = 21;
    this.height = 11;
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
      hit.takeDamage(this.damage, this.damageType);
    }
  }

  render(ctx) {
    const img = assetManager.getImage('peashooter_skin_wishadel_shell');
    if (img) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      drawWishadelPea(ctx, this.x, this.y, this.width, this.height);
    }
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
    this.damageType = 'physical';
    this.width = 51;
    this.height = 26;
    this.active = true;
    this.exploded = false;
    this.skipCollisionCheck = true;
    this.target = target;
    this._targetX = target ? target.x + target.width / 2 : x;
    this._targetY = target ? target.y + target.height / 2 : y;
    this._explosionStage = 0; // 0=flight, 1=flash, 2=shockwave, 3=afterglow
    this._stageTimer = 0;
  }

  update(deltaTime, game) {
    if (this.exploded) {
      this._stageTimer -= deltaTime;
      if (this._stageTimer <= 0) {
        this._explosionStage++;
        if (this._explosionStage === 1) {
          this._stageTimer = 300; // Flash: 300ms
        } else if (this._explosionStage === 2) {
          this._stageTimer = 450; // Shockwave: 450ms
        } else if (this._explosionStage === 3) {
          this._stageTimer = 500; // Afterglow: 500ms
        } else {
          this.active = false;
        }
      }
      return;
    }

    // Track target position (alive or dead)
    if (this.target && this.target.alive) {
      this._targetX = this.target.x + this.target.width / 2;
      this._targetY = this.target.y + this.target.height / 2;
    }

    // Fly toward tracked position
    const dx = this._targetX - (this.x + this.width / 2);
    const dy = this._targetY - (this.y + this.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 20 || this.x > game.canvas.width + 100) {
      // Reached destination or off-screen — explode
      this.explode(game);
    } else {
      const step = this.speed * (deltaTime / 16);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  explode(game) {
    this.exploded = true;
    this._explosionStage = 1;
    this._stageTimer = 300;

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
    const img = assetManager.getImage('peashooter_skin_wishadel_shell');
    ctx.save();
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    // Rotate toward target
    const angle = Math.atan2(this._targetY - cy, this._targetX - cx);
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
      const progress = 1 - this._stageTimer / 300;
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
      const progress = this._stageTimer / 450; // 1 → 0
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
      const progress = this._stageTimer / 500;
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

// Fire Pea skill bullet — explodes on hit, AoE 3×3 cells
export class FirePeaBullet {
  constructor(x, y, row, damage = 50, speed = 4.5) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.speed = speed;
    this.damage = damage;
    this.damageType = 'magic';
    this.width = 22;
    this.height = 22;
    this.active = true;
    this.exploded = false;
    this._explosionTimer = 0;
    this._explosionR = 0;
    this._maxExplosionR = 80;
    this.skipCollisionCheck = true;
    this._animator = assetManager.createAnimator('firePea');
  }

  update(deltaTime, game) {
    if (this._animator) this._animator.update(deltaTime);
    if (this.exploded) {
      this._explosionTimer -= deltaTime;
      this._explosionR += (this._maxExplosionR - this._explosionR) * 0.15;
      if (this._explosionTimer <= 0) {
        this.active = false;
      }
      return;
    }

    this.x += this.speed * (deltaTime / 16);
    if (this.x > game.canvas.width + 30) {
      this.active = false;
      return;
    }

    // Hit detection — same row zombie with proximity check
    const hit = game.zombies.find(z =>
      z.alive && z.row === this.row &&
      Math.abs(z.x + z.width / 2 - (this.x + this.width / 2)) < 30
    );
    if (hit) {
      this.explode(game);
    }
  }

  explode(game) {
    this.exploded = true;
    this._explosionTimer = 350;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const sc = game.lawn.standardCell;
    const cellSize = Math.max(sc.w, sc.h);

    // 3×3 cell AoE
    const hitSet = new Set();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const row = this.row + dr;
        const tgtCol = Math.floor(cx / cellSize) + dc;
        for (const z of game.zombies) {
          if (hitSet.has(z)) continue;
          if (z.alive && z.row === row) {
            const zCol = Math.floor((z.x + z.width / 2) / cellSize);
            if (Math.abs(zCol - tgtCol) <= 1) {
              hitSet.add(z);
              const dist = Math.sqrt(
                (z.x + z.width / 2 - cx) ** 2 +
                (z.y + z.height / 2 - cy) ** 2
              );
              const falloff = Math.max(0.4, 1 - dist / (cellSize * 2));
              z.takeDamage(Math.floor(this.damage * falloff), 'magic');
            }
          }
        }
      }
    }
  }

  render(ctx) {
    if (this.exploded) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      const alpha = Math.max(0, this._explosionTimer / 350);
      drawFireExplosion(ctx, cx, cy, this._explosionR, alpha);
      return;
    }
    if (this._animator) {
      const frame = this._animator.getCurrentCanvas();
      ctx.drawImage(frame, this.x - 3, this.y - 3, this.width + 6, this.height + 6);
      return;
    }
    const img = assetManager.getImage('firePea');
    if (img) {
      const dw = this.width + 6;
      const dh = this.height + 6;
      ctx.drawImage(img, this.x - 3, this.y - 3, dw, dh);
    } else {
      drawFirePea(ctx, this.x + this.width / 2, this.y + this.height / 2, 12);
    }
  }
}
