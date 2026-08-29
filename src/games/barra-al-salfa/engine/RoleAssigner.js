/**
 * Role Assigner — بارا السالفة
 * Randomly assigns the Imposter role among players.
 * Selection is independent of player order.
 */

import { RandomEngine } from '../../../core/random/RandomEngine.js';

export const RoleAssigner = {
  /**
   * Assign roles to players for a round
   * @param {Player[]} players
   * @param {Object} contentItem - The secret content item
   * @returns {Player[]} Updated players with isImposter set
   */
  assign(players, contentItem) {
    if (!players || players.length < 2) {
      throw new Error('Need at least 2 players to assign roles');
    }

    // Randomly pick imposter index (not based on order)
    const imposterIndex = RandomEngine.pickImposterIndex(players.length);

    return players.map((player, index) => ({
      ...player,
      isImposter: index === imposterIndex,
      hasSeenSecret: false,
      vote: null,
      currentRoundScore: 0,
    }));
  },

  /**
   * Get the imposter from a player list
   * @param {Player[]} players
   * @returns {Player|null}
   */
  getImposter(players) {
    return players.find((p) => p.isImposter) || null;
  },

  /**
   * Get the non-imposter players
   * @param {Player[]} players
   * @returns {Player[]}
   */
  getInsiders(players) {
    return players.filter((p) => !p.isImposter);
  },
};
