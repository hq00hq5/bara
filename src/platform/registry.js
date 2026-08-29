/**
 * Game Registry
 * Central registry for all game modules.
 * Adding a new game = registering it here.
 */

const registry = new Map();

export const GameRegistry = {
  /**
   * Register a game module
   * @param {Object} gameModule - Must implement GameModule interface
   */
  register(gameModule) {
    if (!gameModule.id) throw new Error('Game module must have an id');
    if (!gameModule.start) throw new Error('Game module must implement start()');
    registry.set(gameModule.id, gameModule);
  },

  /**
   * Get a game module by ID
   * @param {string} id
   * @returns {Object|null}
   */
  get(id) {
    return registry.get(id) || null;
  },

  /**
   * Get all registered games
   * @returns {Object[]}
   */
  getAll() {
    return Array.from(registry.values());
  },

  /**
   * Check if a game is registered
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return registry.has(id);
  },
};

/**
 * GameModule Interface (documentation)
 * Each game must provide:
 * {
 *   id: string,            // unique game identifier
 *   title: string,         // display name in Arabic
 *   description: string,   // short description
 *   emoji: string,         // emoji icon for the game card
 *   minPlayers: number,
 *   maxPlayers: number,
 *   start: (container, options) => void,  // launch the game
 *   getDefaultSettings: () => Object,
 * }
 */
