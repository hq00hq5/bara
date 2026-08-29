/**
 * Game Engine — Bara Al-Salfa (برا السالفة)
 * Orchestrates session state, role assignment, question turns, voting, guessing, and scoring.
 * Local-first, offline-ready, memory-secure, supports unlimited consecutive games.
 */

import { StateMachine } from '../../../core/state/StateMachine.js';
import { ScoreEngine } from '../../../core/scoring/ScoreEngine.js';
import { createPlayer, resetPlayerForRound } from '../../../core/models/Player.js';
import { StorageManager } from '../../../core/storage/StorageManager.js';
import { ContentManager } from '../../../content/index.js';
import { RoleAssigner } from './RoleAssigner.js';
import { VotingEngine } from './VotingEngine.js';
import { GuessEngine } from './GuessEngine.js';
import { TurnEngine } from './TurnEngine.js';
import { STATES, EVENTS, TRANSITIONS } from './StateDefs.js';
import { GameConfig } from '../config.js';
import { nanoid } from '../../../core/utils/nanoid.js';

export class BarraAlSalfaEngine {
  constructor() {
    this._fsm = null;
    this._session = null;
    this._scoreEngine = null;
    this._turnEngine = null;
    this._listeners = new Map();

    // Round-specific state
    this._currentItem = null;
    this._guessOptions = null;
    this._roundResult = null;
    this._currentRevealIndex = 0;
    this._isTiebreaker = false;
  }

  // ─── Initialization ───────────────────────────────────────────

  /**
   * Start a new game session with players
   * @param {string[]} playerNames
   * @param {Object} [settingsOverride]
   */
  async start(playerNames, settingsOverride = {}) {
    const settings = { ...GameConfig.defaults, ...settingsOverride };

    // Initialize content manager
    ContentManager.init(GameConfig.id);
    ContentManager.clearSessionRecent();

    // Preload content
    await ContentManager.preload();

    // Build players with unique IDs
    const players = playerNames.map((name) => createPlayer({ name }));

    // Save last players for convenience
    StorageManager.saveLastPlayers(playerNames);

    // Build session (unlimited games)
    this._session = {
      sessionId: nanoid(),
      gameId: GameConfig.id,
      players,
      settings,
      gameState: STATES.IDLE,
      createdAt: new Date().toISOString(),
    };

    // Init score engine with spec rules
    this._scoreEngine = new ScoreEngine(settings.scoreRules);

    // Build state machine
    this._fsm = new StateMachine({
      initial: STATES.IDLE,
      transitions: TRANSITIONS,
      onTransition: ({ from, to, event, payload }) => {
        this._session.gameState = to;
        this._emit('stateChange', { from, to, event, payload, session: this._session });
      },
    });

    // Kick off
    this._fsm.send(EVENTS.START_GAME);
    this._fsm.send(EVENTS.CONFIRM_PLAYERS);

    // Begin role distribution
    await this._doRoleDistribution();
  }

  // ─── Phase Handlers ───────────────────────────────────────────

  /**
   * Role distribution: pick secret item + assign imposter + init turn engine
   */
  async _doRoleDistribution() {
    // Pick a random content item with anti-repeat
    this._currentItem = await ContentManager.getRandomItem({
      difficulty: this._session.settings.difficulty,
    });

    if (!this._currentItem) {
      throw new Error('No content items available');
    }

    // Reset player round flags
    this._session.players = this._session.players.map(resetPlayerForRound);

    // Assign imposter randomly
    this._session.players = RoleAssigner.assign(this._session.players, this._currentItem);

    // Initialize TurnEngine for balanced questioning
    this._turnEngine = new TurnEngine(this._session.players);

    // Reset reveal index & round state
    this._currentRevealIndex = 0;
    this._isTiebreaker = false;
    this._roundResult = null;
    this._guessOptions = null;

    this._fsm.send(EVENTS.ROLES_ASSIGNED);
  }

  /**
   * Mark current player as having seen their secret
   * Returns true if all players have seen, false if more remain
   * @returns {boolean}
   */
  markCurrentPlayerRevealed() {
    const player = this._session.players[this._currentRevealIndex];
    if (player) {
      this._session.players[this._currentRevealIndex] = {
        ...player,
        hasSeenSecret: true,
      };
    }

    this._currentRevealIndex += 1;

    if (this._currentRevealIndex >= this._session.players.length) {
      this._fsm.send(EVENTS.ALL_REVEALED);
      return true;
    }
    return false;
  }

  /**
   * Get player currently due to see their secret
   */
  getCurrentRevealPlayer() {
    return this._session.players[this._currentRevealIndex] || null;
  }

  /**
   * Get next player in reveal order
   */
  getNextRevealPlayer() {
    return this._session.players[this._currentRevealIndex + 1] || null;
  }

  /**
   * Get current question turn from TurnEngine
   */
  getCurrentQuestionTurn() {
    return this._turnEngine?.getCurrentTurn() || null;
  }

  /**
   * Advance to next question turn
   */
  nextQuestionTurn() {
    return this._turnEngine?.nextTurn() || null;
  }

  /**
   * Transition to voting phase
   */
  startVoting() {
    this._session.players = VotingEngine.resetVotes(this._session.players);
    this._isTiebreaker = false;
    this._fsm.send(EVENTS.START_VOTING);
  }

  /**
   * Cast a vote
   * @param {string} voterId
   * @param {string} targetId
   * @returns {{ success: boolean, message?: string }}
   */
  castVote(voterId, targetId) {
    if (!VotingEngine.isValidVote(voterId, targetId, this._session.settings)) {
      return { success: false, message: 'لا يمكنك التصويت على نفسك' };
    }

    const voterIndex = this._session.players.findIndex((p) => p.id === voterId);
    if (voterIndex === -1) return { success: false, message: 'لاعب غير موجود' };

    this._session.players[voterIndex] = {
      ...this._session.players[voterIndex],
      vote: targetId,
    };

    if (VotingEngine.allVotescast(this._session.players)) {
      this._resolveVotes();
    }

    return { success: true };
  }

  /**
   * Resolve votes and determine outcome
   */
  _resolveVotes() {
    const result = VotingEngine.getVoteResult(this._session.players);
    const imposter = RoleAssigner.getImposter(this._session.players);

    this._roundResult = {
      ...this._roundResult,
      votes: this._buildVoteMap(),
      voteResult: result,
    };

    this._fsm.send(EVENTS.ALL_VOTED);

    if (result.isTie && !this._isTiebreaker) {
      // Tie detected — trigger revote
      this._isTiebreaker = true;
      this._roundResult.tiedPlayerIds = result.winners;
      this._fsm.send(EVENTS.TIE_DETECTED);
    } else {
      // Determine if imposter was caught
      const mostVotedId = result.winners[0];
      const wasImposterCaught = mostVotedId === imposter?.id;

      this._roundResult = {
        ...this._roundResult,
        imposterId: imposter?.id,
        mostVotedId,
        wasImposterCaught,
        imposterGuessed: null,
        contentItem: this._currentItem,
      };

      if (wasImposterCaught) {
        this._fsm.send(EVENTS.IMPOSTER_CAUGHT);
      } else {
        this._fsm.send(EVENTS.IMPOSTER_SAFE);
        // Imposter wins
        this._finalizeRound(false, null);
      }
    }
  }

  /**
   * Start tiebreaker revote
   */
  startTiebreaker() {
    this._session.players = VotingEngine.resetVotes(this._session.players);
  }

  /**
   * Submit imposter's guess
   * @param {string} guessItemId
   */
  submitGuess(guessItemId) {
    const isCorrect = GuessEngine.isCorrectGuess(guessItemId, this._currentItem);
    this._roundResult = {
      ...this._roundResult,
      imposterGuessed: isCorrect,
    };

    this._finalizeRound(true, isCorrect);
    this._fsm.send(EVENTS.GUESS_SUBMITTED);
  }

  /**
   * Finalize round: calculate scores & update cumulative rankings
   */
  _finalizeRound(wasImposterCaught, imposterGuessed) {
    this._roundResult.wasImposterCaught = wasImposterCaught;
    this._roundResult.imposterGuessed = imposterGuessed;

    const deltas = this._scoreEngine.calculateRoundScore(
      this._roundResult,
      this._session.players
    );
    this._roundResult.scoreDeltas = deltas;

    // Apply score deltas
    this._session.players = this._scoreEngine.applyDeltas(this._session.players, deltas);
  }

  /**
   * Start next game immediately with same players & accumulated scores
   */
  async nextGame() {
    this._fsm.send(EVENTS.NEXT_ROUND);
    await this._doRoleDistribution();
  }

  /**
   * End game session
   */
  endGame() {
    this._fsm.send(EVENTS.END_GAME);
  }

  /**
   * Load guess options (1 correct + 5 distractors)
   */
  async loadGuessOptions() {
    this._guessOptions = await GuessEngine.buildOptions(
      this._currentItem,
      6
    );
    return this._guessOptions;
  }

  // ─── Getters ──────────────────────────────────────────────────

  getState() { return this._fsm?.getState() || STATES.IDLE; }
  getPlayers() { return [...(this._session?.players || [])]; }
  getCurrentItem() { return this._currentItem; }
  getGuessOptions() { return this._guessOptions; }
  getRoundResult() { return this._roundResult; }
  getSession() { return { ...this._session }; }
  getRankedPlayers() { return this._scoreEngine?.getRanking(this._session.players) || []; }
  getImposter() { return RoleAssigner.getImposter(this._session?.players || []); }
  isTiebreaker() { return this._isTiebreaker; }
  getTiedPlayerIds() { return this._roundResult?.tiedPlayerIds || []; }

  // ─── Event Emitter ────────────────────────────────────────────

  on(event, callback) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(callback);
    return () => this._listeners.get(event)?.delete(callback);
  }

  _emit(event, data) {
    this._listeners.get(event)?.forEach((cb) => cb(data));
    this._listeners.get('*')?.forEach((cb) => cb({ event, ...data }));
  }

  _buildVoteMap() {
    const map = {};
    for (const player of this._session.players) {
      if (player.vote) map[player.id] = player.vote;
    }
    return map;
  }

  getVoteBreakdown() {
    const tally = VotingEngine.countVotes(this._session.players);
    return VotingEngine.getVoteBreakdown(tally, this._session.players);
  }
}
