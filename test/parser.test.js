/**
 * Tests for parser.js (text-to-HTML conversion)
 *
 * @jest-environment jsdom
 */

// parser.js requires marked and assigns to window.Parser
const fs = require('fs');
const path = require('path');

// Load marked into global scope (parser.js depends on window.marked)
const { marked } = require('marked');
global.marked = marked;

const parserCode = fs.readFileSync(
  path.join(__dirname, '..', 'docs', 'js', 'parser.js'),
  'utf-8'
);
eval(parserCode);

describe('Parser', () => {
  const config = { prefix: './' };

  describe('basic parsing', () => {
    test('wraps content in section tags', () => {
      var p = new Parser('----\nHello\n----', config);
      var html = p.parse();
      expect(html).toContain('<section');
      expect(html).toContain('</section>');
    });

    test('creates fragment spans for regular text', () => {
      var p = new Parser('----\nHello world\n----', config);
      var html = p.parse();
      expect(html).toContain("class='fragment'");
      expect(html).toContain('Hello world');
    });

    test('creates headings', () => {
      var p = new Parser('----\n## Title\n----', config);
      var html = p.parse();
      expect(html).toContain('<h2');
      expect(html).toContain('Title');
    });
  });

  describe('image alt attributes', () => {
    test('adds alt attribute to large images', () => {
      var p = new Parser('----\nimage: https://example.com/test.png\n----', config);
      var html = p.parse();
      expect(html).toContain("alt='Slide image'");
    });

    test('adds alt attribute to video poster', () => {
      var p = new Parser('----\nvideo: https://example.com/test.mp4\n----', config);
      var html = p.parse();
      expect(html).toContain("alt='Video loading'");
    });
  });

  describe('media URL validation', () => {
    test('shows error for invalid image URL', () => {
      var p = new Parser('----\nimage: not-a-url\n----', config);
      var html = p.parse();
      expect(html).toContain('Invalid image URL');
    });

    test('shows error for invalid video URL', () => {
      var p = new Parser('----\nvideo: ftp://bad/file.mp4\n----', config);
      var html = p.parse();
      expect(html).toContain('Invalid video URL');
    });

    test('shows error for invalid audio URL', () => {
      var p = new Parser('----\naudio: just-a-filename.mp3\n----', config);
      var html = p.parse();
      expect(html).toContain('Invalid audio URL');
    });

    test('accepts valid http URLs', () => {
      var p = new Parser('----\nimage: https://example.com/img.png\n----', config);
      var html = p.parse();
      expect(html).not.toContain('Invalid');
      expect(html).toContain('src=');
    });

    test('accepts data: URL for local images', () => {
      var p = new Parser('----\nimage: data:image/jpeg;base64,/9j/4AAQ\n----', config);
      var html = p.parse();
      expect(html).not.toContain('Invalid');
      expect(html).toContain('src=');
      expect(html).toContain('data:image/jpeg;base64,');
    });

    test('rejects data: URLs that are not images', () => {
      var p = new Parser('----\nimage: data:text/html;base64,PHNjcmlwdD4=\n----', config);
      var html = p.parse();
      expect(html).toContain('Invalid image URL');
    });

    test('rejects SVG data: URLs', () => {
      var p = new Parser('----\nimage: data:image/svg+xml;base64,PHN2Zz4=\n----', config);
      var html = p.parse();
      expect(html).toContain('Invalid image URL');
    });

    test('accepts GIF data: URLs', () => {
      var p = new Parser('----\nimage: data:image/gif;base64,R0lGODlh\n----', config);
      var html = p.parse();
      expect(html).not.toContain('Invalid');
      expect(html).toContain('data:image/gif;base64,');
    });

    test('accepts WebP data: URLs', () => {
      var p = new Parser('----\nimage: data:image/webp;base64,UklGR\n----', config);
      var html = p.parse();
      expect(html).not.toContain('Invalid');
      expect(html).toContain('data:image/webp;base64,');
    });
  });

  // ---- Local image resolution ----

  describe('local image resolution', () => {
    test('resolves local: prefix using imageResolver', () => {
      var resolver = function(name) { return 'data:image/jpeg;base64,RESOLVED'; };
      var p = new Parser('----\nimage: local:photo.jpg\n----', config, resolver);
      var html = p.parse();
      expect(html).toContain('data:image/jpeg;base64,RESOLVED');
      expect(html).not.toContain('local:');
    });

    test('shows error when local image not found', () => {
      var resolver = function(name) { return null; };
      var p = new Parser('----\nimage: local:missing.jpg\n----', config, resolver);
      var html = p.parse();
      expect(html).toContain('not found');
    });

    test('resolves local: prefix in note image', () => {
      var resolver = function(name) { return 'data:image/jpeg;base64,NOTED'; };
      var p = new Parser('----\nHello {image: local:thumb.jpg}\n----', config, resolver);
      var html = p.parse();
      expect(html).toContain('data:image/jpeg;base64,NOTED');
    });

    test('works without imageResolver (backward compatible)', () => {
      var p = new Parser('----\nimage: local:photo.jpg\n----', config);
      var html = p.parse();
      expect(html).toContain('Invalid image URL');
    });

    test('resolves inline ![alt](local:filename) syntax', () => {
      var resolver = function(name) { return 'data:image/png;base64,INLINE'; };
      var p = new Parser('----\n![photo](local:cat.png)\n----', config, resolver);
      var html = p.parse();
      expect(html).toContain('data:image/png;base64,INLINE');
      expect(html).not.toContain('local:');
    });

    test('inline local image shows error when not found', () => {
      var resolver = function(name) { return null; };
      var p = new Parser('----\n![photo](local:missing.png)\n----', config, resolver);
      var html = p.parse();
      expect(html).toContain('not found');
      expect(html).toContain('missing.png');
    });

    test('inline local image without resolver falls through', () => {
      var p = new Parser('----\n![photo](local:cat.png)\n----', config);
      var html = p.parse();
      // Without resolver, local: prefix stays as-is (invalid URL)
      expect(html).toContain('local:cat.png');
    });
  });

  // ---- Markdown extension: tables ----

  describe('markdown tables', () => {
    test('renders a basic markdown table', () => {
      var text = '----\n| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('<table');
      expect(html).toContain('<th');
      expect(html).toContain('Alice');
      expect(html).toContain('Bob');
    });

    test('does not confuse static block with table', () => {
      var text = '----\n| This is a static paragraph.\n| It has no table separator.\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).not.toContain('<table');
      expect(html).toContain('static paragraph');
    });

    test('table with alignment', () => {
      var text = '----\n| Left | Center | Right |\n|:-----|:------:|------:|\n| a | b | c |\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('<table');
    });

    test('table is not treated as static block', () => {
      var text = '----\n| H1 | H2 |\n|---|---|\n| a | b |\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      // Should have table, not quiz processing
      expect(html).toContain('<table');
      expect(html).not.toContain('quiz');
    });
  });

  // ---- Markdown extension: links ----

  describe('markdown links', () => {
    test('renders inline links in regular text', () => {
      var text = '----\nVisit [Example](https://example.com) for more.\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('<a');
      expect(html).toContain('https://example.com');
      expect(html).toContain('Example');
    });

    test('renders inline links in list items', () => {
      var text = '----\n* Check [this link](https://example.com)\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('<a');
      expect(html).toContain('https://example.com');
    });
  });

  // ---- MCQ Quiz ----

  describe('MCQ quiz', () => {
    test('renders MCQ quiz block', () => {
      var text = '----\n| {mcq: What is 1+1?\n|   a) 1\n|   *b) 2\n|   c) 3\n| }\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('mcq-quiz');
      expect(html).toContain('mcq-question');
      expect(html).toContain('What is 1+1?');
      expect(html).toContain('mcq-option');
    });

    test('marks correct answer', () => {
      var text = '----\n| {mcq: Question?\n|   a) Wrong\n|   *b) Right\n|   c) Wrong\n| }\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('data-correct="true"');
      expect(html).toContain('data-correct="false"');
    });

    test('does not interfere with regular quiz', () => {
      var text = '----\n| Regular {quiz item} here\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('fragment quiz');
      expect(html).not.toContain('mcq-quiz');
    });

    test('renders multiple options', () => {
      var text = '----\n| {mcq: Q?\n|   a) A\n|   b) B\n|   *c) C\n|   d) D\n| }\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      var optionCount = (html.match(/mcq-option/g) || []).length;
      // Each option div has class mcq-option
      expect(optionCount).toBeGreaterThanOrEqual(4);
    });

    test('includes reset button', () => {
      var text = '----\n| {mcq: Q?\n|   a) A\n|   *b) B\n| }\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('mcq-reset');
      expect(html).toContain('Try Again');
    });

    test('includes data-correct-label attribute', () => {
      var text = '----\n| {mcq: Q?\n|   a) A\n|   *b) B\n| }\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('data-correct-label');
    });

    test('renders Japanese labels when speech_lang is ja-JP', () => {
      var jaConfig = { prefix: './', speech_lang: 'ja-JP' };
      var text = '----\n| {mcq: Q?\n|   a) A\n|   *b) B\n| }\n----';
      var p = new Parser(text, jaConfig);
      var html = p.parse();
      expect(html).toContain('\u3082\u3046\u4e00\u5ea6'); // もう一度
      expect(html).toContain('\u6b63\u89e3'); // 正解
    });

    test('renders Chinese labels when speech_lang is zh-CN', () => {
      var zhConfig = { prefix: './', speech_lang: 'zh-CN' };
      var text = '----\n| {mcq: Q?\n|   a) A\n|   *b) B\n| }\n----';
      var p = new Parser(text, zhConfig);
      var html = p.parse();
      expect(html).toContain('\u518d\u8bd5\u4e00\u6b21'); // 再试一次
    });

    test('renders Korean labels when speech_lang is ko-KR', () => {
      var koConfig = { prefix: './', speech_lang: 'ko-KR' };
      var text = '----\n| {mcq: Q?\n|   a) A\n|   *b) B\n| }\n----';
      var p = new Parser(text, koConfig);
      var html = p.parse();
      expect(html).toContain('\ub2e4\uc2dc \uc2dc\ub3c4'); // 다시 시도
    });

    test('defaults to English labels when no speech_lang', () => {
      var text = '----\n| {mcq: Q?\n|   a) A\n|   *b) B\n| }\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('Try Again');
      expect(html).toContain('Correct!');
    });
  });

  // ---- Ordered list multi-digit ----

  describe('ordered list multi-digit numbers', () => {
    test('parses two-digit numbered list items', () => {
      var text = '----\n10. Tenth item\n11. Eleventh item\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('10.');
      expect(html).toContain('Tenth item');
      expect(html).toContain('11.');
      expect(html).toContain('Eleventh item');
    });
  });

  // ---- Security ----

  describe('Security', () => {
    test('escapes HTML in note text', () => {
      var text = '----\nHello{note: <img onerror=alert(1)>}\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      // Must not contain raw HTML tag in data-note attribute
      expect(html).not.toContain('<img onerror');
      // The note text should be escaped in the data-note attribute
      expect(html).toMatch(/data-note='[^']*&lt;img/);
    });

    test('strips raw HTML tags via marked', () => {
      var text = '----\n<script>alert(1)</script> Hello\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).not.toContain('<script>');
    });

    test('rejects invalid YouTube ID with special characters', () => {
      var text = "----\nyoutube: https://www.youtube.com/watch?v=abc'><img src=x>\n----";
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('Invalid YouTube video ID');
    });

    test('accepts valid YouTube ID', () => {
      var text = '----\nyoutube: https://www.youtube.com/watch?v=dQw4w9WgXcQ\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('dQw4w9WgXcQ');
      expect(html).not.toContain('Invalid');
    });

    test('rejects media URL with attribute breakout characters', () => {
      var text = "----\nimage: https://example.com/img.png' onerror='alert(1)\n----";
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('Invalid');
    });

    test('escapes HTML in note image URL', () => {
      var text = '----\nHello{image: javascript:alert(1)}\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).not.toContain('javascript:alert');
    });
  });

  describe('auto-animate (~~~~ separator)', () => {
    test('adds data-auto-animate to sections separated by ~~~~', () => {
      var text = '----\nSlide 1\n~~~~\nSlide 2\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).toContain('data-auto-animate');
    });

    test('does not add data-auto-animate for ---- separator', () => {
      var text = '----\nSlide 1\n----\nSlide 2\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      expect(html).not.toContain('data-auto-animate');
    });

    test('creates correct number of slides with ~~~~', () => {
      var text = '----\nSlide 1\n~~~~\nSlide 2\n~~~~\nSlide 3\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      // 4 sections: 1 deck wrapper + 3 content slides
      var sections = html.match(/<section /g);
      expect(sections.length).toBe(4);
    });

    test('mixes ---- and ~~~~ separators correctly', () => {
      var text = '----\nSlide 1\n----\nSlide 2\n~~~~\nSlide 3\n----';
      var p = new Parser(text, config);
      var html = p.parse();
      // Find all section attributes (0=deck, 1=Slide1, 2=Slide2, 3=Slide3)
      var attrs = [...html.matchAll(/<section ([^>]*)>/g)].map(m => m[1]);
      // Slide 1 should NOT have auto-animate
      expect(attrs[1]).not.toContain('data-auto-animate');
      // Slide 2 and 3 should both have auto-animate (~~~~ between them)
      expect(attrs[2]).toContain('data-auto-animate');
      expect(attrs[3]).toContain('data-auto-animate');
    });
  });
});
