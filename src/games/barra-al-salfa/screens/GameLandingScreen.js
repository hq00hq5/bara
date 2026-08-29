/**
 * Game Landing Screen — Bara Al-Salfa (برا السالفة)
 * Dedicated landing screen with visual logo and start button.
 */

import { el, createScreen, primaryBtn, vibrate } from '../../../components/ui.js';
import { GameConfig } from '../config.js';

export function renderGameLandingScreen(container, { onStartSetup, onHome }) {
  const { screen, center, footer } = createScreen(container, {
    showHome: true,
    onHome,
  });

  const card = el('div', { class: 'game-landing-card anim-fade-in' });
  card.innerHTML = `
    <div class="game-logo-badge">🤫</div>
    <h1 class="title-yellow" style="font-size: clamp(2.4rem, 8vw, 3.2rem); margin-bottom: 8px;">${GameConfig.title}</h1>
    <p class="subtitle-white" style="font-size: var(--text-body-md); margin-bottom: 24px; line-height: 1.6;">
      الكل يعرف السالفة إلا واحد برا السالفة!<br/>
      اسألوا بعض واكشفوا المخادع 🕵️‍♂️
    </p>
  `;

  center.appendChild(card);

  const startBtn = primaryBtn('ابدأ اللعبة', 'start-setup-btn');
  startBtn.addEventListener('click', () => {
    vibrate([40]);
    if (onStartSetup) onStartSetup();
  });

  footer.appendChild(startBtn);

  return { screen };
}
