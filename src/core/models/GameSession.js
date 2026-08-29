/**
 * GameSession Model
 * Represents a single play session. Single source of truth.
 */

import { nanoid } from '../utils/nanoid.js';

/**
 * Create a new GameSession
 * @param {Object} opts
 * @returns {GameSession}
 */
export function createGameSession({ gameId, players, settings }) {
  return {
    sessionId: nanoid(),
    gameId,
    players: [...players],
    currentRound: 0,
    totalRounds: settings.totalRounds || 3,
    settings: { ...settings },
    gameState: 'IDLE',
    roundHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update session with partial data
 * @param {GameSession} session
 * @param {Object} updates
 * @returns {GameSession}
 */
export function updateSession(session, updates) {
  return {
    ...session,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Add a round result to session history
 * @param {GameSession} session
 * @param {Object} roundResult
 * @returns {GameSession}
 */
export function addRoundResult(session, roundResult) {
  return {
    ...session,
    roundHistory: [...session.roundHistory, roundResult],
    updatedAt: new Date().toISOString(),
  };
}
