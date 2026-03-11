/**
 * Tests for TTS word highlight module
 *
 * @jest-environment jsdom
 */

const { TTSHighlight } = require('../docs/js/tts-highlight');

describe('TTSHighlight', () => {
  describe('buildTextNodeMap', () => {
    test('maps plain text to a single entry', () => {
      var el = document.createElement('span');
      el.textContent = 'Hello world';
      var map = TTSHighlight.buildTextNodeMap(el);
      expect(map.length).toBe(1);
      expect(map[0].offset).toBe(0);
      expect(map[0].length).toBe(11);
    });

    test('maps text with inline HTML to multiple entries', () => {
      var el = document.createElement('span');
      el.innerHTML = 'Hello <b>bold</b> world';
      var map = TTSHighlight.buildTextNodeMap(el);
      expect(map.length).toBe(3);
      expect(map[0].offset).toBe(0); // "Hello "
      expect(map[1].offset).toBe(6); // "bold"
      expect(map[2].offset).toBe(10); // " world"
    });

    test('handles nested HTML', () => {
      var el = document.createElement('span');
      el.innerHTML = 'A <b><u>nested</u></b> text';
      var map = TTSHighlight.buildTextNodeMap(el);
      // "A " + "nested" + " text"
      expect(map.length).toBe(3);
      expect(map[0].offset).toBe(0);
      expect(map[1].offset).toBe(2);
      expect(map[2].offset).toBe(8);
    });

    test('returns empty map for empty element', () => {
      var el = document.createElement('span');
      var map = TTSHighlight.buildTextNodeMap(el);
      expect(map.length).toBe(0);
    });
  });

  describe('findWordBoundary', () => {
    test('finds word at beginning of text', () => {
      var result = TTSHighlight.findWordBoundary('Hello world', 0);
      expect(result).toEqual({ start: 0, end: 5 });
    });

    test('finds word at offset', () => {
      var result = TTSHighlight.findWordBoundary('Hello world', 6);
      expect(result).toEqual({ start: 6, end: 11 });
    });

    test('finds word in middle', () => {
      var result = TTSHighlight.findWordBoundary('The quick brown fox', 4);
      expect(result).toEqual({ start: 4, end: 9 });
    });

    test('handles offset at space', () => {
      var result = TTSHighlight.findWordBoundary('Hello world', 5);
      // At the space, find next word
      expect(result.start).toBeGreaterThanOrEqual(5);
    });
  });

  describe('highlightWord', () => {
    test('wraps target word in highlight span', () => {
      var el = document.createElement('span');
      el.textContent = 'Hello world';
      TTSHighlight.highlightWord(el, 6, 5); // "world"
      expect(el.querySelector('.tts-word-highlight')).not.toBeNull();
      expect(el.querySelector('.tts-word-highlight').textContent).toBe('world');
    });

    test('clears previous highlight before adding new one', () => {
      var el = document.createElement('span');
      el.textContent = 'Hello world';
      TTSHighlight.highlightWord(el, 0, 5); // "Hello"
      TTSHighlight.highlightWord(el, 6, 5); // "world"
      var highlights = el.querySelectorAll('.tts-word-highlight');
      expect(highlights.length).toBe(1);
      expect(highlights[0].textContent).toBe('world');
    });

    test('works with inline HTML', () => {
      var el = document.createElement('span');
      el.innerHTML = 'Hello <b>bold</b> world';
      TTSHighlight.highlightWord(el, 6, 4); // "bold" inside <b>
      var hl = el.querySelector('.tts-word-highlight');
      expect(hl).not.toBeNull();
      expect(hl.textContent).toBe('bold');
    });

    test('handles out of range gracefully', () => {
      var el = document.createElement('span');
      el.textContent = 'Hello';
      // Should not throw
      TTSHighlight.highlightWord(el, 100, 5);
    });
  });

  describe('clearHighlight', () => {
    test('removes highlight spans and restores text', () => {
      var el = document.createElement('span');
      el.textContent = 'Hello world';
      TTSHighlight.highlightWord(el, 0, 5);
      expect(el.querySelector('.tts-word-highlight')).not.toBeNull();
      TTSHighlight.clearHighlight(el);
      expect(el.querySelector('.tts-word-highlight')).toBeNull();
      expect(el.textContent).toBe('Hello world');
    });

    test('restores inline HTML structure', () => {
      var el = document.createElement('span');
      el.innerHTML = 'Hello <b>bold</b> world';
      TTSHighlight.highlightWord(el, 6, 4);
      TTSHighlight.clearHighlight(el);
      expect(el.querySelector('.tts-word-highlight')).toBeNull();
      expect(el.textContent).toBe('Hello bold world');
      // <b> should still exist
      expect(el.querySelector('b')).not.toBeNull();
    });

    test('no-op on element without highlights', () => {
      var el = document.createElement('span');
      el.textContent = 'Hello world';
      TTSHighlight.clearHighlight(el);
      expect(el.textContent).toBe('Hello world');
    });
  });
});
