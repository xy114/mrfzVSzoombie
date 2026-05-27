import { Zombie } from './Zombie.js';
import { ZOMBIE_TYPES } from './constants.js';

export class ImpZombie extends Zombie {
  constructor(x, y, row) {
    super(x, y, row);
    const cfg = ZOMBIE_TYPES.IMP;
    this.health = cfg.health;
    this.maxHealth = cfg.health;
    this.speed = cfg.speed;
    this.damage = 15;
    this.defense = cfg.defense;
    this.magicResist = cfg.magicResist;
    this.attackInterval = 800;
    this.type = 'imp';
    this.rewardType = 'imp';
    this.rewardValue = 1;
    this.width = 72;
    this.height = 72;
    this.initAnimators();
  }

  renderBars(ctx) {
    const hpPct = this.health / this.maxHealth;
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x + 5, this.y - 5, 65, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x + 5, this.y - 5, 65 * hpPct, 4);
  }
}
