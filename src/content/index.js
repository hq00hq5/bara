/**
 * Content Manager — Lammtna & Bara Al-Salfa
 * Direct static imports for 100% reliable offline content loading.
 * Anti-repeat algorithm using session memory and persistent local storage.
 */

import { RandomEngine } from '../core/random/RandomEngine.js';
import { StorageManager } from '../core/storage/StorageManager.js';

// Direct static JSON imports — Vite handles these natively in both dev & production
// No "with { type: 'json' }" needed — Vite transforms JSON to ESM by default
import animalsData from './animals.json' with { type: 'json' };
import carsData from './cars.json' with { type: 'json' };
import citiesData from './cities.json' with { type: 'json' };
import clothesData from './clothes.json' with { type: 'json' };
import countriesData from './countries.json' with { type: 'json' };
import electronicsData from './electronics.json' with { type: 'json' };
import foodData from './food.json' with { type: 'json' };
import fruitsData from './fruits.json' with { type: 'json' };
import miscellaneousData from './miscellaneous.json' with { type: 'json' };
import natureData from './nature.json' with { type: 'json' };
import objectsData from './objects.json' with { type: 'json' };
import placesData from './places.json' with { type: 'json' };
import professionsData from './professions.json' with { type: 'json' };
import sportsData from './sports.json' with { type: 'json' };
import technologyData from './technology.json' with { type: 'json' };
import toolsData from './tools.json' with { type: 'json' };
import vegetablesData from './vegetables.json' with { type: 'json' };
import vehiclesData from './vehicles.json' with { type: 'json' };

// Complete list of all content categories
const ALL_DATA_MODULES = [
  { key: 'animals',       data: animalsData },
  { key: 'cars',          data: carsData },
  { key: 'cities',        data: citiesData },
  { key: 'clothes',       data: clothesData },
  { key: 'countries',     data: countriesData },
  { key: 'electronics',   data: electronicsData },
  { key: 'food',          data: foodData },
  { key: 'fruits',        data: fruitsData },
  { key: 'miscellaneous', data: miscellaneousData },
  { key: 'nature',        data: natureData },
  { key: 'objects',       data: objectsData },
  { key: 'places',        data: placesData },
  { key: 'professions',   data: professionsData },
  { key: 'sports',        data: sportsData },
  { key: 'technology',    data: technologyData },
  { key: 'tools',         data: toolsData },
  { key: 'vegetables',    data: vegetablesData },
  { key: 'vehicles',      data: vehiclesData },
];

export const CONTENT_CATEGORIES = [
  { id: 'animals',       label: 'حيوانات' },
  { id: 'food',          label: 'طعام' },
  { id: 'fruits',        label: 'فواكه' },
  { id: 'vegetables',    label: 'خضار' },
  { id: 'objects',       label: 'أشياء' },
  { id: 'electronics',   label: 'إلكترونيات' },
  { id: 'sports',        label: 'رياضة' },
  { id: 'places',        label: 'أماكن' },
  { id: 'professions',   label: 'مهن' },
  { id: 'countries',     label: 'دول' },
  { id: 'cities',        label: 'مدن' },
  { id: 'cars',          label: 'سيارات' },
  { id: 'vehicles',      label: 'مركبات' },
  { id: 'tools',         label: 'أدوات' },
  { id: 'nature',        label: 'طبيعة' },
  { id: 'technology',    label: 'تقنية' },
  { id: 'clothes',       label: 'ملابس' },
  { id: 'miscellaneous', label: 'متنوع' },
];

class ContentManagerClass {
  constructor() {
    this._cache = new Map();
    this._sessionRecent = new Set();
    this._gameId = null;
    // Load all content at module initialization time (synchronous — data is bundled)
    this._loadAllData();
  }

  _loadAllData() {
    this._cache.clear();
    for (const { key, data } of ALL_DATA_MODULES) {
      let items = [];
      const actualData = data && data.default ? data.default : data;
      
      if (Array.isArray(actualData)) {
        // Handle case where JSON is a bare array
        items = actualData;
      } else if (actualData && Array.isArray(actualData.items)) {
        // Handle case where JSON has { items: [...] }
        items = actualData.items;
      }
      const validItems = items.filter((item) => item && item.enabled !== false);
      if (validItems.length > 0) {
        this._cache.set(key, validItems);
      }
    }
  }

  /**
   * Direct data injection (used by Node.js test scripts)
   */
  loadCategoryData(categoryName, items) {
    this._cache.set(categoryName, items);
  }

  init(gameId) {
    this._gameId = gameId;
    this._sessionRecent.clear();
    // Ensure cache is populated (defensive — should already be populated from constructor)
    if (this._cache.size === 0) {
      this._loadAllData();
    }
  }

  async preload() {
    // All data is already loaded synchronously at module init — no async needed
    return Promise.resolve();
  }

  async getAllItems() {
    // Safety: reload if cache is empty (shouldn't happen but defensive)
    if (this._cache.size === 0) {
      this._loadAllData();
    }
    let all = [];
    for (const items of this._cache.values()) {
      all = all.concat(items);
    }
    return all;
  }

  /**
   * Pick a random content item with anti-repeat (session memory + localStorage)
   */
  async getRandomItem(options = {}) {
    let allItems = await this.getAllItems();
    if (allItems.length === 0) return null;

    // Optional difficulty filter
    if (options.difficulty && options.difficulty !== 'mixed') {
      const filtered = allItems.filter((i) => i.difficulty === options.difficulty);
      if (filtered.length > 0) allItems = filtered;
    }

    // Exclude recently used items (anti-repeat)
    const persistentRecent = this._gameId
      ? StorageManager.getRecentContent(this._gameId)
      : [];
    const excludeIds = new Set([...this._sessionRecent, ...persistentRecent]);
    const available = allItems.filter((item) => !excludeIds.has(item.id));

    // If all items excluded, fall back progressively
    const pool = available.length > 0
      ? available
      : allItems.filter((item) => !this._sessionRecent.has(item.id));

    const picked = RandomEngine.pick(pool.length > 0 ? pool : allItems);
    if (!picked) return null;

    // Remember this item to avoid immediate repetition
    this._sessionRecent.add(picked.id);
    if (this._gameId) {
      StorageManager.addRecentContent(this._gameId, picked.id, 50);
    }

    return picked;
  }

  /**
   * Get distractors for the Imposter Guess screen (2-3 same category + 2-3 cross-category)
   */
  async getDistractors(correctItem, count = 5) {
    const allItems = await this.getAllItems();
    const pool = allItems.filter(
      (item) => item.id !== correctItem.id && item.text !== correctItem.text
    );
    if (pool.length === 0) return [];

    const sameCategory = pool.filter((item) => item.category === correctItem.category);
    const otherCategory = pool.filter((item) => item.category !== correctItem.category);

    const fromSameCount = Math.min(2, sameCategory.length);
    const fromSame = RandomEngine.pickN(sameCategory, fromSameCount);
    const remainingCount = count - fromSame.length;
    const fromOtherPool = otherCategory.filter(
      (item) => !fromSame.find((s) => s.id === item.id)
    );
    const fromOther = RandomEngine.pickN(fromOtherPool, remainingCount);

    return [...fromSame, ...fromOther];
  }

  getCategoryLabel(categoryId) {
    return CONTENT_CATEGORIES.find((c) => c.id === categoryId)?.label || categoryId;
  }

  clearSessionRecent() {
    this._sessionRecent.clear();
  }
}

export const ContentManager = new ContentManagerClass();
