/* ELI5 crayon widget
   Highlight text on the page -> a crayon button pops up -> click it to get
   the text explained like you're five in a craft-paper speech bubble.
   Self-contained: injects its own font, CSS and HTML. */
(function () {
  const BACKEND_URL = 'https://backend-experiment-test.onrender.com/eli5';

  // ---------- font ----------
  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap';
  document.head.appendChild(font);

  // ---------- styles (all scoped to #eli5-*) ----------
  const style = document.createElement('style');
  style.textContent = `
  #eli5-trigger, #eli5-bubble, #eli5-help, #eli5-help-tip {
    --e-paper: #fdf8ec;
    --e-ink: #2B2118;
    --e-red: #E63946;
    --e-blue: #457B9D;
    --e-yellow: #F4A300;
    font-family: 'Kalam', cursive;
    letter-spacing: 0;
  }
  #eli5-trigger {
    position: absolute;
    display: none;
    margin: 0;
    padding: 5px;
    line-height: 0;
    background: var(--e-yellow);
    border: 2.5px solid var(--e-ink);
    border-radius: 40% 60% 55% 45% / 50% 45% 55% 50%;
    cursor: pointer;
    z-index: 9999;
    box-shadow: 2px 2px 0 var(--e-ink);
    transform: rotate(-3deg);
    transition: transform 0.1s ease;
  }
  #eli5-trigger:hover { transform: rotate(0deg) scale(1.05); }

  #eli5-bubble {
    position: absolute;
    display: none;
    box-sizing: border-box;
    width: max-content;
    max-width: 300px;
    padding: 16px 18px;
    background: var(--e-paper);
    color: var(--e-ink);
    border: 3px solid var(--e-ink);
    border-radius: 22px 18px 24px 16px / 20px 24px 16px 22px;
    font-size: 1rem;
    line-height: 1.5;
    text-align: left;
    z-index: 10000;
    box-shadow: 4px 4px 0 var(--e-blue);
    transform: rotate(-0.7deg);
  }
  #eli5-bubble::after, #eli5-bubble::before {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    border: solid transparent;
  }
  #eli5-bubble.below::after  { top: -14px; left: calc(var(--tail-x, 28px) - 10px); border-width: 0 10px 12px 10px; border-bottom-color: var(--e-ink); }
  #eli5-bubble.below::before { top: -9px;  left: calc(var(--tail-x, 28px) - 8px);  border-width: 0 8px 10px 8px;  border-bottom-color: var(--e-paper); z-index: 1; }
  #eli5-bubble.above::after  { bottom: -14px; left: calc(var(--tail-x, 28px) - 10px); border-width: 12px 10px 0 10px; border-top-color: var(--e-ink); }
  #eli5-bubble.above::before { bottom: -9px;  left: calc(var(--tail-x, 28px) - 8px);  border-width: 10px 8px 0 8px;  border-top-color: var(--e-paper); z-index: 1; }

  #eli5-bubble .eli5-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--e-red);
  }
  #eli5-bubble .eli5-close {
    position: absolute;
    top: 4px;
    right: 10px;
    cursor: pointer;
    font-weight: 700;
    font-size: 1rem;
    line-height: 1.4;
    color: var(--e-ink);
  }
  #eli5-bubble .eli5-loading { color: #6b5f4d; font-style: italic; }

  /* ---------- corner help crayon ---------- */
  #eli5-help {
    position: fixed;
    right: 20px;
    bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    z-index: 9998;
  }
  #eli5-help-btn {
    display: block;
    margin: 0;
    padding: 8px;
    line-height: 0;
    background: var(--e-yellow);
    border: 2.5px solid var(--e-ink);
    border-radius: 40% 60% 55% 45% / 50% 45% 55% 50%;
    cursor: pointer;
    box-shadow: 2px 2px 0 var(--e-ink);
    transform: rotate(-4deg);
    transition: transform 0.15s ease;
  }
  #eli5-help:hover #eli5-help-btn,
  #eli5-help.open #eli5-help-btn,
  #eli5-help-btn:focus-visible { transform: rotate(0deg) scale(1.08); }

  #eli5-help-tip {
    position: absolute;
    right: 0;
    bottom: calc(100% + 16px);
    box-sizing: border-box;
    width: 240px;
    padding: 14px 16px;
    background: var(--e-paper);
    color: var(--e-ink);
    border: 3px solid var(--e-ink);
    border-radius: 22px 18px 24px 16px / 20px 24px 16px 22px;
    box-shadow: 4px 4px 0 var(--e-blue);
    font-size: 0.95rem;
    line-height: 1.45;
    text-align: left;
    transform-origin: bottom right;
    transform: scale(0.4) rotate(-2deg);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.2s ease, opacity 0.15s ease;
  }
  #eli5-help:hover #eli5-help-tip,
  #eli5-help.open #eli5-help-tip,
  #eli5-help:focus-within #eli5-help-tip {
    transform: scale(1) rotate(-0.7deg);
    opacity: 1;
    pointer-events: auto;
  }
  #eli5-help-tip::after, #eli5-help-tip::before {
    content: ""; position: absolute; width: 0; height: 0; border: solid transparent;
  }
  #eli5-help-tip::after  { bottom: -14px; right: 18px; border-width: 12px 10px 0 10px; border-top-color: var(--e-ink); }
  #eli5-help-tip::before { bottom: -9px;  right: 20px; border-width: 10px 8px 0 8px;  border-top-color: var(--e-paper); z-index: 1; }
  #eli5-help-tip .eli5-label { display: block; margin-bottom: 4px; font-weight: 700; font-size: 0.85rem; color: var(--e-red); }
  #eli5-help-tip ol { margin: 0; padding-left: 1.2em; }
  #eli5-help-tip li { margin: 2px 0; }

  @media (prefers-reduced-motion: reduce) {
    #eli5-help-btn, #eli5-help-tip { transition: none; }
  }
  `;
  document.head.appendChild(style);

  // ---------- markup ----------
  const root = document.createElement('div');
  root.innerHTML = `
    <button id="eli5-trigger" type="button" aria-label="Explain this like I'm five" title="Explain like I'm 5">
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
        <g transform="rotate(40 16 16)" stroke="#2B2118" stroke-width="2" stroke-linejoin="round">
          <rect x="11" y="3" width="10" height="19" fill="#E63946"/>
          <rect x="11" y="8" width="10" height="7" fill="#fdf8ec"/>
          <polygon points="11,22 21,22 16,30" fill="#E63946"/>
        </g>
      </svg>
    </button>
    <div id="eli5-bubble" role="dialog" aria-label="Explained like you're five">
      <span class="eli5-close" id="eli5-close" role="button" aria-label="Close">&times;</span>
      <span class="eli5-label">explained like you're five:</span>
      <div id="eli5-text"></div>

    <div id="eli5-help">
      <div id="eli5-help-tip" role="tooltip">
        <span class="eli5-label">how to use me:</span>
        <ol>
          <li>Highlight any text on the page</li>
          <li>Click the little crayon that pops up</li>
          <li>Get it explained like you're five!</li>
        </ol>
      </div>
      <button id="eli5-help-btn" type="button" aria-label="How to use the explain like I'm 5 crayon" aria-describedby="eli5-help-tip">
        <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
          <g transform="rotate(40 16 16)" stroke="#2B2118" stroke-width="2" stroke-linejoin="round">
            <rect x="11" y="3" width="10" height="19" fill="#E63946"/>
            <rect x="11" y="8" width="10" height="7" fill="#fdf8ec"/>
            <polygon points="11,22 21,22 16,30" fill="#E63946"/>
          </g>
        </svg>
      </button>
    </div>`;
  document.body.append(...root.children);

  const trigger = document.getElementById('eli5-trigger');
  const bubble = document.getElementById('eli5-bubble');
  const bubbleText = document.getElementById('eli5-text');
  const closeBtn = document.getElementById('eli5-close');
  const help = document.getElementById('eli5-help');
  const helpBtn = document.getElementById('eli5-help-btn');

  let selectedText = '';
  let selRect = null; // highlight position in page coordinates
  let requestId = 0;  // ignore answers from older requests

  const GAP = 20;     // space between highlight and bubble (room for the tail)
  const MARGIN = 12;  // keep the bubble this far from the screen edges

  // ---------- show the crayon near a selection ----------
  function handleSelection(e) {
    if (bubble.contains(e.target) || trigger.contains(e.target) || help.contains(e.target)) return;

    // ignore text selected inside form fields
    const active = document.activeElement;
    if (active && /^(INPUT|TEXTAREA)$/.test(active.tagName)) return;

    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0 && selection.rangeCount > 0) {
      selectedText = text;
      const r = selection.getRangeAt(0).getBoundingClientRect();
      selRect = {
        top: r.top + window.scrollY,
        bottom: r.bottom + window.scrollY,
        left: r.left + window.scrollX,
        right: r.right + window.scrollX
      };
      trigger.style.top = `${selRect.top - 44}px`;
      trigger.style.left = `${Math.max(MARGIN, selRect.left)}px`;
      trigger.style.display = 'block';
      bubble.style.display = 'none';
    } else {
      trigger.style.display = 'none';
    }
  }
  document.addEventListener('mouseup', handleSelection);
  document.addEventListener('touchend', (e) => setTimeout(() => handleSelection(e), 60));

  // keep the highlight when the crayon is pressed
  trigger.addEventListener('mousedown', (e) => e.preventDefault());

  // clicking elsewhere closes the bubble
  document.addEventListener('mousedown', (e) => {
    if (!bubble.contains(e.target) && !trigger.contains(e.target)) {
      bubble.style.display = 'none';
      requestId++;
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { bubble.style.display = 'none'; trigger.style.display = 'none'; requestId++; }
  });

  // ---------- place the bubble above/below the highlight, tail pointing at it ----------
  function positionBubble() {
    if (!selRect) return;
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    const viewTop = window.scrollY;
    const viewBottom = window.scrollY + window.innerHeight;

    const spaceBelow = viewBottom - selRect.bottom;
    const spaceAbove = selRect.top - viewTop;
    const placeBelow = spaceBelow >= bh + GAP || spaceBelow >= spaceAbove;

    const top = placeBelow ? selRect.bottom + GAP : selRect.top - GAP - bh;

    const targetX = (selRect.left + selRect.right) / 2;
    const minLeft = window.scrollX + MARGIN;
    const maxLeft = window.scrollX + document.documentElement.clientWidth - bw - MARGIN;
    const left = Math.max(minLeft, Math.min(targetX - bw / 2, maxLeft));
    const tailX = Math.max(26, Math.min(targetX - left, bw - 26));

    bubble.classList.toggle('below', placeBelow);
    bubble.classList.toggle('above', !placeBelow);
    bubble.style.setProperty('--tail-x', `${tailX}px`);
    bubble.style.top = `${top}px`;
    bubble.style.left = `${left}px`;
  }

  // ---------- backend call ----------
  async function getExplanation(text) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000); // free Render tier can take ~1 min to wake
    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data.explanation;
    } finally {
      clearTimeout(timer);
    }
  }

  trigger.addEventListener('click', async () => {
    const myId = ++requestId;
    bubble.style.display = 'block';
    trigger.style.display = 'none';
    bubbleText.innerHTML = '<span class="eli5-loading">thinking in crayon...</span>';
    positionBubble();

    // if the free server is asleep, tell the visitor why it's slow
    const slowTimer = setTimeout(() => {
      if (myId === requestId) {
        bubbleText.innerHTML = '<span class="eli5-loading">waking up my server, this can take up to a minute the first time...</span>';
        positionBubble();
      }
    }, 6000);

    try {
      const explanation = await getExplanation(selectedText);
      if (myId !== requestId) return;
      bubbleText.textContent = explanation;
    } catch (err) {
      if (myId !== requestId) return;
      // server messages (e.g. "select under 1000 characters") are friendly; network errors get a generic one
      bubbleText.textContent = err instanceof TypeError || err.name === 'AbortError'
        ? "oops, couldn't reach the server. try again in a moment?"
        : err.message;
    } finally {
      clearTimeout(slowTimer);
    }
    positionBubble(); // content height changed, so re-place it
  });

  window.addEventListener('resize', () => {
    if (bubble.style.display === 'block') positionBubble();
  });

  closeBtn.addEventListener('click', () => {
    bubble.style.display = 'none';
    requestId++;
  });
  // ---------- corner help crayon: hover/focus shows the tip; tap toggles it on touch screens ----------
  helpBtn.addEventListener('click', () => help.classList.toggle('open'));
  document.addEventListener('mousedown', (e) => {
    if (!help.contains(e.target)) help.classList.remove('open');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') help.classList.remove('open');
  });
})();