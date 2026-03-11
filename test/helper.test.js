/**
 * Tests for helper.js (CSS generation)
 *
 * @jest-environment jsdom
 */

// helper.js assigns to window.createCSS; in jsdom, window === global
const fs = require('fs');
const path = require('path');
const helperCode = fs.readFileSync(path.join(__dirname, '..', 'docs', 'js', 'helper.js'), 'utf-8');

// Evaluate in jsdom's global scope where window is available
eval(helperCode);

const baseConfig = {
  font_family: 'sans',
  font_size: 40,
  note_size: 32,
  line_height: 1.4,
  wallpaper: 'none',
  accent_color: '#e15759',
  highlight_color: '#4e79a7',
  highlight_background_color: 'transparent',
  progress_color: '#4e79a7',
  note_color: '#303030',
  note_background_color: '#F4F1BB',
  note_marker_color: '#F4F1BB',
  width: 1280,
  height: 800,
  color_inverted: false
};

describe('createCSS', () => {
  test('returns a string wrapped in <style> tags', () => {
    const css = createCSS(baseConfig);
    expect(css).toMatch(/^<style/);
    expect(css).toMatch(/<\/style>$/);
  });

  test('includes font family for sans', () => {
    const css = createCSS(baseConfig);
    expect(css).toContain('"Lato", sans-serif');
    expect(css).toContain('"News Cycle"');
  });

  test('includes font family for serif', () => {
    const config = Object.assign({}, baseConfig, { font_family: 'serif' });
    const css = createCSS(config);
    expect(css).toContain('Palatino');
  });

  test('includes font family for fun', () => {
    const config = Object.assign({}, baseConfig, { font_family: 'fun' });
    const css = createCSS(config);
    expect(css).toContain('Comic Sans');
  });

  test('includes accent color', () => {
    const css = createCSS(baseConfig);
    expect(css).toContain(baseConfig.accent_color);
  });

  test('includes wallpaper setting', () => {
    const config = Object.assign({}, baseConfig, { wallpaper: 'url(img/wallpaper/test.png)' });
    const css = createCSS(config);
    expect(css).toContain('url(img/wallpaper/test.png)');
  });

  test('includes note background color', () => {
    const css = createCSS(baseConfig);
    expect(css).toContain(baseConfig.note_background_color);
  });

  // ---- Inverted / dark mode rules ----

  describe('inverted mode rules', () => {
    test('includes .reveal.inverted rules for sticky note', () => {
      const css = createCSS(baseConfig);
      expect(css).toContain('.reveal.inverted ~ .additional .sticky');
    });

    test('inverted sticky has dark background', () => {
      const css = createCSS(baseConfig);
      // Should have a dark-ish pink background instead of #ffcbe3
      const stickyMatch = css.match(/\.reveal\.inverted ~ \.additional \.sticky\s*\{([^}]+)\}/);
      expect(stickyMatch).not.toBeNull();
      expect(stickyMatch[1]).toContain('background-color');
      // Should NOT be the light pink #ffcbe3
      expect(stickyMatch[1]).not.toContain('#ffcbe3');
    });

    test('includes inverted rules for note popup', () => {
      const css = createCSS(baseConfig);
      expect(css).toContain('.reveal.inverted ~ .additional div.note');
    });

    test('inverted note has dark background', () => {
      const css = createCSS(baseConfig);
      const noteMatch = css.match(/\.reveal\.inverted ~ \.additional div\.note\s*\{([^}]+)\}/);
      expect(noteMatch).not.toBeNull();
      expect(noteMatch[1]).toContain('background-color');
    });

    test('includes inverted rules for slide number', () => {
      const css = createCSS(baseConfig);
      expect(css).toContain('.reveal.inverted .slide-number');
    });

    test('includes inverted rules for fragment text', () => {
      const css = createCSS(baseConfig);
      expect(css).toContain('.reveal.inverted .slides section .fragment');
    });

    test('includes inverted rules for mark elements', () => {
      const css = createCSS(baseConfig);
      expect(css).toContain('.reveal.inverted .slides section .fragment mark');
    });

    test('inverted mark has dark background', () => {
      const css = createCSS(baseConfig);
      const markMatch = css.match(/\.reveal\.inverted \.slides section \.fragment mark\s*\{([^}]+)\}/);
      expect(markMatch).not.toBeNull();
      expect(markMatch[1]).toContain('background-color');
      // Should NOT be the light yellow #F5EDB9
      expect(markMatch[1]).not.toContain('#F5EDB9');
    });

    test('includes inverted rules for sticky editor', () => {
      const css = createCSS(baseConfig);
      expect(css).toContain('.reveal.inverted ~ .additional .sticky_editor');
    });
  });

  describe('sticky note counter', () => {
    test('includes CSS for sticky_counter', () => {
      const css = createCSS(baseConfig);
      expect(css).toContain('.sticky_counter');
    });
  });
});
