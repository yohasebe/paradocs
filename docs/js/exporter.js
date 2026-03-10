/**
 * Exporter - generates a standalone HTML file from presentation data.
 *
 * The exported file keeps CDN references for external libraries but
 * embeds the slides HTML, config, and generated CSS directly, so it
 * does not depend on sessionStorage.
 *
 * Usage (browser):
 *   Exporter.download(slidesHtml, config, cssText, inverted);
 *
 * Compatible with CommonJS (for testing with Jest).
 */

(function (root) {
  'use strict';

  // Escape </script> inside embedded data to prevent breaking out
  function safeEmbed(str) {
    return str.replace(/<\/(script)/gi, '<\\/$1');
  }

  var Exporter = {};

  /**
   * Generate a complete standalone HTML string.
   */
  Exporter.generateHTML = function (slidesHtml, config, cssText, inverted, paradocsScript) {
    var configJson = safeEmbed(JSON.stringify(config));
    var safeSlidesHtml = safeEmbed(slidesHtml);
    var safeCssText = safeEmbed(cssText);
    var safeParadocsScript = paradocsScript ? safeEmbed(paradocsScript) : '';
    var invertedClass = inverted ? ' inverted' : '';

    return '<!doctype html>\n' +
      '<html>\n' +
      '  <head>\n' +
      '    <meta charset="utf-8">\n' +
      '    <title>Paradocs Presentation</title>\n' +
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n' +
      '    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.css">\n' +
      '    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery-ui@1.14.1/dist/themes/base/jquery-ui.min.css">\n' +
      '    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/theme/simple.css">\n' +
      '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">\n' +
      '    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/dist/tippy.css">\n' +
      '    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/themes/light-border.css">\n' +
      '    ' + safeCssText + '\n' +
      '  </head>\n' +
      '  <body>\n' +
      '    <div class="reveal' + invertedClass + '" id="reveal-container">\n' +
      '      <div id="highlighted_cursor"></div>\n' +
      '      <div class="slides" id="slides-container">\n' +
      '        ' + safeSlidesHtml + '\n' +
      '      </div>\n' +
      '    </div>\n' +
      '    <div class="additional">\n' +
      '      <div class="gadgets" id="gadgets">\n' +
      '        <div class="sticky" data-prevent-swipe>\n' +
      '          <div class="edit_control"><i class="fa-solid fa-pencil"></i><i class="fa-solid fa-eraser"></i><i class="fa-solid fa-xmark"></i></div>\n' +
      '          <textarea class="sticky_editor" spellcheck="false"></textarea>\n' +
      '        </div>\n' +
      '        <div class="note" data-prevent-swipe></div>\n' +
      '        <div class="imagenote" data-prevent-swipe data-enlarged="false">\n' +
      '          <div class="enlarge"><span class="fa-solid fa-plus"></span></div>\n' +
      '        </div>\n' +
      '      </div>\n' +
      '      <div class="switches">\n' +
      '        <div id="left_switches">\n' +
      '          <span class="left_switch"><span class="fa-regular fa-note-sticky" id="sticky_icon"></span></span>\n' +
      '          <span class="left_switch"><span class="fa-solid fa-circle" id="pointer_icon"></span></span>\n' +
      '          <span class="left_switch"><span class="fa-solid fa-wand-magic-sparkles" id="playall_icon"></span></span>\n' +
      '          <span class="left_switch"><span class="fa-solid fa-volume-high" id="speaker_icon"></span></span>\n' +
      '        </div>\n' +
      '        <div id="right_switches">\n' +
      '          <span class="fa-solid fa-arrows-up-down" id="overview_icon"></span>\n' +
      '        </div>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '\n' +
      '    <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"><\/script>\n' +
      '    <script src="https://cdn.jsdelivr.net/npm/jquery-ui@1.14.1/dist/jquery-ui.min.js"><\/script>\n' +
      '    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.js"><\/script>\n' +
      '    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js"><\/script>\n' +
      '    <script src="https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/dist/tippy-bundle.umd.min.js"><\/script>\n' +
      '    <script>\n' +
      '      var pconf = ' + configJson + ';\n' +
      '    <\/script>\n' +
      '    <script>\n' + safeParadocsScript + '\n<\/script>\n' +
      '  </body>\n' +
      '</html>\n';
  };

  /**
   * Generate a timestamped filename.
   */
  Exporter.generateFilename = function () {
    var d = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var date = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    var time = pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
    return 'paradocs_' + date + '_' + time + '.html';
  };

  /**
   * Convert an image blob to a base64 data URI string.
   */
  function blobToDataURI(blob) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onloadend = function () { resolve(reader.result); };
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Replace relative wallpaper url(...) in CSS with inline base64 data URI.
   * Returns a Promise that resolves to the updated CSS string.
   */
  function inlineWallpaperInCSS(cssText) {
    var match = cssText.match(/url\(([^)]*img\/wallpaper\/[^)]+)\)/);
    if (!match) return Promise.resolve(cssText);

    var relativeUrl = match[1];
    return fetch(relativeUrl)
      .then(function (r) { return r.blob(); })
      .then(function (blob) { return blobToDataURI(blob); })
      .then(function (dataUri) {
        return cssText.replace(/url\([^)]*img\/wallpaper\/[^)]+\)/g, 'url(' + dataUri + ')');
      })
      .catch(function () {
        // If fetch fails, remove wallpaper rather than leaving broken reference
        return cssText.replace(/url\([^)]*img\/wallpaper\/[^)]+\)/g, 'none');
      });
  }

  /**
   * Trigger a download of the standalone HTML (browser only).
   * Fetches paradocs.js and wallpaper image, inlining both.
   * basePath should be './' or '../' depending on the page.
   */
  Exporter.download = function (slidesHtml, config, cssText, inverted, basePath) {
    var scriptUrl = (basePath || './') + 'js/paradocs.js';
    Promise.all([
      fetch(scriptUrl).then(function (r) { return r.text(); }),
      inlineWallpaperInCSS(cssText)
    ])
      .then(function (results) {
        var paradocsScript = results[0];
        var inlinedCss = results[1];
        var html = Exporter.generateHTML(slidesHtml, config, inlinedCss, inverted, paradocsScript);
        var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = Exporter.generateFilename();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(function (err) {
        console.error('Failed to prepare export:', err);
        alert('Export failed: could not load required resources.');
      });
  };

  // ---- export ----

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Exporter: Exporter };
  } else {
    root.Exporter = Exporter;
  }

})(typeof window !== 'undefined' ? window : this);
