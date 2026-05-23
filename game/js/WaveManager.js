export class WaveManager {
  constructor(game, maxWaves = 3, zombieTypes = ['normal']) {
    this.game = game;
    this.wave = 0;
    this.maxWaves = maxWaves;
    this.zombieTypes = zombieTypes;
    this.zombiesToSpawn = 0;
    this.spawnInterval = 3000;
    this.lastSpawnTime = 0;
    this.waveComplete = true;
    this.zombiesInWave = 3;
  }

  _pickZombieType() {
    if (this.zombieTypes.length === 1) return this.zombieTypes[0];
    return Math.random() < 0.3 ? 'cone' : 'normal';
  }

  update(deltaTime, currentTime) {
    if (this.waveComplete && this.wave < this.maxWaves) {
      this.startNextWave();
    }

    if (this.zombiesToSpawn > 0 && currentTime - this.lastSpawnTime >= this.spawnInterval) {
      this.lastSpawnTime = currentTime;
      this.zombiesToSpawn--;
      this.game.spawnZombie(this._pickZombieType());
    }

    if (this.zombiesToSpawn === 0 && this.game.zombies.length === 0 && !this.waveComplete) {
      this.waveComplete = true;
    }
  }

  allWavesComplete() {
    return this.wave >= this.maxWaves && this.zombiesToSpawn === 0 && this.game.zombies.length === 0;
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
