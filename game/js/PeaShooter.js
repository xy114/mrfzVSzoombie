import { Plant } from './Plant.js';
import { Bullet, WishadelPea, WishadelShell, FirePeaBullet } from './Bullet.js';
import { GAME_CONFIG, SKIN_CONFIG, STAR_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';
import { drawPeashooter } from './PlantRenderer.js';

export class PeaShooter extends Plant {
  constructor(x, y, starLevel = 1, skinId = null) {
    super(x, y, starLevel);
    this.baseShootInterval = 1500;
    this.baseDamage = 20;
    this.baseBulletSpeed = 5;
    this.skillMaxCooldown = 10000;
    this.skillCooldown = 0;
    this.shootTimer = 0;
    this.isSkillActive = false;
    this.skillDuration = 2000;
    this.skillTimer = 0;
    this.shooting = false;
    this.skinId = skinId;
    this.skillDamage = 50;
    this._applyPeaStarScaling();
    this.applySkin();

    // Wishadel aim state
    this._aimTarget = null;
    this._aimTimer = 0;
    this._aimDuration = 0;
  }

  _applyPeaStarScaling() {
    const m = STAR_CONFIG[this.starLevel] || STAR_CONFIG[1];
    this.shootInterval = this.baseShootInterval * m.cooldownMult;
  }

  applySkin() {
    if (!this.skinId) return;
    const skinCfg = SKIN_CONFIG.peashooter?.[this.skinId];
    if (!skinCfg) return;
    if (skinCfg.firePeaDamage) this.skillDamage = skinCfg.firePeaDamage;
    if (skinCfg.skillCooldown) this.skillMaxCooldown = skinCfg.skillCooldown;
  }

  _getSkinCfg() {
    return SKIN_CONFIG.peashooter?.[this.skinId] || null;
  }

  update(deltaTime, game) {
    const isWishadel = this.skinId === 'wishadel';

    if (isWishadel) {
      // Wishadel aim phase
      if (this._aimTarget) {
        this._aimTimer -= deltaTime;
        if (!this._aimTarget.alive) {
          this._aimTarget = null;
          this._aimTimer = 0;
        } else if (this._aimTimer <= 0) {
          // Fire!
          const cfg = this._getSkinCfg();
          const shell = new WishadelShell(
            this.x + 30, this.y, this.row,
            this._aimTarget,
            cfg ? cfg.skillDamage : 120,
            cfg ? cfg.shellSpeed : 22
          );
          game.addBullet(shell);
          this._aimTarget = null;
        }
      }

      // Wishadel normal attack
      const hasZombieInRow = game.zombies.some(z =>
        z.row === this.row && z.x >= 0 && z.x < game.canvas.width
      );
      if (hasZombieInRow) {
        this.shootTimer += deltaTime;
        if (this.shootTimer >= this.shootInterval) {
          this.shootTimer = 0;
          this.shooting = true;
          const m = STAR_CONFIG[this.starLevel] || STAR_CONFIG[1];
          const cfg = this._getSkinCfg();
          const dmg = Math.floor((cfg ? cfg.peaDamage : 25) * m.damageMult);
          const shell = new WishadelPea(this.x + 30, this.y + 4, this.row, dmg, cfg ? cfg.peaSpeed : 22);
          game.addBullet(shell);
          setTimeout(() => { this.shooting = false; }, 200);
        }
      }
    } else {
      // Default peashooter behavior
      const hasZombieInRow = game.zombies.some(z =>
        z.row === this.row && z.x >= 0 && z.x < game.canvas.width
      );

      if (hasZombieInRow) {
        this.shootTimer += deltaTime;
        if (this.shootTimer >= this.shootInterval) {
          this.shootTimer = 0;
          this.shooting = true;
          const m = STAR_CONFIG[this.starLevel] || STAR_CONFIG[1];
          const dmg = Math.floor(this.baseDamage * m.damageMult);
          const bullet = new Bullet(this.x + 30, this.y, this.row, dmg);
          game.addBullet(bullet);
          setTimeout(() => { this.shooting = false; }, 200);
        }
      }
    }

    if (this.skillCooldown > 0) {
      this.skillCooldown -= deltaTime;
    }

    if (this.isSkillActive) {
      this.skillTimer -= deltaTime;
      if (this.skillTimer <= 0) {
        this.isSkillActive = false;
      }
    }
  }

  useSkill(game) {
    if (this.skillCooldown > 0) return false;

    const isWishadel = this.skinId === 'wishadel';
    if (isWishadel) {
      // Find nearest zombie to house in same row
      const target = game.zombies
        .filter(z => z.alive && z.row === this.row)
        .sort((a, b) => a.x - b.x)[0]; // leftmost = closest to house
      if (!target) return false;

      const cfg = this._getSkinCfg();
      this.skillCooldown = cfg ? cfg.skillCooldown : this.skillMaxCooldown;
      this.isSkillActive = true;
      this.skillTimer = cfg ? cfg.aimDuration : 600;
      this._aimTarget = target;
      this._aimTimer = cfg ? cfg.aimDuration : 600;
      this._aimDuration = cfg ? cfg.aimDuration : 600;
      return true;
    }

    // Default skill: fire a flame pea that explodes on hit
    const firePea = new FirePeaBullet(
      this.x + 30, this.y + 4, this.row,
      this.skillDamage
    );
    game.addBullet(firePea);
    this.skillCooldown = this.skillMaxCooldown;
    this.isSkillActive = true;
    this.skillTimer = 300;
    return true;
  }

  getBodyType() {
    if (this.skinId) {
      const cfg = this._getSkinCfg();
      if (cfg && cfg.bodyType) return cfg.bodyType;
    }
    return 'plant';
  }

  getRenderSize() {
    return this.skinId === 'wishadel' ? 96 : 80;
  }

  renderBars(ctx) {
    super.renderBars(ctx);
    const sz = this.getRenderSize();
    const barW = GAME_CONFIG.CELL_WIDTH * 0.7;
    const barX = this.x + (sz - barW) / 2;
    ctx.fillStyle = '#fff';
    ctx.fillRect(barX, this.y - 14, barW, 5);
    if (this.skillCooldown > 0) {
      const cdPct = this.skillCooldown / this.skillMaxCooldown;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, this.y - 14, barW * cdPct, 5);
    } else {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(barX, this.y - 14, barW, 5);
    }
  }

  render(ctx) {
    const isWishadel = this.skinId === 'wishadel';
    const renderSz = isWishadel ? 96 : 80;
    let img = null;

    if (isWishadel) {
      img = assetManager.getImageNoBg('wishadel_combat');
    }
    if (!img && this.shooting) {
      img = assetManager.getImage('peashooter_shoot');
    }
    if (!img) {
      img = assetManager.getImage('peashooter');
    }

    if (img) {
      const s = Math.min(renderSz / img.naturalWidth, renderSz / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.drawImage(img, this.x + (renderSz - dw) / 2, this.y + (renderSz - dh) / 2, dw, dh);
    } else {
      drawPeashooter(ctx, this.x, this.y, renderSz, renderSz, this.shooting);
    }

    // Wishadel crosshair on target during aim
    if (isWishadel && this._aimTarget && this._aimTarget.alive) {
      this._renderCrosshair(ctx, this._aimTarget);
    }
  }

  _renderCrosshair(ctx, target) {
    const tx = target.x + target.width / 2;
    const ty = target.y + target.height / 2;
    const progress = this._aimTimer > 0 ? 1 - this._aimTimer / this._aimDuration : 1;
    const ringR = 30 - progress * 18; // shrinking ring

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to canvas coords (avoid plant scale/rotation)
    // Purple-red crosshair
    ctx.strokeStyle = `rgba(220, 40, 80, ${0.7 + progress * 0.3})`;
    ctx.lineWidth = 2;

    // Cross lines
    const crossLen = 20;
    ctx.beginPath();
    ctx.moveTo(tx - crossLen, ty);
    ctx.lineTo(tx + crossLen, ty);
    ctx.moveTo(tx, ty - crossLen);
    ctx.lineTo(tx, ty + crossLen);
    ctx.stroke();

    // Shrinking ring
    ctx.beginPath();
    ctx.arc(tx, ty, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = `rgba(255, 80, 120, ${0.8 + progress * 0.2})`;
    ctx.beginPath();
    ctx.arc(tx, ty, 3, 0, Math.PI * 2);
    ctx.fill();

    // Ring glow
    ctx.strokeStyle = `rgba(200, 30, 60, ${0.3 - progress * 0.2})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(tx, ty, ringR + 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
