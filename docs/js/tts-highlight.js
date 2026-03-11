/**
 * TTS Word Highlight - highlights words during text-to-speech playback.
 *
 * Uses TreeWalker to map text nodes to character offsets, then wraps
 * the active word in a highlight span. Preserves existing inline HTML
 * (bold, italic, underline, mark) and cleans up after playback.
 *
 * Compatible with CommonJS (for testing with Jest).
 */

(function (root) {
  'use strict';

  var TTSHighlight = {};
  var HIGHLIGHT_CLASS = 'tts-word-highlight';

  /**
   * Build a map of text nodes with their character offsets.
   * Returns array of { node, offset, length }.
   */
  TTSHighlight.buildTextNodeMap = function (element) {
    var map = [];
    var offset = 0;
    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while ((node = walker.nextNode())) {
      var len = node.textContent.length;
      if (len > 0) {
        map.push({ node: node, offset: offset, length: len });
        offset += len;
      }
    }
    return map;
  };

  /**
   * Find word boundary at a given character index in text.
   * Returns { start, end } of the word.
   */
  TTSHighlight.findWordBoundary = function (text, charIndex) {
    if (charIndex >= text.length) return { start: charIndex, end: charIndex };

    // Skip leading whitespace
    var start = charIndex;
    while (start < text.length && /\s/.test(text[start])) start++;
    if (start >= text.length) return { start: start, end: start };

    // Find word start (go backwards from start if needed)
    var wordStart = start;
    while (wordStart > 0 && !/\s/.test(text[wordStart - 1])) wordStart--;

    // Find word end
    var wordEnd = start;
    while (wordEnd < text.length && !/\s/.test(text[wordEnd])) wordEnd++;

    return { start: wordStart, end: wordEnd };
  };

  /**
   * Highlight a word at the given character offset and length.
   * Clears any previous highlight first.
   */
  TTSHighlight.highlightWord = function (element, charIndex, charLength) {
    // Clear previous highlight
    TTSHighlight.clearHighlight(element);

    var map = TTSHighlight.buildTextNodeMap(element);
    if (map.length === 0) return;

    var fullText = element.textContent;
    var wordBound = charLength
      ? { start: charIndex, end: charIndex + charLength }
      : TTSHighlight.findWordBoundary(fullText, charIndex);

    if (wordBound.start >= wordBound.end) return;

    // Find which text node contains the start of the word
    var targetEntry = null;
    for (var i = 0; i < map.length; i++) {
      var entry = map[i];
      if (entry.offset + entry.length > wordBound.start) {
        targetEntry = entry;
        break;
      }
    }

    if (!targetEntry) return;

    // Calculate offset within the text node
    var nodeOffset = wordBound.start - targetEntry.offset;
    var nodeEnd = Math.min(wordBound.end - targetEntry.offset, targetEntry.length);

    if (nodeOffset < 0 || nodeOffset >= targetEntry.length) return;

    try {
      var range = document.createRange();
      range.setStart(targetEntry.node, nodeOffset);
      range.setEnd(targetEntry.node, nodeEnd);

      var highlight = document.createElement('span');
      highlight.className = HIGHLIGHT_CLASS;
      range.surroundContents(highlight);
    } catch (e) {
      // If surroundContents fails (cross-boundary), silently skip
    }
  };

  /**
   * Remove all highlight spans and normalize text nodes.
   */
  TTSHighlight.clearHighlight = function (element) {
    var highlights = element.querySelectorAll('.' + HIGHLIGHT_CLASS);
    for (var i = 0; i < highlights.length; i++) {
      var hl = highlights[i];
      var parent = hl.parentNode;
      while (hl.firstChild) {
        parent.insertBefore(hl.firstChild, hl);
      }
      parent.removeChild(hl);
    }
    // Merge adjacent text nodes
    element.normalize();
  };

  // ---- export ----
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TTSHighlight: TTSHighlight };
  } else {
    root.TTSHighlight = TTSHighlight;
  }

})(typeof window !== 'undefined' ? window : this);
