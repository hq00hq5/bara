/**
 * Settings Screen — إعدادات المنصة
 */

import { el, createScreen, primaryBtn, vibrate, showToast } from '../../components/ui.js';
import { StorageManager } from '../../core/storage/StorageManager.js';
import { GameConfig } from '../../games/barra-al-salfa/config.js';

export function renderSettingsScreen(container, { onBack }) {
  const savedSettings = StorageManager.getGameSettings(GameConfig.id) || {};
  let difficulty = savedSettings.difficulty || 'mixed';

  const { screen, center, footer } = createScreen(container, {
    showHome: true,
    onHome: onBack,
    topAlign: true,
  });

  const headerTitle = el('h2', {
    class: 'title-yellow',
    style: { fontSize: '1.6rem', marginBottom: '16px' },
    text: 'الإعدادات',
  });
  center.appendChild(headerTitle);

  // Difficulty Settings Card
  const card = el('div', { class: 'results-card w-full anim-fade-in' });
  card.innerHTML = `
    <div style="font-size: var(--text-body-md); font-weight: 700; color: #ffffff; margin-bottom: 8px;">مستوى صعوبة الكلمات:</div>
    <div style="display: flex; gap: 8px; width: 100%; justify-content: center;" id="diff-selector">
      <button class="btn-choice-pill ${difficulty === 'easy' ? 'selected' : ''}" data-diff="easy" style="flex: 1; min-height: 44px; font-size: 0.95rem; padding: 6px 10px;">سهل</button>
      <button class="btn-choice-pill ${difficulty === 'mixed' ? 'selected' : ''}" data-diff="mixed" style="flex: 1; min-height: 44px; font-size: 0.95rem; padding: 6px 10px;">منوع</button>
      <button class="btn-choice-pill ${difficulty === 'hard' ? 'selected' : ''}" data-diff="hard" style="flex: 1; min-height: 44px; font-size: 0.95rem; padding: 6px 10px;">صعب</button>
    </div>
  `;

  card.querySelectorAll('button[data-diff]').forEach((btn) => {
    btn.addEventListener('click', () => {
      vibrate([20]);
      difficulty = btn.getAttribute('data-diff');
      card.querySelectorAll('button[data-diff]').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  center.appendChild(card);

  // Save Button
  const saveBtn = primaryBtn('حفظ الإعدادات', 'save-settings-btn');
  saveBtn.addEventListener('click', () => {
    vibrate([35]);
    StorageManager.saveGameSettings(GameConfig.id, {
      difficulty,
    });
    showToast('تم حفظ الإعدادات بنجاح ✅');
    setTimeout(() => {
      if (onBack) onBack();
    }, 350);
  });

  footer.appendChild(saveBtn);

  return { screen };
}
