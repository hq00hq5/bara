/**
 * Round Result & Score Screen — Bara Al-Salfa (برا السالفة)
 * Sections 31, 32, 33, 49 of Master Specification:
 * - Shows outcome summary: Secret word, imposter identity, guess result
 * - Shows cumulative session standings/leaderboard
 * - NO round numbers, NO round limits
 * - Primary Action: Orange "التالي" immediately starts another game with same players & persistent scores
 */

import { el, createScreen, primaryBtn, vibrate } from '../../../components/ui.js';

export function renderRoundResultScreen(container, { gameEngine, onNextRound, onHome }) {
  const rankedPlayers = gameEngine.getRankedPlayers();
  const roundResult = gameEngine.getRoundResult();
  const secretItem = gameEngine.getCurrentItem();
  const imposter = gameEngine.getImposter();

  const { screen, center, footer } = createScreen(container, {
    showHome: true,
    onHome,
    topAlign: true,
  });

  // 1. Game Outcome Summary Banner
  const summaryCard = el('div', { class: 'results-card anim-fade-in' });
  let outcomeText = '';
  if (roundResult?.wasImposterCaught) {
    if (roundResult?.imposterGuessed) {
      outcomeText = `🎯 انقفط ${imposter?.name} لكن خمّن السالفة صح! (+200)`;
    } else {
      outcomeText = `🎯 انقفط ${imposter?.name} وما عرف يخمن السالفة! (+150 للمصوتين)`;
    }
  } else {
    outcomeText = `🤫 فلت ${imposter?.name} وخدع الجميع! (+200)`;
  }

  summaryCard.innerHTML = `
    <div style="font-size: var(--text-body-sm); color: rgba(255,255,255,0.85);">السالفة كانت:</div>
    <div style="font-size: 1.6rem; font-weight: 900; color: var(--color-text-yellow);">${secretItem?.text || ''}</div>
    <div style="font-size: var(--text-body-sm); font-weight: 700; color: #ffffff; text-align: center; margin-top: 4px;">
      ${outcomeText}
    </div>
  `;
  center.appendChild(summaryCard);

  // 2. Leaderboard Title
  const leaderboardHeader = el('div', {
    class: 'title-yellow',
    style: { fontSize: '1.25rem', marginBottom: '8px', alignSelf: 'flex-start' },
    text: 'جدول النقاط',
  });
  center.appendChild(leaderboardHeader);

  // 3. Standings List
  const list = el('div', { class: 'leaderboard-list anim-fade-in' });

  rankedPlayers.forEach((player, rank) => {
    const row = el('div', { class: 'leaderboard-row' });

    let medal = '';
    if (rank === 0) medal = '🥇 ';
    else if (rank === 1) medal = '🥈 ';
    else if (rank === 2) medal = '🥉 ';

    row.innerHTML = `
      <span class="player-name">${medal}${player.name}</span>
      <span class="player-score">${player.score || 0} نقطة</span>
    `;

    list.appendChild(row);
  });

  center.appendChild(list);

  // 4. Primary "التالي" Button to immediately continue into next game
  const nextGameBtn = primaryBtn('التالي', 'next-game-btn');
  nextGameBtn.addEventListener('click', () => {
    vibrate([40]);
    if (onNextRound) onNextRound();
  });

  footer.appendChild(nextGameBtn);

  return { screen };
}
