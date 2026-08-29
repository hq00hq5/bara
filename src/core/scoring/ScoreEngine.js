/**
 * Score Engine — Lammtna Platform & Bara Al-Salfa
 * Implements the exact modular scoring rules from Section 31 of the Master Specification:
 *
 * 1. If Imposter is NOT identified:
 *    - Imposter: +200 points
 *    - Other players: 0 points
 *
 * 2. If Imposter is identified AND correctly guesses the secret:
 *    - Imposter: +200 points
 *    - Players who correctly identified the Imposter: +50 points
 *
 * 3. If Imposter is identified AND fails to guess:
 *    - Each correct voter: +150 points
 *    - Imposter: 0 points
 */

/**
 * @typedef {Object} ScoreDelta
 * @property {string} playerId
 * @property {number} points
 * @property {string} reason
 */

export class ScoreEngine {
  constructor(rules = {}) {
    this.rules = {
      imposterWinsPoints: 200,
      imposterCaughtAndGuessedPoints: 200,
      voterRewardWhenImposterGuesses: 50,
      voterRewardWhenImposterFails: 150,
      voterInitialReward: 100,
      ...rules,
    };
  }

  /**
   * Calculate score deltas for a game outcome
   * @param {Object} roundResult
   * @param {Player[]} players
   * @returns {ScoreDelta[]}
   */
  calculateRoundScore(roundResult, players) {
    const { wasImposterCaught, imposterGuessed, imposterId, votes } = roundResult;
    const deltas = [];

    if (!wasImposterCaught) {
      // 1. Imposter escaped (NOT caught)
      deltas.push({
        playerId: imposterId,
        points: this.rules.imposterWinsPoints,
        reason: 'imposter_not_caught',
      });
    } else {
      // 2. Imposter was caught
      if (imposterGuessed === true) {
        // Imposter guessed secret correctly
        deltas.push({
          playerId: imposterId,
          points: this.rules.imposterCaughtAndGuessedPoints,
          reason: 'imposter_correct_guess',
        });

        // Players who correctly identified the imposter get 50 points
        for (const [voterId, targetId] of Object.entries(votes || {})) {
          if (targetId === imposterId && voterId !== imposterId) {
            deltas.push({
              playerId: voterId,
              points: this.rules.voterRewardWhenImposterGuesses,
              reason: 'voted_imposter_who_guessed',
            });
          }
        }
      } else {
        // Imposter failed to guess (or didn't guess)
        for (const [voterId, targetId] of Object.entries(votes || {})) {
          if (targetId === imposterId && voterId !== imposterId) {
            deltas.push({
              playerId: voterId,
              points: this.rules.voterRewardWhenImposterFails,
              reason: 'voted_imposter_who_failed',
            });
          }
        }
      }
    }

    return deltas;
  }

  /**
   * Apply score deltas to player array while persisting cumulative scores
   * @param {Player[]} players
   * @param {ScoreDelta[]} deltas
   * @returns {Player[]}
   */
  applyDeltas(players, deltas) {
    const deltaMap = new Map();
    for (const d of deltas) {
      const current = deltaMap.get(d.playerId) || 0;
      deltaMap.set(d.playerId, current + d.points);
    }

    return players.map((player) => {
      const points = deltaMap.get(player.id) || 0;
      return {
        ...player,
        score: (player.score || 0) + points,
        currentRoundScore: points,
      };
    });
  }

  /**
   * Get players sorted by score descending
   * @param {Player[]} players
   * @returns {Player[]}
   */
  getRanking(players) {
    return [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  }
}
