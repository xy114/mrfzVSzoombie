import { GAME_CONFIG, ZOMBIE_TYPES } from './constants.js';

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
    this.damage = 10;
    this.alive = true;
    this.attacking = false;
    this.targetPlant = null;
  }

  update(deltaTime, game) {
    const plantInFront = game.plants.find(p =>
      p.row === this.row &&
      p.x < this.x + 100 &&
      p.x > this.x - 20
    );

    if (plantInFront) {
      this.attacking = true;
      this.targetPlant = plantInFront;
      this.attack(deltaTime);
    } else {
      this.attacking = false;
      this.targetPlant = null;
      this.x -= this.speed * (deltaTime / 16);
    }

    if (this.health <= 0) {
      this.alive = false;
    }
  }

  attack(deltaTime) {
    if (this.targetPlant) {
      this.targetPlant.takeDamage(this.damage * (deltaTime / 1000));
    }
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  render(ctx) {
    const emoji = this.health > 100 ? '🚧' : '🧟';
    ctx.font = '50px Arial';
    ctx.fillText(emoji, this.x, this.y + 50);

    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x + 5, this.y - 5, 50 * healthPercent, 5);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(this.x + 5, this.y - 5, 50, 5);
  }
}

export class NormalZombie extends Zombie {
  constructor(x, y, row) {
    super(x, y, row);
    this.health = ZOMBIE_TYPES.NORMAL.health;
    this.maxHealth = ZOMBIE_TYPES.NORMAL.health;
    this.speed = ZOMBIE_TYPES.NORMAL.speed;
    this.type = 'normal';
  }
}

export class ConeZombie extends Zombie {
  constructor(x, y, row) {
    super(x, y, row);
    this.health = ZOMBIE_TYPES.CONE.health;
    this.maxHealth = ZOMBIE_TYPES.CONE.health;
    this.speed = ZOMBIE_TYPES.CONE.speed;
    this.type = 'cone';
  }
}