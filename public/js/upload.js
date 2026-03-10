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
          regex: /\{(?:note|image|img)\:.*?\}/,
          token: "variable",
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
// editor.renderer.setOption('showLineNumbers', false);
editor.setAutoScrollEditorIntoView(true);

try{
  // Google Chromeは利用可能音声情報を取得するのに時間がかかる
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

  function moveItem(from, to) {
    var f = data.splice(from, 1)[0];
    data.splice(to, 0, f);
  }

  var default_lang_index = vlangs.indexOf(default_lang);
  // fにはdefault_langの値が入る
  var f = vlangs.splice(default_lang_index, 1)[0];
  // default_languをspliceで削除して、0の一にfを挿入
  vlangs.splice(0, 0, f);

  if($('#lang_selected option').length == 0){
    //////////////////// Setup Language and Contry List ///////////////
    $.subdir = $('#top').attr('subdir');
    $.lctags = {};
    $.ajax({
      dataType: "json",
      url: $.subdir + 'lctags',
      success: function(data){
        for (i in vlangs){
          var key = vlangs[i];
          var lctag = key.toUpperCase().split('-');
          var ctstr= "";
          if(data && lctag.length > 0){
            var language = data["languages"][lctag[0]]; 
            var country  = data["countries"][lctag[1]];
            if(language){
              ctstr += language;
              if(country){
                ctstr += (' (' +  country + ')');
              } else {
                ctstr += ' [' + key + ']';
              }
            } else {
              ctstr = key;
            }
          } else {
            ctstr = key;
          }
          $('#lang_selected').append('<option value="' + key +'">' + ctstr + '</option>');
        }
      },
      error: function(){
        for (i in vlangs){
          var key = vlangs[i];
          $('#lang_selected').append('<option value="' + key +'">' + ctstr + '</option>');
        }
      },
      complete: function(){
        if (vlangs.length > 0){
          var default_lang = vlangs[0]
          $('#lang_selected').val(default_lang);
          setupVoices(refresh);
          setupRates(refresh);
          return true;
        } else {
          return false;
        }
      }
    });
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
  var voice_selected = $('#voice_selected option:selected').val();
  var lang_selected = $('#lang_selected option:selected').val();
  var voice = lang_selections[lang_selected][voice_selected];
  // if(voice.localService){
  //   enableRates();
  //   $('#rate_disabled_message').hide();
  // } else {
  //   disableRates();
  //   $('#rate_disabled_message').show();
  // }
}

function disableRates(){
  $('#rate_selected').val('1.0')
  $('#rate_selected').attr("disabled", "disabled");
}

function enableRates(){
  $('#rate_selected').removeAttr("disabled");
}


$("input:file").change(function(){
  $("div.alert").hide();
  var fileName = $(this).val();
  fileName = fileName.replace(/\\/g, '/').replace(/.*\//, '');    
  $("#upload_file_name").val(fileName);
  var message = ""
  editor.setValue(message);
  $("#input-textarea").attr("disabled", "disabled");
  $('#textarea_message').text("Textarea is not available when an input file is selected.");
  $('#textarea_message').show();
});

$("#lang_selected").change(function(){
  setupVoices(true);
  setupRates(true);
});

$("#voice_selected").change(function(){
  setupRates(true);
});

$('#submit_button').on('click', function(){
  var form = $('form');
  var text = editor.getValue();
  var text_input = $("<input>")
    .attr("type", "hidden")
    .attr("name", "text").val(text)
  form.append($(text_input));

  var lang = $('#lang_selected').val();
  var lang_input = $("<input>")
    .attr("type", "hidden")
    .attr("name", "speech_lang").val(lang)
  form.append($(lang_input));

  var voice = $('#voice_selected').val();
  var voice_input = $("<input>")
    .attr("type", "hidden")
    .attr("name", "speech_voice").val(voice)
  form.append($(voice_input));

  form.submit();

});


$("#reset_button").on('click', function(){
  var message = ""
  editor.setValue(message);
  $("#input-textarea").removeAttr("disabled");
  $("#upload_file_name").val("");
  $("#upload_file").val("");
  $('#textarea_message').hide();
});

// $(document).change(function(){
//   var voice_selected = $('#voice_selected option:selected').text();
//   var lang_selected = $('#lang_selected option:selected').text();
//   var voice = lang_selections[lang_selected][voice_selected];
//   console.log(voice);
//   console.log(lang_selections);
// });

function showError(message){
  $("div.alert").html(message).show("fast");
  setTimeout(function() {
    $("div.alert").hide();
  }, 10000);
  return true;
}

$("form").submit(function(){
  // ブラウザがIEでないかチェック
  // if(userAgent.indexOf('msie') != -1) {
  //   showError("Internet Explorer is not supported. Use another web browser.");
  //   return false;
  // }

  if($("#upload_file_name").val()){
    // ファイルが200KB以内かチェック
    var file = $("#upload_file").prop('files')[0];
    if(file){ 
      if($.isNumeric(file.size) && file.size < 200000){
        return true
      } else {
        // alert(file.size);
        showError("File size must be less than 200KB.");
        return false;
      }
    } else {
      return true;
    }
  }

  var text_contents = editor.getValue();
  if(text_contents){
    // テキストが50,000字未満かチェック
    // alert(text_contents.length);
    if(text_contents.length < 50000){
      return true;
    } else {
      showError("Input text must be less than 500,000 characters.");
      return false
    }
  } else {
    showError("Error: Input text is empty!");
    return false;
  }
});

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
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
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

// Bootstrap 5 carousel initialization via data attributes (data-bs-ride="carousel")
// Interval can be set via data-bs-interval on the carousel element

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
  if (resolution_selected == "none"){
    $('body').css("background-image", "");
  } else {
    var wallpaper_url = "url(/paradocs/img/wallpaper/" + wallpaper_selected + ")";
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
    $('#accent_color_sample').css("fontFamily", '"Comic Sans MS", "ヒラギノ丸ゴ Pro W4","ヒラギノ丸ゴ Pro","Hiragino Maru Gothic Pro", "HG丸ｺﾞｼｯｸM-PRO","HGMaruGothicMPRO", cursive, sans-serif');
    $('#highlight_background_color_sample').css("fontFamily", '"Comic Sans MS", "ヒラギノ丸ゴ Pro W4","ヒラギノ丸ゴ Pro","Hiragino Maru Gothic Pro","HG丸ｺﾞｼｯｸM-PRO","HGMaruGothicMPRO", cursive, sans-serif');
  }
});
