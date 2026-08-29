/**
 * Voting Engine — بارا السالفة
 * Handles vote counting, tie detection, and tiebreaker logic.
 */

export const VotingEngine = {
  /**
   * Count votes and return vote tally
   * @param {Player[]} players
   * @returns {Object} { [playerId]: voteCount }
   */
  countVotes(players) {
    const tally = {};
    for (const player of players) {
      if (player.vote) {
        tally[player.vote] = (tally[player.vote] || 0) + 1;
      }
    }
    return tally;
  },

  /**
   * Get the player(s) with the most votes
   * @param {Player[]} players
   * @returns {{ winners: string[], tally: Object, isTie: boolean }}
   */
  getVoteResult(players) {
    const tally = this.countVotes(players);
    if (Object.keys(tally).length === 0) {
      return { winners: [], tally, isTie: false };
    }

    const maxVotes = Math.max(...Object.values(tally));
    const winners = Object.entries(tally)
      .filter(([, count]) => count === maxVotes)
      .map(([id]) => id);

    return {
      winners,
      tally,
      isTie: winners.length > 1,
      maxVotes,
    };
  },

  /**
   * Check if all eligible players have voted
   * @param {Player[]} players
   * @param {Object} settings
   * @returns {boolean}
   */
  allVotescast(players) {
    return players.every((p) => p.vote !== null);
  },

  /**
   * Validate a vote: player can't vote for themselves (if rule applies)
   * @param {string} voterId
   * @param {string} targetId
   * @param {Object} settings
   * @returns {boolean}
   */
  isValidVote(voterId, targetId, settings) {
    if (!settings.allowSelfVote && voterId === targetId) {
      return false;
    }
    return true;
  },

  /**
   * Reset all votes for a new voting round
   * @param {Player[]} players
   * @returns {Player[]}
   */
  resetVotes(players) {
    return players.map((p) => ({ ...p, vote: null }));
  },

  /**
   * Get vote breakdown as array for display
   * @param {Object} tally
   * @param {Player[]} players
   * @returns {{ player: Player, votes: number }[]}
   */
  getVoteBreakdown(tally, players) {
    return Object.entries(tally)
      .map(([playerId, votes]) => ({
        player: players.find((p) => p.id === playerId),
        votes,
      }))
      .filter((entry) => entry.player)
      .sort((a, b) => b.votes - a.votes);
  },
};
