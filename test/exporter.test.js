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
  const sampleScript = 'jQuery(function($){ Reveal.initialize({}); });';

  describe('generateHTML', () => {
    test('returns a string containing DOCTYPE', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).toMatch(/^<!doctype html>/i);
    });

    test('contains slides HTML', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).toContain(sampleSlides);
    });

    test('contains config as embedded JSON', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).toContain(JSON.stringify(sampleConfig));
    });

    test('contains generated CSS', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).toContain(sampleCSS);
    });

    test('contains CDN references for Reveal.js', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).toContain('reveal.js');
      expect(html).toContain('reveal.css');
    });

    test('contains CDN references for jQuery', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).toContain('jquery');
    });

    test('inlines paradocs script content', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).toContain('Reveal.initialize');
    });

    test('does not reference external paradocs.js file', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).not.toContain('paradocs.js');
    });

    test('adds inverted class when inverted is true', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, true, sampleScript);
      expect(html).toContain('class="reveal inverted"');
    });

    test('does not add inverted class when inverted is false', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).toContain('class="reveal"');
      expect(html).not.toContain('class="reveal inverted"');
    });

    test('does not reference sessionStorage', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).not.toContain('sessionStorage');
    });

    test('contains Font Awesome CSS', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).toContain('font-awesome');
    });

    test('contains Tippy.js', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).toContain('tippy');
    });

    test('contains UI elements (switches, gadgets)', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).toContain('id="gadgets"');
      expect(html).toContain('id="sticky_icon"');
      expect(html).toContain('id="speaker_icon"');
      expect(html).toContain('id="overview_icon"');
    });

    test('escapes script-breaking sequences in slides', () => {
      var maliciousSlides = '<section>test</scr' + 'ipt><script>alert(1)</script></section>';
      var html = Exporter.generateHTML(maliciousSlides, sampleConfig, sampleCSS, false, sampleScript);
      // The embedded data should not break out of the script tag
      expect(html).not.toMatch(/<\/script>\s*<script>alert/);
    });

    test('strips Cloud TTS API keys from exported config', () => {
      var configWithKeys = Object.assign({}, sampleConfig, {
        tts_api_key: 'sk-secret-test-key-12345',
        tts_provider: 'openai',
        tts_cloud_voice: 'alloy',
        tts_cloud_rate: '1.5'
      });
      var html = Exporter.generateHTML(sampleSlides, configWithKeys, sampleCSS, false, sampleScript);
      expect(html).not.toContain('sk-secret-test-key-12345');
      expect(html).not.toContain('"tts_api_key"');
      expect(html).not.toContain('"tts_provider"');
      expect(html).not.toContain('"tts_cloud_voice"');
      expect(html).not.toContain('"tts_cloud_rate"');
      // Original config should not be mutated
      expect(configWithKeys.tts_api_key).toBe('sk-secret-test-key-12345');
    });

    test('escapes script-breaking sequences in config', () => {
      var maliciousConfig = Object.assign({}, sampleConfig, {
        speech_voice: 'test</scr' + 'ipt><script>alert(1)'
      });
      var html = Exporter.generateHTML(sampleSlides, maliciousConfig, sampleCSS, false, sampleScript);
      expect(html).not.toMatch(/<\/script>\s*<script>alert/);
    });
  });

  describe('convertYouTubeEmbeds', () => {
    test('replaces YouTube iframe with a clickable link', () => {
      var iframe = "<iframe class='fragment' width='100%' style='opacity: 1;' allow='autoplay' data-ytid='MMmOLN5zBLY' src='https://www.youtube.com/embed/MMmOLN5zBLY?enablejsapi=1&autoplay=0&start=30&end=60' id='yt0' data-ignore='true' ></iframe>";
      var result = Exporter.convertYouTubeEmbeds(iframe);
      expect(result).not.toContain('<iframe');
      expect(result).toContain('https://www.youtube.com/watch?v=MMmOLN5zBLY');
      expect(result).toContain('youtube-link');
    });

    test('preserves thumbnail image in link', () => {
      var iframe = "<iframe class='fragment' data-ytid='MMmOLN5zBLY' src='https://www.youtube.com/embed/MMmOLN5zBLY?enablejsapi=1&autoplay=0' id='yt0' data-ignore='true' ></iframe>";
      var result = Exporter.convertYouTubeEmbeds(iframe);
      expect(result).toContain('img.youtube.com/vi/MMmOLN5zBLY');
    });

    test('preserves fragment class on wrapper', () => {
      var iframe = "<iframe class='fragment' data-ytid='abc123' src='https://www.youtube.com/embed/abc123?enablejsapi=1&autoplay=0' id='yt0' data-ignore='true' ></iframe>";
      var result = Exporter.convertYouTubeEmbeds(iframe);
      expect(result).toContain('fragment');
    });

    test('handles multiple YouTube iframes', () => {
      var html = "<section><iframe class='fragment' data-ytid='aaa' src='https://www.youtube.com/embed/aaa?enablejsapi=1' id='yt0' data-ignore='true' ></iframe></section>" +
                 "<section><iframe class='fragment' data-ytid='bbb' src='https://www.youtube.com/embed/bbb?enablejsapi=1' id='yt1' data-ignore='true' ></iframe></section>";
      var result = Exporter.convertYouTubeEmbeds(html);
      expect(result).not.toContain('<iframe');
      expect(result).toContain('watch?v=aaa');
      expect(result).toContain('watch?v=bbb');
    });

    test('does not modify HTML without YouTube iframes', () => {
      var html = "<section><span class='fragment'>Hello</span></section>";
      var result = Exporter.convertYouTubeEmbeds(html);
      expect(result).toBe(html);
    });

    test('generateHTML applies YouTube conversion', () => {
      var slidesWithYT = "<section><iframe class='fragment' data-ytid='MMmOLN5zBLY' src='https://www.youtube.com/embed/MMmOLN5zBLY?enablejsapi=1&autoplay=0' id='yt0' data-ignore='true' ></iframe></section>";
      var html = Exporter.generateHTML(slidesWithYT, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).not.toContain('<iframe');
      expect(html).toContain('watch?v=MMmOLN5zBLY');
    });
  });

  describe('ARIA labels in generated HTML', () => {
    test('includes aria-label on sticky icon', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).toContain('aria-label="Toggle Sticky Note (s)"');
    });

    test('includes role="button" on control icons', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).toContain('role="button"');
    });

    test('includes tabindex on control icons', () => {
      var html = Exporter.generateHTML(sampleSlides, sampleConfig, sampleCSS, false, sampleScript);
      expect(html).toContain('tabindex="0"');
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
