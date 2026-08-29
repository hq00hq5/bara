/**
 * Vote Result Screen — Bara Al-Salfa (برا السالفة)
 * Shows the outcome of voting: tiebreaker, caught imposter, or escaped imposter.
 */

import { el, createScreen, primaryBtn, vibrate } from '../../../components/ui.js';

export function renderVoteResultScreen(container, { gameEngine, onProceedToGuess, onProceedToRoundResult, onStartTiebreaker, onHome }) {
  const players = gameEngine.getPlayers();
  const roundResult = gameEngine.getRoundResult();
  const imposter = gameEngine.getImposter();
  const isTie = roundResult?.voteResult?.isTie;
  const mostVotedId = roundResult?.mostVotedId;
  const mostVotedPlayer = players.find((p) => p.id === mostVotedId);
  const wasImposterCaught = roundResult?.wasImposterCaught;

  const { screen, center, footer } = createScreen(container, {
    showHome: true,
    onHome,
  });

  const box = el('div', { class: 'question-instruction-box anim-fade-in' });

  if (isTie) {
    // ── Case 1: Tie in votes ──
    const tiedPlayerNames = (roundResult.tiedPlayerIds || [])
      .map((id) => players.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(' و ');

    box.innerHTML = `
      <h2 class="title-yellow" style="margin-bottom: 16px;">تعادل في الأصوات!</h2>
      <div class="question-text-main" style="margin-bottom: 8px;">
        تعادل كل من:<br/>
        <span style="color: var(--color-text-yellow); font-size: 1.4rem;">${tiedPlayerNames}</span>
      </div>
      <div class="question-text-sub">
        لازم تعيدون التصويت بينهم لتحديد اللي برا السالفة
      </div>
    `;
    center.appendChild(box);

    const revoteBtn = primaryBtn('إعادة التصويت', 'tiebreaker-btn');
    revoteBtn.addEventListener('click', () => {
      vibrate([40]);
      if (onStartTiebreaker) onStartTiebreaker();
    });
    footer.appendChild(revoteBtn);

  } else {
    // ── Case 2: Verdict determined ──
    if (wasImposterCaught) {
      // Imposter caught!
      box.innerHTML = `
        <h2 class="title-yellow" style="margin-bottom: 16px;">تم كشف اللي برا السالفة!</h2>
        <div class="question-text-main" style="margin-bottom: 8px;">
          <span style="color: var(--color-text-yellow); font-size: 1.4rem;">${mostVotedPlayer?.name}</span><br/>
          كان برا السالفة! 🎯
        </div>
        <div class="question-text-sub">
          عنده فرصة أخيرة لتخمين السالفة
        </div>
      `;
      center.appendChild(box);

      const nextBtn = primaryBtn('التالي', 'proceed-to-guess-btn');
      nextBtn.addEventListener('click', () => {
        vibrate([35]);
        if (onProceedToGuess) onProceedToGuess();
      });
      footer.appendChild(nextBtn);

    } else {
      // Innocent voted out — Imposter escaped!
      box.innerHTML = `
        <h2 class="title-white" style="margin-bottom: 16px; color: #ff6b6b;">تصويت خاطئ!</h2>
        <div class="question-text-main" style="margin-bottom: 8px;">
          <span style="color: var(--color-text-yellow); font-size: 1.4rem;">${mostVotedPlayer?.name}</span><br/>
          كان داخل السالفة!
        </div>
        <div class="question-text-sub" style="margin-top: 12px;">
          اللي كان برا السالفة هو:<br/>
          <span style="color: var(--color-text-yellow); font-size: 1.5rem; font-weight: 800;">${imposter?.name}</span> 🤫
        </div>
      `;
      center.appendChild(box);

      const nextBtn = primaryBtn('التالي', 'proceed-to-result-btn');
      nextBtn.addEventListener('click', () => {
        vibrate([35]);
        if (onProceedToRoundResult) onProceedToRoundResult();
      });
      footer.appendChild(nextBtn);
    }
  }

  return { screen };
}
