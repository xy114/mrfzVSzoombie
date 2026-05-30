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
      ctx.drawImage(frame, this.x, this.y + 7, this.width * 2.6, this.height * 2);
      return;
    }
    const img = assetManager.getImage('pea');
    if (img) {
      ctx.drawImage(img, this.x, this.y + 7, this.width * 2.6, this.height * 2);
    } else {
      drawPea(ctx, this.x + this.width, this.y + 7 + this.height, this.width);
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
    const img = assetManager.getImage('peashooter_skin_wishadel_pea');
    const dw = this.width * 4;
    const dh = this.height * 4;
    if (img) {
      ctx.drawImage(img, this.x, this.y + 10, dw, dh);
    } else {
      drawWishadelPea(ctx, this.x, this.y + 10, dw, dh);
    }
  }
}

// Wishadel skill — homing missile with GIF explosion
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
    this._explosionAnimator = null;
    this._hitZombies = null;
  }

  update(deltaTime, game) {
    if (this.exploded) {
      if (this._explosionAnimator) {
        this._explosionAnimator.update(deltaTime);
        if (!this._explosionAnimator.isActive) {
          // Release deferred death effects
          if (this._hitZombies) {
            for (const z of this._hitZombies) {
              z._deathDeferred = false;
            }
          }
          this.active = false;
        }
      } else {
        this.active = false;
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
      this.explode(game);
    } else {
      const step = this.speed * (deltaTime / 16);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  explode(game) {
    this.exploded = true;
    this._explosionAnimator = assetManager.createAnimator('explosion');
    if (this._explosionAnimator) this._explosionAnimator.setLoop(false);

    // Register on top-layer explosion list (rendered at sun level)
    if (game.wishadelExplosions) game.wishadelExplosions.push(this);

    this._hitZombies = [];

    const sc = game.lawn.standardCell;
    const cellSize = Math.max(sc.w, sc.h);
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    // 21-cell area (5x5 minus corners)
    const hitSet = new Set();
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
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
              if (!z.alive) {
                z._deathDeferred = true;
                this._hitZombies.push(z);
              }
            }
          }
        }
      }
    }
  }

  render(ctx) {
    // Explosion rendered at top layer (sun level) via game.wishadelExplosions
    if (this.exploded) return;

    // Missile image — wisdel-missle-ps
    const img = assetManager.getImage('wisdel_missle_ps');
    ctx.save();
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const angle = Math.atan2(this._targetY - cy, this._targetX - cx) - Math.PI / 6; // CCW 30° offset
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(-1, 1); // Flip horizontally — missile faces travel direction
    const dw = this.width * 3;
    const dh = this.height * 3;
    if (img) {
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    } else {
      drawWishadelPea(ctx, -dw / 2, -dh / 2, dw, dh);
    }
    ctx.restore();
  }

  renderExplosion(ctx) {
    if (!this._explosionAnimator) return;
    const frame = this._explosionAnimator.getCurrentCanvas();
    if (!frame) return;
    const nw = this._explosionAnimator.naturalWidth;
    const nh = this._explosionAnimator.naturalHeight;
    const scale = Math.min(560 / nw, 560 / nh);
    const dw = nw * scale;
    const dh = nh * scale;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    ctx.drawImage(frame, cx - dw / 2, cy - dh / 2, dw, dh);
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
      ctx.drawImage(frame, this.x - this.width * 0.15, this.y + 7 - this.height * 0.15, this.width * 2.6 + 6, this.height * 2 + 6);
      return;
    }
    const img = assetManager.getImage('firePea');
    if (img) {
      const dw = this.width * 2.6 + 6;
      const dh = this.height * 2 + 6;
      ctx.drawImage(img, this.x - this.width * 0.15, this.y + 7 - this.height * 0.15, dw, dh);
    } else {
      drawFirePea(ctx, this.x + this.width, this.y + 7 + this.height, this.width);
    }
  }
}
