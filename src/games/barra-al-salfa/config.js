/**
 * Game Configuration — Bara Al-Salfa (برا السالفة)
 */
export const GameConfig = {
  id: 'barra-al-salfa',
  title: 'برا السالفة',
  englishTitle: 'Bara Al-Salfa',
  description: 'الكل يعرف السالفة إلا واحد برا السالفة — هل تقدرون تكشفونه؟',
  emoji: '🤫',

  // Dynamic player limits (3 to 20 players)
  minPlayers: 3,
  maxPlayers: 20,

  defaults: {
    difficulty: 'mixed',
    allowSelfVote: false,
    guessOptionsCount: 6, // 1 correct + 5 distractors
    scoreRules: {
      imposterWinsPoints: 200,
      imposterCaughtAndGuessedPoints: 200,
      voterRewardWhenImposterGuesses: 50,
      voterRewardWhenImposterFails: 150,
      voterInitialReward: 100,
    },
  },

  storageKey: 'barra_al_salfa',
};
