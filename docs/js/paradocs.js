jQuery(function($){

  // Skip all initialization in preview mode (used by live preview iframe)
  if (window.location.search.indexOf('mode=preview') !== -1) return;

  //////////////////// Variables ///////////////
  var DEFAULT_WIDTH = 1280;
  var DEFAULT_HEIGHT = 800;
  var sqrScale;
  var originalNoteCo = {left: "20%", top: "70%"};
  var originalImageNoteCo = {left: "60%", top: "10%"};
  var originalStickyCo = {left: "10%", top: "10%"};

  var showingNote = false;
  var showingImageNote = false;
  var showingSticky = false;

  var speakerVisible = false;
  var videoPlaying = false;
  var ytplayers = {};
  var youtubePlaying = false;
  var playingAll = false;

  var voiceSpecified = false;
  var utterance = false;

  var magicIntervalId;
  var magicTimerId;

  // div elements 
  var $reveal_iframe = $(".reveal iframe");
  var $reveal_video = $(".reveal_video");
  var $reveal_img = $(".reveal img");

  // mouse cursor
  var cursor = $("#highlighted_cursor");
  var cursorWidth = 20;
  var mouseX = 0;
  var mouseY = 0;
  var mouse_mode = "regular" // or "laser"

  var rafPending = false;
  $(document).on('mousemove', function(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(function() {
        cursor.css({
          left: mouseX - (cursorWidth / 2),
          top: mouseY - (cursorWidth / 2)
        });
        rafPending = false;
      });
    }
  }).on('mouseleave', function(e) {
    if(mouse_mode === "laser"){
      $("#highlighted_cursor").hide();
    }
  }).on('mouseenter', function(e) {
    if(mouse_mode === "laser"){
      $("#highlighted_cursor").show();
    }
  });

  var $gadgets = $('.gadgets');
  var $current_fragment  = $('.current-fragment');
  var $div_sticky = $('.gadgets div.sticky');
  var $sticky_editor = $('textarea.sticky_editor');
  var $edit_control = $('.gadgets div.sticky div.edit_control');
  var $div_note = $('.gadgets div.note');
  var $div_imagenote = $('.gadgets div.imagenote');
  var $div_enlarge = $('.gadgets div.imagenote div.enlarge');
  var $overview_icon = $('.switches span#overview_icon');
  var $sticky_icon = $('.switches span#sticky_icon');
  var $pointer_icon = $('.switches span#pointer_icon');
  var $playall_icon = $('.switches span#playall_icon');
  var $speaker_icon = $('.switches span#speaker_icon');
  var $beep_icon = $('.switches span#beep_icon');
  var $left_switches = $('.switches div#left_switches');
  var $right_switches = $('.switches div#right_switches');

  // Beep sound
  var beepEnabled = false;
  var audioCtx = null;
  function playBeep() {
    if (!beepEnabled) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 1200;
    osc.type = 'sine';
    gain.gain.value = 0.08;
    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
  }

  // tooltips
  tippy.setDefaultProps({
    allowHTML: true,
    theme: "light-border",
  });

  // ARIA labels for accessibility
  $('#sticky_icon').attr('aria-label', 'Toggle Sticky Note (s)').attr('role', 'button').attr('tabindex', '0');
  $('#pointer_icon').attr('aria-label', 'Switch Pointer Shape/Color (p)').attr('role', 'button').attr('tabindex', '0');
  $('#playall_icon').attr('aria-label', 'Start/Stop Automatic Presentation (a)').attr('role', 'button').attr('tabindex', '0');
  $('#speaker_icon').attr('aria-label', 'Start/Stop Text-to-Speech (.)').attr('role', 'button').attr('tabindex', '0');
  $('#overview_icon').attr('aria-label', 'Toggle Overview (ESC)').attr('role', 'button').attr('tabindex', '0');
  $('#beep_icon').attr('aria-label', 'Toggle Beep Sound').attr('role', 'button').attr('tabindex', '0');

  tippy("#beep_icon", {
    content: "<span class='tooltip'><b>Toggle Beep Sound</b></span>"
  });
  tippy("#sticky_icon", {
    content: "<span class='tooltip'><b>Toggle Sticky Note</b><br />Shortcut: <span class='shortcut'>s</span></span></span>"
  });
  tippy("#pointer_icon", {
    content: "<span class='tooltip'><b>Switch Pointer Shape/Color</b><br />Shortcut: <span class='shortcut'>p</span></span>"
  });
  tippy("#playall_icon", {
    content: "<span class='tooltip'><b>Start/Stop Automatic Presentation</b><br />Shortcut: <span class='shortcut'>a</span></span>"
  });
  tippy("#speaker_icon", {
    content: "<span class='tooltip'><b>Start/Stop Text-to-Speech</b><br />Shortcut: <span class='shortcut'>.</span></span>"
  });
  tippy("#overview_icon", {
    content: "<span class='tooltip'><b>Toggle Overview</b><br />Shortcut: <span class='shortcut'>ESC</span></span>"
  });

  // Feature-based mobile/touch detection (replaces fragile UA sniffing)
  var isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  //////////////////// Things need to be done when document is ready ///////////////
  $(document).ready(function() {
    $div_note.draggable({
      containment: "parent",
      drag: function(e, ui) {
        ui.position.left = ui.position.left / sqrScale;
        ui.position.top  = ui.position.top / sqrScale;
      }
    });

    $div_imagenote.draggable({
      containment: "parent",
      drag: function(e, ui) {
        ui.position.left = ui.position.left / sqrScale;
        ui.position.top  = ui.position.top / sqrScale;
      }
    })

    initializeReveal();
    createSticky();
    setFontSize();
    adjust_sticky();
    prepareYoutube();
    initializeSpeechSynthesis();
    initializeMCQ();
    get_punch_script();
  });

  /////////////// Initialize reveal.js ///////////////

  //////////////////// Functions ////////////////////

  function initializeMCQ(){
    $(document).on('click', '.mcq-option', function() {
      var $option = $(this);
      var $quiz = $option.closest('.mcq-quiz');

      if ($option.hasClass('mcq-disabled')) return;

      if ($option.attr('data-correct') === 'true') {
        $quiz.attr('data-answered', 'true');
        $quiz.find('.mcq-option').addClass('mcq-disabled');
        $option.addClass('mcq-correct');
        var correctLabel = $quiz.attr('data-correct-label') || '\u2713 Correct!';
        $quiz.find('.mcq-feedback').text(correctLabel).addClass('mcq-correct-feedback').show();
        $quiz.find('.mcq-reset').show();
      } else {
        $option.addClass('mcq-incorrect mcq-disabled');
        var incorrectLabel = $quiz.attr('data-incorrect-label') || '\u2717 Incorrect';
        $quiz.find('.mcq-feedback').text(incorrectLabel).removeClass('mcq-correct-feedback').addClass('mcq-incorrect-feedback').show();
      }
    });

    $(document).on('click', '.mcq-reset', function(e) {
      e.stopPropagation();
      var $quiz = $(this).closest('.mcq-quiz');
      $quiz.removeAttr('data-answered');
      $quiz.find('.mcq-option')
        .removeClass('mcq-correct mcq-incorrect mcq-disabled');
      $quiz.find('.mcq-feedback')
        .text('').removeClass('mcq-correct-feedback mcq-incorrect-feedback').hide();
      $(this).hide();
    });
  }

  function get_punch_script(){
    var tag = document.createElement("script");
    tag.src = "https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  function enlarge_image(){
    if($div_imagenote.data("enlarged")){
      $div_imagenote.css("width", $div_imagenote.data("origwidth") + "px");
      $div_imagenote.css("height", $div_imagenote.data("origheight") + $div_imagenote.find(".enlarge").outerHeight() + "px");
      $div_imagenote.data("enlarged", false);
      $div_imagenote.find(".enlarge span").removeClass("fa-minus").addClass("fa-plus");
    }else{
      var gwidth = $gadgets.width();
      var doubleWidth = $div_imagenote.data("origwidth") * 2;
      var gheight = $gadgets.height();
      var doubleHeight = $div_imagenote.data("origheight") * 2 + $div_imagenote.find(".enlarge").outerHeight();
      var newHeight;
      var newWidth;
      newWidth= parseInt(doubleWidth);
      newHeight = parseInt(doubleHeight);
      $div_imagenote.css("height", newHeight + "px");
      $div_imagenote.css("width", newWidth + "px");
      $div_imagenote.data("enlarged", true);
      $div_imagenote.find(".enlarge span").removeClass("fa-plus").addClass("fa-minus");
    }
  }

  var keybindings = {
    // ENTER
    13 : function() {
      return true;
    },
    // G
    71: function() {
      showGoogleSearch();
      return false;
    },
    //A
    65: function() {
      $playall_icon.click();
    },
    // B
    66: function() {
      playMedia();
      return false;
    },      
    // period
    190: function(e) {
      playMedia();
      return false;
    },     
    // J
    74: function() {
      Reveal.next();
      return false;
    },
    // K
    75: function() {
      Reveal.prev();
      return false;
    },
    // N
    78: function() {
      return false;
    },
    // P
    80: function() {
      $pointer_icon.click();
      return false;
    },
    // S
    83: function() {
      $sticky_icon.click();
      return false;
    }
  }

  var keybindings_overview = {
    // ENTER
    13 : function() {
      if(Reveal.isOverview()){
        Reveal.toggleOverview();
        return false;
      }
      return true;
    },
    // J
    74: function() {
      Reveal.down();
      return false;
    },      
    // K
    75: function() {
      Reveal.up();
      return false;
    },
    // N
    78: function() {
      return false;
    },
    // P
    80: function() {
      $pointer_icon.click();
      return false;
    },
    // period
    190: function() {
      return false;
    },     
  }

  var keybindings_autoplaying = {
    // ENTER
    13 : function() {
      return false;
    },
    // SPACE
    32: function() {
      return false;
    },
    // ←
    37: function() {
      return false;
    },
    // ↑
    38: function() {
      return false;
    },
    // →
    39: function() {
      return false;
    },
    // ↓
    40: function() {
      return false;
    },
    //A
    65: function() {
      $playall_icon.click();
    },
    // H
    72: function() {
      return false;
    },
    // J
    74: function() {
      return false;
    },
    // K
    75: function() {
      return false;
    },
    // L
    76: function() {
      return false;
    },
    // N
    78: function() {
      return false;
    },
    // P
    80: function() {
      $pointer_icon.click();
      return false;
    },
    // S
    83: function() {
      $sticky_icon.click();
      return false;
    },
    // period
    190: function(e) {
      return false;
    }
  }
  
  function initializeReveal(){
    Reveal.initialize({
      postMessage: false,
      postMessageEvents: false,
      controls: true,
      controlsTutorial: true,
      progress: true,
      slideNumber: 'c/t',
      hash: true,
      fragmentInURL: true,
      overview: false,
      navigationMode: "default",
      center: true,
      hideInactiveCursor: true,
      hideCursorTime: 2000,
      help: false,
      touch: false,
      loop: false,
      rtl: false,
      fragments: true,
      embedded: false,
      autoSlide: 0,
      autoSlideStoppable: true,
      autoPlayMedia: false,
      mouseWheel: true,
      previewLinks: false,
      transition: 'none',
      transitionSpeed: 'normal',
      viewDistance: 3,
      keyboard: keybindings,
      margin: 0.1
    }).then(function() {
      //////////////////// Configure reveal.js ///////////////
      Reveal.configure(pconf);

      // These must run after Reveal is initialized
      sqrScale = getSqrt();
      adjust_size();
      adjust_media();

      if($reveal_video.length > 0){
        var vid = $reveal_video.attr('id');
        $('video#' + vid).on('loadeddata', function() {
          $(this).prev('img').remove();
          $(this).show();
          var indices = Reveal.getIndices();
          Reveal.slide(indices.h, indices.v, indices.f);
        });
      }
      if(isMobile){
        Reveal.configure({overview: false, touch: true});
        $overview_icon.hide();
      }

      $current_fragment = $('.current-fragment');
      $('.reveal').css("visibility", "visible");
      $('.fragment').css("visibility", "visible");
      document.body.classList.add('ready');

      $overview_icon.click(function () {
        this.blur();
        toggleCustomOverview();
      });

      $beep_icon.click(function () {
        beepEnabled = !beepEnabled;
        if (beepEnabled) {
          $beep_icon.addClass('playing');
          playBeep();
        } else {
          $beep_icon.removeClass('playing');
        }
        this.blur();
      });

      $sticky_icon.click(function () {
        if($div_sticky.is(":hidden")){
          showSticky();
        } else {
          hideSticky();
        }
      });

      $pointer_icon.click(function (e){
        if($("#highlighted_cursor").is(":visible")){
          mouse_mode = "regular";
          $("#highlighted_cursor").hide();
          $("body").css("cursor", "auto");
          $("#pointer_icon").removeClass("fa-arrow-pointer").addClass("fa-circle");
        } else {
          mouse_mode = "laser";
          $("#highlighted_cursor").show();
          $("body").css("cursor", "none");
          $("#pointer_icon").removeClass("fa-circle").addClass("fa-arrow-pointer");
        }
      });

      $playall_icon.on("click", function(e){
        if(playingAll){
          stopPlayAll();
        } else {
          $(this).addClass("playing");
          $speaker_icon.css("visibility", "hidden");
          speakerVisible = $speaker_icon.is(":visible")
          playingAll = true;
          playAll(true);
        }
      });
    });

    //////////////////// Event Listeners ///////////////
    Reveal.on('slidechanged', function(event) {
      stopVideo();
      stopYoutube();
      stopSpeechSound();
      flip_page(event);
      resetConfig();
    });

    Reveal.on('fragmentshown', function(event) {
      $current_fragment = $('.current-fragment');
      stopVideo();
      stopYoutube();
      stopSpeechSound();
      move_to_fragment(false);
      scrollIfNecessary($current_fragment);
      playBeep();
      if(Reveal.getProgress() === 1 && $current_fragment.attr('id') === "eos"){
        $("#coffee").show();
      }
    });

    Reveal.on('fragmenthidden', function(event) {
      $current_fragment = $('.current-fragment');
      stopVideo();
      stopYoutube();
      stopSpeechSound();
      move_to_fragment(true);
      if(!$current_fragment.is(':empty') && typeof($current_fragment[0]) != "undefined"){
        scrollIfNecessary($current_fragment);
      }
      if(Reveal.getProgress() === 1){
        $("#coffee").hide();
      }
    });

    // Custom overview (iframe-based, like filmstrip preview)
    var customOverviewOpen = false;
    var customOverlayEl = null;

    // Cache for resolved YouTube thumbnail URLs
    var ytThumbCache = {};

    // Pre-check if maxresdefault exists, cache result for reuse
    function resolveYtThumb(ytid) {
      if (ytThumbCache[ytid]) return ytThumbCache[ytid];
      var maxres = 'https://img.youtube.com/vi/' + ytid + '/maxresdefault.jpg';
      var fallback = 'https://img.youtube.com/vi/' + ytid + '/hqdefault.jpg';
      // Synchronously return maxres, but probe in background for next time
      var img = new Image();
      img.onload = function() { ytThumbCache[ytid] = maxres; };
      img.onerror = function() { ytThumbCache[ytid] = fallback; };
      img.src = maxres;
      return ytThumbCache[ytid] || maxres;
    }

    // Replace YouTube/audio/video iframes and elements with static placeholders for thumbnails
    function replaceMediaForThumb(html) {
      // YouTube iframes → thumbnail image with play icon
      html = html.replace(/<iframe[^>]*data-ytid=['"]([^'"]+)['"][^>]*>[^<]*<\/iframe>/gi, function(match, ytid) {
        var thumbUrl = resolveYtThumb(ytid);
        return '<div style="position:relative;width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden;">' +
          '<img src="' + thumbUrl + '" style="width:100%;height:100%;object-fit:cover;" />' +
          '<div style="position:absolute;width:60px;height:42px;background:rgba(205,32,31,0.9);border-radius:10px;display:flex;align-items:center;justify-content:center;">' +
          '<div style="width:0;height:0;border-style:solid;border-width:10px 0 10px 18px;border-color:transparent transparent transparent #fff;margin-left:3px;"></div>' +
          '</div></div>';
      });
      // Any remaining iframes (non-YouTube) → placeholder
      html = html.replace(/<iframe[^>]*>[^<]*<\/iframe>/gi,
        '<div style="width:100%;height:80px;background:#eee;display:flex;align-items:center;justify-content:center;color:#999;font-size:14px;">embedded content</div>');
      // Audio elements → simple icon placeholder
      html = html.replace(/<audio[^>]*>(?:[\s\S]*?<\/audio>)?/gi,
        '<div style="width:100%;height:40px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#999;font-size:14px;border-radius:4px;">&#9835; audio</div>');
      return html;
    }

    var OVERVIEW_BASE_CSS =
      '@import url("https://fonts.googleapis.com/css?family=News+Cycle:400,700|Lato:400,700&display=swap");' +
      '*{margin:0;padding:0;box-sizing:border-box;}' +
      'body{font-family:"Lato","Source Sans Pro",Helvetica,sans-serif;font-size:40px;color:#222;line-height:1.3;}' +
      'h1,h2,h3{font-family:"News Cycle",Impact,sans-serif;font-weight:bold;line-height:1.2;margin:0 0 0.3em 0;}' +
      'h1{font-size:1.5em;}h2{font-size:1.2em;}h3{font-size:1.0em;}' +
      'ul,ol{text-align:left;margin:0 0 0 1em;}' +
      'li{margin:0.2em 0;}' +
      'table{border-collapse:collapse;margin:0.5em auto;}' +
      'td,th{border:1px solid #ddd;padding:0.3em 0.6em;font-size:0.7em;}' +
      'th{background:#f5f5f5;font-weight:bold;}' +
      'pre,code{font-family:monospace;font-size:0.6em;background:#f5f5f5;padding:0.2em 0.4em;border-radius:3px;}' +
      'pre{padding:0.5em;overflow:hidden;}' +
      'blockquote{border-left:4px solid #ddd;padding-left:0.8em;margin:0.5em 0;font-size:0.9em;color:#555;}' +
      'img{max-width:100%;max-height:100%;object-fit:contain;}' +
      'mark{background:#ffe066;padding:0 0.1em;}' +
      'a{color:#4e79a7;text-decoration:none;}';

    function buildSlideSrcdoc(sectionInnerHtml, cleanCss, inverted, w, h) {
      sectionInnerHtml = replaceMediaForThumb(sectionInnerHtml);
      return '<!doctype html><html><head><meta charset="utf-8">' +
        '<style>' +
          OVERVIEW_BASE_CSS +
          'html,body{margin:0;padding:0;overflow:hidden;}' +
          '.reveal{width:' + w + 'px;height:' + h + 'px;overflow:hidden;}' +
          '.reveal .slides{width:100%;height:100%;}' +
          '.reveal .slides section{' +
            'visibility:visible!important;' +
            'display:flex!important;' +
            'flex-direction:column;' +
            'justify-content:center;' +
            'top:0!important;' +
            'width:100%;height:100%;' +
            'padding:40px;box-sizing:border-box;' +
          '}' +
          '.reveal .slides section .fragment{visibility:visible!important;opacity:1!important;}' +
          cleanCss +
        '</style>' +
        '</head><body>' +
        '<div class="reveal' + inverted + '">' +
          '<div class="slides"><section>' + sectionInnerHtml + '</section></div>' +
        '</div>' +
        '</body></html>';
    }

    function toggleCustomOverview() {
      if (customOverviewOpen) {
        closeCustomOverview();
      } else {
        openCustomOverview();
      }
    }

    function openCustomOverview() {
      customOverviewOpen = true;
      showingNote = $div_note.is(":visible");
      showingImageNote = $div_imagenote.is(":visible");
      showingSticky = $div_sticky.is(":visible");
      $div_note.hide();
      $div_imagenote.hide();
      $div_sticky.hide();
      $left_switches.hide();
      $overview_icon.addClass("playing");
      $('#overview_icon').removeClass('fa-grip').addClass('fa-compress');
      Reveal.configure({keyboard: false, mouseWheel: false});

      // Collect custom CSS (skip FOUC prevention style containing opacity:0)
      var cleanCss = '';
      document.querySelectorAll('style').forEach(function(s) {
        var text = s.textContent;
        if (text.indexOf('opacity') === -1 || text.indexOf('.reveal') !== -1) {
          cleanCss += text;
        }
      });
      var inverted = document.getElementById('reveal-container').classList.contains('inverted') ? ' inverted' : '';
      var w = pconf.width || DEFAULT_WIDTH;
      var h = pconf.height || DEFAULT_HEIGHT;

      // Build overlay
      customOverlayEl = document.createElement('div');
      customOverlayEl.id = 'custom-overview-overlay';
      var grid = document.createElement('div');
      grid.id = 'custom-overview-grid';

      var sections = document.querySelectorAll('.reveal .slides > section > section');
      var currentIndex = Reveal.getIndices().v || 0;

      sections.forEach(function(sec, i) {
        var thumb = document.createElement('div');
        thumb.className = 'custom-overview-thumb' + (i === currentIndex ? ' active' : '');

        var label = document.createElement('div');
        label.className = 'custom-overview-label';
        label.textContent = (i + 1);

        var iframeWrap = document.createElement('div');
        iframeWrap.className = 'custom-overview-iframe-wrap';

        var iframe = document.createElement('iframe');
        iframe.setAttribute('tabindex', '-1');
        iframe.style.pointerEvents = 'none';
        iframe.srcdoc = buildSlideSrcdoc(sec.innerHTML, cleanCss, inverted, w, h);

        iframeWrap.appendChild(iframe);
        thumb.appendChild(label);
        thumb.appendChild(iframeWrap);

        thumb.addEventListener('click', function() {
          Reveal.slide(0, i, 0);
          closeCustomOverview();
        });

        grid.appendChild(thumb);
      });

      customOverlayEl.appendChild(grid);
      document.body.appendChild(customOverlayEl);

      // Compute scale based on actual rendered thumb width
      var firstThumb = grid.querySelector('.custom-overview-thumb');
      if (firstThumb) {
        var thumbW = firstThumb.clientWidth;
        var scale = thumbW / w;
        var thumbH = Math.round(h * scale);
        var wraps = grid.querySelectorAll('.custom-overview-iframe-wrap');
        wraps.forEach(function(wrap) {
          wrap.style.height = thumbH + 'px';
          var ifr = wrap.querySelector('iframe');
          if (ifr) {
            ifr.style.width = w + 'px';
            ifr.style.height = h + 'px';
            ifr.style.transform = 'scale(' + scale + ')';
          }
        });
      }

      // Scroll to current slide
      setTimeout(function() {
        var activeThumb = grid.querySelector('.active');
        if (activeThumb) activeThumb.scrollIntoView({ block: 'center', behavior: 'auto' });
      }, 50);

      // Arrow/Enter keys for overview navigation (remove first to prevent duplicates)
      document.removeEventListener('keydown', overviewNavHandler);
      document.addEventListener('keydown', overviewNavHandler);
    }

    function closeCustomOverview() {
      customOverviewOpen = false;
      if (customOverlayEl) {
        customOverlayEl.remove();
        customOverlayEl = null;
      }
      $left_switches.show();
      if (showingSticky) $div_sticky.show();
      $overview_icon.removeClass("playing");
      $('#overview_icon').removeClass('fa-compress').addClass('fa-grip');
      Reveal.configure({keyboard: keybindings, mouseWheel: true});
      document.removeEventListener('keydown', overviewNavHandler);
    }

    // Global ESC handler — always active, toggles overview open/close
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Escape') return;
      // Don't intercept when typing in input/textarea
      var tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      toggleCustomOverview();
    }, true);

    function overviewNavHandler(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopImmediatePropagation();
        var grid = document.getElementById('custom-overview-grid');
        if (grid) {
          var active = grid.querySelector('.custom-overview-thumb.active');
          if (active) {
            var idx = parseInt(active.querySelector('.custom-overview-label').textContent, 10) - 1;
            Reveal.slide(0, idx, 0);
          }
        }
        closeCustomOverview();
        return;
      }
      var grid = document.getElementById('custom-overview-grid');
      if (!grid) return;
      var thumbs = grid.querySelectorAll('.custom-overview-thumb');
      if (!thumbs.length) return;
      var cols = Math.round(grid.clientWidth / thumbs[0].offsetWidth);
      var activeIdx = 0;
      thumbs.forEach(function(t, i) { if (t.classList.contains('active')) activeIdx = i; });
      var newIdx = activeIdx;
      if (e.key === 'ArrowRight') newIdx = Math.min(activeIdx + 1, thumbs.length - 1);
      else if (e.key === 'ArrowLeft') newIdx = Math.max(activeIdx - 1, 0);
      else if (e.key === 'ArrowDown') newIdx = Math.min(activeIdx + cols, thumbs.length - 1);
      else if (e.key === 'ArrowUp') newIdx = Math.max(activeIdx - cols, 0);
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
      thumbs[activeIdx].classList.remove('active');
      thumbs[newIdx].classList.add('active');
      thumbs[newIdx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    $(window).resize(function() {
      sqrScale = getSqrt();
      adjust_size();
      if($reveal_video.is(':visible') || $reveal_iframe.is(':visible') || $reveal_img.is(':visible')){
        adjust_media();
      }
      if(screen.height === window.innerHeight){
        $("#left_switches").css({"width": "75%", "text-align": "left"});
        $(".left_switch").css({"display": "inline-block", "text-align": "center"});
      } else {
        $("#left_switches").css({"width": "40px", "text-align": "center"});
        $(".left_switch").css({"display": "block","text-align": "center"});
      }
    });
  }
  
  // Create speech synthesis prototype
  function initializeSpeechSynthesis(){
    // Check for Cloud TTS provider
    if (typeof CloudTTS !== 'undefined' && pconf.tts_provider && pconf.tts_provider !== 'browser') {
      CloudTTS.setProvider(pconf.tts_provider);
      CloudTTS.setApiKey(pconf.tts_api_key || '');
      CloudTTS.setVoice(pconf.tts_cloud_voice || '');
      CloudTTS.setSpeed(pconf.tts_cloud_rate || '1.0');
      utterance = true; // truthy to show speaker icon
      voiceSpecified = true;
      return;
    }

    try{
      utterance = new SpeechSynthesisUtterance();
    } catch(e) {
      utterance = false;
    }

    if(utterance){
      setupSpeechSynthesis();
      window.speechSynthesis.onvoiceschanged = function() {
        setupSpeechSynthesis();
      }
    } else {
      $playall_icon.hide();
    }

    voiceSpecified = false;
  }

 
  function getSqrt(){
    var realRatio = Reveal.getScale() ;
    // return Math.sqrt(Math.sqrt(Math.sqrt(Math.sqrt(Math.sqrt(Math.sqrt(Math.sqrt(realRatio)))))));
    var ratioValue = Math.sqrt(Math.sqrt(realRatio));
    if(ratioValue > 1){
      return 1;
    } else {
      return ratioValue;
    }
  }

  function setFontSize(){
    var fontSize = parseInt($('.reveal').css("fontSize"));
    $sticky_editor.css("fontSize", parseInt(fontSize * 0.7) + "px");
    $edit_control.css("fontSize", parseInt(fontSize * 0.6) + "px");
    $div_note.css("fontSize", parseInt(fontSize * 0.7) + "px");
    $div_imagenote.css("fontSize", parseInt(fontSize * 0.7) + "px");
  }

  function scrollIfNecessary(elem){
    var isOutOfViewport = function (elem) {
      var out = {};
      var bounding = elem.getBoundingClientRect();
      out.top = bounding.top < 0;
      out.bottom = bounding.bottom * 1.05 > window.innerHeight || bounding.bottom * 1.05 > document.documentElement.clientHeight;
      out.any = out.top || out.bottom 
      return out;
    };

    var resultCheckVP = isOutOfViewport(elem[0]);
    if(resultCheckVP.any){
      Reveal.configure({
        slideNumber: false,
        progress: false,
        controls: false,
      });
      try {
        elem[0].scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      } catch(e) {
      }
    }
  }

  function resetConfig(){
    Reveal.configure({
      slideNumber: 'c/t',
      progress: true,
      controls: true
    });
  }

  function createSticky(){

    var maxWidth = $(document).width() * 0.7 / sqrScale;
    var maxHeight = $(document).height() * 0.7 / sqrScale;

    $div_sticky.resizable({
      handles : 'se', 
      containment: "parent",
      maxHeight: maxHeight,
      maxWidth: maxWidth ,
      
      resize: function(event, ui) {

        var changeWidth = ui.size.width - ui.originalSize.width; // find change in width
        var newWidth = ui.originalSize.width + changeWidth / sqrScale; // adjust new width by our zoomScale

        var changeHeight = ui.size.height - ui.originalSize.height; // find change in height
        var newHeight = ui.originalSize.height + changeHeight / sqrScale; // adjust new height by our zoomScale

        ui.size.width = newWidth;
        ui.size.height = newHeight;
        $sticky_editor.css("height", (newHeight - 40) + "px");
      }

      
    }).draggable({
      containment: "parent",
      drag: function(e, ui) {
        // 拡大倍率で割ることで位置を調整
        ui.position.left = ui.position.left / sqrScale;
        ui.position.top  = ui.position.top / sqrScale;
      }
    });

    $('div.sticky i.fa-pencil').on('click', function(){
      $sticky_editor.focus();
      $sticky_icon.addClass('editing');
    });

    $('div.sticky i.fa-eraser').on('click', function(){
      $sticky_editor.val("").focus();
      $sticky_icon.addClass('editing');
      adjust_sticky();
    });

    $('div.sticky i.fa-xmark').on('click', function(){
      hideSticky()
    });

    $sticky_editor.on('input keyup paste cut', function(e) {
      adjust_sticky();
    });

    $div_sticky.on('resize', function (e) {
      e.stopPropagation();
      adjust_sticky();
    });
  }

  
  ///// Create a speech synthesis prototype
  function setupSpeechSynthesis(){
    var voices = window.speechSynthesis.getVoices();
    var speech_voice = pconf.speech_voice;
    for (var i in voices) {
      if(voices[i].name == speech_voice){        
        utterance.voice = voices[i];
        voiceSpecified = true;
      }
    }
    utterance.rate = pconf.speech_rate;
    if(!voiceSpecified){
      utterance.url = 'native';
    }
  }

  ///// Return legnth of a string by byte
  function lengthInUtf8Bytes(str) {
    // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
    var m = encodeURIComponent(str).match(/%[89ABab]/g);
    return str.length + (m ? m.length : 0);
  }
  
  ///// Trim text to 260 bytes
  function trimText(text){
    while(lengthInUtf8Bytes(text) >= 260){
      text = text.substr(0, text.length - 1);
    }
    return text;
  }

  ///// Split text with segmentation characters
  function splitText(text){
    // https://stackoverflow.com/questions/10992921/how-to-remove-emoji-code-using-javascript
    text = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
    text = text.replace(/\s\s*/g, ' ');
    var segments = text.split(/(?:\、|\。|\: |\; |\? |\! )/)
    return segments;
  }
  
  ///// (Not) split text when doing automatic presentation
  function splitTextForAutomatic(text){
    // https://stackoverflow.com/questions/10992921/how-to-remove-emoji-code-using-javascript
    text = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
    text = text.replace(/\s\s*/g, ' ');
    text  = text.replace(/(?:\、|\。|\: |\; |\? |\! )/g, '. ');
    var segments = [text];
    return segments;
  }

  ///// Get a text segment currently selected
  function getSelectionText() {
    var text = "";
    if (window.getSelection) {
      text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
      text = document.selection.createRange().text();
    }
    return text;
  }

  ///// show google search results
  function showGoogleSearch(){
    var phrase = getSelectionText();
    var query = phrase.split(" ").join("+");
    var google_url = Reveal.getConfig().google;
    if (!google_url || !/^https?:\/\//i.test(google_url)) return;
    google_url = google_url.replace(/\[q\]/g, encodeURIComponent(query));
    window.open(google_url);
  }

  ///// Show speaker icon
  function showSpeaker(){
      if(!utterance){
        return false;
      }

    $speaker_icon.on("click",function () {
      playSpeechSound($current_fragment);
    }).show();
  }
  
  ///// Hide speaker icon
  function hideSpeaker(){
    $speaker_icon.off('click').hide();
  }
  
  function adjust_sticky(sticky_editor){
    var maxStickyChar = 500;
    var currentText = $sticky_editor.val();

    if (currentText.length > maxStickyChar){
      $sticky_editor.val(currentText.substring(0, maxStickyChar));
      currentText = $sticky_editor.val();
    }

    // Update character counter
    var remaining = maxStickyChar - currentText.length;
    var $counter = $div_sticky.find('.sticky_counter');
    if ($counter.length === 0) {
      $counter = $('<span class="sticky_counter"></span>');
      $edit_control.append($counter);
    }
    $counter.text(remaining);
    $counter.css('color', remaining < 50 ? '#e15759' : '#999');
  }

  function adjust_media(){
    var max_height = $('div.slides').height();
    var max_width = $('div.slides').width();

    $reveal_iframe.height(parseInt(max_height * 0.95 - 45));
    $reveal_iframe.parent().css("top",0);

    $reveal_video.height(parseInt(max_height * 0.95 - 45));
    $reveal_video.parent().css("top",0);
    
    $reveal_img.height(parseInt(max_height * 0.95 - 45));
    $reveal_img.parent().css("top",0);
  }

  function adjust_size(){

    $gadgets.css({transform: "scale(" + sqrScale + ")", transformOrigin: "top left"})

    $div_sticky.css({transform: "scale(" + sqrScale + ")", transformOrigin: "top left"})
    $div_imagenote.css({transform: "scale(" + sqrScale + ")", transformOrigin: "top left"})
    $div_note.css({transform: "scale(" + sqrScale + ")", transformOrigin: "top left"})

    $div_note.css({top: originalNoteCo.top, left: originalNoteCo.left});
    $div_imagenote.css({top: originalImageNoteCo.top, left: originalImageNoteCo.left});
    $div_sticky.css({top: originalStickyCo.top, left: originalStickyCo.left});
  }

  function showNote(){
    if(Reveal.isOverview()){return false}; 
    var note = $current_fragment.attr('data-note');
    var notetype = $current_fragment.attr('data-notetype');

    if(notetype === "img" || notetype === "image"){
      var imgElem = document.createElement("img");
      if(/^https?:\/\//i.test(note)) { imgElem.src = note; }
      var img = $(imgElem);
      $div_imagenote.data("enlarged", false);
      img.on("load",function(){
        var iWidth = $(this).width();
        var iHeight = $(this).height();
        var iRate = iWidth/iHeight;
        var faspan = $(this).parent().find(".enlarge");
        if(iRate < 1.0){
          var iw = parseInt(200 / iHeight * iWidth)
          $div_imagenote.css("height", 200 + faspan.outerHeight() + "px");
          $div_imagenote.css("width", iw + "px");
          $div_imagenote.data("origheight", 200);
          $div_imagenote.data("origwidth", iw);
        } else {
          var ih = parseInt(200 / iWidth * iHeight);
          $div_imagenote.css("width", "200px");
          $div_imagenote.css("height", ih + faspan.outerHeight() + "px");
          $div_imagenote.data("origwidth", 200);
          $div_imagenote.data("origheight", ih);
        }
      });
      $(".gadgets div.imagenote div.enlarge span").removeClass("fa-minus").addClass("fa-plus");
      $div_imagenote.find("img").remove();
      $div_imagenote.append(img)
      $div_imagenote.hide().show();
      $div_note.hide()
      $div_enlarge.off("click").on("click", function(e){
        enlarge_image();
      });
    } else if(notetype === "note") {
      var noteSpan = document.createElement("span");
      noteSpan.textContent = note;
      $div_note.hide().empty().append(noteSpan).show()
      $div_imagenote.hide();
    } else {
      $div_note.hide();
      $div_imagenote.hide();
    }
  }

  ///// Things need to be done when a slide is shown
  function flip_page(event){
    $current_fragment = $('.current-fragment');
    hideSpeaker();
    $div_imagenote.stop().hide();
    $div_note.stop().hide();

    var prev_slide = $(event.previousSlide);
    var mode = (prev_slide.attr('class'));
    var current_slide = $(event.currentSlide);
    var fragments = current_slide.find('.fragment');
    var num_fragments = fragments.length;

    if(mode === "future"){   
      $current_fragment = $(fragments[num_fragments - 1]);
      if($current_fragment.hasClass('quiz')){
        $current_fragment.css('color', '#333');
      }
      if($current_fragment.text().length > 0 && $current_fragment[0].tagName == "SPAN"){
        showSpeaker();
        showNote();
      }
    } else {
      prev_slide.find('.fragment.quiz').css('color', '#303030'); 
    }
    adjust_media();
  }
  
  ///// Things need to be done when a fragment is shown  
  function move_to_fragment(backward){
    hideSpeaker();

    if($current_fragment.text().length > 0 && $current_fragment[0].tagName == "SPAN"){
      showSpeaker();
    }
    showNote();
  }
  
  ///// create new speech synthesis object from prototype
  function createNewUtterance(){
    var u_new = new SpeechSynthesisUtterance();
    u_new.rate = utterance.rate;
    u_new.lang = utterance.lang;
    u_new.voice = utterance.voice;
    u_new.volume = 100;
    u_new.url = utterance.url;
    return u_new
  }

  function showSticky(){
    $div_sticky.show()
    $sticky_editor.focus();
    $sticky_icon.addClass('editing');
  }

  function hideSticky(){
    $div_sticky.hide();
    $sticky_icon.removeClass('editing');
  }

  ///// play whatever currently shown
  function playMedia(defer){
    if(typeof $current_fragment[0] === "undefined"){
      if(typeof defer != "undefined"){
        defer.resolve();
      }
    } else {
      var tagname = $current_fragment[0].tagName;
      // Check for link-only fragments first (e.g. downloaded HTML YouTube links)
      var $fragmentLink = $current_fragment.find('a[href]');
      if (!$fragmentLink.length && $current_fragment.is('a[href]')) $fragmentLink = $current_fragment;
      if ($fragmentLink.length > 0 && $fragmentLink.attr('href') && $fragmentLink.attr('href') !== '#' &&
          ($current_fragment.hasClass('youtube-link') || $fragmentLink.attr('href').indexOf('youtube.com') !== -1 || $fragmentLink.attr('href').indexOf('youtu.be') !== -1)) {
        window.open($fragmentLink.attr('href'), '_blank');
        if (typeof defer !== "undefined") { defer.resolve(); }
      } else if(tagname == "IFRAME"){
        playYoutube($current_fragment, defer);
      } else if(tagname == "VIDEO" || tagname == "AUDIO"){
        playVideo($current_fragment, defer);
      } else if(tagname == "SPAN" && $current_fragment.data("notetype") === "image"){
        // if(defer){
          playSpeechSound($current_fragment, defer);
        // } else {
        //   enlarge_image();
        // }
      } else if(tagname == "IMG"){
        if(typeof defer != "undefined"){
          defer.resolve()
        }
      } else if (tagname == "SPAN" && $current_fragment.text().length > 0){
        // If the fragment contains a link, open it instead of TTS
        var $link = $current_fragment.find('a[href]');
        if ($link.length > 0 && $link.attr('href') && $link.attr('href') !== '#') {
          window.open($link.attr('href'), '_blank');
          if (typeof defer !== "undefined") { defer.resolve(); }
        } else {
          playSpeechSound($current_fragment, defer);
        }
      } else {
        if(typeof defer != "undefined"){
          defer.resolve()
        }
      }
    }
  }

  function speak_article(phrase_array, utterance, defer) {
    // Cancel any pending utterances to prevent memory buildup
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
    }
    $speaker_icon.addClass("playing");

    // TTS word highlight: track cumulative offset across segments
    var cumulativeOffset = 0;
    var fragmentElem = $current_fragment[0];
    var ttsAvailable = (typeof TTSHighlight !== 'undefined') && fragmentElem;

    for (var i = 0; i < phrase_array.length; i++){
      var sentence = phrase_array[i].replace(/^\s+|\s+$/g, '');
      if (sentence) {
        var new_utterance = createNewUtterance()
        new_utterance.text = phrase_array[i];

        // Attach word highlight via onboundary
        if (ttsAvailable) {
          (function(segOffset) {
            new_utterance.onboundary = function(event) {
              if (event.name === 'word') {
                var charLen = event.charLength || 0;
                TTSHighlight.highlightWord(fragmentElem, segOffset + event.charIndex, charLen);
              }
            };
          })(cumulativeOffset);
        }

        speechSynthesis.speak(new_utterance);
        cumulativeOffset += phrase_array[i].length;
      }
      if(i === phrase_array.length - 1){
        if(typeof defer != "undefined"){
          waitUntilFinished(new_utterance, "speech", 0, defer);
        } else {
          new_utterance.addEventListener('end', function(e){
            $speaker_icon.removeClass("playing");
            if (ttsAvailable) { TTSHighlight.clearHighlight(fragmentElem); }
          });
        }
      }
    }
  }

  ///// stop speech sound
  function stopSpeechSound(){
    // Cloud TTS path
    if (typeof CloudTTS !== 'undefined' && CloudTTS.isCloudProvider()) {
      CloudTTS.stop();
      $speaker_icon.removeClass("playing");
      return;
    }

    if(speechSynthesis.speaking){
      speechSynthesis.cancel();
    }
    $speaker_icon.removeClass("playing");
    // Clear TTS word highlight
    if (typeof TTSHighlight !== 'undefined' && $current_fragment[0]) {
      TTSHighlight.clearHighlight($current_fragment[0]);
    }
  }

  ///// play speech sound
  function playSpeechSound(cfragment, defer) {
    if(!utterance){
      return false;
    }

    // Cloud TTS path
    if (typeof CloudTTS !== 'undefined' && CloudTTS.isCloudProvider()) {
      if (CloudTTS.isPlaying()) {
        CloudTTS.stop();
        $speaker_icon.removeClass("playing");
        return false;
      }

      if (cfragment == undefined) return false;
      var text = cfragment.text();
      if (!text || !text.trim()) return false;

      var segments;
      if (typeof(defer) != "undefined") {
        segments = splitTextForAutomatic(text);
      } else {
        segments = splitText(text);
      }

      $speaker_icon.addClass("playing");
      CloudTTS.speakSequence(segments, function() {
        $speaker_icon.removeClass("playing");
        if (typeof defer !== "undefined") {
          defer.resolve();
        }
      }, function(err) {
        console.error('Cloud TTS error:', err.message);
        $speaker_icon.removeClass("playing");
        if (typeof defer !== "undefined") {
          defer.reject();
        }
      });
      return true;
    }

    if(speechSynthesis.speaking){
      $speaker_icon.removeClass("playing");
      speechSynthesis.cancel();
      return false;
    }

    if(cfragment == undefined){
      return false;
    }

    var text = cfragment.text();

    if(typeof(defer) != "undefined"){
      var segments = splitTextForAutomatic(text);
    } else {
      var segments = splitText(text);
    }

    var u_new = createNewUtterance();

    if(text != "" && segments.length > 0){
      speak_article(segments, u_new, defer);
      return true
    } else {
      return false;
    }
  }


  function prepareYoutube(){

    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    tag.onerror = function() {
      console.warn('YouTube IFrame API failed to load. YouTube playback will not be available.');
    };
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    function onPlayerReady(e){
      e.target.stopVideo();
    }
    var done = false;
    window.onYouTubePlayerAPIReady = function() {
      $reveal_iframe.each(function(i){
        var jelem = $(this);
        var yt_src = jelem.attr("src");
        var yt_id = jelem.data("ytid");
        var iframe_id = jelem.attr("id");
        ytplayers[iframe_id] = new YT.Player(iframe_id, {
          videoId: yt_id,
          playerVars: {
            height: "100%",
            width: "100%",
            rel: 0,
            wmode: "opaque",
            // origin: location.protocol + '//' + location.hostname + "/",
            disablekb: 1,
            events: {
              onReady: onPlayerReady,
            }
          }
        });
      });
    };
  }

  ///// Play Youtube video  
  function playYoutube(cfragment, defer){
    var iframe_id = cfragment.attr("id");

    if (!ytplayers[iframe_id]) {
      console.warn('YouTube player not available for', iframe_id);
      if (typeof defer !== "undefined") { defer.resolve(); }
      return;
    }

    try {
      if(youtubePlaying){
        ytplayers[iframe_id].pauseVideo();
        youtubePlaying = false;
      } else {
        ytplayers[iframe_id].playVideo();
        youtubePlaying = true;
        if(typeof(defer) != "undefined"){
          waitUntilFinished(ytplayers[iframe_id], "youtube", 0, defer);
        }
      }
    } catch(e) {
      console.warn('YouTube playback error:', e);
      if (typeof defer !== "undefined") { defer.resolve(); }
    }
  }

  function stopYoutube(){
    try {
      Object.keys(ytplayers).forEach(function (key) {
        ytplayers[key].pauseVideo();
        youtubePlaying = false;
      });
    } catch(e){
    }
  }
  
  ///// Play video
  function playVideo(cfragment, defer){
    if (!videoPlaying) {
      videoPlaying = cfragment[0];
    }
    if (videoPlaying.paused){
      videoPlaying.play();
      if(typeof(defer) != "undefined"){
        waitUntilFinished(videoPlaying, "video", 0, defer);
      }
    }else{
      videoPlaying.pause();
    }
  };  

  ///// Stop video
  function stopVideo(){
    if(videoPlaying){
      videoPlaying.pause();
      videoPlaying = false;
    }
    videoPlaying = false;
  }

  function  addMultipleEventListener(target, eventNames, listener) {
    var events = eventNames.split(" ");
    events.forEach(function(event){target.addEventListener(event, listener, false)});
  };

  function waitUntilFinished(target, media, maxtime, defer){
    if(media == "speech" || media == "video" || media == "audio" || media == "youtube") {

      var mediaStarted = false;
      var mediaDone = false;
      addMultipleEventListener(target, 'start started end ended pause paused error', function(e){
        if(e.type === "start" || e.type === "started"){
          mediaStarted = true;
        } else if(e.type === "error"){
          defer.resolve();
          clearInterval(magicIntervalId);
          clearTimeout(magicTimerId);
        } else if(e.type === "end" || e.type === "ended" || e.type === "pause" || e.type === "paused"){
          mediaDone = true;
        }
      });

      if(media == "youtube"){
        target.addEventListener("onStateChange", function(state){
          if(state.data === 0){
            mediaDone = true;
          }
        });
      }

      magicIntervalId= setInterval(function(){
        if(mediaDone){
          defer.resolve();
          clearInterval(magicIntervalId);
          clearTimeout(magicTimerId);
        }
      }, 500);

      if(media === "speech"){
        magicTimerId = setTimeout(function(){
          if(!mediaStarted){
            defer.reject();
            clearInterval(magicIntervalId);
          }
        }, 2000);
      }

    } else if (maxtime == 0){
      defer.resolve();
    } else {
      var timerId2 = setInterval(function(){
        if(media === "video" || media === "audio"){
          target.pause();
          videoPlaying = false;
        } else if(media === "youtube"){
          target.pauseVideo();
          youtubePlaying = false;
        } else if(media === "speech"){
          target.cancel();
        }
        defer.resolve();
      }, maxtime)
    }
  }

  function stopPlayAll(){
    $(".quiz").toggleClass('playingall');
    $playall_icon.removeClass("playing");
    $speaker_icon.removeClass("playing").css("visibility", "visible");
    $speaker_icon.show();
    $overview_icon.show();
    Reveal.configure({ controls: true, keyboard: keybindings, overview: false});
    playingAll = false;
    stopVideo();
    stopSpeechSound();
    stopYoutube();
    clearInterval(magicIntervalId);
    clearTimeout(magicTimerId);
  }

  function playAll(firsttime){
    if(!playingAll){
      return false;
    }
    if(firsttime){
      $(".quiz").toggleClass('playingall');
      Reveal.configure({controls: false, keyboard: keybindings_autoplaying, overview: false});
      $overview_icon.hide();
      $speaker_icon.hide();
      Reveal.prev()
    }
    var nextf = Reveal.nextFragment();
    if(nextf){
      playNextFragment()
    } else {
      var nextl = Reveal.getProgress();
      if(nextl < 1){
        Reveal.next();
        setTimeout(function(){
          playAll(false);
        }, 1500);
      } else {
        stopPlayAll();
        return true;
      }
    }
  }

  function playNextFragment(){
    var defer = new $.Deferred()
    playMedia(defer);
    defer.promise().then(function(){
      playAll(false);
    }, function(){
      stopPlayAll();
    });
    return true;
  }
});
