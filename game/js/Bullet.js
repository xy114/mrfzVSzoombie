export class Bullet {
  constructor(x, y, row) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.speed = 5;
    this.damage = 20;
    this.width = 20;
    this.height = 20;
    this.active = true;
  }

  update(deltaTime) {
    this.x += this.speed * (deltaTime / 16);
  }

  render(ctx) {
    ctx.font = '20px Arial';
    ctx.fillText('🟢', this.x, this.y + 15);
  }
}

export class FireBullet {
  constructor(x, y, row) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.speed = 7;
    this.damage = 50;
    this.explosionRadius = 1.5;
    this.width = 25;
    this.height = 25;
    this.active = true;
    this.exploded = false;
  }

  update(deltaTime, game) {
    if (this.exploded) {
      this.active = false;
      return;
    }

    this.x += this.speed * (deltaTime / 16);

    const hitZombie = game.zombies.find(z =>
      z.row === this.row &&
      z.x < this.x + 30 &&
      z.x > this.x - 30
    );

    if (hitZombie) {
      this.explode(game);
    }

    if (this.x > game.canvas.width) {
      this.active = false;
    }
  }

  explode(game) {
    this.exploded = true;
    this.active = false;

    const cellWidth = 100;
    const cellHeight = 108;
    const centerCol = Math.floor(this.x / cellWidth);
    const centerRow = this.row;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const targetRow = centerRow + dr;
        const targetCol = centerCol + dc;

        game.zombies.forEach(zombie => {
          if (zombie.row === targetRow) {
            const zombieCol = Math.floor(zombie.x / cellWidth);
            if (Math.abs(zombieCol - targetCol) <= 1) {
              zombie.takeDamage(this.damage);
            }
          }
        });

        game.plants.forEach(plant => {
          if (plant.row === targetRow) {
            const plantCol = Math.floor(plant.x / cellWidth);
            if (Math.abs(plantCol - targetCol) <= 1) {
              plant.takeDamage(this.damage * 0.5);
            }
          }
        });
      }
    }
  }

  render(ctx) {
    ctx.font = '25px Arial';
    ctx.fillText('🔥', this.x - 5, this.y + 15);
    if (this.exploded) {
      ctx.font = '40px Arial';
      ctx.fillText('💥', this.x - 20, this.y + 25);
    }
  }
}