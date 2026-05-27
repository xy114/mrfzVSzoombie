import { Zombie } from './Zombie.js';
import { ZOMBIE_TYPES } from './constants.js';

export class ShieldZombie extends Zombie {
  constructor(x, y, row) {
    super(x, y, row);
    const cfg = ZOMBIE_TYPES.SHIELD;
    this.health = cfg.health;
    this.maxHealth = cfg.health;
    this.speed = cfg.speed;
    this.defense = cfg.defense;
    this.magicResist = cfg.magicResist;
    this.type = 'shield';
    this.rewardType = 'shield';
    this.rewardValue = 3;
    this.initAnimators();
  }
}
