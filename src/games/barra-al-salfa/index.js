/**
 * Bara Al-Salfa (برا السالفة) — Game Module Entry
 * Implements the GameModule interface for the Lammtna Platform Game Registry.
 */

import { GameConfig } from './config.js';
import { BarraAlSalfaEngine } from './engine/GameEngine.js';
import { showToast } from '../../components/ui.js';
import { renderGameLandingScreen } from './screens/GameLandingScreen.js';
import { renderPlayerSetupScreen } from './screens/PlayerSetupScreen.js';
import { renderSecretRevealScreen } from './screens/SecretRevealScreen.js';
import { renderQuestionPhaseScreen } from './screens/QuestionPhaseScreen.js';
import { renderVotingScreen } from './screens/VotingScreen.js';
import { renderVoteResultScreen } from './screens/VoteResultScreen.js';
import { renderImposterGuessScreen } from './screens/ImposterGuessScreen.js';
import { renderRoundResultScreen } from './screens/RoundResultScreen.js';

export const BarraAlSalfaGameModule = {
  id: GameConfig.id,
  title: GameConfig.title,
  description: GameConfig.description,
  emoji: GameConfig.emoji,
  minPlayers: GameConfig.minPlayers,
  maxPlayers: GameConfig.maxPlayers,

  getDefaultSettings() {
    return { ...GameConfig.defaults };
  },

  /**
   * Start a game instance inside a DOM container
   * @param {HTMLElement} container
   * @param {Object} options
   * @param {Function} [options.onExit] - Callback when returning to platform home
   */
  start(container, options = {}) {
    const engine = new BarraAlSalfaEngine();
    let savedPlayerNames = [];

    const handleHome = () => {
      if (options.onExit) options.onExit();
    };

    // ── Screen Navigation Flow ──

    function showLanding() {
      renderGameLandingScreen(container, {
        onStartSetup: () => showPlayerSetup(),
        onHome: handleHome,
      });
    }

    function showPlayerSetup() {
      renderPlayerSetupScreen(container, {
        gameConfig: GameConfig,
        onStart: async (playerNames) => {
          savedPlayerNames = playerNames;
          try {
            await engine.start(playerNames, options.settingsOverride || {});
            showSecretReveal();
          } catch (err) {
            console.error('Failed to start game:', err);
            showToast(`خطأ في بدء اللعبة: ${err.message || err}`);
          }
        },
        onHome: handleHome,
      });
    }

    function showSecretReveal() {
      renderSecretRevealScreen(container, {
        gameEngine: engine,
        onAllRevealed: () => {
          showQuestionPhase();
        },
        onHome: handleHome,
      });
    }

    function showQuestionPhase() {
      renderQuestionPhaseScreen(container, {
        gameEngine: engine,
        onStartVoting: () => {
          engine.startVoting();
          showVoting(false);
        },
        onHome: handleHome,
      });
    }

    function showVoting(isTiebreaker = false) {
      renderVotingScreen(container, {
        gameEngine: engine,
        isTiebreaker,
        onVotingComplete: () => {
          showVoteResult();
        },
        onHome: handleHome,
      });
    }

    function showVoteResult() {
      renderVoteResultScreen(container, {
        gameEngine: engine,
        onStartTiebreaker: () => {
          engine.startTiebreaker();
          showVoting(true);
        },
        onProceedToGuess: () => {
          showImposterGuess();
        },
        onProceedToRoundResult: () => {
          showRoundResult();
        },
        onHome: handleHome,
      });
    }

    function showImposterGuess() {
      renderImposterGuessScreen(container, {
        gameEngine: engine,
        onGuessCompleted: () => {
          showRoundResult();
        },
        onHome: handleHome,
      });
    }

    function showRoundResult() {
      renderRoundResultScreen(container, {
        gameEngine: engine,
        onNextRound: async () => {
          await engine.nextGame();
          showSecretReveal();
        },
        onHome: handleHome,
      });
    }

    // Launch with Game Landing Screen
    showLanding();

    return {
      engine,
      destroy() {
        // Cleanup on module exit
      },
    };
  },
};
