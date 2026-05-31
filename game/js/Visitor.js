import { GAME_CONFIG } from './constants.js';
import { getVisitorDef } from './VisitorConfig.js';
import { assetManager } from './AssetManager.js';
import { DamageNumber } from './DamageNumber.js';
import { SlashEffect } from './SlashEffect.js';
import { drawHealthBar, drawSkillBar } from './Plant.js';

// === Visitor Base Class ===
export class Visitor {
  constructor(x, y, row, visitorId) {
    const def = getVisitorDef(visitorId);
    this.id = visitorId;
    this.x = x;
    this.y = y;
    this.row = row;
    this.width = 96;
    this.height = 96;
    this.health = def.combat.health;
    this.maxHealth = def.combat.health;
    this.alive = true;
    this.category = 'visitor';

    this.getBodyType = () => 'humanoid';
    this.getRenderSize = () => 96;
    this.getAspectRatio = () => 1.0;
    this.scale = 1;
    this.rotation = 0;
    this._timeStopForm = false;
    this._retreating = 0;
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
    const img = assetManager.getImageNoBg(imgKey);
    ctx.save();
    if (img) {
      // Keep aspect ratio, center in bounding box, flip to face right
      const s = Math.min(this.width / img.naturalWidth, this.height / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      const offX = (this.width - dw) / 2;
      const offY = (this.height - dh) / 2;
      this._barAnchorY = this.y + offY;
      ctx.drawImage(img, this.x + offX, this.y + offY, dw, dh);
    } else {
      this._barAnchorY = this.y;
      ctx.fillStyle = this._timeStopForm ? '#a040d0' : '#607080';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText('???', this.x + 15, this.y + 45);
    }
    ctx.restore();
  }

  renderBars(ctx) {
    drawHealthBar(ctx, this.x, this.y, this.getRenderSize(), this.health / this.maxHealth);
    const activeRemaining = this._activeCooldownRemaining || 0;
    const ratio = activeRemaining > 0 ? 1 - this.getCooldownRatio('active') : 0;
    drawSkillBar(ctx, this.x, this.y, this.getRenderSize(), ratio, '#c040ff');
  }
}

// === Katana Zero ===
export class KatanaZero extends Visitor {
  constructor(x, y, row) {
    super(x, y, row, 'katana_zero');
  }

  _executePassive(game) {
    const def = getVisitorDef('katana_zero');
    const speedMult = game.timeScale; // record user speed before time-stop
    game.timeScale *= GAME_CONFIG.TIME_STOP;
    game._timeStopped = true;
    this._timeStopForm = true;

    const targets = game.zombies.filter(z => z.alive && z.row === this.row);
    const effects = [];
    for (const z of targets) {
      const dmg = Math.floor(def.combat.passiveSkillDamage + z.maxHealth * def.combat.passiveSkillHpRatio);
      z.takeDamage(dmg, 'magic');
      z._pauseTimer = 100;
      z._timeStopFrozen = true;
      effects.push({ zombie: z, dmg, isPassive: true });
    }

    // Stagger slash effects during time stop — scaled by speed multiplier
    effects.forEach((ef, i) => {
      setTimeout(() => {
        game.addSlashEffect(new SlashEffect(ef.zombie.x, ef.zombie.y, ef.zombie.width, ef.zombie.height, true));
      }, i * 100 / speedMult);
    });

    setTimeout(() => {
      game.timeScale /= GAME_CONFIG.TIME_STOP;
      game._timeStopped = false;
      this._timeStopForm = false;
      this._passiveCooldownRemaining = def.combat.passiveSkillCooldown;
      for (const ef of effects) {
        ef.zombie._timeStopFrozen = false;
      }
      // Damage numbers appear after time stop
      for (const ef of effects) {
        game.addDamageNumber(new DamageNumber(
          ef.zombie.x + ef.zombie.width / 2, ef.zombie.y, ef.dmg, true
        ));
      }
    }, def.combat.passiveSkillDuration / speedMult);
  }

  executeActive(game) {
    if (this._activeCooldownRemaining > 0) return false;
    const def = getVisitorDef('katana_zero');

    const speedMult = game.timeScale; // record user speed before time-stop
    game.timeScale *= GAME_CONFIG.TIME_STOP;
    game._timeStopped = true;
    this._timeStopForm = true;

    const targets = game.zombies.filter(z => z.alive);
    const dmgMap = new Map();
    for (const z of targets) {
      z._timeStopFrozen = true;
      dmgMap.set(z, 0);
    }

    const slashCount = def.combat.activeSkillSlashes;
    const slashInterval = def.combat.activeSkillDuration / slashCount / speedMult;

    for (let i = 0; i < slashCount; i++) {
      setTimeout(() => {
        for (const z of targets) {
          if (!z.alive && !z._timeStopFrozen) continue;
          const dmg = Math.floor(def.combat.activeSkillDamage + z.maxHealth * def.combat.activeSkillHpRatio);
          z.takeDamage(dmg, 'magic');
          dmgMap.set(z, dmgMap.get(z) + dmg);
          z._pauseTimer = 100;
          game.addSlashEffect(new SlashEffect(z.x, z.y, z.width, z.height, false));
        }
      }, i * slashInterval);
    }

    setTimeout(() => {
      game.timeScale /= GAME_CONFIG.TIME_STOP;
      game._timeStopped = false;
      this._timeStopForm = false;
      this._activeCooldownRemaining = def.combat.activeSkillCooldown;
      for (const z of targets) {
        z._pauseTimer = 0;
        z._timeStopFrozen = false;
      }
      for (const [z, totalDmg] of dmgMap) {
        if (totalDmg > 0) {
          game.addDamageNumber(new DamageNumber(
            z.x + z.width / 2, z.y - 20, totalDmg, true
          ));
        }
      }
    }, def.combat.activeSkillDuration / speedMult);

    return true;
  }
}
