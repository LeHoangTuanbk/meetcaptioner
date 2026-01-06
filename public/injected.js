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
        min-width: 240px;
        min-height: 150px;
      }
      #meetcaptioner-overlay.minimized {
        height: auto !important;
        width: 140px !important;
        min-width: 0 !important;
        min-height: 0 !important;
      }
      #meetcaptioner-overlay.minimized .mc-content,
      #meetcaptioner-overlay.minimized .mc-resize-br,
      #meetcaptioner-overlay.minimized .mc-resize-bl,
      #meetcaptioner-overlay.minimized .mc-resize-b {
        display: none !important;
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
        user-select: text;
        cursor: text;
      }
      .mc-content *::selection {
        background: rgba(255, 255, 255, 0.85) !important;
        color: #1a1a2e !important;
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
        position: absolute;
        bottom: 4px;
        width: 16px;
        height: 16px;
        opacity: 0.4;
        transition: opacity 0.2s;
      }
      .mc-resize:hover {
        opacity: 0.9;
      }
      .mc-resize-br {
        right: 4px;
        cursor: nwse-resize;
      }
      .mc-resize-bl {
        left: 4px;
        cursor: nesw-resize;
      }
      .mc-resize::before,
      .mc-resize::after {
        content: '';
        position: absolute;
        background: rgba(255,255,255,0.5);
        border-radius: 1px;
      }
      .mc-resize-br::before {
        bottom: 2px;
        right: 2px;
        width: 8px;
        height: 2px;
      }
      .mc-resize-br::after {
        bottom: 2px;
        right: 2px;
        width: 2px;
        height: 8px;
      }
      .mc-resize-bl::before {
        bottom: 2px;
        left: 2px;
        width: 8px;
        height: 2px;
      }
      .mc-resize-bl::after {
        bottom: 2px;
        left: 2px;
        width: 2px;
        height: 8px;
      }
      .mc-resize-b {
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        cursor: ns-resize;
      }
      .mc-resize-b::before {
        content: '';
        position: absolute;
        bottom: 4px;
        left: 50%;
        transform: translateX(-50%);
        width: 24px;
        height: 3px;
        background: rgba(255,255,255,0.4);
        border-radius: 2px;
      }
      .mc-resize-b::after {
        display: none;
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
    const resizeHandleBR = createElement('div', { className: 'mc-resize mc-resize-br' });
    const resizeHandleBL = createElement('div', { className: 'mc-resize mc-resize-bl' });
    const resizeHandleB = createElement('div', { className: 'mc-resize mc-resize-b' });

    overlay = createElement('div', { id: 'meetcaptioner-overlay' }, [header, content, resizeHandleBR, resizeHandleBL, resizeHandleB]);
    document.body.appendChild(overlay);

    // Make draggable
    makeDraggable(overlay, header);

    // Make resizable (corners + bottom)
    makeResizable(overlay, resizeHandleBR, 'br');
    makeResizable(overlay, resizeHandleBL, 'bl');
    makeResizable(overlay, resizeHandleB, 'b');

    renderCaptions();
  }

  // Make element resizable (width + height)
  // corner: 'br' = bottom-right, 'bl' = bottom-left
  function makeResizable(element, handle, corner) {
    let startX = 0, startY = 0, startWidth = 0, startHeight = 0, startLeft = 0;
    let isResizing = false;

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = element.offsetWidth;
      startHeight = element.offsetHeight;
      startLeft = element.getBoundingClientRect().left;

      const cursors = { br: 'nwse-resize', bl: 'nesw-resize', b: 'ns-resize' };
      document.body.style.cursor = cursors[corner];
      document.body.style.userSelect = 'none';

      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
    });

    function resize(e) {
      if (!isResizing) return;
      e.preventDefault();

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      // Height is same for all handles (min 150, no max)
      const newHeight = Math.max(150, startHeight + deltaY);
      element.style.height = newHeight + 'px';

      if (corner === 'br') {
        // Bottom-right: drag right to increase width
        const newWidth = Math.max(240, startWidth + deltaX);
        element.style.width = newWidth + 'px';
      } else if (corner === 'bl') {
        // Bottom-left: drag left to increase width, also move left position
        const newWidth = Math.max(240, startWidth - deltaX);
        element.style.width = newWidth + 'px';
        element.style.left = (startLeft + deltaX) + 'px';
        element.style.right = 'auto';
      }
      // corner === 'b': only height, no width change
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
