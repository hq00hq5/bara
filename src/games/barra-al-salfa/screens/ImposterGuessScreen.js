/**
 * Imposter Guess Screen — Bara Al-Salfa (برا السالفة)
 * Exact replica of Reference Screenshot 4:
 * - Handover: "انطوا التلفون لـ [اسم اللاعب]" -> [ التالي ]
 * - Header: "[اسم اللاعب] ايش هي السالفة؟"
 * - Choices: 6 Dark Magenta rounded pill buttons (1 correct secret + 5 distractors)
 */

import { el, createScreen, primaryBtn, choiceBtn, vibrate } from '../../../components/ui.js';

export function renderImposterGuessScreen(container, { gameEngine, onGuessCompleted, onHome }) {
  const imposter = gameEngine.getImposter();
  let guessOptions = [];
  let isHandoverDone = false;

  async function init() {
    guessOptions = await gameEngine.loadGuessOptions();
    renderStep();
  }

  function renderStep() {
    const { screen, center, footer } = createScreen(container, {
      showHome: true,
      onHome,
    });

    if (!isHandoverDone) {
      // ── Step 1: Handover pass-the-phone to the imposter ──
      const box = el('div', { class: 'question-instruction-box anim-fade-in' });
      box.innerHTML = `
        <h2 class="title-white" style="font-size: clamp(2rem, 6.5vw, 2.7rem);">
          انطوا التلفون لـ<br/>
          <span style="color: var(--color-text-yellow);">${imposter?.name || 'اللاعب'}</span>
        </h2>
      `;
      center.appendChild(box);

      const readyBtn = primaryBtn('التالي', 'imposter-ready-btn');
      readyBtn.addEventListener('click', () => {
        vibrate([30]);
        isHandoverDone = true;
        renderStep();
      });
      footer.appendChild(readyBtn);

    } else {
      // ── Step 2: Guess choices (Screenshot 4 Replica) ──
      const titleWrap = el('div', { class: 'text-center anim-fade-in mb-3' });
      titleWrap.innerHTML = `
        <h2 class="title-white" style="font-size: clamp(1.5rem, 5vw, 2rem); margin-bottom: 20px;">
          <span style="color: var(--color-text-yellow); font-weight: 800;">${imposter?.name}</span>
          ايش هي السالفة؟
        </h2>
      `;
      center.appendChild(titleWrap);

      const optionsList = el('div', { class: 'choices-stack anim-fade-in' });

      guessOptions.forEach(({ item, isCorrect }) => {
        const btn = choiceBtn(item.text, `guess-option-${item.id}`);

        btn.addEventListener('click', () => {
          vibrate([40]);
          // Submit guess to engine
          gameEngine.submitGuess(item.id);

          if (onGuessCompleted) onGuessCompleted();
        });

        optionsList.appendChild(btn);
      });

      center.appendChild(optionsList);
    }
  }

  init();
}
