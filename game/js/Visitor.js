import { GAME_CONFIG } from './constants.js';
import { getVisitorDef } from './VisitorConfig.js';
import { assetManager } from './AssetManager.js';
import { DamageNumber } from './DamageNumber.js';
import { SlashEffect } from './SlashEffect.js';

// === Visitor Base Class ===
export class Visitor {
  constructor(x, y, row, visitorId) {
    const def = getVisitorDef(visitorId);
    this.id = visitorId;
    this.x = x;
    this.y = y;
    this.row = row;
    this.width = 60;
    this.height = 80;
    this.health = def.combat.health;
    this.maxHealth = def.combat.health;
    this.alive = true;
    this.category = 'visitor';
    this.scale = 1;
    this.rotation = 0;
    this._timeStopForm = false;
    this._passiveCooldownRemaining = 0;
    this._activeCooldownRemaining = 0;
    this._pendingPassive = false;
  }

  update(deltaTime, game) {
    if (this._passiveCooldownRemaining > 0) {
      this._passiveCooldownRemaining = Math.max(0, this._passiveCooldownRemaining - deltaTime);
    }
    if (this._activeCooldownRemaining > 0) {
      this._activeCooldownRemaining = Math.max(0, this._activeCooldownRemaining - deltaTime);
    }

    if (this._pendingPassive) {
      this._pendingPassive = false;
      this._executePassive(game);
    }
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
    }
    if (this.alive && this._passiveCooldownRemaining <= 0) {
      this._pendingPassive = true;
    }
  }

  _executePassive(game) { /* override in subclass */ }

  isOnCooldown(type) {
    if (type === 'active') return this._activeCooldownRemaining > 0;
    if (type === 'passive') return this._passiveCooldownRemaining > 0;
    return false;
  }

  getCooldownRatio(type) {
    const def = getVisitorDef(this.id);
    if (type === 'active') {
      return 1 - this._activeCooldownRemaining / def.combat.activeSkillCooldown;
    }
    if (type === 'passive') {
      return 1 - this._passiveCooldownRemaining / def.combat.passiveSkillCooldown;
    }
    return 0;
  }

  render(ctx) {
    const imgKey = this._timeStopForm ? 'visitor_katana_zero_time' : 'visitor_katana_zero';
    const img = assetManager.getImage(imgKey);
    if (img) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = this._timeStopForm ? '#a040d0' : '#607080';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText('???', this.x + 15, this.y + 45);
    }

    if (this._activeCooldownRemaining > 0) {
      const ratio = this.getCooldownRatio('active');
      ctx.fillStyle = '#333';
      ctx.fillRect(this.x, this.y + this.height + 2, this.width, 4);
      ctx.fillStyle = '#c040ff';
      ctx.fillRect(this.x, this.y + this.height + 2, this.width * ratio, 4);
    }
  }
}

// === Katana Zero ===
export class KatanaZero extends Visitor {
  constructor(x, y, row) {
    super(x, y, row, 'katana_zero');
  }

  _executePassive(game) {
    const def = getVisitorDef('katana_zero');
    game.setTimeScale(GAME_CONFIG.TIME_STOP);
    this._timeStopForm = true;
    this._passiveCooldownRemaining = def.combat.passiveSkillCooldown;

    const targets = game.zombies.filter(z => z.alive && z.row === this.row);
    for (const z of targets) {
      const dmg = def.combat.passiveSkillDamage + z.maxHealth * def.combat.passiveSkillHpRatio;
      z.takeDamage(dmg, 'magic');
      z._pauseTimer = 100;

      game.addSlashEffect(new SlashEffect(z.x, z.y, z.width, z.height, true));
      game.addDamageNumber(new DamageNumber(
        z.x + z.width / 2, z.y, dmg, true
      ));
    }

    setTimeout(() => {
      game.setTimeScale(1.0);
      this._timeStopForm = false;
    }, def.combat.passiveSkillDuration);
  }

  executeActive(game) {
    if (this._activeCooldownRemaining > 0) return false;
    const def = getVisitorDef('katana_zero');

    game.setTimeScale(GAME_CONFIG.TIME_STOP);
    this._timeStopForm = true;
    this._activeCooldownRemaining = def.combat.activeSkillCooldown;

    const targets = game.zombies.filter(z => z.alive);
    let totalDmg = 0;

    for (const z of targets) {
      for (let i = 0; i < def.combat.activeSkillSlashes; i++) {
        const dmg = def.combat.activeSkillDamage + z.maxHealth * def.combat.activeSkillHpRatio;
        z.takeDamage(dmg, 'magic');
        totalDmg += dmg;
        z._pauseTimer = 100;
      }
      game.addSlashEffect(new SlashEffect(z.x, z.y, z.width, z.height, false));
    }

    if (targets.length > 0) {
      const mid = targets[Math.floor(targets.length / 2)];
      game.addDamageNumber(new DamageNumber(
        mid.x + mid.width / 2, mid.y - 20, totalDmg, true
      ));
    }

    setTimeout(() => {
      game.setTimeScale(1.0);
      this._timeStopForm = false;
      for (const z of targets) {
        z._pauseTimer = 0;
      }
    }, def.combat.activeSkillDuration);

    return true;
  }
}
