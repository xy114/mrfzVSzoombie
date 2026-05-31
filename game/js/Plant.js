import { GAME_CONFIG, STAR_CONFIG } from './constants.js';

// Shared bar rendering — all units call these so bar position/size stays consistent
export const BAR_W = 56, BAR_H = 5;
export function drawHealthBar(ctx, x, y, size, percent) {
  const barX = x + (size - BAR_W) / 2 - 5;
  const barY = y - 8;
  ctx.fillStyle = '#fff';
  ctx.fillRect(barX, barY, BAR_W, BAR_H);
  ctx.fillStyle = '#0dc5d0';
  ctx.fillRect(barX, barY, BAR_W * percent, BAR_H);
}
export function drawSkillBar(ctx, x, y, size, ratio, fillColor = '#f59e0b') {
  const barX = x + (size - BAR_W) / 2 - 5;
  const barY = y - 14;
  ctx.fillStyle = '#fff';
  ctx.fillRect(barX, barY, BAR_W, BAR_H);
  if (ratio > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, BAR_W * ratio, BAR_H);
  } else {
    ctx.fillStyle = fillColor;
    ctx.fillRect(barX, barY, BAR_W, BAR_H);
  }
}

export class Plant {
  constructor(x, y, starLevel = 1) {
    this.x = x;
    this.y = y;
    this.width = this.getRenderSize();
    this.height = Math.round(this.width * this.getAspectRatio());
    this.baseMaxHealth = 100;
    this.starLevel = starLevel;
    this.maxHealth = 100;
    this.health = 100;
    this.alive = true;
    this.scale = 1;
    this.rotation = 0;
    this._retreating = 0;
    this._invulnerable = false;
    this._barAnchorY = this.y;
    this._doHealthScaling();
  }

  _doHealthScaling() {
    const m = (STAR_CONFIG[this.starLevel] || STAR_CONFIG[1]).healthMult;
    this.maxHealth = Math.floor(this.baseMaxHealth * m);
    this.health = this.maxHealth;
  }

  update(deltaTime, game) {
  }

  render(ctx) {
  }

  getBodyType() { return 'plant'; }
  getRenderSize() { return 80; }
  getAspectRatio() { return 1.0; }

  getPlacementParams() {
    return {
      bodyType: this.getBodyType(),
      renderSize: this.getRenderSize(),
      aspectRatio: this.getAspectRatio()
    };
  }

  renderBars(ctx) {
    drawHealthBar(ctx, this.x, this.y, this.getRenderSize(), this.health / this.maxHealth);
    this.renderSkillBar(ctx);
  }

  renderSkillBar(ctx) {
    if (this.skillMaxCooldown === undefined) return;
    const ratio = this.skillCooldown > 0 ? this.skillCooldown / this.skillMaxCooldown : 0;
    drawSkillBar(ctx, this.x, this.y, this.getRenderSize(), ratio);
  }

  takeDamage(damage) {
    if (this._invulnerable) return;
    this.health -= damage;
    if (this.health <= 0) {
      this.alive = false;
    }
  }
}
