jQuery(function($){  

  //////////////////// Variables ///////////////
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

  $(document).on('mousemove', function(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
    cursor.css({
      left: mouseX - (cursorWidth / 2),
      top: mouseY - (cursorWidth / 2)
    })
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
  var $left_switches = $('.switches div#left_switches');
  var $right_switches = $('.switches div#right_switches');

  // tooltips
  tippy.setDefaultProps({
    allowHTML: true,
    theme: "light-border",
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

  var ua = navigator.userAgent.toLowerCase();
  var isMobile = false;
  var isiPhone = (ua.indexOf('iphone') > -1);
  var isiPad = (ua.indexOf('safari') > -1 && typeof document.ontouchstart !== 'undefined');
  var isAndroid = (ua.indexOf('android') > -1) && (ua.indexOf('mobile') > -1);
  var isAndroidTablet = (ua.indexOf('android') > -1) && (ua.indexOf('mobile') == -1);
  if(isiPhone || isiPad || isAndroid || isAndroidTablet){
    isMobile = true
  }

  //////////////////// Things need to be done when document is ready ///////////////
  $(document).ready(function() {
    sqrScale = getSqrt();
    if($reveal_video.length > 0){
      var vid = $reveal_video.attr('id');
      $('video#' + vid).on('loadeddata', function() {
        $(this).prev('img').remove();
        $(this).show();
        var indices = Reveal.getIndices();
        Reveal.slide(indices.h, indices.v, indices.f);
      });
    }

    $div_note.draggable({
      containment: "parent",
      drag: function(e, ui) {
        // 拡大倍率で割ることで位置を調整
        ui.position.left = ui.position.left / sqrScale;
        ui.position.top  = ui.position.top / sqrScale;
      }
    });

    $div_imagenote.draggable({
      containment: "parent",
      drag: function(e, ui) {
        // 拡大倍率で割ることで位置を調整
        ui.position.left = ui.position.left / sqrScale;
        ui.position.top  = ui.position.top / sqrScale;
      }
    })

    initializeReveal();
    createSticky();
    setFontSize();
    adjust_size();
    adjust_sticky();
    adjust_media();
    prepareYoutube();
    initializeSpeechSynthesis();
    get_punch_script();
  });

  /////////////// Initialize reveal.js ///////////////

  //////////////////// Functions ////////////////////
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
    // ESC
    13 : function() {
      if(Reveal.isOverview()){
        Reveal.toggleOverview();
        return false;
      }
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
    // ESC
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
      history: true,
      overview: true,
      navigationMode: "default",
      center: true,
      keyboard: true,
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
      hideAddressBar: true,
      previewLinks: false,
      theme: Reveal.getQueryHash().theme,
      transition: 'none',
      transitionSpeed: 'normal',
      viewDistance: 2,
      keyboard: keybindings,
      margin: 0.1
    });
  
    //////////////////// Configure reveal.js ///////////////
    Reveal.configure(pconf);
    if(isMobile){
      Reveal.configure({overview: false, touch: true});
      $overview_icon.hide();
    }

    //////////////////// Event Listeners ///////////////
    Reveal.addEventListener('slidechanged', function(event) {
      stopVideo();
      stopYoutube();
      stopSpeechSound();
      flip_page(event);
      resetConfig();
    });

    Reveal.addEventListener('ready', function(event) {
      $current_fragment = $('.current-fragment');
      $('.reveal').css("visibility", "visible");
      $('.fragment').css("visibility", "visible");

      $overview_icon.click(function () {
        Reveal.toggleOverview();
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
          $("#pointer_icon").removeClass("fa-mouse-pointer").addClass("fa-circle");
        } else {
          mouse_mode = "laser";
          $("#highlighted_cursor").show();
          $("body").css("cursor", "none");
          $("#pointer_icon").removeClass("fa-circle").addClass("fa-mouse-pointer");
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

    Reveal.addEventListener('fragmentshown', function(event) {
      $current_fragment = $('.current-fragment');
      stopVideo();
      stopYoutube();
      stopSpeechSound();
      move_to_fragment(false);
      scrollIfNecessary($current_fragment);
      if(Reveal.getProgress() === 1 && $current_fragment.attr('id') === "eos"){
        $("#coffee").show();
      }
    });

    Reveal.addEventListener('fragmenthidden', function(event) {
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

    Reveal.addEventListener('overviewshown', function(event) {
      showingNote = $div_note.is(":visible");
      showingImageNote = $div_imagenote.is(":visible");
      showingSticky = $div_sticky.is(":visible");
      $div_note.hide();
      $div_imagenote.hide();
      $div_sticky.hide();
      $left_switches.hide();

      $overview_icon.addClass("playing");
      Reveal.configure({keyboard: keybindings_overview});
    });

    Reveal.addEventListener('overviewhidden', function(event) {
      $left_switches.show();
      if(showingSticky){
        $div_sticky.show();
      }

      $overview_icon.removeClass("playing");
      Reveal.configure({keyboard: keybindings});
    });

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

    $('div.sticky i.fa-close').on('click', function(){
      hideSticky()
    });

    $('div.sticky div[contentEditable]').on('blur keyup paste cut mouseup', function(e) {
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
    google_url = google_url.replace(/\[q\]/g, query);
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
    var maxStickyLines = 12;
    var currentText = $sticky_editor.text();

    if (currentText.length > maxStickyChar){
      $sticky_editor.text(currentText.substring(0, maxStickyChar));
      alert("A sticky note can contain a maximum of " + maxStickyChar + " characters");
    }
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
      var img = $("<img src='" + note + "' />");
      $div_imagenote.data("enlarged", false);
      img.bind("load",function(){
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
      var textnote = "<span>" + note + "</span>";
      $div_note.hide().html(textnote).show()
      $div_imagenote.hide();
    } else {
      $div_note.hide();
      $div_imagenote.hide();
    }
  }

  ///// Things need to be done when a slide is shown
  function flip_page(event){
    $current_fragment = $('.current_fragment');
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

    // var fragments = $current_fragment.closest('section').find('.fragment')
    
    // if($current_fragment.hasClass('quiz')){

      // var idx = fragments.index($current_fragment);
      // if (idx == 0 && fragments.length == 1){
      //   var prev_fragment = $("<span class='fragment quiz'></span>");
      //   var next_fragment = $("<span class='fragment quiz'></span>");
      // } else if (idx == 0){
      //   var prev_fragment = $("<span class='fragment quiz'></span>");
      //   var next_fragment = $(fragments[1]);
      // } else if (idx == fragments.length - 1) {
      //   var prev_fragment = $(fragments[fragments.length - 2]);
      //   var next_fragment = $("<span class='fragment quiz'></span>");
      // } else {
      //   var prev_fragment = $(fragments[idx - 1]);
      //   var next_fragment = $(fragments[idx + 1]);
      // }

      // if(backward){
      //   $current_fragment.css('color', 'transparent');
      //   if(next_fragment.hasClass('quiz')){
      //     next_fragment.css('color', 'lightgray');
      //   }
      // } else {
      //   $current_fragment.css('color', 'transparent');
      //   if(prev_fragment.hasClass('quiz')){
      //     prev_fragment.css('color', '#303030');
      //   }
      // }  

    // } else {
    //   if(backward){
    //     $('span.fragment.quiz').css('color', 'lightgray');
    //   }
    // }
    
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
      if(tagname == "IFRAME"){
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
        playSpeechSound($current_fragment, defer);
      } else {
        if(typeof defer != "undefined"){
          defer.resolve()
        }
      }
    }
  }

  function speak_article(phrase_array, utterance, defer) { 
    $speaker_icon.addClass("playing");
    for (var i = 0; i < phrase_array.length; i++){
      var sentence = phrase_array[i].replace(/^\s+|\s+$/g, '');
      if (sentence) {
        var new_utterance = createNewUtterance()
        new_utterance.text = phrase_array[i];
        speechSynthesis.speak(new_utterance); 
      }
      if(i === phrase_array.length - 1){
        if(typeof defer != "undefined"){
          waitUntilFinished(new_utterance, "speech", 0, defer);
        } else {
          new_utterance.addEventListener('end', function(e){
            $speaker_icon.removeClass("playing");
          });
        }
      }
    }
  }

  ///// stop speech sound
  function stopSpeechSound(){
    if(speechSynthesis.speaking){
      speechSynthesis.cancel();
    }
    $speaker_icon.removeClass("playing");
  }

  ///// play speech sound
  function playSpeechSound(cfragment, defer) {
    if(!utterance){
      return false;
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
    var yt_src = cfragment.data("src");
    var yt_id = cfragment.data("ytid");
    var iframe_id = cfragment.attr("id");
    
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
        magicTimerId = setInterval(function(){
          if(!mediaStarted){
            defer.reject();
            clearInterval(magicIntervalId);
            clearTimeout(magicTimerId);
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
    Reveal.configure({ controls: true, keyboard: keybindings, overview: true});
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
    }, function(e){
      console.log(e);
      stopPlayAll();
      alert("Press the icon once again if you're ready for the automatic presentation")
    });
    return true;
  }
});
