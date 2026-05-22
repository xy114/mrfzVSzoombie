import { Game } from './Game.js';
import { assetManager } from './AssetManager.js';

document.addEventListener('DOMContentLoaded', async () => {
  await assetManager.loadImages();
  
  const canvas = document.getElementById('game-canvas');
  const game = new Game(canvas);
  let selectedPlant = null;

  const plantCards = document.querySelectorAll('.plant-card');
  plantCards.forEach(card => {
    card.addEventListener('click', () => {
      const plantType = card.dataset.plant;
      if (selectedPlant === plantType) {
        selectedPlant = null;
        card.classList.remove('selected');
      } else {
        plantCards.forEach(c => c.classList.remove('selected'));
        selectedPlant = plantType;
        card.classList.add('selected');
      }
    });
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (window.game) {
      for (const sun of window.game.suns) {
        const dx = x - sun.x;
        const dy = y - sun.y;
        if (dx > -20 && dx < 40 && dy > -20 && dy < 40) {
          const value = sun.collect();
          window.game.collectSun(value);
          return;
        }
      }

      for (const plant of window.game.plants) {
        if (plant.constructor.name === 'PeaShooter') {
          const px = plant.x;
          const py = plant.y;
          const dx = x - px;
          const dy = y - py;
          if (dx > -10 && dx < 90 && dy > -10 && dy < 100) {
            plant.useSkill(window.game);
            return;
          }
        }
      }
    }

    if (selectedPlant && window.game) {
      window.game.handlePlantClick(x, y, selectedPlant);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && window.game) {
      e.preventDefault();
      for (const plant of window.game.plants) {
        if (plant.constructor.name === 'PeaShooter') {
          if (plant.useSkill(window.game)) {
            break;
          }
        }
      }
    }
  });

  game.start();
  window.game = game;
  console.log('Game initialized successfully');
});