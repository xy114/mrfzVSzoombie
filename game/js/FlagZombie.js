import { Zombie } from './Zombie.js';
import { assetManager } from './AssetManager.js';

export class FlagZombie extends Zombie {
  constructor(x, y, row) {
    super(x, y, row);
    this.type = 'flag';
    this.maxHealth = 100;
    this.health = 100;
    this.defense = 0;
    this.speed = 0.3;
    this.damage = 20;
    this.deathGifKey = 'zombie_death';
  }

  initAnimators() {
    this.walkAnimator = assetManager.createAnimator('flag');
    this.attackAnimator = assetManager.createAnimator('flag_attack');
    if (this.walkAnimator && this.walkAnimator.frameCount > 0) {
      const scale = this.width / this.walkAnimator.naturalWidth;
      this.height = Math.round(this.walkAnimator.naturalHeight * scale);
    }
  }
}
