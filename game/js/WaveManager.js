import { getZombieDef } from './ZombieConfig.js';

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

  _getAllowedTypes() {
    const isLastWave = this.wave >= this.maxWaves;
    return this.zombieTypes.filter(type => {
      const def = getZombieDef(type);
      if (!def) return true;
      if (def.category === 'elite' && this.wave === 1) return false;
      if (def.category === 'boss' && !isLastWave) return false;
      return true;
    });
  }

  _pickZombieType() {
    // First zombie of each wave is always a flag zombie
    if (this.zombiesToSpawn === this.zombiesInWave) {
      return 'flag';
    }
    const types = this._getAllowedTypes();
    if (types.length === 0) return this.zombieTypes[0];
    if (types.length === 1) return types[0];
    // Weighted random based on available types
    const roll = Math.random();
    if (types.includes('imp') && roll < 0.2) return 'imp';
    if (types.includes('shield') && roll < 0.4) return 'shield';
    if (types.includes('cone') && roll < 0.55) return 'cone';
    return types.includes('normal') ? 'normal' : types[0];
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
