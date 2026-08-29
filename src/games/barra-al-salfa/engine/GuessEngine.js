/**
 * Guess Engine — بارا السالفة
 * Generates guess options (correct answer + distractors) for the Imposter.
 */

import { RandomEngine } from '../../../core/random/RandomEngine.js';
import { ContentManager } from '../../../content/index.js';

export const GuessEngine = {
  /**
   * Build a list of guess options for the imposter
   * @param {Object} correctItem - The correct ContentItem
   * @param {number} totalOptions - Total options including correct (default 6)
   * @param {string[]} [categories] - Available categories for distractors
   * @returns {Promise<{ item: Object, isCorrect: boolean }[]>}
   */
  async buildOptions(correctItem, totalOptions = 6, categories = []) {
    const distractorCount = totalOptions - 1;

    // Get distractors from ContentManager
    const distractors = await ContentManager.getDistractors(
      correctItem,
      distractorCount,
      categories
    );

    // Build option objects
    const options = [
      { item: correctItem, isCorrect: true },
      ...distractors.map((item) => ({ item, isCorrect: false })),
    ];

    // Deduplicate by text (in case of collision)
    const seen = new Set();
    const unique = options.filter(({ item }) => {
      if (seen.has(item.text)) return false;
      seen.add(item.text);
      return true;
    });

    // Shuffle so correct answer isn't always in same position
    return RandomEngine.shuffle(unique);
  },

  /**
   * Check if a guess is correct
   * @param {string} guessId - The guessed item's ID
   * @param {Object} correctItem - The correct ContentItem
   * @returns {boolean}
   */
  isCorrectGuess(guessId, correctItem) {
    return guessId === correctItem.id;
  },
};
