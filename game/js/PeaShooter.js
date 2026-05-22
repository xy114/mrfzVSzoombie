import { Plant } from './Plant.js';
import { Bullet, FireBullet } from './Bullet.js';
import { BULLET_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';

export class PeaShooter extends Plant {
  constructor(x, y) {
    super(x, y);
    this.shootTimer = 0;
    this.shootInterval = 1500;
    this.skillCooldown = 0;
    this.skillMaxCooldown = 10000;
    this.isSkillActive = false;
    this.skillDuration = 2000;
    this.skillTimer = 0;
    this.shooting = false;
  }

  update(deltaTime, game) {
    const hasZombieInRow = game.zombies.some(z => 
      z.row === this.row && z.x >= 0 && z.x < game.canvas.width
    );

    if (hasZombieInRow) {
      this.shootTimer += deltaTime;
      if (this.shootTimer >= this.shootInterval) {
        this.shootTimer = 0;
        this.shooting = true;
        const bullet = new Bullet(this.x + 80, this.y + 40, this.row);
        game.addBullet(bullet);
        setTimeout(() => { this.shooting = false; }, 200);
      }
    }

    if (this.skillCooldown > 0) {
      this.skillCooldown -= deltaTime;
    }

    if (this.isSkillActive) {
      this.skillTimer -= deltaTime;
      if (this.skillTimer <= 0) {
        this.isSkillActive = false;
      }
    }
  }

  useSkill(game) {
    if (this.skillCooldown <= 0) {
      this.skillCooldown = this.skillMaxCooldown;
      this.isSkillActive = true;
      this.skillTimer = this.skillDuration;
      const fireBullet = new FireBullet(this.x + 80, this.y + 40, this.row);
      game.addBullet(fireBullet);
      return true;
    }
    return false;
  }

  render(ctx) {
    const imageKey = this.shooting ? 'peashooter_shoot' : 'peashooter';
    const img = assetManager.getImage(imageKey);
    
    if (img) {
      ctx.drawImage(img, this.x, this.y, 80, 80);
    } else {
      const emoji = this.isSkillActive ? '🔥' : '🫛';
      ctx.font = '50px Arial';
      ctx.fillText(emoji, this.x + 20, this.y + 70);
    }

    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(this.x + 10, this.y + 5, 80 * healthPercent, 5);

    if (this.skillCooldown > 0) {
      const cooldownPercent = this.skillCooldown / this.skillMaxCooldown;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(this.x + 10, this.y + 95, 80 * cooldownPercent, 5);
    } else {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(this.x + 10, this.y + 95, 80, 5);
    }
  }
}