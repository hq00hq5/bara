/**
 * Storage Manager
 * Unified storage API. Abstracts LocalStorage vs IndexedDB.
 * LocalStorage: settings, preferences, player names, session scores
 * IndexedDB: content library (when large)
 */

// --- LocalStorage Adapter ---
export const LocalStorageAdapter = {
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
};

// --- Storage Keys Registry ---
export const STORAGE_KEYS = {
  // Platform
  PLATFORM_SETTINGS: 'platform_settings',
  LAST_PLAYERS: 'platform_last_players',

  // Game specific (prefixed with game id)
  gameSettings: (gameId) => `${gameId}_settings`,
  gameStats: (gameId) => `${gameId}_stats`,
  recentContent: (gameId) => `${gameId}_recent_content`,
};

// --- StorageManager ---
export const StorageManager = {
  /**
   * Save platform settings
   */
  savePlatformSettings(settings) {
    return LocalStorageAdapter.set(STORAGE_KEYS.PLATFORM_SETTINGS, settings);
  },

  getPlatformSettings() {
    return LocalStorageAdapter.get(STORAGE_KEYS.PLATFORM_SETTINGS, {});
  },

  /**
   * Save last used player names for convenience
   */
  saveLastPlayers(names) {
    return LocalStorageAdapter.set(STORAGE_KEYS.LAST_PLAYERS, names);
  },

  getLastPlayers() {
    return LocalStorageAdapter.get(STORAGE_KEYS.LAST_PLAYERS, []);
  },

  /**
   * Game-specific settings
   */
  saveGameSettings(gameId, settings) {
    return LocalStorageAdapter.set(STORAGE_KEYS.gameSettings(gameId), settings);
  },

  getGameSettings(gameId) {
    return LocalStorageAdapter.get(STORAGE_KEYS.gameSettings(gameId), null);
  },

  /**
   * Recently used content (for anti-repeat)
   */
  saveRecentContent(gameId, contentIds) {
    return LocalStorageAdapter.set(STORAGE_KEYS.recentContent(gameId), contentIds);
  },

  getRecentContent(gameId) {
    return LocalStorageAdapter.get(STORAGE_KEYS.recentContent(gameId), []);
  },

  addRecentContent(gameId, contentId, maxStore = 50) {
    const recent = this.getRecentContent(gameId);
    const updated = [contentId, ...recent.filter((id) => id !== contentId)].slice(0, maxStore);
    return this.saveRecentContent(gameId, updated);
  },
};
