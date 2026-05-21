export class WaveManager {
  constructor(game) {
    this.game = game;
    this.wave = 0;
    this.zombiesToSpawn = 0;
    this.spawnInterval = 3000;
    this.lastSpawnTime = 0;
    this.waveComplete = true;
    this.zombiesInWave = 3;
  }

  update(deltaTime, currentTime) {
    if (this.waveComplete) {
      this.startNextWave();
    }

    if (this.zombiesToSpawn > 0 && currentTime - this.lastSpawnTime >= this.spawnInterval) {
      this.lastSpawnTime = currentTime;
      this.zombiesToSpawn--;
      const type = Math.random() < 0.3 ? 'cone' : 'normal';
      this.game.spawnZombie(type);
    }

    if (this.zombiesToSpawn === 0 && this.game.zombies.length === 0 && !this.waveComplete) {
      this.waveComplete = true;
    }
  }

  startNextWave() {
    this.wave++;
    this.zombiesInWave = 3 + this.wave * 2;
    this.zombiesToSpawn = this.zombiesInWave;
    this.spawnInterval = Math.max(1000, 3000 - this.wave * 100);
    this.waveComplete = false;
    this.game.updateWaveDisplay();
  }
}