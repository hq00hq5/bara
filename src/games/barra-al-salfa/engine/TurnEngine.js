/**
 * Turn Engine — Balanced Random Question Graph Engine
 * Implements Sections 20-25 of the Master Specification:
 * - Directed question graph: Player A -> Player B
 * - Fairness & balance: every player gets fair opportunity to ask and be asked
 * - Scalable from 3 to 20 players
 * - Anti-repetition & candidate penalty scoring
 */

import { RandomEngine } from '../../../core/random/RandomEngine.js';

export class TurnEngine {
  /**
   * @param {Player[]} players
   */
  constructor(players = []) {
    this.players = [...players];
    this.history = []; // Array of { askerId, targetId, timestamp }
    this.askCounts = new Map(); // playerId -> number of times asked
    this.targetCounts = new Map(); // playerId -> number of times targeted

    this.players.forEach((p) => {
      this.askCounts.set(p.id, 0);
      this.targetCounts.set(p.id, 0);
    });

    this.turnSequence = [];
    this.currentTurnIndex = 0;
    this._generateBalancedSequence();
  }

  /**
   * Generate a randomized but balanced question cycle for all players
   */
  _generateBalancedSequence() {
    if (this.players.length < 2) return;

    // Randomize initial asker order
    const shuffledAskers = RandomEngine.shuffle([...this.players]);
    const sequence = [];
    const recentPairs = [];

    for (let i = 0; i < shuffledAskers.length; i++) {
      const asker = shuffledAskers[i];
      const target = this._selectBestTarget(asker, recentPairs);
      if (target) {
        sequence.push({ asker, target });
        recentPairs.push({ askerId: asker.id, targetId: target.id });
      }
    }

    this.turnSequence = sequence;
    this.currentTurnIndex = 0;
  }

  /**
   * Select best candidate target using the penalty scoring algorithm
   * @param {Player} asker
   * @param {Array} recentPairs
   * @returns {Player}
   */
  _selectBestTarget(asker, recentPairs = []) {
    const candidates = this.players.filter((p) => p.id !== asker.id);
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    const scored = candidates.map((candidate) => {
      let penalty = 0;

      const targetCount = this.targetCounts.get(candidate.id) || 0;
      penalty += targetCount * 10; // overTargetedPenalty

      // Has asker already asked this candidate?
      const alreadyAsked = this.history.filter(
        (h) => h.askerId === asker.id && h.targetId === candidate.id
      ).length;
      penalty += alreadyAsked * 20; // alreadyAskedPenalty

      // Immediate reverse relationship? (Candidate just asked Asker)
      const lastPair = recentPairs[recentPairs.length - 1] || this.history[this.history.length - 1];
      if (lastPair && lastPair.askerId === candidate.id && lastPair.targetId === asker.id) {
        penalty += 30; // reversePairPenalty
      }

      // Was candidate targeted in the very last question?
      if (lastPair && lastPair.targetId === candidate.id) {
        penalty += 15; // recentTargetPenalty
      }

      return { candidate, score: penalty };
    });

    // Find the minimum penalty score
    const minScore = Math.min(...scored.map((s) => s.score));
    // Best candidates with minimal penalty
    const bestCandidates = scored
      .filter((s) => s.score <= minScore + 5)
      .map((s) => s.candidate);

    return RandomEngine.pick(bestCandidates) || candidates[0];
  }

  /**
   * Get the current question pair
   * @returns {{ asker: Player, target: Player }}
   */
  getCurrentTurn() {
    if (this.turnSequence.length === 0) {
      this._generateBalancedSequence();
    }
    return this.turnSequence[this.currentTurnIndex % this.turnSequence.length];
  }

  /**
   * Advance to the next question turn
   * @returns {{ asker: Player, target: Player }}
   */
  nextTurn() {
    const current = this.getCurrentTurn();
    if (current) {
      // Record in history & counts
      this.history.push({ askerId: current.asker.id, targetId: current.target.id });
      this.askCounts.set(current.asker.id, (this.askCounts.get(current.asker.id) || 0) + 1);
      this.targetCounts.set(current.target.id, (this.targetCounts.get(current.target.id) || 0) + 1);
    }

    this.currentTurnIndex++;
    if (this.currentTurnIndex >= this.turnSequence.length) {
      // Regenerate fresh balanced cycle
      this._generateBalancedSequence();
    }
    return this.getCurrentTurn();
  }

  /**
   * Get candidates for a specific asker if player chooses interactively
   * @param {Player} asker
   * @returns {Player[]}
   */
  getCandidates(asker) {
    return this.players.filter((p) => p.id !== asker.id);
  }
}
