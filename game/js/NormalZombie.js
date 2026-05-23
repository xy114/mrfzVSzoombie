import { Zombie } from './Zombie.js';
import { ZOMBIE_TYPES } from './constants.js';

export class NormalZombie extends Zombie {
  constructor(x, y, row) {
    super(x, y, row);
    this.health = ZOMBIE_TYPES.NORMAL.health;
    this.maxHealth = ZOMBIE_TYPES.NORMAL.health;
    this.speed = ZOMBIE_TYPES.NORMAL.speed;
    this.type = 'normal';
    this.rewardType = 'normal';
    this.rewardValue = 1;
  }
}
