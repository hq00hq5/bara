/**
 * Shared UI Helpers & Screen Builders
 * Matching the exact visual style of reference screenshots
 */

/**
 * Clear container safely
 * @param {HTMLElement} container
 * @returns {HTMLElement}
 */
export function clearContainer(container) {
  container.innerHTML = '';
  return container;
}

/**
 * Create DOM element helper
 */
export function el(tag, opts = {}) {
  const element = document.createElement(tag);
  if (opts.class) element.className = opts.class;
  if (opts.id) element.id = opts.id;
  if (opts.text !== undefined) element.textContent = opts.text;
  if (opts.html !== undefined) element.innerHTML = opts.html;
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) {
      element.setAttribute(k, v);
    }
  }
  if (opts.style) {
    for (const [k, v] of Object.entries(opts.style)) {
      element.style[k] = v;
    }
  }
  return element;
}

/**
 * Circular Home Button (Maroon, top-left with House SVG)
 */
export function createHomeBtn(onClick) {
  const btn = el('button', {
    class: 'btn-home',
    attrs: { 'aria-label': 'الرئيسية', type: 'button' },
  });
  btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
  if (onClick) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      vibrate([30]);
      onClick();
    });
  }
  return btn;
}

/**
 * Screen Builder with standard Top Bar and Layout
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {boolean} [options.showHome=true]
 * @param {Function} [options.onHome]
 * @param {boolean} [options.topAlign=false]
 * @returns {{ screen: HTMLElement, topBar: HTMLElement, center: HTMLElement, footer: HTMLElement }}
 */
export function createScreen(container, options = {}) {
  clearContainer(container);

  const screen = el('div', { class: 'screen anim-fade-in' });
  const topBar = el('div', { class: 'screen-top-bar' });

  if (options.showHome !== false && options.onHome) {
    const homeBtn = createHomeBtn(options.onHome);
    topBar.appendChild(homeBtn);
  } else {
    const spacer = el('div', { style: { width: '48px', height: '48px' } });
    topBar.appendChild(spacer);
  }

  const center = el('div', {
    class: `screen-center ${options.topAlign ? 'screen-center-top' : ''}`,
  });

  const footer = el('div', {
    style: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  });

  screen.appendChild(topBar);
  screen.appendChild(center);
  screen.appendChild(footer);
  container.appendChild(screen);

  return { screen, topBar, center, footer };
}

/**
 * Large Orange Primary Pill Button (e.g. "التالي")
 */
export function primaryBtn(text, id = null) {
  const btn = el('button', {
    class: 'btn-primary-pill',
    text,
    id: id || undefined,
    attrs: { type: 'button' },
  });
  return btn;
}

/**
 * Dark Magenta Choice Pill Button (for players / voting / distractors)
 */
export function choiceBtn(text, id = null) {
  const btn = el('button', {
    class: 'btn-choice-pill',
    text,
    id: id || undefined,
    attrs: { type: 'button' },
  });
  return btn;
}

/**
 * Alias for secondary button
 */
export function secondaryBtn(text, id = null) {
  return choiceBtn(text, id);
}

/**
 * Show a clean toast notification
 */
export function showToast(message, duration = 2200) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = el('div', { class: 'toast', id: 'global-toast' });
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

/**
 * Haptic Vibration Feedback
 */
export function vibrate(pattern = [40]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (_) {}
  }
}

/**
 * Debounce helper to prevent double tapping
 */
export function debounceAction(fn, delay = 250) {
  let isExecuting = false;
  return function (...args) {
    if (isExecuting) return;
    isExecuting = true;
    try {
      fn.apply(this, args);
    } finally {
      setTimeout(() => {
        isExecuting = false;
      }, delay);
    }
  };
}
