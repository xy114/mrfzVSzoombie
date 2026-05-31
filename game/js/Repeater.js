import { PeaShooter } from './PeaShooter.js';
import { Bullet, PiercingFirePea } from './Bullet.js';
import { STAR_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';

export class Repeater extends PeaShooter {
  constructor(x, y, starLevel = 1, skinId = null) {
    super(x, y, starLevel, skinId);
    this.plantType = 'repeater';
    this.baseMaxHealth = 150;
    this._doHealthScaling();
    this.skinId = skinId || 'default';
    this._animator = null;
    if (!this.skinId || this.skinId === 'default') {
      this._animator = assetManager.createAnimator('repeater');
    }
    this._firingPeas = 0;
    this._firePeaTimer = 0;
    this._bulletIndex = 0;
    this._peaDamage = 30;
    this._peaSpeed = 8;
    this._firePeaDamage = 30;
    this.skillMaxCooldown = 10000;
  }

  update(deltaTime, game) {
    if (this._animator) this._animator.update(deltaTime);
    if (this.skillCooldown > 0) this.skillCooldown -= deltaTime;

    const hasZombieInRow = game.zombies.some(z =>
      z.alive && z.row === this.row && z.x >= 0
    );
    if (hasZombieInRow) {
      this.shootTimer += deltaTime;
      if (this.shootTimer >= this.shootInterval && this._firingPeas <= 0) {
        this._firingPeas = 2;
        this._bulletIndex = 0;
        this._firePeaTimer = 0;
      }
    }

    if (this._firingPeas > 0) {
      this._firePeaTimer -= deltaTime;
      if (this._firePeaTimer <= 0) {
        const m = STAR_CONFIG[this.starLevel] || STAR_CONFIG[1];
        const dmg = Math.floor(this._peaDamage * m.damageMult);
        const yOff = this._bulletIndex === 0 ? -6 : 6;
        const pea = new Bullet(this.x + 30, this.y + 4 + yOff, this.row, dmg);
        pea.speed = this._peaSpeed;
        game.addBullet(pea);
        this._bulletIndex++;
        this._firingPeas--;
        this._firePeaTimer = 200;
        if (this._firingPeas <= 0) {
          this.shootTimer = 0;
        }
      }
    }
  }

  useSkill(game) {
    if (this.skillCooldown > 0) return false;
    this.skillCooldown = this.skillMaxCooldown;

    const m = STAR_CONFIG[this.starLevel] || STAR_CONFIG[1];
    const dmg = Math.floor(this._firePeaDamage * m.damageMult * 1.5);

    const delays = [0, 150];
    const yOffs = [-6, 6];
    for (let i = 0; i < 2; i++) {
      setTimeout(() => {
        const pea = new PiercingFirePea(this.x + 30, this.y + 4 + yOffs[i], this.row, dmg);
        pea.speed = 10;
        game.addBullet(pea);
      }, delays[i]);
    }
    return true;
  }

  getBodyType() { return 'plant'; }
  getRenderSize() { return 80; }
  getAspectRatio() { return 1.0; }
}
