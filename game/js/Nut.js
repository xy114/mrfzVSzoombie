import { Plant } from './Plant.js';
import { GAME_CONFIG, STAR_CONFIG } from './constants.js';
import { drawSkillBar } from './Plant.js';
import { assetManager } from './AssetManager.js';
import { drawNut } from './PlantRenderer.js';
import { GifAnimator } from './GifAnimator.js';

export class Nut extends Plant {
  constructor(x, y, starLevel = 1) {
    super(x, y, starLevel);
    this.plantType = 'nut';
    this.baseMaxHealth = 400;
    this._doHealthScaling();
    this.defense = 0;
    this.baseSkillDefense = 30;
    this.skillMaxCooldown = 15000;
    this.skillCooldown = 0;
    this.skillDuration = 5000;
    this.skillTimer = 0;
    this.isSkillActive = false;
    this._animator = assetManager.createAnimator('nut');
  }

  update(deltaTime, game) {
    if (this._animator) this._animator.update(deltaTime);
    if (this.skillCooldown > 0) {
      this.skillCooldown -= deltaTime;
    }
    if (this.isSkillActive) {
      this.skillTimer -= deltaTime;
      if (this.skillTimer <= 0) {
        this.isSkillActive = false;
        this.defense = 0;
        this.skillCooldown = this.skillMaxCooldown;
      }
    }
  }

  useSkill(game) {
    if (this.skillCooldown <= 0 && !this.isSkillActive) {
      this.isSkillActive = true;
      this.skillTimer = this.skillDuration;
      this.defense = this.baseSkillDefense;
      return true;
    }
    return false;
  }

  takeDamage(damage) {
    const actual = Math.max(1, damage - this.defense);
    this.health -= actual;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  render(ctx) {
    if (this._animator) {
      const frame = this._animator.getCurrentCanvas();
      const scale = this.width / this._animator.naturalWidth;
      const drawW = this.width;
      const drawH = Math.round(this._animator.naturalHeight * scale);
      const drawY = this.y + this.height - drawH;
      this._barAnchorY = drawY;
      ctx.drawImage(frame, this.x, drawY, drawW, drawH);
      if (this.isSkillActive) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(this.x, drawY, drawW, drawH);
        ctx.restore();
      }
      return;
    }
    const img = assetManager.getImage('nut');
    if (img) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      drawNut(ctx, this.x, this.y, this.width, this.height, this.isSkillActive);
    }
  }

  renderSkillBar(ctx) {
    const ratio = this.isSkillActive ? this.skillTimer / this.skillDuration
      : this.skillCooldown > 0 ? this.skillCooldown / this.skillMaxCooldown : 0;
    const color = this.isSkillActive ? 'rgba(100,180,255,0.4)' : '#60a5fa';
    drawSkillBar(ctx, this.x, this.y, this.getRenderSize(), ratio, color);
  }

  renderBars(ctx) {
    super.renderBars(ctx);
  }
}
