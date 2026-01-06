/**
 * MeetCaptioner - Floating Caption Overlay
 * Displays captions directly on Google Meet
 */
(function () {
  'use strict';

  if (window.__meetCaptionerInjected) return;
  window.__meetCaptionerInjected = true;

  console.log('[MeetCaptioner] Starting...');

  // State
  const captions = [];
  const MAX_CAPTIONS = 50;
  let overlay = null;
  let captionList = null;
  let isMinimized = false;

  // Create element helper
  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'textContent') {
        el.textContent = value;
      } else if (key.startsWith('on')) {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    }
    children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child) {
        el.appendChild(child);
      }
    });
    return el;
  }

  // Create floating overlay UI
  function createOverlay() {
    if (overlay) return;

    // Styles
    const styles = document.createElement('style');
    styles.textContent = `
      #meetcaptioner-overlay {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 320px;
        max-height: 300px;
        background: rgba(26, 26, 46, 0.92);
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        font-family: 'Google Sans', Roboto, sans-serif;
        z-index: 999999;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.15);
      }
      #meetcaptioner-overlay.minimized {
        max-height: 40px;
        width: 140px;
      }
      #meetcaptioner-overlay.minimized .mc-content {
        display: none;
      }
      .mc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(60, 60, 90, 0.9);
        cursor: grab;
        user-select: none;
      }
      .mc-header:active {
        cursor: grabbing;
      }
      .mc-title {
        color: #fff;
        font-size: 14px;
        font-weight: 500;
      }
      .mc-controls {
        display: flex;
        gap: 8px;
      }
      .mc-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        padding: 4px;
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      .mc-btn:hover {
        opacity: 1;
      }
      .mc-content {
        max-height: 250px;
        overflow-y: auto;
        padding: 6px;
      }
      .mc-content::-webkit-scrollbar {
        width: 6px;
      }
      .mc-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }
      .mc-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .mc-caption {
        padding: 10px 12px;
        background: rgba(42, 42, 62, 0.6);
        border-radius: 8px;
        animation: mcFadeIn 0.3s ease;
      }
      @keyframes mcFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .mc-speaker {
        color: #8b8bff;
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 4px;
      }
      .mc-text {
        color: #fff;
        font-size: 14px;
        line-height: 1.4;
      }
      .mc-time {
        color: rgba(255, 255, 255, 0.4);
        font-size: 10px;
        margin-top: 4px;
      }
      .mc-empty {
        color: rgba(255, 255, 255, 0.5);
        text-align: center;
        padding: 20px;
        font-size: 13px;
      }
    `;
    document.head.appendChild(styles);

    // Build DOM
    const clearBtn = createElement('button', {
      className: 'mc-btn mc-clear',
      title: 'Clear',
      textContent: '🗑️',
      onClick: () => {
        captions.length = 0;
        renderCaptions();
      }
    });

    const minimizeBtn = createElement('button', {
      className: 'mc-btn mc-minimize',
      title: 'Minimize',
      textContent: '−',
      onClick: () => {
        isMinimized = !isMinimized;
        overlay.classList.toggle('minimized', isMinimized);
        minimizeBtn.textContent = isMinimized ? '+' : '−';
      }
    });

    const controls = createElement('div', { className: 'mc-controls' }, [clearBtn, minimizeBtn]);
    const title = createElement('span', { className: 'mc-title', textContent: '📝 Captions' });
    const header = createElement('div', { className: 'mc-header' }, [title, controls]);

    captionList = createElement('div', { className: 'mc-list' });
    const content = createElement('div', { className: 'mc-content' }, [captionList]);

    overlay = createElement('div', { id: 'meetcaptioner-overlay' }, [header, content]);
    document.body.appendChild(overlay);

    // Make draggable
    makeDraggable(overlay, header);
    renderCaptions();
  }

  // Make element draggable
  function makeDraggable(element, handle) {
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    let isDragging = false;

    handle.addEventListener('mousedown', dragStart);

    function dragStart(e) {
      if (e.target.tagName === 'BUTTON') return; // Don't drag on buttons
      e.preventDefault();
      e.stopPropagation();

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = element.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);
    }

    function drag(e) {
      if (!isDragging) return;
      e.preventDefault();

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      element.style.left = (startLeft + deltaX) + 'px';
      element.style.top = (startTop + deltaY) + 'px';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    }

    function dragEnd() {
      isDragging = false;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', dragEnd);
    }
  }

  // Render captions - efficient update
  function renderCaptions(updateOnly = false) {
    if (!captionList) return;

    // Empty state
    if (captions.length === 0) {
      while (captionList.firstChild) {
        captionList.removeChild(captionList.firstChild);
      }
      const empty = createElement('div', { className: 'mc-empty' });
      empty.appendChild(document.createTextNode('Waiting for captions...'));
      empty.appendChild(document.createElement('br'));
      empty.appendChild(document.createTextNode('Turn on CC in Google Meet'));
      captionList.appendChild(empty);
      return;
    }

    // Remove empty message if exists
    const emptyEl = captionList.querySelector('.mc-empty');
    if (emptyEl) emptyEl.remove();

    const existingItems = captionList.querySelectorAll('.mc-caption');

    // Update existing or add new
    captions.forEach((c, i) => {
      if (existingItems[i]) {
        // Update existing item (no animation)
        const item = existingItems[i];
        const textEl = item.querySelector('.mc-text');
        const timeEl = item.querySelector('.mc-time');
        if (textEl && textEl.textContent !== c.text) {
          textEl.textContent = c.text;
        }
        if (timeEl) timeEl.textContent = c.time;
      } else {
        // Add new item
        const speaker = createElement('div', { className: 'mc-speaker', textContent: c.speaker });
        const text = createElement('div', { className: 'mc-text', textContent: c.text });
        const time = createElement('div', { className: 'mc-time', textContent: c.time });
        const caption = createElement('div', { className: 'mc-caption' }, [speaker, text, time]);
        captionList.appendChild(caption);
      }
    });

    // Remove extra items
    while (existingItems.length > captions.length) {
      const lastItem = captionList.lastElementChild;
      if (lastItem && lastItem.classList.contains('mc-caption')) {
        lastItem.remove();
      }
    }

    // Auto scroll to bottom (only for new captions)
    if (!updateOnly) {
      const content = overlay.querySelector('.mc-content');
      content.scrollTop = content.scrollHeight;
    }
  }

  // Add caption with better deduplication
  function addCaption(speaker, text) {
    // Exact duplicate check
    const last = captions[captions.length - 1];
    if (last && last.speaker === speaker && last.text === text) return;

    // Find last caption from same speaker
    const lastFromSameSpeaker = [...captions].reverse().find(c => c.speaker === speaker);

    // Check if this is a continuation/update of the same speech
    if (lastFromSameSpeaker) {
      const oldText = lastFromSameSpeaker.text;
      const newText = text;

      // If new text contains old text or vice versa, it's an update
      const isUpdate = newText.includes(oldText.slice(0, 15)) ||
                       oldText.includes(newText.slice(0, 15)) ||
                       (last && last.speaker === speaker);

      if (isUpdate && last && last.speaker === speaker) {
        // Update in place if it's the last caption
        last.text = text;
        last.time = new Date().toLocaleTimeString();
        renderCaptions(true); // updateOnly - no flash
        return;
      }
    }

    // Add as new caption
    captions.push({
      speaker,
      text,
      time: new Date().toLocaleTimeString(),
    });

    while (captions.length > MAX_CAPTIONS) {
      captions.shift();
    }

    renderCaptions(false); // new caption - with scroll
    console.log('[MeetCaptioner] Caption:', speaker, '-', text);
  }

  // Extract captions from Google Meet
  function extractCaptions() {
    const captionRegion = document.querySelector('[role="region"][aria-label="Captions"]');
    if (!captionRegion) return;

    const captionEntries = captionRegion.querySelectorAll('.nMcdL');

    captionEntries.forEach(entry => {
      const speakerEl = entry.querySelector('.NWpY1d');
      const speaker = speakerEl?.textContent?.trim() || 'Speaker';

      const textEl = entry.querySelector('.ygicle');
      if (!textEl) return;

      const text = textEl.textContent?.trim();
      if (text && text.length > 1) {
        addCaption(speaker, text);
      }
    });
  }

  // Debounce helper
  function debounce(fn, delay) {
    let timer = null;
    return function() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  // Start observer - only on caption region
  function startObserver() {
    let observer = null;
    const debouncedExtract = debounce(extractCaptions, 100);

    function observeCaptionRegion() {
      const captionRegion = document.querySelector('[role="region"][aria-label="Captions"]');

      if (captionRegion && !captionRegion._mcObserving) {
        captionRegion._mcObserving = true;

        if (observer) observer.disconnect();

        observer = new MutationObserver(debouncedExtract);
        observer.observe(captionRegion, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        console.log('[MeetCaptioner] Observing caption region');
      }
    }

    // Check for caption region periodically (low frequency)
    setInterval(observeCaptionRegion, 2000);

    // Initial check
    observeCaptionRegion();

    console.log('[MeetCaptioner] Observer started');
  }

  // Initialize
  function init() {
    createOverlay();
    startObserver();
  }

  // Wait for page ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 1000);
  }

  // Marker
  const meta = document.createElement('meta');
  meta.name = 'meetcaptioner-injected';
  meta.content = 'true';
  (document.head || document.documentElement).appendChild(meta);

  console.log('[MeetCaptioner] Ready');
})();
