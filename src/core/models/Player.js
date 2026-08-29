/**
 * Player Model
 * Immutable-style factory. All mutations return new objects.
 */

let _playerIdCounter = 0;

/**
 * Create a new Player
 * @param {Object} opts
 * @returns {Player}
 */
export function createPlayer({ name, id = null }) {
  return {
    id: id || `player_${++_playerIdCounter}_${Date.now()}`,
    name: name.trim(),
    score: 0,
    currentRoundScore: 0,
    isImposter: false,
    vote: null,        // playerId they voted for
    hasAnswered: false,
    hasSeenSecret: false,
  };
}

/**
 * Reset round-specific fields for a new round
 * @param {Player} player
 * @returns {Player}
 */
export function resetPlayerForRound(player) {
  return {
    ...player,
    currentRoundScore: 0,
    isImposter: false,
    vote: null,
    hasAnswered: false,
    hasSeenSecret: false,
  };
}

/**
 * Apply score delta to a player
 * @param {Player} player
 * @param {number} delta
 * @returns {Player}
 */
export function applyScore(player, delta) {
  return {
    ...player,
    score: player.score + delta,
    currentRoundScore: player.currentRoundScore + delta,
  };
}

/**
 * Get player display initial (first char of name)
 * @param {Player} player
 * @returns {string}
 */
export function getPlayerInitial(player) {
  return player.name.charAt(0).toUpperCase();
}

/**
 * Reset the ID counter (for fresh sessions)
 */
export function resetPlayerIdCounter() {
  _playerIdCounter = 0;
}
