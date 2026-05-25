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
    this.width = 65;
    this.height = 86;
  }

  render(ctx) {
    const attackKey = 'imp_attack';
    const img = assetManager.getImage(attackKey) || assetManager.getImage('imp');
    if (img) {
      ctx.drawImage(img, this.x, this.y, 65, 86);
    } else {
      drawImpZombie(ctx, this.x, this.y, 65, 86, this.attacking);
    }
  }

  renderBars(ctx) {
    const hpPct = this.health / this.maxHealth;
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x + 5, this.y - 5, 55, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x + 5, this.y - 5, 55 * hpPct, 4);
  }
}
