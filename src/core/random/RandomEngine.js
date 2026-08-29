/**
 * Random Engine
 * Cryptographically seeded randomness for fair game results.
 * Handles: shuffle, pick, weighted selection, anti-repeat.
 */

export const RandomEngine = {
  /**
   * Get a random integer in [0, max)
   * Uses crypto.getRandomValues for fairness
   */
  int(max) {
    if (max <= 0) return 0;
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  },

  /**
   * Get a random integer in [min, max] inclusive
   */
  intRange(min, max) {
    return min + this.int(max - min + 1);
  },

  /**
   * Shuffle array in place (Fisher-Yates)
   * @param {Array} arr
   * @returns {Array} same array, shuffled
   */
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  /**
   * Pick a random element from array
   * @param {Array} arr
   * @returns {*}
   */
  pick(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[this.int(arr.length)];
  },

  /**
   * Pick N unique random elements from array
   * @param {Array} arr
   * @param {number} n
   * @returns {Array}
   */
  pickN(arr, n) {
    if (!arr || arr.length === 0) return [];
    const shuffled = this.shuffle(arr);
    return shuffled.slice(0, Math.min(n, shuffled.length));
  },

  /**
   * Pick random element EXCLUDING certain items
   * @param {Array} arr
   * @param {Array} excludeIds - IDs to exclude
   * @param {string} idKey - Key to use for ID comparison (default: 'id')
   * @returns {*}
   */
  pickExcluding(arr, excludeIds, idKey = 'id') {
    const excludeSet = new Set(excludeIds);
    const filtered = arr.filter((item) => !excludeSet.has(item[idKey]));
    // If all items are excluded, fall back to full array
    return this.pick(filtered.length > 0 ? filtered : arr);
  },

  /**
   * Pick a random index from a list of players (for imposter selection)
   * Ensures fair selection regardless of player order
   * @param {number} playerCount
   * @returns {number} index
   */
  pickImposterIndex(playerCount) {
    return this.int(playerCount);
  },
};
