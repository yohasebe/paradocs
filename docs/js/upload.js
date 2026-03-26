//////////////////// Setup Ace Syntax ///////////////
ace.define('ace/mode/custom', [], function(require, exports, module) {
  var oop = require("ace/lib/oop");
  var TextMode = require("ace/mode/text").Mode;
  var Tokenizer = require("ace/tokenizer").Tokenizer;
  var CustomHighlightRules = require("ace/mode/custom_highlight_rules").CustomHighlightRules;
  var Mode = function() {
    this.HighlightRules = CustomHighlightRules;
  };
  oop.inherits(Mode, TextMode);
  (function() {
  }).call(Mode.prototype);
  exports.Mode = Mode;
});

ace.define('ace/mode/custom_highlight_rules', [], function(require, exports, module) {
  var oop = require("ace/lib/oop");
  var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;
  var CustomHighlightRules = function() {
    this.$rules = {
      "start": [
        {
          regex: /^\s*(?:\= ?|\- ?){4,}\s*$/,
          token: "invalid",
          next: "start"
        },
        {
          regex: /^(?:header|footer|youtube|yt|image|img|video|audio)\:.+$/,
          token: "constant.language.escape",
          next: "start"
        },
        {
          regex: /^#+/,
          token: "comment",
          next: "start"
        },
        {
          regex: /^\|\s*(?:\*\s|.\.\s|\d+\.\s)/,
          token: "comment",
          next: "start"
        },
        {
          regex: /^(?:\*\s|.\.\s|\d+\.\s)/,
          token: "comment",
          next: "start"
        },
        {
          regex: /^(?:\||\!\!)\s*/,
          token: "keyword",
          next: "start"
        },
        {
          regex: /\{mcq:/,
          token: "constant.language.escape",
          next: "start"
        },
        {
          regex: /\{(?:note|image|img)\:.*?\}/,
          token: "variable",
          next: "start"
        },
        {
          regex: /\[[^\]]+\]\([^)]+\)/,
          token: "string",
          next: "start"
        },
        {
          regex: /^\|[\s\-:]+\|$/,
          token: "comment",
          next: "start"
        },
        {
          regex: /`[^`]+`/,
          token: "string",
          next: "start"
        },
        {
          regex: /^```/,
          token: "comment",
          next: "start"
        },
        {
          regex: /[\{\}]/,
          token: "constant.language.escape",
          next: "start"
        },
        {
          regex: /(?:\*[^\*]+\*|\*\*[^\*]+\*\*|\*\*\*[^\*]+\*\*\*|\_[^\_]+\_|\=\=[^\=]+\=\=)/,
          token: "keyword",
          next: "start"
        },
        {
          defaultToken : "text"
        }
      ],
    };
    this.normalizeRules()
  };
  oop.inherits(CustomHighlightRules, TextHighlightRules);
  exports.CustomHighlightRules = CustomHighlightRules;
});

//////////////////// Setup Ace textarea ///////////////
var editor = ace.edit($("#input-textarea").attr('id'));
editor.setTheme("ace/theme/textmate");
editor.session.setMode("ace/mode/custom");
editor.session.setOption('wrap', true);
editor.session.setOption('tabSize', 2);
editor.renderer.setOption('fontSize', 14);

editor.container.style.lineHeight = 1.7;
editor.renderer.updateFontSize();

editor.renderer.setOption('showPrintMargin', false);
editor.renderer.setOption('showInvisibles', true);
editor.renderer.setOption('showGutter', false);
editor.setAutoScrollEditorIntoView(false);

//////////////////// Auto-save setup ///////////////
var langKey = { 'ja-JP': 'ja_', 'zh-CN': 'zh_', 'ko-KR': 'ko_' }[default_lang] || 'en_';
var autosave = new AutoSave('paradocs_' + langKey);

//////////////////// Load saved or sample text ///////////////
if (autosave.hasSavedData()) {
  editor.setValue(autosave.loadText(), -1);
  // Restore form settings after speech voices are loaded
  var savedSettings = autosave.loadSettings();
  if (savedSettings) {
    $(function() {
      // Wait for voices to load before restoring speech settings
      var restoreTries = 25; // Give up after 5 seconds
      var restoreTimer = setInterval(function() {
        if ($('#lang_selected option').length > 0 || --restoreTries <= 0) {
          clearInterval(restoreTimer);
          if (savedSettings.resolution) $('#resolution_selected').val(savedSettings.resolution).trigger('change');
          if (savedSettings.font_family) $('#font_family_selected').val(savedSettings.font_family).trigger('change');
          if (savedSettings.font_size) $('#font_size_selected').val(savedSettings.font_size);
          if (savedSettings.wallpaper) $('#wallpaper_selected').val(savedSettings.wallpaper).trigger('change');
          if (savedSettings.accent_color) $('#accent_color_selected').val(savedSettings.accent_color).trigger('change');
          if (savedSettings.highlight_background_color) $('#highlight_background_color_selected').val(savedSettings.highlight_background_color).trigger('change');
          if (savedSettings.color_inverted) $('#text_background').prop('checked', true).trigger('change');
          if (savedSettings.speech_lang) {
            $('#lang_selected').val(savedSettings.speech_lang).trigger('change');
            setTimeout(function() {
              if (savedSettings.speech_voice) $('#voice_selected').val(savedSettings.speech_voice);
              if (savedSettings.speech_rate) $('#rate_selected').val(savedSettings.speech_rate);
            }, 200);
          }
          // Restore per-provider API keys
          if (window._setCloudKey) {
            if (savedSettings.tts_api_key_openai) window._setCloudKey('openai', savedSettings.tts_api_key_openai);
            if (savedSettings.tts_api_key_elevenlabs) window._setCloudKey('elevenlabs', savedSettings.tts_api_key_elevenlabs);
            // Legacy: single key field
            if (!savedSettings.tts_api_key_openai && !savedSettings.tts_api_key_elevenlabs && savedSettings.tts_api_key) {
              if (savedSettings.tts_provider) window._setCloudKey(savedSettings.tts_provider, savedSettings.tts_api_key);
            }
          }
          if (savedSettings.tts_provider && savedSettings.tts_provider !== 'browser') {
            $('#tts_provider_selected').val(savedSettings.tts_provider).trigger('change');
            // Wait for voice list to populate, then restore selection
            var voiceRestoreTries = 20;
            var voiceRestoreTimer = setInterval(function() {
              var $opts = $('#tts_cloud_voice_selected option');
              var hasVoices = $opts.length > 0 && $opts.first().val() !== '';
              // Also stop early if voices failed to load (error message option present)
              var hasFailed = $opts.length > 0 && $opts.first().text().indexOf('Failed') >= 0;
              if (hasVoices || hasFailed || --voiceRestoreTries <= 0) {
                clearInterval(voiceRestoreTimer);
                if (hasVoices && savedSettings.tts_cloud_voice) {
                  $('#tts_cloud_voice_selected').val(savedSettings.tts_cloud_voice);
                }
                if (savedSettings.tts_cloud_rate) $('#tts_cloud_rate_selected').val(savedSettings.tts_cloud_rate);
              }
            }, 200);
          }
        }
      }, 200);
    });
  }
} else {
  var sampleSuffix = { 'ja-JP': '_ja', 'zh-CN': '_zh', 'ko-KR': '_ko' }[default_lang] || '';
  fetch(BASE_PATH + 'data/sample' + sampleSuffix + '.txt')
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function(text) {
      editor.setValue(text, -1);
    })
    .catch(function(err) {
      console.warn('Failed to load sample text:', err.message);
    });
}

// Limits and defaults
var MAX_CHARS = 50000;
var DEFAULT_RESOLUTION = '1280x800';
var ALLOWED_RESOLUTIONS = ['800x600', '1280x800', '1920x1080'];
function updateCharCounter() {
  var len = editor.getValue().length;
  var $counter = $('#char_counter');
  $counter.text(len.toLocaleString() + ' / ' + MAX_CHARS.toLocaleString());
  if (len > MAX_CHARS * 0.9) {
    $counter.css('color', '#e15759');
  } else {
    $counter.css('color', '#999');
  }
}

// Auto-save editor text on change (debounced)
editor.session.on('change', function() {
  autosave.debouncedSaveText(editor.getValue());
  updateCharCounter();
  // Update live preview (skip if style panel is inserting to prevent scroll)
  if (typeof PreviewPanel !== 'undefined' && !(typeof window._isStylePanelInserting === 'function' && window._isStylePanelInserting())) {
    PreviewPanel.scheduleUpdate();
  }
});

// Sync preview slide on cursor movement (skip during style panel insertion)
editor.selection.on('changeCursor', function() {
  if (typeof PreviewPanel !== 'undefined' && PreviewPanel.isVisible() &&
      !(typeof window._isStylePanelInserting === 'function' && window._isStylePanelInserting())) {
    PreviewPanel.syncSlide(editor.getCursorPosition().row);
  }
});

// Initial counter update
$(function() { updateCharCounter(); });

//////////////////// Style panel ///////////////
(function() {
  var $toggle = $('#style-panel-toggle');
  var $panel = $('#style-panel');
  if (!$toggle.length || !$panel.length) return;

  // Toggle panel visibility — flex layout handles height automatically
  $toggle.on('click', function() {
    $panel.toggle();
    $toggle.toggleClass('active');
    editor.resize();
    if (typeof PreviewPanel !== 'undefined' && PreviewPanel.isVisible()) {
      PreviewPanel.syncHeight();
    }
  });

  // Prevent ALL mousedown within the panel from stealing editor focus
  $panel[0].addEventListener('mousedown', function(e) {
    e.preventDefault();
  }, true);

  // Snippet definitions: what to insert for each data-insert value
  var snippets = {
    'slide-sep':    { line: '\n----\n\n', wrap: false },
    'deck-sep':     { line: '\n====\n\n', wrap: false },

    'static':       { prefix: '| ', wrap: false, lineStart: true, blockAware: true },
    'auto-split':   { prefix: '!! ', wrap: false, lineStart: true, blockAware: true },
    'h1':           { prefix: '# ', wrap: false, lineStart: true },
    'h2':           { prefix: '## ', wrap: false, lineStart: true },
    'h3':           { prefix: '### ', wrap: false, lineStart: true },
    'bold':         { before: '**', after: '**', placeholder: 'text' },
    'italic':       { before: '*', after: '*', placeholder: 'text' },
    'underline':    { before: '_', after: '_', placeholder: 'text' },
    'strikethrough':{ before: '~~', after: '~~', placeholder: 'text' },
    'highlight':    { before: '==', after: '==', placeholder: 'text' },
    'code-inline':  { before: '`', after: '`', placeholder: 'code' },
    'ul':           { prefix: '* ', wrap: false, lineStart: true, blockAware: true },
    'ol':           { prefix: '1. ', wrap: false, lineStart: true, blockAware: true, numbered: true },
    'blockquote':   { prefix: '> ', wrap: false, lineStart: true, blockAware: true },
    'code-block':   { line: '\n```\ncode\n```\n', wrap: false, blockWrap: true, wrapBefore: '```\n', wrapAfter: '\n```' },
    'table':        { line: '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n', wrap: false },
    'link':         { before: '[', after: '](url)', placeholder: 'text' },
    'image':        { line: 'image: https://\n', wrap: false, lineStart: true },
    'youtube':      { line: 'youtube: https://www.youtube.com/watch?v=\n', wrap: false, lineStart: true },
    'video':        { line: 'video: https://\n', wrap: false, lineStart: true },
    'audio':        { line: 'audio: https://\n', wrap: false, lineStart: true },
    'note':         { before: '{note: ', after: '}', placeholder: 'note text' },
    'image-note':   { before: '{image: ', after: '}', placeholder: 'url' },
    'hidden':       { line: '| text {hidden text} text\n', wrap: false, lineStart: true },
    'mcq':          { line: '| {mcq: Question?\n|   a) Option A\n|   *b) Correct Answer\n|   c) Option C\n| }\n', wrap: false, lineStart: true }
  };

  // Flag to suppress preview update during snippet insertion
  var _suppressPreview = false;
  window._isStylePanelInserting = function() { return _suppressPreview; };

  // Scroll guard: intercept and cancel any page scroll during insertion
  var _scrollGuard = false;
  var _guardScrollY = 0;
  window.addEventListener('scroll', function() {
    if (_scrollGuard) window.scrollTo(0, _guardScrollY);
  }, { passive: false });

  // Helper: check if text is wrapped with before/after markers
  function isWrapped(text, before, after) {
    return text.length >= before.length + after.length &&
      text.substring(0, before.length) === before &&
      text.substring(text.length - after.length) === after;
  }

  // Helper: strip prefix from a line (returns stripped line or null if not present)
  function stripPrefix(line, prefix) {
    var trimmed = line.replace(/^\s*/, '');
    var indent = line.length - trimmed.length;
    if (trimmed.substring(0, prefix.length) === prefix) {
      return line.substring(0, indent) + trimmed.substring(prefix.length);
    }
    return null;
  }

  // Helper: check if line has a numbered list prefix (e.g. "1. ", "12. ")
  function stripNumberedPrefix(line) {
    var m = line.match(/^(\s*)\d+\.\s/);
    if (m) return line.substring(0, m[1].length) + line.substring(m[0].length);
    return null;
  }

  $panel.on('click', '.sp-btn', function() {
    var key = $(this).data('insert');
    var snip = snippets[key];
    if (!snip) return;

    // Activate scroll guard
    _guardScrollY = window.pageYOffset || document.documentElement.scrollTop;
    _scrollGuard = true;
    var editorScrollTop = editor.session.getScrollTop();

    // Suppress preview update
    _suppressPreview = true;

    var session = editor.session;
    var selection = editor.selection;
    var range = selection.getRange();
    var selectedText = session.getTextRange(range);

    // === Line-level toggle (h1, h2, h3, static, auto-split, ul, ol, blockquote) ===
    if (snip.prefix && snip.lineStart) {
      var startRow = range.start.row;
      var endRow = selectedText ? range.end.row : startRow;

      // Check if ALL non-empty lines already have the prefix → toggle off
      var allHavePrefix = true;
      for (var r = startRow; r <= endRow; r++) {
        var ln = session.getLine(r);
        if (!ln.trim()) continue;
        var stripped = snip.numbered ? stripNumberedPrefix(ln) : stripPrefix(ln, snip.prefix);
        if (stripped === null) { allHavePrefix = false; break; }
      }

      if (allHavePrefix) {
        // Remove prefix from all lines (iterate in reverse to preserve row indices)
        for (var r = endRow; r >= startRow; r--) {
          var ln = session.getLine(r);
          if (!ln.trim()) continue;
          var stripped = snip.numbered ? stripNumberedPrefix(ln) : stripPrefix(ln, snip.prefix);
          if (stripped !== null) {
            session.replace({ start: { row: r, column: 0 }, end: { row: r, column: ln.length } }, stripped);
          }
        }
      } else {
        // Add prefix to all non-empty lines
        var num = 0;
        for (var r = startRow; r <= endRow; r++) {
          var ln = session.getLine(r);
          if (!ln.trim()) continue;
          var pfx = snip.numbered ? (++num) + '. ' : snip.prefix;
          session.insert({ row: r, column: 0 }, pfx);
        }
      }

    // === Inline toggle (bold, italic, underline, etc.) ===
    } else if (snip.before !== undefined) {
      if (selectedText) {
        // Check if selected text itself is wrapped
        if (isWrapped(selectedText, snip.before, snip.after)) {
          // Unwrap: remove markers from inside selection
          var inner = selectedText.substring(snip.before.length, selectedText.length - snip.after.length);
          session.replace(range, inner);
        // Check if surrounding text has the markers (user selected content without markers)
        } else {
          var lineText = session.getLine(range.start.row);
          var bLen = snip.before.length;
          var aLen = snip.after.length;
          var beforeChars = lineText.substring(range.start.column - bLen, range.start.column);
          var afterChars = lineText.substring(range.end.column, range.end.column + aLen);
          if (range.start.row === range.end.row && beforeChars === snip.before && afterChars === snip.after) {
            // Unwrap: remove surrounding markers
            var expandedRange = {
              start: { row: range.start.row, column: range.start.column - bLen },
              end: { row: range.end.row, column: range.end.column + aLen }
            };
            session.replace(expandedRange, selectedText);
          } else {
            // Wrap: add markers
            session.replace(range, snip.before + selectedText + snip.after);
          }
        }
      } else {
        // No selection: insert placeholder with markers
        var pos = editor.getCursorPosition();
        var text = snip.before + snip.placeholder + snip.after;
        session.insert(pos, text);
        var startCol = pos.column + snip.before.length;
        var endCol = startCol + snip.placeholder.length;
        selection.setRange({
          start: { row: pos.row, column: startCol },
          end: { row: pos.row, column: endCol }
        });
      }

    // === Block wrap (code-block) ===
    } else if (snip.blockWrap) {
      if (selectedText) {
        // Check if already wrapped
        var lines = selectedText.split('\n');
        if (lines[0].trim() === snip.wrapBefore.trim() && lines[lines.length - 1].trim() === snip.wrapAfter.trim()) {
          session.replace(range, lines.slice(1, -1).join('\n'));
        } else {
          session.replace(range, snip.wrapBefore + selectedText + snip.wrapAfter);
        }
      } else {
        var pos = editor.getCursorPosition();
        var line = session.getLine(pos.row);
        var text = snip.line;
        if (pos.column > 0 && line.length > 0) text = '\n' + text;
        session.insert(pos, text);
      }

    // === Line insert (separators, templates — no toggle) ===
    } else if (snip.line) {
      var pos = editor.getCursorPosition();
      var line = session.getLine(pos.row);
      var text = snip.line;
      if (snip.lineStart && pos.column > 0 && line.length > 0) {
        text = '\n' + text;
      }
      session.insert(pos, text);
    }

    // Restore editor internal scroll
    editor.renderer.scrollToY(editorScrollTop);

    // Release guards and refocus editor
    setTimeout(function() {
      _scrollGuard = false;
      _suppressPreview = false;
      editor.focus();
      // Quietly update preview without scroll
      if (typeof PreviewPanel !== 'undefined') {
        PreviewPanel.scheduleUpdate();
      }
    }, 150);
  });
})();

//////////////////// Speech setup ///////////////
try{
  var voices;
  var utterance;
  var waitCount = 0;
  var timer = setInterval(function(){
    waitCount++;
    voices = window.speechSynthesis.getVoices();
    if(voices && voices.length > 0){
      utterance = new SpeechSynthesisUtterance();
      setupLanguages(true, default_lang);
      window.speechSynthesis.onvoiceschanged = function() {
        setupLanguages(false, default_lang);
      }
      clearInterval(timer);
      $("#lang_controller").show();
      $("#voice_controller").show();
      $("#rate_controller").show();
    } else if (waitCount == 50){
      clearInterval(timer);
      return false;
    }
  },100);
} catch(e) {
  var utterance = false;
}

var lang_selections = {};

function setupLanguages(refresh, default_lang){
  var voices = window.speechSynthesis.getVoices();
  if(voices.length == 0){
    return false;
  }
  for (var i in voices) {
    if (voices[i].localService && voices[i].name.indexOf("Siri") >= 0){
      continue;
    }
    var vlang = voices[i].lang;
    var vname = voices[i].name;
    if(lang_selections[vlang]){
      lang_selections[vlang][vname] = voices[i];
    } else {
      lang_selections[vlang] = {};
      lang_selections[vlang][vname] = voices[i];
    }
  }

  var vlangs = Object.keys(lang_selections);
  vlangs = vlangs.sort().filter(function (x, i, self) {
    return self.indexOf(x) === i;
  });

  var default_lang_index = vlangs.indexOf(default_lang);
  if (default_lang_index >= 0) {
    var f = vlangs.splice(default_lang_index, 1)[0];
    vlangs.splice(0, 0, f);
  }

  if($('#lang_selected option').length == 0){
    var displayNames = null;
    try { displayNames = new Intl.DisplayNames([navigator.language || 'en'], { type: 'language' }); } catch(e) {}
    for (var i in vlangs){
      var key = vlangs[i];
      var label = key;
      if (displayNames) {
        try { label = displayNames.of(key); } catch(e) {}
      }
      $('#lang_selected').append('<option value="' + key +'">' + label + '</option>');
    }
    if (vlangs.length > 0){
      var dl = vlangs[0];
      $('#lang_selected').val(dl);
      setupVoices(refresh);
      setupRates(refresh);
    }
  }
}

function setupVoices(refresh){
  var lang_selected = $('#lang_selected option:selected').val();
  var voices = lang_selections[lang_selected];
  if(refresh || $('#voice_selected option').length == 0){
    $('#voice_selected').empty();
    var set_voice_selected = false;
    for (var i in voices){
      if(!set_voice_selected && (voices[i].name.includes("Google") || voices[i].name.includes("Natural"))){
        $('#voice_selected').append('<option value="' + voices[i].name +'" selected>' + voices[i].name +'</option>');
        set_voice_selected = true;
      } else {
        $('#voice_selected').append('<option value="' + voices[i].name +'">' + voices[i].name +'</option>');
      }
    }
  }
}

function setupRates(refresh){
  var rates = ["2.0", "1.9", "1.8", "1.7", "1.6", "1.5", "1.4", "1.3", "1.2", "1.1", "1.0", "0.9", "0.8", "0.7", "0.6", "0.5", "0.4"]
  if(refresh || $('#rate_selected option').length == 0){
    var rate = $('#rate_selected').empty();
    for (var i in rates){
      rate.append('<option value="' + rates[i] + '">' + rates[i] +'</option>');
    }
    rate.val("1.0");
  }
}

$("#lang_selected").change(function(){
  setupVoices(true);
  setupRates(true);
});

$("#voice_selected").change(function(){
  setupRates(true);
});

//////////////////// Cloud TTS setup ///////////////
(function() {
  if (typeof CloudTTS === 'undefined') return;

  // Show cloud TTS section once speech controls are visible
  var cloudWait = setInterval(function() {
    if ($('#lang_controller').is(':visible') || $('#lang_selected option').length > 0) {
      clearInterval(cloudWait);
      $('#cloud_tts_section').show();
    }
  }, 200);

  // Toggle controls visibility
  $('#cloud_tts_toggle').on('click', function() {
    var $controls = $('#cloud_tts_controls');
    var $caret = $('#cloud_tts_caret');
    if ($controls.is(':visible')) {
      $controls.slideUp(200);
      $caret.removeClass('fa-caret-down').addClass('fa-caret-right');
    } else {
      $controls.slideDown(200);
      $caret.removeClass('fa-caret-right').addClass('fa-caret-down');
    }
  });

  // Per-provider API key storage
  var _cloudKeys = { openai: '', elevenlabs: '' };
  var _prevProvider = 'browser';

  // Provider change
  $('#tts_provider_selected').on('change', function() {
    var provider = $(this).val();

    // Stop any in-progress cloud TTS playback before switching
    if (typeof CloudTTS !== 'undefined' && CloudTTS.isPlaying()) {
      CloudTTS.stop();
    }

    // Save current key before switching
    if (_prevProvider !== 'browser') {
      _cloudKeys[_prevProvider] = $('#tts_api_key').val() || '';
    }

    if (provider === 'browser') {
      $('#tts_api_key_controller').hide();
      $('#tts_cloud_voice_controller').hide();
      $('#tts_cloud_rate_controller').hide();
      $('#lang_controller').show();
      $('#voice_controller').show();
      $('#rate_controller').show();
    } else {
      // Restore saved key for this provider
      $('#tts_api_key').val(_cloudKeys[provider] || '');
      $('#tts_api_key_status').text('');
      $('#tts_api_key_controller').show();
      $('#tts_cloud_voice_controller').show();
      $('#lang_controller').hide();
      $('#voice_controller').hide();
      $('#rate_controller').hide();
      // OpenAI supports speed; ElevenLabs does not
      if (provider === 'openai') {
        $('#tts_cloud_rate_controller').show();
      } else {
        $('#tts_cloud_rate_controller').hide();
      }
      populateCloudVoices(provider);
    }

    _prevProvider = provider;
  });

  // API key change (for ElevenLabs voice list refresh)
  $('#tts_api_key').on('change', function() {
    var provider = $('#tts_provider_selected').val();
    if (provider === 'elevenlabs') {
      populateCloudVoices(provider);
    }
    // Clear previous verification status
    $('#tts_api_key_status').text('');
  });

  // Verify API key
  $('#tts_api_key_verify').on('click', function() {
    var provider = $('#tts_provider_selected').val();
    var apiKey = $('#tts_api_key').val();
    var $status = $('#tts_api_key_status');
    var $btn = $(this);

    if (!apiKey) {
      $status.text('Enter a key first').css('color', '#e15759');
      return;
    }

    $btn.addClass('disabled');
    $status.text('Verifying...').css('color', '#999');

    CloudTTS.verifyApiKey(provider, apiKey).then(function(result) {
      $btn.removeClass('disabled');
      if (result.valid) {
        $status.html('<i class="fa-solid fa-circle-check"></i> Valid').css('color', '#59a14f');
      } else {
        $status.html('<i class="fa-solid fa-circle-xmark"></i> ' + result.error).css('color', '#e15759');
      }
    });
  });

  function populateCloudVoices(provider) {
    var $select = $('#tts_cloud_voice_selected');
    $select.empty();

    if (provider === 'openai') {
      CloudTTS.OPENAI_VOICES.forEach(function(v) {
        $select.append('<option value="' + v + '">' + v + '</option>');
      });
    } else if (provider === 'elevenlabs') {
      var apiKey = $('#tts_api_key').val();
      if (!apiKey) {
        $select.append('<option value="">-- Enter API key first --</option>');
        return;
      }
      $select.append('<option value="">Loading...</option>');
      CloudTTS.fetchVoices(apiKey).then(function(voices) {
        $select.empty();
        voices.forEach(function(v) {
          $select.append($('<option>').val(v.voice_id).text(v.name));
        });
      }).catch(function(err) {
        $select.empty();
        $select.append('<option value="">Failed to load voices</option>');
        console.error('Failed to fetch ElevenLabs voices:', err.message);
      });
    }
  }

  // Expose for settings restore (closure-scoped, not on window)
  window._populateCloudVoices = populateCloudVoices;
  window._getCloudKey = function(provider) { return _cloudKeys[provider] || ''; };
  window._setCloudKey = function(provider, key) { _cloudKeys[provider] = key; };
})();

//////////////////// Default config (matches paradocs.conf) ///////////////
var DEFAULT_CONFIG = {
  "para_version": "0.9.0",
  "note_color": "#303030",
  "note_background_color": "#F4F1BB",
  "note_marker_color": "#F4F1BB",
  "font_size": 40,
  "note_size": 32,
  "line_height": 1.4,
  "google": "https://www.google.co.jp/?q=[q]#q=[q]",
  "prefix": BASE_PATH
};

//////////////////// Client-side conversion ///////////////

// Shared conversion logic: validates input, builds config, parses text.
// Returns { slides, config, css, colorInverted } or null on error.
function buildPresentation() {
  var text = editor.getValue();

  if (!text || text.trim().length === 0) {
    showError("Error: Input text is empty!");
    return null;
  }
  if (text.length >= MAX_CHARS) {
    showError("Input text must be less than 50,000 characters.");
    return null;
  }

  // Build config from form values
  var config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  config.speech_voice = $('#voice_selected').val() || '';
  config.speech_lang = $('#lang_selected').val() || default_lang;
  config.speech_rate = $('#rate_selected').val() || '1.0';
  config.tts_provider = $('#tts_provider_selected').val() || 'browser';
  config.tts_api_key = $('#tts_api_key').val() || '';
  config.tts_cloud_voice = $('#tts_cloud_voice_selected').val() || '';
  config.tts_cloud_rate = $('#tts_cloud_rate_selected').val() || '1.0';

  var fontSize = parseInt($('#font_size_selected').val()) || 40;
  config.font_size = fontSize;
  config.note_size = fontSize;
  config.font_family = $('#font_family_selected').val() || 'sans';

  var accentColor = $('#accent_color_selected').val() || '#e15759';
  if (/^#[0-9a-fA-F]{3,8}$/.test(accentColor)) {
    config.accent_color = accentColor;
  } else {
    config.accent_color = '#e15759';
  }

  var colorInverted = $('#text_background').is(':checked');
  config.color_inverted = colorInverted;

  var wp = $('#wallpaper_selected').val() || 'none';
  var allowedWallpapers = [
    'absurdity.png', 'arches.png', 'bedge-grunge.png', 'bright-squares.png',
    'fabric-plaid.png', 'food.png', 'gplay.png', 'gray-floral.png',
    'inspiration-geometry.png', 'project-paper.png', 'sandpaper.png'
  ];
  if (wp === 'none' || allowedWallpapers.indexOf(wp) === -1) {
    config.wallpaper = 'none';
  } else {
    config.wallpaper = 'url(' + BASE_PATH + 'img/wallpaper/' + wp + ')';
  }

  var rawHlColor = $('#highlight_background_color_selected').val() || '#4e79a7';
  var safeHlColor = /^#[0-9a-fA-F]{3,8}$/.test(rawHlColor) ? rawHlColor : '#4e79a7';

  if (colorInverted) {
    config.highlight_background_color = safeHlColor;
    config.highlight_color = '#ffffff';
    config.progress_color = safeHlColor;
  } else {
    config.highlight_background_color = 'transparent';
    config.highlight_color = safeHlColor;
    config.progress_color = safeHlColor;
  }

  var resolution = $('#resolution_selected').val() || DEFAULT_RESOLUTION;
  if (ALLOWED_RESOLUTIONS.indexOf(resolution) === -1) {
    resolution = DEFAULT_RESOLUTION;
  }
  var resParts = resolution.split('x');
  config.width = parseInt(resParts[0]);
  config.height = parseInt(resParts[1]);

  // Parse text (with local image resolver)
  var slides;
  var imageResolver = function(name) {
    return typeof ImageStore !== 'undefined' ? ImageStore.get(name) : null;
  };
  try {
    var parser = new Parser(text, config, imageResolver);
    slides = parser.parse();
  } catch(e) {
    console.error('Parser error:', e);
    showError('Parser error: ' + e.message);
    return null;
  }

  // Generate CSS
  var css = createCSS(config);

  return { slides: slides, config: config, css: css, colorInverted: colorInverted };
}

// Pre-calculate submit button width to prevent resize on click
(function() {
  var $btn = $('#submit_button');
  var originalHtml = $btn.html();
  var originalWidth = $btn.outerWidth();
  $btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Converting...');
  var convertingWidth = $btn.outerWidth();
  $btn.html(originalHtml);
  $btn.css('min-width', Math.max(originalWidth, convertingWidth) + 'px');
})();

$('#submit_button').on('click', function(){
  var $btn = $(this);
  var originalText = $btn.html();
  $btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Converting...').addClass('disabled');

  // Use setTimeout to allow UI update before synchronous parsing
  setTimeout(function() {
    var result = buildPresentation();
    $btn.html(originalText).removeClass('disabled');
    if (!result) return;

    var slides = result.slides;
    var config = result.config;
    var css = result.css;
    var colorInverted = result.colorInverted;

    // Store in sessionStorage (check size limit ~5MB)
    try {
      sessionStorage.setItem('paradocs_slides', slides);
      sessionStorage.setItem('paradocs_config', JSON.stringify(config));
      sessionStorage.setItem('paradocs_css', css);
      sessionStorage.setItem('paradocs_inverted', colorInverted ? 'true' : 'false');
    } catch (e) {
      alert('Presentation data is too large for browser storage. Please reduce the text size.');
      return;
    }

    // Save form settings for next visit
    saveFormSettings(config);

    // Open deck page
    window.open(BASE_PATH + 'deck.html', '_blank');
  }, 50);
});

$('#download_button').on('click', function(){
  var $btn = $(this);
  var originalText = $btn.html();
  $btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Exporting...').addClass('disabled');

  setTimeout(function() {
    var result = buildPresentation();
    if (!result) {
      $btn.html(originalText).removeClass('disabled');
      return;
    }

    // Save form settings for next visit
    saveFormSettings(result.config);

    // Download standalone HTML
    Exporter.download(result.slides, result.config, result.css, result.colorInverted, BASE_PATH);

    // Restore button after a short delay (download is async)
    setTimeout(function() {
      $btn.html(originalText).removeClass('disabled');
    }, 2000);
  }, 50);
});

// Save source text as .txt file
$('#save_text_button').on('click', function(e) {
  e.preventDefault();
  var text = editor.getValue();
  if (!text.trim()) return;
  var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'paradocs-source.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Load source text from .txt file
$('#load_text_button').on('click', function(e) {
  e.preventDefault();
  document.getElementById('load-text-input').click();
});

function showLoadMessage(msg) {
  var $msg = $('#textarea_message');
  $msg.text(msg).show();
  setTimeout(function() { $msg.fadeOut(); }, 4000);
}

$('#load-text-input').on('change', function(e) {
  var file = e.target.files[0];
  if (!file) return;

  // Validate file type
  var validTypes = ['text/plain', 'text/markdown', ''];
  var ext = file.name.split('.').pop().toLowerCase();
  if (validTypes.indexOf(file.type) === -1 && ext !== 'txt' && ext !== 'md') {
    showLoadMessage('Only .txt and .md files are allowed.');
    this.value = '';
    return;
  }

  // Validate file size (max 1MB)
  if (file.size > 1024 * 1024) {
    showLoadMessage('File is too large. Maximum size is 1MB.');
    this.value = '';
    return;
  }

  var reader = new FileReader();
  reader.onload = function(ev) {
    var text = ev.target.result;

    // Security: reject binary / non-text content
    if (/[\x00-\x08\x0E-\x1F]/.test(text)) {
      showLoadMessage('File contains invalid characters.');
      return;
    }

    // Security: strip script tags and event handler attributes
    text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
    text = text.replace(/\bon\w+\s*=\s*(['"]?)[\s\S]*?\1/gi, '');

    editor.setValue(text, -1);
    editor.focus();
  };
  reader.onerror = function() {
    showLoadMessage('Failed to read file.');
  };
  reader.readAsText(file, 'UTF-8');

  // Reset input so same file can be re-loaded
  this.value = '';
});

function saveFormSettings(config) {
  autosave.saveSettings({
    speech_lang: config.speech_lang,
    speech_voice: config.speech_voice,
    speech_rate: config.speech_rate,
    font_size: String(config.font_size),
    font_family: config.font_family,
    accent_color: config.accent_color,
    highlight_background_color: $('#highlight_background_color_selected').val() || '#4e79a7',
    resolution: $('#resolution_selected').val() || DEFAULT_RESOLUTION,
    wallpaper: $('#wallpaper_selected').val() || 'sandpaper.png',
    color_inverted: config.color_inverted,
    tts_provider: config.tts_provider || 'browser',
    // Sync current input to _cloudKeys before saving
    tts_api_key_openai: (function() {
      if (config.tts_provider === 'openai' && config.tts_api_key) window._setCloudKey('openai', config.tts_api_key);
      return window._getCloudKey('openai');
    })(),
    tts_api_key_elevenlabs: (function() {
      if (config.tts_provider === 'elevenlabs' && config.tts_api_key) window._setCloudKey('elevenlabs', config.tts_api_key);
      return window._getCloudKey('elevenlabs');
    })(),
    tts_cloud_voice: config.tts_cloud_voice || '',
    tts_cloud_rate: config.tts_cloud_rate || '1.0'
  });
}

function clearImages() {
  ImageStore.clear();
  localStorage.removeItem('paradocs_' + langKey + 'local_images');
  var il = document.getElementById('image-list');
  if (il) {
    var emptyMsg = { 'ja': '画像はまだアップロードされていません', 'zh-CN': '尚未上传图片', 'ko': '아직 업로드된 이미지가 없습니다' };
    il.innerHTML = "<span class='text-muted'>" + (emptyMsg[document.documentElement.lang] || 'No images uploaded') + "</span>";
  }
}

// Clear Text — clears editor text only (keeps images)
$("#clear_button").on('click', function(){
  editor.setValue('');
  autosave.clear();
  $('#textarea_message').hide();
});

// Reset — clears images and restores sample text
$("#reset_button").on('click', function(){
  autosave.clear();
  clearImages();
  $('#textarea_message').hide();
  // Reload sample text
  var sampleSuffix = { 'ja-JP': '_ja', 'zh-CN': '_zh', 'ko-KR': '_ko' }[default_lang] || '';
  fetch(BASE_PATH + 'data/sample' + sampleSuffix + '.txt')
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function(text) {
      editor.setValue(text, -1);
    })
    .catch(function(err) {
      console.warn('Failed to load sample text:', err.message);
    });
});

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function showError(message){
  $("div.alert").text(message).show("fast");
  setTimeout(function() {
    $("div.alert").hide();
  }, 10000);
  return true;
}

$("#input-textarea").focus(function(){
  $("div.alert").hide();
  return true;
});

//////////////////// Settings panel toggle ///////////////
$('#settings_toggle_button').on('click', function() {
  var $btn = $(this);
  var $panel = $('#settings-and-images');
  $panel.slideToggle(200, function() {
    if ($panel.is(':visible')) {
      $btn.addClass('active');
      // Expand all groups
      $('.settings-group-header').addClass('open');
      $('.settings-group-body').show();
      $('html, body').animate({ scrollTop: $panel.offset().top - 60 }, 300);
    } else {
      $btn.removeClass('active');
      // Collapse all groups when panel closes
      $('.settings-group-header').removeClass('open');
      $('.settings-group-body').hide();
    }
  });
});

$('.settings-group-header').on('click', function() {
  var $header = $(this);
  var targetId = $header.data('target');
  $header.toggleClass('open');
  $('#' + targetId).slideToggle(200);
});

//////////////////// Scroll to top ///////////////
$(document).on('scroll', function(){
  if ($(window).scrollTop() > 100) {
    $('.ctrl-wrapper.scroll-top').addClass('show');
  } else {
    $('.ctrl-wrapper.scroll-top').removeClass('show');
  }
});
$('#to-top').click(function(){
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
});

$(document).click(function (event) {
  var clickover = $(event.target);
  var _opened = $(".navbar-collapse").hasClass("show");
  if (_opened === true && !clickover.hasClass("navbar-toggler")) {
    var navbarCollapse = document.querySelector('.navbar-collapse');
    if (navbarCollapse) {
      var bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
      if (bsCollapse) {
        bsCollapse.hide();
      }
    }
  }
});

$("#input-textarea").resizable( {handles:"se", grid: [10000000,1] }).on('resize', function(){
  editor.resize();
});

//////////////////// Local image upload ///////////////

(function() {
  var MAX_DIMENSION = 1280;
  var JPEG_QUALITY = 0.85;
  var STORAGE_KEY = 'paradocs_' + langKey + 'local_images';
  var dropZone = document.getElementById('image-drop-zone');
  var fileInput = document.getElementById('image-file-input');
  var imageList = document.getElementById('image-list');

  if (!dropZone || !fileInput || !imageList) return;

  // Restore images from localStorage on page load
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      ImageStore.fromJSON(saved);
    }
  } catch (e) {
    console.warn('Failed to restore images from localStorage:', e.message);
  }

  /**
   * Persist ImageStore to localStorage.
   */
  function persistImages() {
    try {
      localStorage.setItem(STORAGE_KEY, ImageStore.toJSON());
    } catch (e) {
      console.warn('Failed to persist images to localStorage:', e.message);
      var lang = document.documentElement.lang;
      var msg = lang === 'ja' ? '画像の保存に失敗しました。ストレージの容量が不足しています。不要な画像を削除してください。' :
                lang === 'zh-CN' ? '图片保存失败。存储空间不足，请删除不需要的图片。' :
                lang === 'ko' ? '이미지 저장에 실패했습니다. 저장 공간이 부족합니다. 불필요한 이미지를 삭제해 주세요.' :
                'Failed to save images. Storage quota exceeded. Please remove unnecessary images.';
      showError(msg);
    }
  }

  // Click to open file dialog
  dropZone.addEventListener('click', function() {
    fileInput.click();
  });

  // Keyboard accessibility
  dropZone.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  // File input change
  fileInput.addEventListener('change', function() {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFiles(fileInput.files);
      fileInput.value = '';
    }
  });

  // Drag and drop
  dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  /**
   * Resize an image to max dimension and compress as JPEG.
   * Returns a Promise resolving to { name, dataUrl }.
   */
  function resizeAndStore(file) {
    return new Promise(function(resolve, reject) {
      // Validate type and size first via ImageStore
      var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (ALLOWED_TYPES.indexOf(file.type) === -1) {
        reject(new Error(file.name + ': unsupported image type.'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error(file.name + ': exceeds 5MB limit.'));
        return;
      }

      // For GIF, store directly (preserve animation)
      if (file.type === 'image/gif') {
        ImageStore.processFile(file).then(resolve).catch(reject);
        return;
      }

      var reader = new FileReader();
      reader.onerror = function() { reject(new Error('Failed to read: ' + file.name)); };
      reader.onload = function(e) {
        var img = new Image();
        img.onerror = function() { reject(new Error('Failed to load image: ' + file.name)); };
        img.onload = function() {
          var w = img.width;
          var h = img.height;

          // Only resize if exceeds max dimension
          if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
            if (w > h) {
              h = Math.round(h * MAX_DIMENSION / w);
              w = MAX_DIMENSION;
            } else {
              w = Math.round(w * MAX_DIMENSION / h);
              h = MAX_DIMENSION;
            }
          }

          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          // Convert to JPEG (or PNG for transparency)
          var outputType = (file.type === 'image/png') ? 'image/png' : 'image/jpeg';
          var quality = (outputType === 'image/jpeg') ? JPEG_QUALITY : undefined;
          var dataUrl = canvas.toDataURL(outputType, quality);

          var safeName = ImageStore.sanitizeName(file.name);
          ImageStore.set(safeName, dataUrl);
          resolve({ name: safeName, dataUrl: dataUrl });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Process multiple files: resize, store, update list.
   */
  function handleFiles(files) {
    var promises = [];
    for (var i = 0; i < files.length; i++) {
      promises.push(resizeAndStore(files[i]));
    }

    Promise.allSettled(promises).then(function(results) {
      var errors = [];
      results.forEach(function(r) {
        if (r.status === 'rejected') {
          errors.push(r.reason.message);
        }
      });
      if (errors.length > 0) {
        showError(errors.join('\n'));
      }
      persistImages();
      refreshImageList();
    });
  }

  /**
   * Refresh the image list UI.
   */
  function refreshImageList() {
    var names = ImageStore.list();
    imageList.textContent = '';

    if (names.length === 0) {
      var emptyMsg = document.createElement('span');
      emptyMsg.className = 'text-muted';
      emptyMsg.textContent =
        document.documentElement.lang === 'ja' ? '画像はまだアップロードされていません' :
        document.documentElement.lang === 'zh-CN' ? '尚未上传图片' :
        document.documentElement.lang === 'ko' ? '아직 업로드된 이미지가 없습니다' :
        'No images uploaded';
      imageList.appendChild(emptyMsg);
      return;
    }

    names.forEach(function(name) {
      var dataUrl = ImageStore.get(name);

      var div = document.createElement('div');
      div.className = 'image-list-item';

      var img = document.createElement('img');
      img.src = dataUrl || '';
      img.alt = '';
      div.appendChild(img);

      var nameSpan = document.createElement('span');
      nameSpan.className = 'image-name';
      nameSpan.dataset.name = name;
      nameSpan.textContent = name;
      nameSpan.addEventListener('click', function() { insertImageReference(name); });
      div.appendChild(nameSpan);

      var removeSpan = document.createElement('span');
      removeSpan.className = 'image-remove';
      removeSpan.dataset.name = name;
      removeSpan.title = 'Remove';
      var icon = document.createElement('i');
      icon.className = 'fa-solid fa-xmark';
      removeSpan.appendChild(icon);
      removeSpan.addEventListener('click', function() {
        ImageStore.remove(name);
        persistImages();
        refreshImageList();
        removeImageReferences(name);
      });
      div.appendChild(removeSpan);

      imageList.appendChild(div);
    });
  }

  /**
   * Insert `image: local:filename` at the editor cursor position,
   * ensuring it sits on its own line.
   */
  function insertImageReference(name) {
    var pos = editor.getCursorPosition();
    var line = editor.session.getLine(pos.row);
    var prefix = '';
    var suffix = '\n';

    // If cursor is not at the start of an empty line, add a newline before
    if (line.length > 0 && pos.column > 0) {
      prefix = '\n';
    }

    var text = prefix + 'image: local:' + name + suffix;
    editor.session.insert(pos, text);
    editor.focus();
  }

  /**
   * Remove all `image: local:filename` or `img: local:filename` lines
   * from the editor for a given image name.
   */
  function removeImageReferences(name) {
    var content = editor.getValue();
    var pattern = new RegExp('^\\s*(?:image|img):\\s*local:' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'gm');
    var updated = content.replace(pattern, '');
    // Clean up consecutive blank lines left behind
    updated = updated.replace(/\n{3,}/g, '\n\n');
    if (updated !== content) {
      editor.setValue(updated, -1);
    }
  }

  // Show restored images on page load
  refreshImageList();
})();

// Initialize preview panel
$(function() {
  if (typeof PreviewPanel !== 'undefined') {
    PreviewPanel.init();
  }
});

$("#accent_color_selected").change(function(){
  var accent_color = $(this).val();
  $("#accent_color_sample").css("color", accent_color);
  if (typeof PreviewPanel !== 'undefined') PreviewPanel.forceUpdate();
});

$("#highlight_background_color_selected").change(function(){
  var highlight_background_color = $(this).val();
  var text_background_checked = $("#text_background").is(':checked')
  if(text_background_checked){
    $("#highlight_background_color_sample").css("background-color", highlight_background_color).css("color", "#ffffff");
  }else{
    $("#highlight_background_color_sample").css("background-color", "transparent").css("color", highlight_background_color);
  }
  if (typeof PreviewPanel !== 'undefined') PreviewPanel.forceUpdate();
});

$("#text_background").change(function(){
  var highlight_background_color = $("#highlight_background_color_selected").val();
  var text_background_checked = $(this).is(':checked')
  if(text_background_checked){
    $("#highlight_background_color_sample").css("background-color", highlight_background_color).css("color", "#ffffff");
  } else {
    $("#highlight_background_color_sample").css("background-color", "transparent").css("color", highlight_background_color);
  }
  if (typeof PreviewPanel !== 'undefined') PreviewPanel.forceUpdate();
});

$("#resolution_selected").change(function(){
  var resolution_selected = $("#resolution_selected").val();
  var font_size_selected = $("#font_size_selected");
  if (resolution_selected == "800x600"){
    font_size_selected.val("30");
  } else if(resolution_selected == "1920x1080"){
    font_size_selected.val("50");
  } else {
    font_size_selected.val("40");
  }
  if (typeof PreviewPanel !== 'undefined') {
    PreviewPanel.updateAspectRatio();
    PreviewPanel.forceUpdate();
  }
});

$("#wallpaper_selected").change(function(){
  var wallpaper_selected = $("#wallpaper_selected").val();
  if (wallpaper_selected == "none"){
    $('body').css("background-image", "");
  } else {
    var wallpaper_url = "url(" + BASE_PATH + "img/wallpaper/" + wallpaper_selected + ")";
    $('body').css("background-image", wallpaper_url);
  }
  if (typeof PreviewPanel !== 'undefined') PreviewPanel.forceUpdate();
});

$("#font_size_selected").change(function(){
  if (typeof PreviewPanel !== 'undefined') PreviewPanel.forceUpdate();
});

$("#font_family_selected").change(function(){
  var fontfamily_selected = $("#font_family_selected").val();
  var fontFamily;
  if (fontfamily_selected == "sans"){
    fontFamily = '"Lato", sans-serif';
  } else if(fontfamily_selected == "serif"){
    fontFamily = '"Palatino Linotype", "Book Antiqua", Palatino, FreeSerif, serif';
  } else if(fontfamily_selected == "fun"){
    fontFamily = '"Comic Sans MS", "\u30D2\u30E9\u30AE\u30CE\u4E38\u30B4 Pro W4","\u30D2\u30E9\u30AE\u30CE\u4E38\u30B4 Pro","Hiragino Maru Gothic Pro","HG\u4E38\uFF7A\uFF9E\uFF7C\uFF6F\uFF78M-PRO","HGMaruGothicMPRO", cursive, sans-serif';
  }
  $('.color-sample').css("fontFamily", fontFamily);
  if (typeof PreviewPanel !== 'undefined') PreviewPanel.forceUpdate();
});
