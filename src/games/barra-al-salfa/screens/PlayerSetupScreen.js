/**
 * Player Setup Screen — Bara Al-Salfa (برا السالفة)
 * Exact replica of Reference Screenshot 2:
 * - Header: "تقدر تضيف لاعبين زيادة أو تبدأ اللعب بالضغط على التالي"
 * - White paddle inputs with orange circular (-) remove buttons
 * - Bottom: Large orange "التالي" pill button + Orange circular (+) add button
 * - Dynamic 3 to 20 players, duplicate names supported internally
 */

import { el, createScreen, primaryBtn, showToast, vibrate } from '../../../components/ui.js';
import { StorageManager } from '../../../core/storage/StorageManager.js';

export function renderPlayerSetupScreen(container, { gameConfig, onStart, onHome }) {
  const minPlayers = gameConfig.minPlayers || 3;
  const maxPlayers = gameConfig.maxPlayers || 20;

  // Load last players from local storage or set default 3
  const lastPlayers = StorageManager.getLastPlayers();
  const initialPlayers = lastPlayers.length >= minPlayers
    ? lastPlayers.slice(0, Math.min(lastPlayers.length, maxPlayers))
    : ['محمد', 'علي', 'حسن'];

  let players = [...initialPlayers];

  const { screen, center, footer } = createScreen(container, {
    showHome: true,
    onHome,
    topAlign: true,
  });

  // Header Instruction Text (Matching Screenshot 2)
  const headerText = el('div', {
    class: 'setup-header-text',
    text: 'تقدر تضيف لاعبين زيادة أو تبدأ اللعب بالضغط على التالي',
  });
  center.appendChild(headerText);

  // Player List Container
  const listContainer = el('div', {
    class: 'player-list-container',
    id: 'player-paddle-list',
  });

  function renderPaddles() {
    listContainer.innerHTML = '';
    players.forEach((name, index) => {
      const row = el('div', { class: 'player-paddle-row' });

      // Orange (-) delete button
      const delBtn = el('button', {
        class: 'btn-player-delete',
        attrs: { type: 'button', 'aria-label': 'حذف' },
      });
      delBtn.innerHTML = `<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
      delBtn.addEventListener('click', () => {
        vibrate([20]);
        if (players.length > minPlayers) {
          players.splice(index, 1);
          renderPaddles();
        } else {
          showToast(`الحد الأدنى ${minPlayers} لاعبين`);
        }
      });

      // White paddle card with text input
      const inputWrap = el('div', { class: 'player-paddle-input-wrap' });
      const input = el('input', {
        class: 'player-paddle-input',
        attrs: {
          type: 'text',
          placeholder: `اسم اللاعب`,
          value: name,
          maxlength: '25',
          id: `player-paddle-input-${index}`,
        },
      });

      input.value = name;
      input.addEventListener('input', (e) => {
        players[index] = e.target.value;
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const nextInput = document.getElementById(`player-paddle-input-${index + 1}`);
          if (nextInput) nextInput.focus();
          else addPlayer();
        }
      });

      inputWrap.appendChild(input);
      row.appendChild(delBtn);
      row.appendChild(inputWrap);
      listContainer.appendChild(row);
    });
  }

  function addPlayer() {
    if (players.length >= maxPlayers) {
      showToast(`الحد الأقصى ${maxPlayers} لاعباً`);
      return;
    }
    vibrate([25]);
    players.push('');
    renderPaddles();

    setTimeout(() => {
      const lastInput = document.getElementById(`player-paddle-input-${players.length - 1}`);
      lastInput?.focus();
    }, 80);
  }

  renderPaddles();
  center.appendChild(listContainer);

  // Bottom Actions Bar (Matching Screenshot 2)
  const bottomBar = el('div', { class: 'setup-bottom-bar' });

  // Orange "التالي" Button
  const nextBtn = primaryBtn('التالي', 'start-game-btn');
  nextBtn.addEventListener('click', () => {
    // Read input values
    const inputs = listContainer.querySelectorAll('input');
    const names = Array.from(inputs)
      .map((inp) => inp.value.trim())
      .filter(Boolean);

    if (names.length < minPlayers) {
      showToast(`أدخل على الأقل ${minPlayers} أسماء لبدء اللعب`);
      return;
    }

    vibrate([40]);
    onStart(names);
  });

  // Orange Circular (+) Add Player Button
  const addBtn = el('button', {
    class: 'btn-player-add',
    attrs: { type: 'button', 'aria-label': 'إضافة لاعب' },
    id: 'add-player-btn',
  });
  // SVG user with plus icon matching screenshot 2
  addBtn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="9" cy="7" r="4" fill="none" stroke="#ffffff" stroke-width="2.2"/>
      <line x1="19" y1="8" x2="19" y2="14" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="16" y1="11" x2="22" y2="11" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `;
  addBtn.addEventListener('click', addPlayer);

  bottomBar.appendChild(nextBtn);
  bottomBar.appendChild(addBtn);

  footer.appendChild(bottomBar);

  return { screen };
}
