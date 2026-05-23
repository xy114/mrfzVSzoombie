import { GAME_CONFIG, ZOMBIE_TYPES } from './constants.js';
import { assetManager } from './AssetManager.js';

export class Zombie {
  constructor(x, y, row) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.width = 60;
    this.height = 80;
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 0.3;
    this.damage = 20;
    this.alive = true;
    this.attacking = false;
    this.targetPlant = null;
    this.attackTimer = 0;
    this.attackInterval = 1000;
    this.type = 'normal';
    this.rewardType = 'normal';
    this.rewardValue = 1;
  }

  update(deltaTime, game) {
    const plantInFront = game.plants.find(p =>
      p.row === this.row &&
      p.x < this.x + 80 &&
      p.x > this.x - 30
    );

    if (plantInFront) {
      this.attacking = true;
      this.targetPlant = plantInFront;
      this.attackTimer += deltaTime;
      if (this.attackTimer >= this.attackInterval) {
        this.attackTimer = 0;
        this.attack();
      }
    } else {
      this.attacking = false;
      this.targetPlant = null;
      this.x -= this.speed * (deltaTime / 16);
    }

    if (this.health <= 0) {
      this.alive = false;
    }
  }

  attack() {
    if (this.targetPlant) {
      this.targetPlant.takeDamage(this.damage);
    }
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  render(ctx) {
    let imageKey = this.type;
    if (this.attacking) {
      imageKey += '_attack';
    }
    const img = assetManager.getImage(imageKey);

    if (img) {
      ctx.drawImage(img, this.x, this.y, 60, 80);
    } else {
      const emoji = this.type === 'cone' ? '🚧' : '🧟';
      ctx.font = '50px Arial';
      ctx.fillText(emoji, this.x, this.y + 50);
    }

    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x + 5, this.y - 5, 50 * healthPercent, 5);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(this.x + 5, this.y - 5, 50, 5);
  }
}
