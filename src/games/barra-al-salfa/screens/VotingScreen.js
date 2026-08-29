/**
 * Voting Screen — Bara Al-Salfa (برا السالفة)
 * Exact replica of Reference Screenshot 1:
 * - Handover: "انطوا التلفون لـ [اسم المصوت]" -> [ التالي ]
 * - Header: "[اسم المصوت] اختار الشخص اللي تظن انه برا السالفة!"
 * - Candidate Buttons: Dark Magenta rounded pill buttons
 * - Private voting pass-and-play flow
 */

import { el, createScreen, primaryBtn, choiceBtn, vibrate } from '../../../components/ui.js';

export function renderVotingScreen(container, { gameEngine, onVotingComplete, onHome, isTiebreaker = false }) {
  const players = gameEngine.getPlayers();
  const tiedPlayerIds = isTiebreaker ? gameEngine.getTiedPlayerIds() : [];
  let currentVoterIndex = 0;
  let isVoterConfirmed = false;

  function renderStep() {
    const voter = players[currentVoterIndex];
    if (!voter) {
      if (onVotingComplete) onVotingComplete();
      return;
    }

    const { screen, center, footer } = createScreen(container, {
      showHome: true,
      onHome,
    });

    if (!isVoterConfirmed) {
      // ── Step 1: Handover screen ──
      const box = el('div', { class: 'question-instruction-box anim-fade-in' });
      box.innerHTML = `
        <h2 class="title-white" style="font-size: clamp(2rem, 6.5vw, 2.7rem);">
          انطوا التلفون لـ<br/>
          <span style="color: var(--color-text-yellow);">${voter.name}</span>
        </h2>
      `;
      center.appendChild(box);

      const nextBtn = primaryBtn('التالي', 'voter-ready-btn');
      nextBtn.addEventListener('click', () => {
        vibrate([30]);
        isVoterConfirmed = true;
        renderStep();
      });
      footer.appendChild(nextBtn);

    } else {
      // ── Step 2: Voting Choices (Screenshot 1 Replica) ──
      const titleWrap = el('div', { class: 'text-center anim-fade-in mb-3' });
      titleWrap.innerHTML = `
        <h2 class="title-white" style="font-size: clamp(1.4rem, 4.5vw, 1.85rem); line-height: 1.5; margin-bottom: 24px;">
          <span style="color: var(--color-text-yellow); font-weight: 800;">${voter.name}</span>
          اختار الشخص اللي تظن انه برا السالفة!
        </h2>
      `;
      center.appendChild(titleWrap);

      const candidatesList = el('div', { class: 'choices-stack anim-fade-in' });

      // Candidates (excluding self, or restricted to tied players in tiebreaker)
      const eligibleCandidates = (isTiebreaker && tiedPlayerIds.length > 0)
        ? players.filter((p) => tiedPlayerIds.includes(p.id) && p.id !== voter.id)
        : players.filter((p) => p.id !== voter.id);

      eligibleCandidates.forEach((candidate) => {
        const btn = choiceBtn(candidate.name, `vote-candidate-${candidate.id}`);
        btn.addEventListener('click', () => {
          vibrate([35]);
          // Record vote
          gameEngine.castVote(voter.id, candidate.id);

          // Advance to next voter
          currentVoterIndex++;
          isVoterConfirmed = false;

          if (currentVoterIndex >= players.length) {
            if (onVotingComplete) onVotingComplete();
          } else {
            renderStep();
          }
        });
        candidatesList.appendChild(btn);
      });

      center.appendChild(candidatesList);
    }
  }

  renderStep();
}
