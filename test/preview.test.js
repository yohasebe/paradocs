/**
 * Tests for preview.js (filmstrip preview panel with virtual scroll)
 *
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Minimal DOM setup before loading preview.js
function setupDOM() {
  document.body.innerHTML = `
    <div id="editor-preview-container">
      <div id="editor-wrapper">
        <div id="editor-header"></div>
        <div id="input-textarea" style="height:450px;"></div>
      </div>
      <div id="filmstrip-handle" style="display:none;"></div>
      <div id="filmstrip-panel" style="display:none;">
        <div id="filmstrip-scroll"></div>
      </div>
    </div>
    <span id="preview_toggle_button" class="btn"></span>
    <span id="filmstrip-sync-btn" class="filmstrip-sync active" style="display:none;"></span>
  `;
}

// Mock window.innerWidth
function setWindowWidth(w) {
  Object.defineProperty(window, 'innerWidth', { value: w, writable: true, configurable: true });
}

// Load preview.js into global scope
function loadPreview() {
  const code = fs.readFileSync(
    path.join(__dirname, '..', 'docs', 'js', 'preview.js'),
    'utf-8'
  );
  eval(code);
  // IIFE creates a local var; re-export to global for tests
  global.PreviewPanel = eval('PreviewPanel');
}

describe('PreviewPanel', () => {
  beforeEach(() => {
    setupDOM();
    setWindowWidth(800); // Narrow: don't auto-open
    loadPreview();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    // Clean up global
    if (typeof PreviewPanel !== 'undefined') {
      // no teardown needed, DOM is cleared
    }
  });

  describe('init()', () => {
    test('should not auto-open filmstrip on narrow screens', () => {
      PreviewPanel.init();
      var panel = document.getElementById('filmstrip-panel');
      expect(panel.style.display).toBe('none');
    });

    test('should auto-open filmstrip on wide screens (>900px)', () => {
      setWindowWidth(1200);
      // Reload to pick up new width
      loadPreview();
      PreviewPanel.init();
      var panel = document.getElementById('filmstrip-panel');
      expect(panel.style.display).toBe('flex');
    });

    test('should add active class to toggle button when opened', () => {
      setWindowWidth(1200);
      loadPreview();
      PreviewPanel.init();
      var btn = document.getElementById('preview_toggle_button');
      expect(btn.classList.contains('active')).toBe(true);
    });
  });

  describe('toggle()', () => {
    beforeEach(() => {
      PreviewPanel.init();
    });

    test('should show filmstrip panel when toggled on', () => {
      PreviewPanel.toggle();
      var panel = document.getElementById('filmstrip-panel');
      expect(panel.style.display).toBe('flex');
    });

    test('should hide filmstrip panel when toggled off', () => {
      PreviewPanel.toggle(); // on
      PreviewPanel.toggle(); // off
      var panel = document.getElementById('filmstrip-panel');
      expect(panel.style.display).toBe('none');
    });

    test('should show sync button when panel is visible', () => {
      PreviewPanel.toggle();
      var syncBtn = document.getElementById('filmstrip-sync-btn');
      expect(syncBtn.style.display).toBe('');
    });

    test('should hide sync button when panel is hidden', () => {
      PreviewPanel.toggle(); // on
      PreviewPanel.toggle(); // off
      var syncBtn = document.getElementById('filmstrip-sync-btn');
      expect(syncBtn.style.display).toBe('none');
    });

    test('should show resize handle when panel is visible', () => {
      PreviewPanel.toggle();
      var handle = document.getElementById('filmstrip-handle');
      expect(handle.style.display).toBe('');
    });
  });

  describe('isVisible()', () => {
    beforeEach(() => {
      PreviewPanel.init();
    });

    test('should return false initially', () => {
      expect(PreviewPanel.isVisible()).toBe(false);
    });

    test('should return true after toggle on', () => {
      PreviewPanel.toggle();
      expect(PreviewPanel.isVisible()).toBe(true);
    });

    test('should return false after toggle on then off', () => {
      PreviewPanel.toggle();
      PreviewPanel.toggle();
      expect(PreviewPanel.isVisible()).toBe(false);
    });
  });

  describe('sync toggle', () => {
    test('should toggle active class on sync button click', () => {
      PreviewPanel.init();
      PreviewPanel.toggle(); // open panel
      var syncBtn = document.getElementById('filmstrip-sync-btn');
      // Default is on (active class)
      expect(syncBtn.classList.contains('active')).toBe(true);
      // Click to disable
      syncBtn.click();
      expect(syncBtn.classList.contains('active')).toBe(false);
      // Click to re-enable
      syncBtn.click();
      expect(syncBtn.classList.contains('active')).toBe(true);
    });
  });

  describe('scheduleUpdate()', () => {
    test('should not throw when panel is not visible', () => {
      PreviewPanel.init();
      expect(() => PreviewPanel.scheduleUpdate()).not.toThrow();
    });

    test('should not throw when panel is visible', () => {
      PreviewPanel.init();
      PreviewPanel.toggle();
      expect(() => PreviewPanel.scheduleUpdate()).not.toThrow();
    });
  });

  describe('forceUpdate()', () => {
    test('should not throw', () => {
      PreviewPanel.init();
      expect(() => PreviewPanel.forceUpdate()).not.toThrow();
    });
  });

  describe('updateAspectRatio()', () => {
    test('should not throw', () => {
      PreviewPanel.init();
      expect(() => PreviewPanel.updateAspectRatio()).not.toThrow();
    });
  });

  describe('syncSlide()', () => {
    test('should not throw when panel is not visible', () => {
      PreviewPanel.init();
      expect(() => PreviewPanel.syncSlide(0)).not.toThrow();
    });

    test('should not throw when panel is visible but sync disabled', () => {
      PreviewPanel.init();
      PreviewPanel.toggle();
      expect(() => PreviewPanel.syncSlide(5)).not.toThrow();
    });
  });

  describe('sendUpdate()', () => {
    test('should show placeholder when no editor is defined', () => {
      PreviewPanel.init();
      PreviewPanel.toggle();
      // editor is not defined, so getValue returns ''
      PreviewPanel.sendUpdate();
      var scroll = document.getElementById('filmstrip-scroll');
      expect(scroll.innerHTML).toContain('Enter text');
    });
  });

  describe('filmstrip height sync', () => {
    test('should set maxHeight on filmstrip panel based on textarea', () => {
      // Manually set offsetHeight (jsdom does not compute layout)
      Object.defineProperty(document.getElementById('input-textarea'), 'offsetHeight', {
        value: 450, configurable: true
      });
      Object.defineProperty(document.getElementById('editor-header'), 'offsetHeight', {
        value: 28, configurable: true
      });
      PreviewPanel.init();
      PreviewPanel.toggle();
      var panel = document.getElementById('filmstrip-panel');
      expect(panel.style.maxHeight).toBe('478px');
    });
  });
});

describe('replaceMediaForThumb', () => {
  beforeAll(() => {
    setWindowWidth(1200);
    setupDOM();
    loadPreview();
  });

  test('replaces YouTube iframe with thumbnail image', () => {
    var html = "<iframe class='fragment' width='100%' allow='autoplay' data-ytid='ABC123def' src='https://www.youtube.com/embed/ABC123def' id='yt1' data-ignore='true' ></iframe>";
    var result = PreviewPanel._replaceMediaForThumb(html);
    expect(result).not.toContain('<iframe');
    expect(result).toContain('img.youtube.com/vi/ABC123def/');
    expect(result).toContain('object-fit:cover');
  });

  test('replaces non-YouTube iframe with placeholder', () => {
    var html = "<iframe src='https://example.com/embed'></iframe>";
    var result = PreviewPanel._replaceMediaForThumb(html);
    expect(result).not.toContain('<iframe');
    expect(result).toContain('embedded content');
  });

  test('replaces audio element with placeholder', () => {
    var html = "<audio src='https://example.com/audio.mp3'></audio>";
    var result = PreviewPanel._replaceMediaForThumb(html);
    expect(result).not.toContain('<audio');
    expect(result).toContain('audio');
  });

  test('preserves non-media HTML content', () => {
    var html = "<div class='text'><p>Hello world</p></div>";
    var result = PreviewPanel._replaceMediaForThumb(html);
    expect(result).toBe(html);
  });

  test('handles multiple YouTube iframes', () => {
    var html = "<iframe data-ytid='vid1' src='x'></iframe><p>text</p><iframe data-ytid='vid2' src='y'></iframe>";
    var result = PreviewPanel._replaceMediaForThumb(html);
    expect(result).toContain('vid1');
    expect(result).toContain('vid2');
    expect(result).not.toContain('<iframe');
  });
});

describe('PreviewPanel DOM missing', () => {
  test('should not throw when required elements are missing', () => {
    document.body.innerHTML = '';
    loadPreview();
    expect(() => PreviewPanel.init()).not.toThrow();
  });

  test('isVisible returns false when not initialized', () => {
    document.body.innerHTML = '';
    loadPreview();
    PreviewPanel.init();
    expect(PreviewPanel.isVisible()).toBe(false);
  });
});
