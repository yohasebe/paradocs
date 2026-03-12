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
editor.renderer.setOption('fontSize', 16);

editor.container.style.lineHeight = 1.7;
editor.renderer.updateFontSize();

editor.renderer.setOption('showPrintMargin', false);
editor.renderer.setOption('showInvisibles', true);
editor.renderer.setOption('showGutter', false);
editor.setAutoScrollEditorIntoView(true);

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
      var restoreTimer = setInterval(function() {
        if ($('#lang_selected option').length > 0 || --restoreTimer._tries <= 0) {
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
        }
      }, 200);
      restoreTimer._tries = 25; // Give up after 5 seconds
    });
  }
} else {
  var sampleSuffix = { 'ja-JP': '_ja', 'zh-CN': '_zh', 'ko-KR': '_ko' }[default_lang] || '';
  fetch(BASE_PATH + 'data/sample' + sampleSuffix + '.txt')
    .then(function(r) { return r.text(); })
    .then(function(text) {
      editor.setValue(text, -1);
    });
}

// Character counter for editor
var MAX_CHARS = 50000;
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
});

// Initial counter update
$(function() { updateCharCounter(); });

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
    for (var i in vlangs){
      var key = vlangs[i];
      $('#lang_selected').append('<option value="' + key +'">' + key + '</option>');
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

//////////////////// Default config (matches paradocs.conf) ///////////////
var DEFAULT_CONFIG = {
  "para_version": "0.8.0",
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
  if (text.length >= 50000) {
    showError("Input text must be less than 50,000 characters.");
    return null;
  }

  // Build config from form values
  var config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  config.speech_voice = $('#voice_selected').val() || '';
  config.speech_lang = $('#lang_selected').val() || default_lang;
  config.speech_rate = $('#rate_selected').val() || '1.0';

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

  var allowedResolutions = ['800x600', '1280x800', '1920x1080'];
  var resolution = $('#resolution_selected').val() || '1280x800';
  if (allowedResolutions.indexOf(resolution) === -1) {
    resolution = '1280x800';
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
    showError('Parser error: ' + e.message);
    return null;
  }

  // Generate CSS
  var css = createCSS(config);

  return { slides: slides, config: config, css: css, colorInverted: colorInverted };
}

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

function saveFormSettings(config) {
  autosave.saveSettings({
    speech_lang: config.speech_lang,
    speech_voice: config.speech_voice,
    speech_rate: config.speech_rate,
    font_size: String(config.font_size),
    font_family: config.font_family,
    accent_color: config.accent_color,
    highlight_background_color: $('#highlight_background_color_selected').val() || '#4e79a7',
    resolution: $('#resolution_selected').val() || '1280x800',
    wallpaper: $('#wallpaper_selected').val() || 'sandpaper.png',
    color_inverted: config.color_inverted
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
    .then(function(r) { return r.text(); })
    .then(function(text) {
      editor.setValue(text, -1);
    });
});

function showError(message){
  $("div.alert").html(message).show("fast");
  setTimeout(function() {
    $("div.alert").hide();
  }, 10000);
  return true;
}

$("#input-textarea").focus(function(){
  $("div.alert").hide();
  return true;
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
   * Persist ImageStore to sessionStorage.
   */
  function persistImages() {
    try {
      localStorage.setItem(STORAGE_KEY, ImageStore.toJSON());
    } catch (e) {
      console.warn('Failed to persist images to localStorage:', e.message);
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
        showError(errors.join('<br>'));
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
    if (names.length === 0) {
      imageList.innerHTML = "<span class='text-muted'>" +
        (document.documentElement.lang === 'ja' ? '画像はまだアップロードされていません' :
         document.documentElement.lang === 'zh-CN' ? '尚未上传图片' :
         document.documentElement.lang === 'ko' ? '아직 업로드된 이미지가 없습니다' :
         'No images uploaded') + "</span>";
      return;
    }

    var html = '';
    names.forEach(function(name) {
      var dataUrl = ImageStore.get(name);
      var thumbSrc = dataUrl ? dataUrl : '';
      html += "<div class='image-list-item'>" +
        "<img src='" + thumbSrc + "' alt=''>" +
        "<span class='image-name' data-name='" + name.replace(/'/g, '&#39;') + "'>" + name + "</span>" +
        "<span class='image-remove' data-name='" + name.replace(/'/g, '&#39;') + "' title='Remove'><i class='fa-solid fa-xmark'></i></span>" +
        "</div>";
    });
    imageList.innerHTML = html;

    // Click on name → insert into editor
    imageList.querySelectorAll('.image-name').forEach(function(el) {
      el.addEventListener('click', function() {
        var name = el.getAttribute('data-name');
        insertImageReference(name);
      });
    });

    // Click on remove → delete from store and remove references from editor
    imageList.querySelectorAll('.image-remove').forEach(function(el) {
      el.addEventListener('click', function() {
        var name = el.getAttribute('data-name');
        ImageStore.remove(name);
        persistImages();
        refreshImageList();
        // Remove matching image: local:name lines from the editor
        removeImageReferences(name);
      });
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

$("#accent_color_selected").change(function(){
  var accent_color = $(this).val();
  $("#accent_color_sample").css("color", accent_color);
});

$("#highlight_background_color_selected").change(function(){
  var highlight_background_color = $(this).val();
  var text_background_checked = $("#text_background").is(':checked')
  if(text_background_checked){
    $("#highlight_background_color_sample").css("background-color", highlight_background_color).css("color", "#ffffff");
  }else{
    $("#highlight_background_color_sample").css("background-color", "transparent").css("color", highlight_background_color);
  }
});

$("#text_background").change(function(){
  var highlight_background_color = $("#highlight_background_color_selected").val();
  var text_background_checked = $(this).is(':checked')
  if(text_background_checked){
    $("#highlight_background_color_sample").css("background-color", highlight_background_color).css("color", "#ffffff");
  } else {
    $("#highlight_background_color_sample").css("background-color", "transparent").css("color", highlight_background_color);
  }
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
});

$("#wallpaper_selected").change(function(){
  var wallpaper_selected = $("#wallpaper_selected").val();
  if (wallpaper_selected == "none"){
    $('body').css("background-image", "");
  } else {
    var wallpaper_url = "url(" + BASE_PATH + "img/wallpaper/" + wallpaper_selected + ")";
    $('body').css("background-image", wallpaper_url);
  }
});

$("#font_family_selected").change(function(){
  var fontfamily_selected = $("#font_family_selected").val();
  if (fontfamily_selected == "sans"){
    $('#accent_color_sample').css("fontFamily", '"News Cycle", Impact, sans-serif');
    $('#highlight_background_color_sample').css("fontFamily", '"Lato", sans-serif');
  } else if(fontfamily_selected == "serif"){
    $('#accent_color_sample').css("fontFamily", '"Palatino Linotype", "Book Antiqua", Palatino, FreeSerif, serif');
    $('#highlight_background_color_sample').css("fontFamily", '"Palatino Linotype", "Book Antiqua", Palatino, FreeSerif, serif');
  } else if(fontfamily_selected == "fun"){
    $('#accent_color_sample').css("fontFamily", '"Comic Sans MS", "\u30D2\u30E9\u30AE\u30CE\u4E38\u30B4 Pro W4","\u30D2\u30E9\u30AE\u30CE\u4E38\u30B4 Pro","Hiragino Maru Gothic Pro", "HG\u4E38\uFF7A\uFF9E\uFF7C\uFF6F\uFF78M-PRO","HGMaruGothicMPRO", cursive, sans-serif');
    $('#highlight_background_color_sample').css("fontFamily", '"Comic Sans MS", "\u30D2\u30E9\u30AE\u30CE\u4E38\u30B4 Pro W4","\u30D2\u30E9\u30AE\u30CE\u4E38\u30B4 Pro","Hiragino Maru Gothic Pro","HG\u4E38\uFF7A\uFF9E\uFF7C\uFF6F\uFF78M-PRO","HGMaruGothicMPRO", cursive, sans-serif');
  }
});
