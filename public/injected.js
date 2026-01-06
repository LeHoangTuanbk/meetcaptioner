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

    // Styles - Simple Design
    const styles = document.createElement('style');
    styles.textContent = `
      #meetcaptioner-overlay {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 320px;
        height: 360px;
        background: #1a1a2e;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      #meetcaptioner-overlay.minimized {
        height: auto;
        width: 140px;
      }
      #meetcaptioner-overlay.minimized .mc-content,
      #meetcaptioner-overlay.minimized .mc-resize {
        display: none;
      }
      .mc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        background: #252540;
        cursor: grab;
        user-select: none;
        flex-shrink: 0;
        border-radius: 12px 12px 0 0;
      }
      .mc-header:active {
        cursor: grabbing;
      }
      .mc-title {
        color: #fff;
        font-size: 14px;
        font-weight: 500;
      }
      .mc-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 20px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.6;
        transition: opacity 0.2s;
        color: #fff;
        border-radius: 6px;
      }
      .mc-btn:hover {
        opacity: 1;
        background: rgba(255,255,255,0.1);
      }
      .mc-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        min-height: 0;
      }
      .mc-content::-webkit-scrollbar {
        width: 4px;
      }
      .mc-content::-webkit-scrollbar-track {
        background: transparent;
      }
      .mc-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 2px;
      }
      .mc-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .mc-caption {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .mc-caption.mc-new {
        animation: mcFadeIn 0.2s ease;
      }
      @keyframes mcFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .mc-speaker {
        color: #4ade80;
        font-size: 12px;
        font-weight: 600;
      }
      .mc-text {
        color: #e4e4e7;
        font-size: 13px;
        line-height: 1.45;
      }
      .mc-time {
        color: #6b7280;
        font-size: 10px;
        margin-top: 2px;
      }
      .mc-empty {
        color: #6b7280;
        text-align: center;
        padding: 32px 16px;
        font-size: 12px;
        line-height: 1.5;
      }
      .mc-resize {
        height: 10px;
        cursor: ns-resize;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        opacity: 0.3;
        transition: opacity 0.2s;
      }
      .mc-resize:hover {
        opacity: 0.8;
      }
      .mc-resize::after {
        content: '';
        width: 36px;
        height: 4px;
        background: rgba(255,255,255,0.4);
        border-radius: 2px;
      }
    `;
    document.head.appendChild(styles);

    // Build DOM - Simple: Title + Minimize + Content + Resize
    const title = createElement('span', { className: 'mc-title', textContent: 'Captions' });

    const minimizeBtn = createElement('button', {
      className: 'mc-btn',
      title: 'Minimize',
      textContent: '−',
      onClick: () => {
        isMinimized = !isMinimized;
        overlay.classList.toggle('minimized', isMinimized);
        minimizeBtn.textContent = isMinimized ? '+' : '−';
      }
    });

    const header = createElement('div', { className: 'mc-header' }, [title, minimizeBtn]);

    captionList = createElement('div', { className: 'mc-list' });
    const content = createElement('div', { className: 'mc-content' }, [captionList]);
    const resizeHandle = createElement('div', { className: 'mc-resize' });

    overlay = createElement('div', { id: 'meetcaptioner-overlay' }, [header, content, resizeHandle]);
    document.body.appendChild(overlay);

    // Make draggable
    makeDraggable(overlay, header);

    // Make resizable
    makeResizable(overlay, resizeHandle);

    renderCaptions();
  }

  // Make element resizable (vertical)
  function makeResizable(element, handle) {
    let startY = 0, startHeight = 0;
    let isResizing = false;

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      startY = e.clientY;
      startHeight = element.offsetHeight;

      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';

      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
    });

    function resize(e) {
      if (!isResizing) return;
      e.preventDefault();
      const delta = e.clientY - startY;
      const newHeight = Math.max(150, Math.min(600, startHeight + delta));
      element.style.maxHeight = newHeight + 'px';
      element.style.height = newHeight + 'px';
    }

    function stopResize() {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    }
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
        // Add new item with animation
        const speaker = createElement('div', { className: 'mc-speaker', textContent: c.speaker });
        const text = createElement('div', { className: 'mc-text', textContent: c.text });
        const time = createElement('div', { className: 'mc-time', textContent: c.time });
        const caption = createElement('div', { className: 'mc-caption mc-new' }, [speaker, text, time]);
        captionList.appendChild(caption);
        // Remove animation class after it plays
        setTimeout(() => caption.classList.remove('mc-new'), 200);
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

  // Check text similarity
  function isSimilar(text1, text2) {
    if (!text1 || !text2) return false;
    const t1 = text1.slice(0, 20);
    const t2 = text2.slice(0, 20);
    return t1.includes(t2.slice(0, 10)) || t2.includes(t1.slice(0, 10));
  }

  // Add caption with better deduplication
  function addCaption(speaker, text) {
    if (!speaker || !text) return;

    const last = captions[captions.length - 1];

    // Exact duplicate
    if (last && last.text === text) return;

    // Same speaker - always update last entry
    if (last && last.speaker === speaker) {
      last.text = text;
      last.time = new Date().toLocaleTimeString();

      // Direct DOM update
      const items = captionList?.querySelectorAll('.mc-caption');
      const lastItem = items?.[items.length - 1];
      if (lastItem) {
        const textEl = lastItem.querySelector('.mc-text');
        const timeEl = lastItem.querySelector('.mc-time');
        if (textEl) textEl.textContent = text;
        if (timeEl) timeEl.textContent = last.time;
      }
      return;
    }

    // Check if similar to any recent caption (last 3)
    const recent = captions.slice(-3);
    for (const c of recent) {
      if (isSimilar(c.text, text)) {
        return; // Skip duplicate
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

    renderCaptions(false);
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
