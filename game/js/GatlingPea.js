import { PeaShooter } from './PeaShooter.js';
import { Bullet, FirePeaBullet } from './Bullet.js';
import { GAME_CONFIG, STAR_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';

export class GatlingPea extends PeaShooter {
  constructor(x, y, starLevel = 1, skinId = null) {
    super(x, y, starLevel, skinId);
    this.plantType = 'gatlingpea';
    this.baseMaxHealth = 200;
    this._doHealthScaling();
    this.skinId = skinId || 'default';
    this._animator = null;
    if (!this.skinId || this.skinId === 'default') {
      this._animator = assetManager.createAnimator('gatlingpea');
    }
    this.baseDamage = 40;
    this._bulletsRemaining = 0;
    this._bulletTimer = 0;
    this._bulletIndex = 0;
    this.skillMaxCooldown = 15000;
  }

  update(deltaTime, game) {
    if (this._animator) this._animator.update(deltaTime);
    if (this.skillCooldown > 0) this.skillCooldown -= deltaTime;

    const hasZombieInRow = game.zombies.some(z =>
      z.alive && z.row === this.row && z.x >= 0
    );
    if (hasZombieInRow) {
      this.shootTimer += deltaTime;
      if (this.shootTimer >= this.shootInterval && this._bulletsRemaining <= 0) {
        this._bulletsRemaining = 4;
        this._bulletIndex = 0;
        this._bulletTimer = 0;
      }
    }

    if (this._bulletsRemaining > 0) {
      this._bulletTimer -= deltaTime;
      if (this._bulletTimer <= 0) {
        const m = STAR_CONFIG[this.starLevel] || STAR_CONFIG[1];
        const dmg = Math.floor(this.baseDamage * m.damageMult);
        const yOffs = [-6, -2, 2, 6];
        const yOff = yOffs[this._bulletIndex];
        const pea = new Bullet(this.x + 30, this.y + 4 + yOff, this.row, dmg);
        pea.speed = 8;
        game.addBullet(pea);
        this._bulletIndex++;
        this._bulletsRemaining--;
        this._bulletTimer = 120;
        if (this._bulletsRemaining <= 0) {
          this.shootTimer = 0;
        }
      }
    }
  }

  useSkill(game) {
    if (this.skillCooldown > 0) return false;
    this.skillCooldown = this.skillMaxCooldown;

    const m = STAR_CONFIG[this.starLevel] || STAR_CONFIG[1];
    const dmg = Math.floor(50 + this.baseDamage * m.damageMult);

    for (let row = 0; row < 5; row++) {
      let delay = 0;
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          if (!game.isRunning) return;
          const pea = new FirePeaBullet(this.x + 30, 0, row, dmg, 6);
          const rowMidY = row * GAME_CONFIG.CELL_HEIGHT + GAME_CONFIG.CELL_HEIGHT / 2;
          pea.y = rowMidY - pea.height / 2;
          pea.speed = 6;
          game.addBullet(pea);
        }, delay);
        delay += 150;
      }
    }
    return true;
  }

  getBodyType() { return 'plant'; }
  getRenderSize() { return 80; }
  getAspectRatio() { return 1.0; }
}
