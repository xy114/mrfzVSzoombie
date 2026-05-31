import { Zombie } from './Zombie.js';
import { assetManager } from './AssetManager.js';

export class BucketZombie extends Zombie {
  constructor(x, y, row) {
    super(x, y, row);
    this.type = 'bucket';
    this.maxHealth = 300;
    this.health = 300;
    this.defense = 40;
    this.speed = 0.3;
    this.damage = 20;
    this.deathGifKey = 'zombie_death';
    this._shatterTimer = 0;
    this._showShatterEffect = false;
  }

  initAnimators() {
    this.walkAnimator = assetManager.createAnimator('bucket');
    this.attackAnimator = assetManager.createAnimator('bucket_attack');
    if (this.walkAnimator && this.walkAnimator.frameCount > 0) {
      const scale = this.width / this.walkAnimator.naturalWidth;
      this.height = Math.round(this.walkAnimator.naturalHeight * scale);
    }
  }

  update(deltaTime, game) {
    super.update(deltaTime, game);
    if (this._showShatterEffect) {
      this._shatterTimer -= deltaTime;
      if (this._shatterTimer <= 0) {
        this._showShatterEffect = false;
      }
    }
  }
}
