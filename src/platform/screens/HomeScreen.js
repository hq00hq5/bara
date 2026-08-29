/**
 * Platform Home Screen — لمّتنا (Lammtna)
 * Shows available games and entry point into Bara Al-Salfa.
 */

import { el, createScreen, primaryBtn, vibrate } from '../../components/ui.js';
import { GameRegistry } from '../registry.js';
import { PlatformConfig } from '../config.js';

export function renderHomeScreen(container, { onSelectGame, onOpenSettings }) {
  const games = GameRegistry.getAll();
  const { screen, topBar, center, footer } = createScreen(container, { showHome: false });

  // Center Content: Platform Brand & Games List
  const heroWrap = el('div', { class: 'text-center mb-4 anim-fade-in' });
  heroWrap.innerHTML = `
    <div style="font-size: 3.5rem; margin-bottom: 8px;">🎲</div>
    <h1 class="title-yellow" style="font-size: clamp(2.2rem, 8vw, 3rem); margin-bottom: 6px;">${PlatformConfig.name}</h1>
    <p class="subtitle-white" style="font-size: var(--text-body-md); opacity: 0.95;">
      ألعاب جماعية للأصدقاء والعائلة تلعبونها من جوال واحد بدون إنترنت!
    </p>
  `;
  center.appendChild(heroWrap);

  // Active Games List
  const listWrap = el('div', {
    class: 'choices-stack',
    style: { width: '100%', maxWidth: '340px', gap: '14px' },
  });

  games.forEach((game) => {
    const card = el('button', {
      class: 'btn-choice-pill',
      style: {
        width: '100%',
        minHeight: '62px',
        fontSize: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
      },
      id: `game-btn-${game.id}`,
      attrs: { type: 'button' },
    });

    card.innerHTML = `
      <span style="font-weight: 800;">${game.title}</span>
      <span style="font-size: 1.4rem;">👥</span>
    `;

    card.addEventListener('click', () => {
      vibrate([40]);
      if (onSelectGame) onSelectGame(game.id);
    });

    listWrap.appendChild(card);
  });

  // Future game placeholders
  const placeholder1 = el('div', {
    class: 'btn-choice-pill',
    style: {
      width: '100%',
      minHeight: '56px',
      opacity: '0.5',
      cursor: 'default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 24px',
      background: 'rgba(156, 27, 75, 0.5)',
      boxShadow: 'none',
    },
  });
  placeholder1.innerHTML = `
    <span style="font-weight: 600; font-size: 1rem;">مين أنا؟ (قريباً)</span>
    <span style="font-size: 1.2rem;">🎭</span>
  `;
  listWrap.appendChild(placeholder1);

  center.appendChild(listWrap);

  return { screen };
}
