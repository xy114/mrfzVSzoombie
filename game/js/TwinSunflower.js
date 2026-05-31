import { Sunflower } from './Sunflower.js';
import { Sun } from './Sun.js';
import { assetManager } from './AssetManager.js';

export class TwinSunflower extends Sunflower {
  constructor(x, y, starLevel = 1, skinId = null) {
    super(x, y, starLevel, skinId);
    this.plantType = 'twinsunflower';
    this.baseMaxHealth = 200;
    this._doHealthScaling();
    this.sunInterval = 10000;
    this.sunTimer = 0;
    this._beamActive = false;
    this._beamTimer = 0;
    this._beamDamage = 0;
    this._beamTracker = 0;
    this._beamTickCount = 0;
    this.skillCooldown = 0;
    this.skillMaxCooldown = 15000;
    // Use own animator, not sunflower's
    this._animator = assetManager.createAnimator('twinsunflower');
  }

  update(deltaTime, game) {
    if (this.skillCooldown > 0) this.skillCooldown -= deltaTime;
    if (this._animator) this._animator.update(deltaTime);

    if (this._beamActive) {
      this._beamTimer -= deltaTime;
      this._beamTracker += deltaTime;
      if (this._beamTracker >= 1000 && this._beamTickCount < 3) {
        this._beamTracker -= 1000;
        this._beamTickCount++;
        for (const z of game.zombies) {
          if (z.alive && z.row === this.row) {
            z.takeDamage(this._beamDamage, 'magic');
          }
        }
      }
      if (this._beamTimer <= 0) {
        this._beamActive = false;
        this._beamTracker = 0;
        this._beamTickCount = 0;
      }
      return;
    }

    this.sunTimer += deltaTime;
    if (this.sunTimer >= this.sunInterval) {
      this.sunTimer = 0;
      this.produceTwinSuns(game);
    }
  }

  produceTwinSuns(game) {
    const sunX1 = this.x + this.width / 2 - 15;
    const sunX2 = this.x + this.width / 2 + 15;
    const startY = this.y - 30;
    const targetY = this.y + 20 + Math.random() * 30;
    game.addSun(new Sun(sunX1, startY, targetY));
    game.addSun(new Sun(sunX2, startY, targetY));
  }

  useSkill(game) {
    if (this.skillCooldown > 0 || this._beamActive) return false;
    this._beamActive = true;
    this._beamTimer = 3000;
    this._beamTracker = 0;
    this._beamTickCount = 0;
    this._beamDamage = Math.min(Math.floor(game.sun * 0.4), 200);
    this.skillCooldown = this.skillMaxCooldown;
    return true;
  }

  render(ctx) {
    if (this._beamActive) {
      const t = performance.now() / 1000;
      const srcX = this.x + this.width;
      const srcY = this.y + this.height / 2;
      const beamLen = 900 - srcX;
      const pulse = 0.75 + 0.25 * Math.sin(t * 3.5);
      const seed = this.row * 7;
      ctx.save();

      // Outer glow — 0.6 → 0.4
      const g1 = ctx.createLinearGradient(srcX, 0, srcX + beamLen, 0);
      g1.addColorStop(0, 'rgba(255,220,80,0.6)');
      g1.addColorStop(1, 'rgba(255,220,80,0.4)');
      ctx.fillStyle = g1;
      ctx.fillRect(srcX, srcY - 48 * pulse, beamLen, 96 * pulse);

      // Core beam — 1.0 → 0.9
      const g2 = ctx.createLinearGradient(srcX, 0, srcX + beamLen, 0);
      g2.addColorStop(0, 'rgba(255,255,255,1)');
      g2.addColorStop(1, 'rgba(255,255,255,0.9)');
      ctx.fillStyle = g2;
      ctx.fillRect(srcX, srcY - 7, beamLen, 14);

      // Sparks along beam
      for (let i = 0; i < 6; i++) {
        const px = srcX + 30 + (beamLen - 60) * ((i * 0.18 + t * 0.03) % 1);
        const py = srcY - 18 + 36 * Math.sin(t * 7 + i * 2.1);
        const a = 0.5 + 0.4 * Math.sin(t * 6 + i);
        ctx.fillStyle = `rgba(255,255,200,${a})`;
        ctx.beginPath();
        ctx.arc(px, py, 2 + Math.sin(t * 5 + i), 0, Math.PI * 2);
        ctx.fill();
      }

      // Scattering motes
      for (let i = 0; i < 7; i++) {
        const phase = seed + i * 1.1;
        const px = srcX + 20 + (beamLen - 40) * ((phase * 0.17) % 1);
        const drift = 22 + 35 * (Math.sin(t * 2.5 + phase) * 0.5 + 0.5);
        const py = srcY + (i % 2 ? drift : -drift);
        const life = 0.35 + 0.4 * (Math.sin(t * 2 + phase) * 0.5 + 0.5);
        if (life > 0.35) {
          ctx.fillStyle = `rgba(255,${210 + i * 6},${100 + i * 18},${life})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.5 + i * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Source flare
      const g3 = ctx.createRadialGradient(srcX, srcY, 0, srcX, srcY, 28 * pulse);
      g3.addColorStop(0, 'rgba(255,255,255,0.95)');
      g3.addColorStop(0.3, 'rgba(255,240,180,0.5)');
      g3.addColorStop(1, 'rgba(255,160,30,0)');
      ctx.fillStyle = g3;
      ctx.fillRect(srcX - 28, srcY - 28, 56, 56);

      ctx.restore();
    }
    // Render own twin sunflower GIF, not sunflower's
    if (this._animator) {
      const frame = this._animator.getCurrentCanvas();
      const scale = this.width / this._animator.naturalWidth;
      const drawW = this.width;
      const drawH = Math.round(this._animator.naturalHeight * scale);
      const drawY = this.y + this.height - drawH;
      this._barAnchorY = drawY;
      ctx.drawImage(frame, this.x, drawY, drawW, drawH);
      return;
    }
    // Fallback
    const img = assetManager.getImage('twinsunflower');
    if (img) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    }
  }

  renderBars(ctx) {
    super.renderBars(ctx);
  }
}
