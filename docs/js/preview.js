// Filmstrip Preview — slide thumbnails next to editor (virtual scroll)
var PreviewPanel = (function() {
  var DEFAULT_WIDTH = 1280;
  var DEFAULT_HEIGHT = 800;
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
  var syncEnabled = true;

  // Virtual scroll state
  var slideData = [];    // Array of srcdoc strings
  var thumbDivs = [];    // Array of placeholder DOM elements
  var thumbH = 0;
  var slideScale = 0;
  var slideWidth = DEFAULT_WIDTH;
  var slideHeight = DEFAULT_HEIGHT;
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

    var syncCheckbox = document.getElementById('filmstrip-sync-checkbox');
    if (syncCheckbox) {
      syncCheckbox.addEventListener('change', function() {
        syncEnabled = syncCheckbox.checked;
        updateSyncUI();
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

  function updateSyncUI() {
    var syncLabel = document.getElementById('filmstrip-sync-label');
    var syncIcon = document.getElementById('filmstrip-sync-icon');
    var syncBtn = document.getElementById('filmstrip-sync-btn');
    if (syncLabel) {
      syncLabel.textContent = syncEnabled ?
        (syncLabel.dataset.labelOn || 'Click to scroll') :
        (syncLabel.dataset.labelOff || 'Click to preview');
    }
    if (syncIcon) {
      syncIcon.className = syncEnabled ? 'fa-solid fa-link' : 'fa-solid fa-magnifying-glass';
    }
    if (syncBtn) {
      syncBtn.title = syncEnabled ?
        (syncBtn.dataset.hintOn || '') :
        (syncBtn.dataset.hintOff || '');
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
      sendUpdate({ scrollToActive: true });
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
    var stylePanel = document.getElementById('style-panel');
    if (textarea && filmstripPanel) {
      var h = textarea.offsetHeight + (editorHeader ? editorHeader.offsetHeight : 0);
      if (stylePanel && stylePanel.offsetHeight > 0 && stylePanel.style.display !== 'none') {
        h += stylePanel.offsetHeight;
      }
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

  function sendUpdate(options) {
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
        if (options && options.scrollToActive) {
          highlightSlide(getCurrentSlideIndex(), true);
        }
      }
    } catch (e) {
      // Keep last good thumbnails on error
    }
  }

  // Minimal inline CSS for preview thumbnails (no external links to avoid sandbox warnings)
  var PREVIEW_BASE_CSS =
    '@import url("https://fonts.googleapis.com/css?family=News+Cycle:400,700|Lato:400,700&display=swap");' +
    '*{margin:0;padding:0;box-sizing:border-box;}' +
    'body{font-family:"Lato","Source Sans Pro",Helvetica,sans-serif;font-size:40px;color:#222;line-height:1.3;}' +
    'h1,h2,h3{font-family:"News Cycle",Impact,sans-serif;font-weight:bold;line-height:1.2;margin:0 0 0.3em 0;}' +
    'h1{font-size:1.5em;}h2{font-size:1.2em;}h3{font-size:1.0em;}' +
    'ul,ol{text-align:left;margin:0 0 0 1em;}' +
    'li{margin:0.2em 0;}' +
    'table{border-collapse:collapse;margin:0.5em auto;}' +
    'td,th{border:1px solid #ddd;padding:0.3em 0.6em;font-size:0.7em;}' +
    'th{background:#f5f5f5;font-weight:bold;}' +
    'pre,code{font-family:monospace;font-size:0.6em;background:#f5f5f5;padding:0.2em 0.4em;border-radius:3px;}' +
    'pre{padding:0.5em;overflow:hidden;}' +
    'blockquote{border-left:4px solid #ddd;padding-left:0.8em;margin:0.5em 0;font-size:0.9em;color:#555;}' +
    'img{max-width:100%;max-height:100%;object-fit:contain;}' +
    'mark{background:#ffe066;padding:0 0.1em;}' +
    'a{color:#4e79a7;text-decoration:none;}';

  // Cache for resolved YouTube thumbnail URLs
  var ytThumbCache = {};

  function resolveYtThumb(ytid) {
    if (ytThumbCache[ytid]) return ytThumbCache[ytid];
    var maxres = 'https://img.youtube.com/vi/' + ytid + '/maxresdefault.jpg';
    var fallback = 'https://img.youtube.com/vi/' + ytid + '/hqdefault.jpg';
    var img = new Image();
    img.onload = function() { ytThumbCache[ytid] = maxres; };
    img.onerror = function() { ytThumbCache[ytid] = fallback; };
    img.src = maxres;
    return ytThumbCache[ytid] || maxres;
  }

  // Replace YouTube/audio/video embeds with static placeholders for thumbnails
  function replaceMediaForThumb(html) {
    html = html.replace(/<iframe[^>]*data-ytid=['"]([^'"]+)['"][^>]*>[^<]*<\/iframe>/gi, function(match, ytid) {
      var thumbUrl = resolveYtThumb(ytid);
      return '<div style="position:relative;width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden;">' +
        '<img src="' + thumbUrl + '" style="width:100%;height:100%;object-fit:cover;" />' +
        '<div style="position:absolute;width:60px;height:42px;background:rgba(205,32,31,0.9);border-radius:10px;display:flex;align-items:center;justify-content:center;">' +
        '<div style="width:0;height:0;border-style:solid;border-width:10px 0 10px 18px;border-color:transparent transparent transparent #fff;margin-left:3px;"></div>' +
        '</div></div>';
    });
    html = html.replace(/<iframe[^>]*>[^<]*<\/iframe>/gi,
      '<div style="width:100%;height:80px;background:#eee;display:flex;align-items:center;justify-content:center;color:#999;font-size:14px;">embedded content</div>');
    html = html.replace(/<audio[^>]*>(?:[\s\S]*?<\/audio>)?/gi,
      '<div style="width:100%;height:40px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#999;font-size:14px;border-radius:4px;">&#9835; audio</div>');
    return html;
  }

  // Strip all script-triggering content from HTML for preview iframes
  function sanitizeForPreview(html) {
    return html
      // Remove paired <script>…</script> (including multiline, nested whitespace)
      .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
      // Remove any remaining orphaned <script> opening tags
      .replace(/<script\b[^>]*>/gi, '')
      // Remove inline event handlers (onclick, onerror, etc.)
      // Use (?:^|\s) to avoid matching data-onclick, aria-onchange, etc.
      .replace(/(?:^|\s)on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
      .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  }

  function buildSlideData(slidesHtml, cssText, config, inverted) {
    slideWidth = config.width || DEFAULT_WIDTH;
    slideHeight = config.height || DEFAULT_HEIGHT;
    var thumbW = Math.max(100, filmstripPanel.clientWidth - 8);
    slideScale = thumbW / slideWidth;
    thumbH = Math.round(slideHeight * slideScale);

    var tmp = document.createElement('div');
    tmp.innerHTML = slidesHtml;
    var deckSection = tmp.querySelector('section.deck');
    var sections = deckSection ? deckSection.querySelectorAll(':scope > section') : tmp.querySelectorAll('section');

    var cleanCss = cssText ? cssText.replace(/<\/?style[^>]*>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '') : '';

    slideData = [];
    for (var i = 0; i < sections.length; i++) {
      var slideHtml = sanitizeForPreview(replaceMediaForThumb(sections[i].innerHTML));
      var slideDoc = '<!doctype html><html><head><meta charset="utf-8">' +
        '<style>' +
        PREVIEW_BASE_CSS +
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
          '<div class="slides"><section>' + slideHtml + '</section></div>' +
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

      // Click: sync ON → jump to editor, sync OFF → open lightbox
      div.addEventListener('click', (function(idx) {
        return function() {
          if (syncEnabled) {
            jumpToSlide(idx);
          } else {
            openLightbox(idx);
          }
        };
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
      // No sandbox: content is sanitized (scripts/handlers stripped by sanitizeForPreview)
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

  function highlightSlide(index, scroll) {
    if (!filmstripScroll) return;
    lastSlideIndex = index;
    for (var i = 0; i < thumbDivs.length; i++) {
      if (i === index) {
        thumbDivs[i].classList.add('active');
      } else {
        thumbDivs[i].classList.remove('active');
      }
    }
    // Only scroll filmstrip when explicitly requested (user click, toggle open)
    if (scroll && thumbDivs[index]) {
      var thumb = thumbDivs[index];
      var containerHeight = filmstripScroll.clientHeight;
      var containerRect = filmstripScroll.getBoundingClientRect();
      var thumbRect = thumb.getBoundingClientRect();
      var thumbTopInContainer = thumbRect.top - containerRect.top + filmstripScroll.scrollTop;
      var targetScroll = thumbTopInContainer - (containerHeight - thumbRect.height) / 2;
      filmstripScroll.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
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
    var sepRegex = /^\s*(?:(?:=\s?|~\s?){4,}|(?:-\s?){3,})\s*$/;
    var sepCount = 0;
    var startLine = -1;
    var endLine = lines.length - 1;
    for (var i = 0; i < lines.length; i++) {
      if (sepRegex.test(lines[i])) {
        if (sepCount === index) {
          startLine = i + 1;
        } else if (sepCount === index + 1) {
          endLine = i - 1;
          break;
        }
        sepCount++;
      }
    }
    if (startLine < 0) return;
    // Select the slide's text range
    var Range = ace.require('ace/range').Range;
    editor.selection.setRange(new Range(startLine, 0, endLine, lines[endLine].length));
    editor.scrollToLine(startLine, true, true);
    editor.focus();
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
      if (/^\s*(?:(?:=\s?|~\s?){4,}|(?:-\s?){3,})\s*$/.test(lines[i])) {
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
    updateAspectRatio: updateAspectRatio,
    syncHeight: syncFilmstripHeight,
    _replaceMediaForThumb: replaceMediaForThumb,
    _sanitizeForPreview: sanitizeForPreview
  };
})();
