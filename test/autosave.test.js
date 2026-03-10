/**
 * Tests for autosave module (localStorage persistence)
 *
 * @jest-environment jsdom
 */

const { AutoSave } = require('../docs/js/autosave');

describe('AutoSave', () => {
  let autosave;

  beforeEach(() => {
    localStorage.clear();
    autosave = new AutoSave('paradocs_');
  });

  // ---- saveText / loadText ----

  describe('saveText / loadText', () => {
    test('saves and loads text', () => {
      autosave.saveText('Hello World');
      expect(autosave.loadText()).toBe('Hello World');
    });

    test('returns null when no text saved', () => {
      expect(autosave.loadText()).toBeNull();
    });

    test('overwrites previous text', () => {
      autosave.saveText('first');
      autosave.saveText('second');
      expect(autosave.loadText()).toBe('second');
    });

    test('handles empty string', () => {
      autosave.saveText('');
      expect(autosave.loadText()).toBe('');
    });

    test('handles text with special characters', () => {
      const text = "Line1\nLine2\t\"quoted\" <html> & 日本語";
      autosave.saveText(text);
      expect(autosave.loadText()).toBe(text);
    });

    test('handles large text', () => {
      const text = 'x'.repeat(50000);
      autosave.saveText(text);
      expect(autosave.loadText()).toBe(text);
    });
  });

  // ---- saveSettings / loadSettings ----

  describe('saveSettings / loadSettings', () => {
    test('saves and loads settings object', () => {
      const settings = { font_size: '40', speech_lang: 'ja-JP' };
      autosave.saveSettings(settings);
      expect(autosave.loadSettings()).toEqual(settings);
    });

    test('returns null when no settings saved', () => {
      expect(autosave.loadSettings()).toBeNull();
    });

    test('handles all form fields', () => {
      const settings = {
        speech_lang: 'en-US',
        speech_voice: 'Google US English',
        speech_rate: '1.2',
        font_size: '50',
        font_family: 'serif',
        accent_color: '#e15759',
        highlight_background_color: '#4e79a7',
        resolution: '1920x1080',
        wallpaper: 'sandpaper.png',
        color_inverted: true
      };
      autosave.saveSettings(settings);
      expect(autosave.loadSettings()).toEqual(settings);
    });

    test('handles corrupted JSON gracefully', () => {
      localStorage.setItem('paradocs_settings', '{invalid json}');
      expect(autosave.loadSettings()).toBeNull();
    });
  });

  // ---- clear ----

  describe('clear', () => {
    test('clears saved text', () => {
      autosave.saveText('some text');
      autosave.clear();
      expect(autosave.loadText()).toBeNull();
    });

    test('clears saved settings', () => {
      autosave.saveSettings({ font_size: '40' });
      autosave.clear();
      expect(autosave.loadSettings()).toBeNull();
    });

    test('does not affect other localStorage keys', () => {
      localStorage.setItem('other_app_data', 'keep');
      autosave.saveText('text');
      autosave.clear();
      expect(localStorage.getItem('other_app_data')).toBe('keep');
    });
  });

  // ---- hasSavedData ----

  describe('hasSavedData', () => {
    test('returns false when nothing saved', () => {
      expect(autosave.hasSavedData()).toBe(false);
    });

    test('returns true when text is saved', () => {
      autosave.saveText('hello');
      expect(autosave.hasSavedData()).toBe(true);
    });

    test('returns false after clear', () => {
      autosave.saveText('hello');
      autosave.clear();
      expect(autosave.hasSavedData()).toBe(false);
    });
  });

  // ---- prefix isolation ----

  describe('prefix isolation', () => {
    test('different prefixes do not interfere', () => {
      const other = new AutoSave('other_');
      autosave.saveText('paradocs text');
      other.saveText('other text');
      expect(autosave.loadText()).toBe('paradocs text');
      expect(other.loadText()).toBe('other text');
    });
  });

  // ---- debounce ----

  describe('debouncedSaveText', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('does not save immediately', () => {
      autosave.debouncedSaveText('hello');
      expect(autosave.loadText()).toBeNull();
    });

    test('saves after delay', () => {
      autosave.debouncedSaveText('hello');
      jest.advanceTimersByTime(1000);
      expect(autosave.loadText()).toBe('hello');
    });

    test('resets timer on rapid calls', () => {
      autosave.debouncedSaveText('first');
      jest.advanceTimersByTime(500);
      autosave.debouncedSaveText('second');
      jest.advanceTimersByTime(500);
      // 1000ms total but timer was reset, so 'first' should not have been saved
      expect(autosave.loadText()).toBeNull();
      jest.advanceTimersByTime(500);
      expect(autosave.loadText()).toBe('second');
    });
  });

  // ---- localStorage unavailable ----

  describe('localStorage unavailable', () => {
    let originalStorage;

    beforeEach(() => {
      originalStorage = global.localStorage;
      // Simulate localStorage being unavailable (throws on access)
      Object.defineProperty(global, 'localStorage', {
        get: () => { throw new Error('localStorage disabled'); },
        configurable: true
      });
    });

    afterEach(() => {
      Object.defineProperty(global, 'localStorage', {
        value: originalStorage,
        writable: true,
        configurable: true
      });
    });

    test('saveText does not throw', () => {
      expect(() => autosave.saveText('hello')).not.toThrow();
    });

    test('loadText returns null', () => {
      expect(autosave.loadText()).toBeNull();
    });

    test('hasSavedData returns false', () => {
      expect(autosave.hasSavedData()).toBe(false);
    });

    test('clear does not throw', () => {
      expect(() => autosave.clear()).not.toThrow();
    });
  });
});
