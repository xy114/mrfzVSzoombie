import { Zombie } from './Zombie.js';
import { ZOMBIE_TYPES } from './constants.js';
import { assetManager } from './AssetManager.js';
import { drawImpZombie } from './ZombieRenderer.js';

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
    this.width = 45;
    this.height = 60;
  }

  render(ctx) {
    const img = assetManager.getImage(this.attacking ? 'imp_attack' : 'imp');
    if (img) {
      ctx.drawImage(img, this.x, this.y, 45, 60);
    } else {
      drawImpZombie(ctx, this.x, this.y, 45, 60, this.attacking);
    }
    const hpPct = this.health / this.maxHealth;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x + 3, this.y - 5, 39 * hpPct, 4);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(this.x + 3, this.y - 5, 39, 4);
  }
}
