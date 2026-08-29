/**
 * Question Phase Screen — Bara Al-Salfa (برا السالفة)
 * Exact replica of Reference Screenshot 3:
 * - Yellow title: "وقت الأسئلة"
 * - Instructions: "[السائل] اسأل [المسؤول] سؤال متعلق بالسالفة!..."
 * - Bottom action: Orange "التالي" pill button to advance turn + "صوت" button for voting
 */

import { el, createScreen, primaryBtn, vibrate } from '../../../components/ui.js';

export function renderQuestionPhaseScreen(container, { gameEngine, onStartVoting, onHome }) {
  function renderTurn() {
    const turn = gameEngine.getCurrentQuestionTurn();
    const askerName = turn?.asker?.name || 'اللاعب';
    const targetName = turn?.target?.name || 'اللاعب';

    const { screen, center, footer } = createScreen(container, {
      showHome: true,
      onHome,
    });

    const box = el('div', { class: 'question-instruction-box anim-fade-in' });
    box.innerHTML = `
      <h2 class="title-yellow" style="margin-bottom: 24px;">وقت الأسئلة</h2>
      <div class="question-text-main" style="margin-bottom: 12px;">
        <span style="color: var(--color-text-yellow); font-weight: 800;">${askerName}</span>
        اسأل
        <span style="color: var(--color-text-yellow); font-weight: 800;">${targetName}</span>
        سؤال متعلق بالسالفة!
      </div>
      <div class="question-text-sub">
        اختار سؤالك بعناية حتى اللي برا السالفة<br/>
        ما يعرف عن ايش تتكلمون
      </div>
    `;

    center.appendChild(box);

    // Footer actions
    const footerBar = el('div', { class: 'question-footer-bar' });

    // Primary Next Turn button
    const nextBtn = primaryBtn('التالي', 'next-question-btn');
    nextBtn.addEventListener('click', () => {
      vibrate([25]);
      gameEngine.nextQuestionTurn();
      renderTurn();
    });

    // Voting trigger button
    const voteBtn = el('button', {
      class: 'btn-vote-trigger',
      text: 'صوت',
      id: 'start-vote-btn',
      attrs: { type: 'button' },
    });
    voteBtn.addEventListener('click', () => {
      vibrate([40]);
      if (onStartVoting) onStartVoting();
    });

    footerBar.appendChild(nextBtn);
    footerBar.appendChild(voteBtn);
    footer.appendChild(footerBar);
  }

  renderTurn();
}
