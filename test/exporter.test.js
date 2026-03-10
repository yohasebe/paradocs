/**
 * Tests for exporter module (standalone HTML generation)
 *
 * @jest-environment jsdom
 */

const { Exporter } = require('../docs/js/exporter');

describe('Exporter', () => {
  const sampleSlides = '<section><span class="current-visible">Hello World</span></section>';
  const sampleConfig = {
    width: 1280,
    height: 800,
    font_size: 40,
    speech_lang: 'en-US',
    speech_voice: 'Google US English',
    speech_rate: '1.0'
  };
  const sampleCSS = '<style>.reveal { font-size: 40px; }</style>';

  describe('generateHTML', () => {
    test('returns a string containing DOCTYPE', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false);
      expect(html).toMatch(/^<!doctype html>/i);
    });

    test('contains slides HTML', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false);
      expect(html).toContain(sampleSlides);
    });

    test('contains config as embedded JSON', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false);
      expect(html).toContain(JSON.stringify(sampleConfig));
    });

    test('contains generated CSS', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false);
      expect(html).toContain(sampleCSS);
    });

    test('contains CDN references for Reveal.js', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false);
      expect(html).toContain('reveal.js');
      expect(html).toContain('reveal.css');
    });

    test('contains CDN references for jQuery', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false);
      expect(html).toContain('jquery');
    });

    test('contains paradocs.js reference or inline', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false);
      expect(html).toContain('paradocs');
    });

    test('adds inverted class when inverted is true', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, true);
      expect(html).toContain('class="reveal inverted"');
    });

    test('does not add inverted class when inverted is false', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false);
      expect(html).toContain('class="reveal"');
      expect(html).not.toContain('class="reveal inverted"');
    });

    test('does not reference sessionStorage', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false);
      expect(html).not.toContain('sessionStorage');
    });

    test('contains Font Awesome CSS', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false);
      expect(html).toContain('font-awesome');
    });

    test('contains Tippy.js', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false);
      expect(html).toContain('tippy');
    });

    test('contains UI elements (switches, gadgets)', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false);
      expect(html).toContain('id="gadgets"');
      expect(html).toContain('id="sticky_icon"');
      expect(html).toContain('id="speaker_icon"');
      expect(html).toContain('id="overview_icon"');
    });

    test('escapes script-breaking sequences in slides', () => {
      var maliciousSlides = '<section>test</scr' + 'ipt><script>alert(1)</script></section>';
      var html = Exporter.generateHTML(maliciousSlides, sampleConfig, sampleCSS, false);
      // The embedded data should not break out of the script tag
      expect(html).not.toMatch(/<\/script>\s*<script>alert/);
    });

    test('escapes script-breaking sequences in config', () => {
      var maliciousConfig = Object.assign({}, sampleConfig, {
        speech_voice: 'test</scr' + 'ipt><script>alert(1)'
      });
      var html = Exporter.generateHTML(sampleSlides, maliciousConfig, sampleCSS, false);
      expect(html).not.toMatch(/<\/script>\s*<script>alert/);
    });
  });

  describe('generateFilename', () => {
    test('returns a .html filename', () => {
      var name = Exporter.generateFilename();
      expect(name).toMatch(/\.html$/);
    });

    test('contains paradocs prefix', () => {
      var name = Exporter.generateFilename();
      expect(name).toMatch(/^paradocs/);
    });

    test('contains date-like pattern', () => {
      var name = Exporter.generateFilename();
      expect(name).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });
});
