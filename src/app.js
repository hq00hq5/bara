/**
 * Platform Application Shell
 * Orchestrates Platform initialization, GameRegistry, and Router.
 */

import { GameRegistry } from './platform/registry.js';
import { router } from './platform/router.js';
import { renderHomeScreen } from './platform/screens/HomeScreen.js';
import { renderSettingsScreen } from './platform/screens/SettingsScreen.js';
import { BarraAlSalfaGameModule } from './games/barra-al-salfa/index.js';
import { StorageManager } from './core/storage/StorageManager.js';
import { GameConfig } from './games/barra-al-salfa/config.js';

export class App {
  constructor(containerId = 'app') {
    this.container = document.getElementById(containerId);
    this.activeGameInstance = null;
  }

  init() {
    // 1. Register Game Modules in the Platform GameRegistry
    GameRegistry.register(BarraAlSalfaGameModule);

    // 2. Setup SPA Routes
    router
      .on('/', () => {
        this.showHome();
      })
      .on('/settings', () => {
        this.showSettings();
      })
      .on('/game', (params) => {
        const gameId = params?.id || BarraAlSalfaGameModule.id;
        this.launchGame(gameId);
      });

    // 3. Initialize Router
    router.init();
  }

  showHome() {
    this._cleanupGame();
    renderHomeScreen(this.container, {
      onSelectGame: (gameId) => {
        router.navigate('/game', { id: gameId });
      },
      onOpenSettings: () => {
        router.navigate('/settings');
      },
    });
  }

  showSettings() {
    this._cleanupGame();
    renderSettingsScreen(this.container, {
      onBack: () => {
        router.navigate('/');
      },
    });
  }

  launchGame(gameId) {
    this._cleanupGame();
    const gameModule = GameRegistry.get(gameId);
    if (!gameModule) {
      router.navigate('/');
      return;
    }

    // Load custom settings for this game
    const settingsOverride = StorageManager.getGameSettings(gameId) || {};

    this.activeGameInstance = gameModule.start(this.container, {
      settingsOverride,
      onExit: () => {
        router.navigate('/');
      },
    });
  }

  _cleanupGame() {
    if (this.activeGameInstance?.destroy) {
      this.activeGameInstance.destroy();
    }
    this.activeGameInstance = null;
  }
}
