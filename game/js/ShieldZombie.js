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
    const img = assetManager.getImage(this.attacking ? 'shield_attack' : 'shield');
    if (img) {
      ctx.drawImage(img, this.x, this.y, 60, 80);
    } else {
      drawShieldZombie(ctx, this.x, this.y, 60, 80, this.attacking);
    }
    const hpPct = this.health / this.maxHealth;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x + 5, this.y - 5, 50 * hpPct, 5);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(this.x + 5, this.y - 5, 50, 5);
  }
}
