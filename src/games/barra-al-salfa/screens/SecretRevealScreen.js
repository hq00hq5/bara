/**
 * Secret Reveal Screen — Bara Al-Salfa (برا السالفة)
 * Sections 17, 18, 19, 45, 46 of Master Specification:
 * - Handover screen: "انطوا التلفون ل[اسم اللاعب]" -> [ التالي ]
 * - Reveal screen (Insider): "السالفة هي:\n\n[الكلمة]" -> [ التالي ]
 * - Reveal screen (Imposter): "إنت برا السالفة" -> [ التالي ]
 * - Zero clutter, zero player numbers, zero leaks, instant transitions.
 */

import { el, createScreen, primaryBtn, vibrate } from '../../../components/ui.js';

export function renderSecretRevealScreen(container, { gameEngine, onAllRevealed, onHome }) {
  let isSecretVisible = false;

  function renderCurrentStep() {
    const player = gameEngine.getCurrentRevealPlayer();
    const secretItem = gameEngine.getCurrentItem();

    if (!player) {
      if (onAllRevealed) onAllRevealed();
      return;
    }

    const { screen, center, footer } = createScreen(container, {
      showHome: true,
      onHome,
    });

    if (!isSecretVisible) {
      // ── Step 1: Handover Pass-the-Phone ──
      const box = el('div', { class: 'question-instruction-box anim-fade-in' });
      box.innerHTML = `
        <h2 class="title-white" style="font-size: clamp(2rem, 6.5vw, 2.7rem);">
          انطوا التلفون لـ<br/>
          <span style="color: var(--color-text-yellow);">${player.name}</span>
        </h2>
      `;
      center.appendChild(box);

      const nextBtn = primaryBtn('التالي', 'reveal-next-btn');
      nextBtn.addEventListener('click', () => {
        vibrate([30]);
        isSecretVisible = true;
        renderCurrentStep();
      });
      footer.appendChild(nextBtn);

    } else {
      // ── Step 2: Secret Revealed ──
      const box = el('div', { class: 'question-instruction-box anim-fade-in' });

      if (player.isImposter) {
        // Imposter Screen
        box.innerHTML = `
          <h2 class="text-imposter-role">
            إنت برا السالفة!
          </h2>
        `;
      } else {
        // Normal Player (Insider) Screen
        box.innerHTML = `
          <div class="subtitle-white" style="font-size: 1.4rem; opacity: 0.95;">
            السالفة هي:
          </div>
          <h2 class="text-secret-reveal" style="color: var(--color-text-yellow);">
            ${secretItem?.text || ''}
          </h2>
        `;
      }

      center.appendChild(box);

      const nextBtn = primaryBtn('التالي', 'hide-secret-btn');
      nextBtn.addEventListener('click', () => {
        vibrate([30]);
        isSecretVisible = false;
        const allDone = gameEngine.markCurrentPlayerRevealed();
        if (allDone) {
          if (onAllRevealed) onAllRevealed();
        } else {
          renderCurrentStep();
        }
      });
      footer.appendChild(nextBtn);
    }
  }

  renderCurrentStep();
}
