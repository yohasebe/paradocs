// Filmstrip Preview — slide thumbnails next to editor (virtual scroll)
var PreviewPanel = (function() {
  var filmstripPanel = null;
  var filmstripScroll = null;
  var filmstripHandle = null;
  var container = null;
  var editorWrapper = null;
  var toggleBtn = null;
  var debounceTimer = null;
  var syncTimer = null;
  var lastText = null;
  var lastSlideIndex = -1;
  var visible = false;
  var syncEnabled = false;

  // Virtual scroll state
  var slideData = [];    // Array of srcdoc strings
  var thumbDivs = [];    // Array of placeholder DOM elements
  var thumbH = 0;
  var slideScale = 0;
  var slideWidth = 1280;
  var slideHeight = 800;
  var renderedSet = {};  // { index: true } for slides with iframes
  var BUFFER = 2;

  function init() {
    filmstripPanel = document.getElementById('filmstrip-panel');
    filmstripScroll = document.getElementById('filmstrip-scroll');
    filmstripHandle = document.getElementById('filmstrip-handle');
    container = document.getElementById('editor-preview-container');
    editorWrapper = document.getElementById('editor-wrapper');
    toggleBtn = document.getElementById('preview_toggle_button');

    if (!filmstripPanel || !toggleBtn || !filmstripScroll) return;

    toggleBtn.addEventListener('click', function() {
      toggle();
    });

    var syncBtn = document.getElementById('filmstrip-sync-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', function() {
        syncEnabled = !syncEnabled;
        syncBtn.classList.toggle('active', syncEnabled);
      });
    }

    filmstripScroll.addEventListener('scroll', onScroll);

    initResize();

    var textarea = document.getElementById('input-textarea');
    if (textarea && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(function() {
        if (visible) syncFilmstripHeight();
      }).observe(textarea);
    }

    if (window.innerWidth > 900) {
      toggle();
    }
  }

  // --- Resize handle ---
  function initResize() {
    if (!filmstripHandle || !container) return;
    var dragging = false;

    filmstripHandle.addEventListener('mousedown', startDrag);
    filmstripHandle.addEventListener('touchstart', startDrag, { passive: false });

    function startDrag(e) {
      e.preventDefault();
      dragging = true;
      filmstripHandle.classList.add('dragging');
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchmove', onDrag, { passive: false });
      document.addEventListener('touchend', stopDrag);
    }

    function onDrag(e) {
      if (!dragging) return;
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var rect = container.getBoundingClientRect();
      var filmstripW = rect.right - clientX;
      filmstripW = Math.max(150, Math.min(500, filmstripW));
      filmstripPanel.style.width = filmstripW + 'px';
      rerender();
      if (typeof editor !== 'undefined') editor.resize();
    }

    function stopDrag() {
      dragging = false;
      filmstripHandle.classList.remove('dragging');
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchmove', onDrag);
      document.removeEventListener('touchend', stopDrag);
    }
  }

  function rerender() {
    lastText = null;
    sendUpdate();
  }

  function toggle() {
    visible = !visible;
    var syncBtn = document.getElementById('filmstrip-sync-btn');
    if (visible) {
      filmstripPanel.style.display = 'flex';
      if (filmstripHandle) filmstripHandle.style.display = '';
      if (syncBtn) syncBtn.style.display = '';
      syncFilmstripHeight();
      toggleBtn.classList.add('active');
      sendUpdate();
      if (typeof editor !== 'undefined') {
        setTimeout(function() { editor.resize(); }, 50);
      }
    } else {
      filmstripPanel.style.display = 'none';
      if (filmstripHandle) filmstripHandle.style.display = 'none';
      if (syncBtn) syncBtn.style.display = 'none';
      toggleBtn.classList.remove('active');
      if (typeof editor !== 'undefined') {
        setTimeout(function() { editor.resize(); }, 50);
      }
    }
  }

  function syncFilmstripHeight() {
    var textarea = document.getElementById('input-textarea');
    var editorHeader = document.getElementById('editor-header');
    if (textarea && filmstripPanel) {
      var h = textarea.offsetHeight + (editorHeader ? editorHeader.offsetHeight : 0);
      filmstripPanel.style.maxHeight = h + 'px';
      if (filmstripHandle) filmstripHandle.style.height = h + 'px';
    }
  }

  function scheduleUpdate() {
    if (!visible) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
      sendUpdate();
    }, 800);
  }

  function sendUpdate() {
    if (!visible) return;

    var text = (typeof editor !== 'undefined') ? editor.getValue() : '';
    if (text === lastText) return;
    lastText = text;

    if (!text || text.trim().length === 0) {
      slideData = [];
      thumbDivs = [];
      renderedSet = {};
      filmstripScroll.innerHTML = '<div style="text-align:center;padding:1em;color:#999;font-size:11px;">Enter text...</div>';
      return;
    }

    try {
      var result = buildPresentation();
      if (result && result.slides) {
        buildSlideData(result.slides, result.css, result.config, result.colorInverted);
        highlightSlide(getCurrentSlideIndex());
      }
    } catch (e) {
      // Keep last good thumbnails on error
    }
  }

  // Same CDN as deck.html — srcdoc iframes cannot use local paths
  var REVEAL_CORE_CSS = 'https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.css';
  var REVEAL_THEME_CSS = 'https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/theme/simple.css';

  function buildSlideData(slidesHtml, cssText, config, inverted) {
    slideWidth = config.width || 1280;
    slideHeight = config.height || 800;
    var thumbW = Math.max(100, filmstripPanel.clientWidth - 8);
    slideScale = thumbW / slideWidth;
    thumbH = Math.round(slideHeight * slideScale);

    var tmp = document.createElement('div');
    tmp.innerHTML = slidesHtml;
    var deckSection = tmp.querySelector('section.deck');
    var sections = deckSection ? deckSection.querySelectorAll(':scope > section') : tmp.querySelectorAll('section');

    var cleanCss = cssText ? cssText.replace(/<\/?style[^>]*>/gi, '') : '';

    slideData = [];
    for (var i = 0; i < sections.length; i++) {
      var slideDoc = '<!doctype html><html><head><meta charset="utf-8">' +
        '<link rel="stylesheet" href="' + REVEAL_CORE_CSS + '">' +
        '<link rel="stylesheet" href="' + REVEAL_THEME_CSS + '">' +
        '<style>' +
          'html,body{margin:0;padding:0;overflow:hidden;}' +
          '.reveal{width:' + slideWidth + 'px;height:' + slideHeight + 'px;overflow:hidden;}' +
          '.reveal .slides{width:100%;height:100%;}' +
          '.reveal .slides section{' +
            'visibility:visible!important;' +
            'display:flex!important;' +
            'flex-direction:column;' +
            'justify-content:center;' +
            'top:0!important;' +
            'width:100%;height:100%;' +
            'padding:40px;box-sizing:border-box;' +
          '}' +
          '.reveal .slides section .fragment{visibility:visible!important;opacity:1!important;}' +
          '.reveal .slides section.stack{visibility:visible!important;}' +
          cleanCss +
        '</style>' +
        '</head><body>' +
        '<div class="reveal' + (inverted ? ' inverted' : '') + '">' +
          '<div class="slides"><section>' + sections[i].innerHTML + '</section></div>' +
        '</div>' +
        '</body></html>';

      slideData.push(slideDoc);
    }

    // Build all placeholder divs (lightweight, no iframes yet)
    buildPlaceholders();
    // Populate visible range with iframes
    updateVisibleIframes();
  }

  function buildPlaceholders() {
    filmstripScroll.innerHTML = '';
    thumbDivs = [];
    renderedSet = {};

    for (var i = 0; i < slideData.length; i++) {
      var div = document.createElement('div');
      div.className = 'filmstrip-thumb';
      div.setAttribute('data-slide', i);
      div.style.height = thumbH + 'px';

      var num = document.createElement('span');
      num.className = 'filmstrip-num';
      num.textContent = i + 1;
      div.appendChild(num);

      // Click to open lightbox, double-click to jump editor
      div.addEventListener('click', (function(idx) {
        return function() { openLightbox(idx); };
      })(i));
      div.addEventListener('dblclick', (function(idx) {
        return function() { jumpToSlide(idx); };
      })(i));

      filmstripScroll.appendChild(div);
      thumbDivs.push(div);
    }
  }

  function getVisibleRange() {
    var scrollTop = filmstripScroll.scrollTop;
    var viewHeight = filmstripScroll.clientHeight;
    var itemH = thumbH + 8; // border(4) + margin(4)
    if (itemH <= 0) return { start: 0, end: Math.min(slideData.length, 5) };

    var start = Math.max(0, Math.floor(scrollTop / itemH) - BUFFER);
    var end = Math.min(slideData.length, Math.ceil((scrollTop + viewHeight) / itemH) + BUFFER);
    return { start: start, end: end };
  }

  function updateVisibleIframes() {
    if (slideData.length === 0) return;
    var range = getVisibleRange();

    // Remove iframes outside visible range
    for (var idx in renderedSet) {
      var n = parseInt(idx, 10);
      if (n < range.start || n >= range.end) {
        var iframe = thumbDivs[n].querySelector('iframe');
        if (iframe) thumbDivs[n].removeChild(iframe);
        delete renderedSet[idx];
      }
    }

    // Add iframes for visible range
    for (var i = range.start; i < range.end; i++) {
      if (renderedSet[i]) continue;
      var fr = document.createElement('iframe');
      fr.setAttribute('sandbox', 'allow-same-origin');
      fr.setAttribute('tabindex', '-1');
      fr.srcdoc = slideData[i];
      fr.style.cssText = 'width:' + slideWidth + 'px;height:' + slideHeight + 'px;transform:scale(' + slideScale + ');';
      thumbDivs[i].appendChild(fr);
      renderedSet[i] = true;
    }
  }

  var scrollRafPending = false;
  function onScroll() {
    if (slideData.length === 0 || scrollRafPending) return;
    scrollRafPending = true;
    requestAnimationFrame(function() {
      scrollRafPending = false;
      updateVisibleIframes();
    });
  }

  function highlightSlide(index) {
    if (!filmstripScroll) return;
    lastSlideIndex = index;
    for (var i = 0; i < thumbDivs.length; i++) {
      if (i === index) {
        thumbDivs[i].classList.add('active');
        var ct = filmstripScroll;
        var tTop = thumbDivs[i].offsetTop;
        var tBot = tTop + thumbDivs[i].offsetHeight;
        if (tTop < ct.scrollTop || tBot > ct.scrollTop + ct.clientHeight) {
          thumbDivs[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      } else {
        thumbDivs[i].classList.remove('active');
      }
    }
  }

  // --- Lightbox ---
  var lightboxOverlay = null;
  var lightboxIframe = null;
  var lightboxCounter = null;
  var lightboxIndex = -1;

  function createLightbox() {
    lightboxOverlay = document.createElement('div');
    lightboxOverlay.id = 'filmstrip-lightbox';

    var wrap = document.createElement('div');
    wrap.className = 'filmstrip-lightbox-wrap';

    lightboxIframe = document.createElement('iframe');
    lightboxIframe.setAttribute('sandbox', 'allow-same-origin');
    lightboxIframe.setAttribute('tabindex', '-1');

    lightboxCounter = document.createElement('div');
    lightboxCounter.className = 'filmstrip-lightbox-counter';

    var closeBtn = document.createElement('div');
    closeBtn.className = 'filmstrip-lightbox-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closeLightbox);

    wrap.appendChild(lightboxIframe);
    lightboxOverlay.appendChild(wrap);
    lightboxOverlay.appendChild(lightboxCounter);
    lightboxOverlay.appendChild(closeBtn);

    lightboxOverlay.addEventListener('click', function(e) {
      if (e.target === lightboxOverlay) closeLightbox();
    });

    document.body.appendChild(lightboxOverlay);
  }

  function openLightbox(index) {
    if (!lightboxOverlay) createLightbox();
    if (index < 0 || index >= slideData.length) return;
    lightboxIndex = index;

    var vw = window.innerWidth * 0.8;
    var vh = window.innerHeight * 0.8;
    var scale = Math.min(vw / slideWidth, vh / slideHeight);
    var w = Math.round(slideWidth * scale);
    var h = Math.round(slideHeight * scale);

    var wrap = lightboxIframe.parentNode;
    wrap.style.width = w + 'px';
    wrap.style.height = h + 'px';
    wrap.style.marginTop = (-h / 2) + 'px';
    wrap.style.marginLeft = (-w / 2) + 'px';

    lightboxIframe.style.width = slideWidth + 'px';
    lightboxIframe.style.height = slideHeight + 'px';
    lightboxIframe.style.transform = 'scale(' + scale + ')';

    lightboxIframe.srcdoc = slideData[index];
    lightboxCounter.textContent = (index + 1) + ' / ' + slideData.length;

    lightboxOverlay.classList.add('active');
    document.addEventListener('keydown', lightboxKeyHandler);
  }

  function closeLightbox() {
    if (!lightboxOverlay) return;
    lightboxOverlay.classList.remove('active');
    lightboxIframe.srcdoc = '';
    lightboxIndex = -1;
    document.removeEventListener('keydown', lightboxKeyHandler);
  }

  function lightboxKeyHandler(e) {
    if (e.key === 'Escape') { closeLightbox(); return; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (lightboxIndex < slideData.length - 1) openLightbox(lightboxIndex + 1);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (lightboxIndex > 0) openLightbox(lightboxIndex - 1);
    }
  }

  function jumpToSlide(index) {
    if (typeof editor === 'undefined') return;
    var lines = editor.session.getDocument().getAllLines();
    var sepCount = 0;
    for (var i = 0; i < lines.length; i++) {
      if (/^\s*(?:=\s?|-\s?){4,}\s*$/.test(lines[i])) {
        sepCount++;
        if (sepCount - 1 === index) {
          editor.gotoLine(Math.min(i + 2, lines.length), 0, true);
          editor.focus();
          return;
        }
      }
    }
  }

  function syncSlide(cursorRow) {
    if (!visible || !syncEnabled) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function() {
      var slideIndex = getSlideIndexForRow(cursorRow);
      if (slideIndex === lastSlideIndex) return;
      lastSlideIndex = slideIndex;
      highlightSlide(slideIndex);
    }, 100);
  }

  function getSlideIndexForRow(row) {
    if (typeof editor === 'undefined') return 0;
    var lines = editor.session.getLines(0, row);
    var count = 0;
    for (var i = 0; i < lines.length; i++) {
      if (/^\s*(?:=\s?|-\s?){4,}\s*$/.test(lines[i])) {
        count++;
      }
    }
    return Math.max(0, count - 1);
  }

  function getCurrentSlideIndex() {
    if (typeof editor === 'undefined') return 0;
    return getSlideIndexForRow(editor.getCursorPosition().row);
  }

  function updateAspectRatio() {
    forceUpdate();
  }

  function isVisible() {
    return visible;
  }

  function forceUpdate() {
    lastText = null;
    scheduleUpdate();
  }

  return {
    init: init,
    toggle: toggle,
    scheduleUpdate: scheduleUpdate,
    sendUpdate: sendUpdate,
    syncSlide: syncSlide,
    isVisible: isVisible,
    forceUpdate: forceUpdate,
    updateAspectRatio: updateAspectRatio
  };
})();
