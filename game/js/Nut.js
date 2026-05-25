import { Plant } from './Plant.js';
import { STAR_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';
import { drawNut } from './PlantRenderer.js';

export class Nut extends Plant {
  constructor(x, y, starLevel = 1) {
    super(x, y, starLevel);
    this.baseMaxHealth = 400;
    this._doHealthScaling();
    this.defense = 0;
    this.baseSkillDefense = 30;
    this.skillMaxCooldown = 15000;
    this.skillCooldown = 0;
    this.skillDuration = 5000;
    this.skillTimer = 0;
    this.isSkillActive = false;
  }

  update(deltaTime, game) {
    if (this.skillCooldown > 0) {
      this.skillCooldown -= deltaTime;
    }
    if (this.isSkillActive) {
      this.skillTimer -= deltaTime;
      if (this.skillTimer <= 0) {
        this.isSkillActive = false;
        this.defense = 0;
      }
    }
  }

  useSkill(game) {
    if (this.skillCooldown <= 0 && !this.isSkillActive) {
      this.skillCooldown = this.skillMaxCooldown;
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
    const img = assetManager.getImage('nut');
    if (img) {
      ctx.drawImage(img, this.x, this.y, 80, 80);
    } else {
      drawNut(ctx, this.x, this.y, 80, 80, this.isSkillActive);
    }
  }

  renderBars(ctx) {
    const hpPct = this.health / this.maxHealth;
    const barW = 70;
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x + 10, this.y + 5, barW, 5);
    ctx.fillStyle = '#0dc5d0';
    ctx.fillRect(this.x + 10, this.y + 5, barW * hpPct, 5);
    if (this.isSkillActive) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x + 10, this.y + 92, barW, 3);
      ctx.fillStyle = 'rgba(100,180,255,0.4)';
      ctx.fillRect(this.x + 10, this.y + 92, barW * (this.skillTimer / this.skillDuration), 3);
    } else if (this.skillCooldown > 0) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x + 10, this.y + 92, barW, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(this.x + 10, this.y + 92, barW * (this.skillCooldown / this.skillMaxCooldown), 3);
    } else {
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(this.x + 10, this.y + 92, barW, 3);
    }
  }
}
