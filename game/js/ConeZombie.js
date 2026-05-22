import { Zombie } from './Zombie.js';
import { ZOMBIE_TYPES } from './constants.js';

export class ConeZombie extends Zombie {
  constructor(x, y, row) {
    super(x, y, row);
    this.health = ZOMBIE_TYPES.CONE.health;
    this.maxHealth = ZOMBIE_TYPES.CONE.health;
    this.speed = ZOMBIE_TYPES.CONE.speed;
    this.type = 'cone_zombie';
  }
}