import { Zombie } from './Zombie.js';
import { ZOMBIE_TYPES } from './constants.js';
import { assetManager } from './AssetManager.js';
import { drawShieldZombie } from './ZombieRenderer.js';

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
  }

  render(ctx) {
    const attackKey = 'shield_attack';
    const img = assetManager.getImage(attackKey) || assetManager.getImage('shield');
    if (img) {
      ctx.drawImage(img, this.x, this.y, 86, 115);
    } else {
      drawShieldZombie(ctx, this.x, this.y, 86, 115, this.attacking);
    }
  }
}
