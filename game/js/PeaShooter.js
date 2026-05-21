import { Plant } from './Plant.js';
import { Bullet, FireBullet } from './Bullet.js';
import { BULLET_CONFIG } from './constants.js';

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
  }

  update(deltaTime, game) {
    const hasZombieAhead = game.zombies.some(z => z.row === this.row && z.x > this.x);

    if (hasZombieAhead) {
      this.shootTimer += deltaTime;
      if (this.shootTimer >= this.shootInterval) {
        this.shootTimer = 0;
        const bullet = new Bullet(this.x + 80, this.y + 40, this.row);
        game.addBullet(bullet);
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
    const emoji = this.isSkillActive ? '🔥' : '🫛';
    ctx.font = '50px Arial';
    ctx.fillText(emoji, this.x + 20, this.y + 70);

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