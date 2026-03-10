#!/usr/bin/env ruby

def create_css(conf)

  if conf["font_family"] == "sans"
    font_family_body = '"Lato", sans-serif'
    font_family_heading = '"News Cycle", Impact, sans-serif'
  elsif conf["font_family"] == "serif"
    font_family_body = '"Palatino Linotype", "Book Antiqua", Palatino, FreeSerif, serif'
    font_family_heading = '"Palatino Linotype", "Book Antiqua", Palatino, FreeSerif, serif'
  elsif conf["font_family"] == "fun"
    font_family_body = '"Comic Sans MS","ヒラギノ丸ゴ Pro W4","ヒラギノ丸ゴ Pro","Hiragino Maru Gothic Pro","HG丸ｺﾞｼｯｸM-PRO","HGMaruGothicMPRO", cursive, sans-serif'
    font_family_heading = '"Comic Sans MS","ヒラギノ丸ゴ Pro W4","ヒラギノ丸ゴ Pro","Hiragino Maru Gothic Pro","HG丸ｺﾞｼｯｸM-PRO","HGMaruGothicMPRO", cursive, sans-serif'
  end


  css =<<EOD
<style type="text/css">

html{
  background-image: #{conf["wallpaper"]};
}

body{
  cursor: auto;
}

.reveal{
  overflow: hidden;
}

#highlighted_cursor {
  display: none; 
  top: 0;
  left: 0; 
  border-radius: 50%;
  position: absolute;
  cursor: none;
  pointer-events: none;
  width: 35px;
  height: 35px;
  background-color: #{conf["accent_color"]}; 
  opacity: 0.5;
  z-index: 1001;
}

.tooltip{
  font-family: #{font_family_body};
}

.shortcut{
  font-family: monospace;
  font-weight: bold;
  color: #{conf["accent_color"]};
  font-size: 1.2em;
}

.additional{
  visibility:hidden;
  position: absolute;
  font-size: #{conf["font_size"]}px;
  color: #555;
  background-color: transparent; 
  font-family: #{font_family_body};
  width: 100%;
  height: 100%;
  padding:0;
  margin:0;
  top:0;
  left:0;
  z-index:300;
}

.switches{
  position: absolute;
  width: 100%;
  height: 100%;
  padding:0;
  margin:0;
  top:0;
  left:0;
}

#left_switches{
  width: 40px;
  text-align:center;
}

.left_switch{
  display: block;
  width: 40px;
  margin: 0;
  padding: 4px 0;
}

.left_switches span{
  padding: 0;
  margin: 0;
}

.gadgets{
  position: relative;
  width: 100%;
  height: 100%;
  padding:0;
  margin:auto;
}

.reveal section.deck.stack.present section.present {
    overflow-x: hidden !important;
    overflow-y: hidden !important;
    max-height: #{conf["height"]}px;
}

.reveal {
  visibility: hidden;
  font-size: #{conf["font_size"]}px;
  color: #555;
  background-color: #ffffff;
  background-image: #{conf["wallpaper"]};
  font-family: #{font_family_body};
}

.reveal .progress {
  height: 5px;
  color: #{conf["progress_color"]};
}

.reveal .slide-number{
  right:auto;
  left: 8px;
  bottom: 13px;
  background-color: lightgray;
  text-shadow: none;
  color: #555;
  font-size: 40%;
}

.reveal div.text {
  text-align: justify;
}

.reveal div.text h1, 
.reveal div.text h2, 
.reveal div.text h3, 
.reveal div.text h4, 
.reveal div.text h5 {
  text-align: left; 
  font-weight: bold;
  color: #{conf["accent_color"]};
  text-shadow: -1px 1px 2px rgba(0,0,0,0.25);
  font-family: #{font_family_heading};
}

.reveal div.text.bold {
  font-weight: bold;
}

.reveal blockquote {
  text-align: left;
  margin-top:0.5em;
}

.reveal .slides section div.text a, 
        .slides section div.text a:link, 
        .slides section div.text a:hover, 
        .slides section div.text a:visited {
  color: #777;
  text-shadow:-1px 1px 2px rgba(0,0,0,0.25);
}

.reveal .slides section div.text .fragment.visible.current-fragment a, 
        .slides section div.text .fragment.visible.current-fragment a:link, 
        .slides section div.text .fragment.visible.current-fragmentdiv.text a:hover, 
        .slides section div.text .fragment.visible.current-fragmentdiv.text a:visited {
  color: #{conf["highlight_color"]};
  text-shadow:-1px 1px 2px rgba(0,0,0,0.25);
}

div.gadgets div.sticky{
  visibility: visible;
  display:none;
  position: absolute;
  margin:0;
  bottom:auto;
  right:auto;
  min-height:85px;
  min-width:100px;
  width:400px;
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 12px;
  padding-bottom: 12px;
  color:#777;
  background-color: #ffcbe3;
  text-align: left;
  box-shadow:1px 1px 1px rgba(0,0,0,0.25);
  cursor: grab;
}

.gadgets div.sticky .edit_control i {
  cursor: pointer;
  margin-left: 10px;
  margin-right: 4px;
}

.gadgets div.sticky div.edit_panel{
  text-align:right;
}

.gadgets div.sticky span.panel{
  padding:0;
  margin:0;
  display: block;
  position: absolute;
  top:5px;
  right:5px;
}

.gadgets .ui-widget-content {
  border: 0;
}

.gadgets .sticky_editor:focus{
  outline: none;
}

.gadgets .sticky_editor{
  font-family: #{font_family_body};
  height: 100px;
  width: 100%;
  margin-top:4px;
  margin-bottom:4px;
  padding:0;
  border: 2px solid #ffcbe3 !important;
  background-color: #ffcbe3;
  line-height:1.2em;
  opacity: 0.8;
  min-height: 35px;
  resize: none;
  overflow-x: auto;
  overflow-y: auto;
  color:#555;
  border:0;
}

.gadgets div.sticky:hover .sticky_editor[contenteditable="true"],
.gadgets .sticky_editor:focus{
  background-color: #ffa4ce !important;
}

.gadgets div.note{
  visibility: visible;
  display:none;
  position: absolute;
  bottom:auto;
  right:auto;
  max-width: 65%;
  min-width: 10%;
  max-height:40%;
  color:#555;
  background-color: #{conf["note_background_color"]};
  opacity: 1;
  text-align: left;
  padding-left:16px;
  padding-right:16px;
  padding-top:10px;
  padding-bottom:10px;
  box-shadow:1px 1px 1px rgba(0,0,0,0.25);
  cursor: grab;
  line-height:1.4em;
}

.gadgets div.imagenote{
  visibility: visible;
  display:none;
  position: absolute;
  bottom: auto;
  right: auto;
  padding:0;
  margin:0;
  background-color: transparent;
  border: 0;
  box-shadow: none;
  opacity: 1;
  cursor: grab;
}

.gadgets div.imagenote .enlarge{
  padding:0;
  margin:0;
  width:100%;
}

.gadgets div.imagenote .enlarge span{
  position: absolute
  top:0;
  left:0;
  width: 1em;
  height: 1em;
  display: inline-block;
  color: white !important;
  background-color: #777 !important;
  font-size: 0.7em !important;
  padding-top:2px;
  text-align: center;
  cursor: pointer;
}

.gadgets div.imagenote img{
  display:inline-block;
  padding:0;
  margin:0;
  max-height:100%;
  max-width:100%;
  box-shadow:1px 1px 1px rgba(0,0,0,0.25);
}

.reveal .slides section .fragment mark {
  color: gray;
  line-height: #{conf["line_height"]};
  opacity: 1;
  margin-right: 10px;
  text-shadow: none;
  background-color: #F5EDB9;
  margin:0;
}

.reveal .slides section .fragment.visible.current-fragment mark{
  color: gray;
  background-color: #F5EDB9;
  opacity: 1;
  text-shadow:-1px 1px 2px rgba(0,0,0,0.25);
}

.gadgets div.note em {
  font-style: normal;
  background: #{conf["note_marker_color"]};
  text-shadow:1px 1px 1px rgba(0,0,0,0.25);
}

.reveal .slides section .fragment {
  color: gray;
  line-height: #{conf["line_height"]};
  opacity: 1;
  margin-right: 10px;
  text-shadow: none;
}

.reveal .slides section .fragment.quote{
  color: gray;
  opacity: 1;
  line-height:2;
  font-style: italic;
  padding-left: 2em;
}

.reveal .slides section code.fragment{
  color: white;
  opacity: 1;
}

.reveal .slides section .fragment.visible.current-fragment {
  color: #{conf["highlight_color"]};
  background-color: #{conf["highlight_background_color"]};
  opacity: 1;
  text-shadow:-1px 1px 2px rgba(0,0,0,0.25);
}

.reveal .slides section .fragment.visible.current-fragment li{
  color: #{conf["highlight_color"]};
  background-color: #{conf["highlight_background_color"]};
  opacity: 1;
  text-shadow:-1px 1px 2px rgba(0,0,0,0.25);
}

.reveal div.slides section img.fragment ,
.reveal div.slides section audio.fragment, 
.reveal div.slides section video.fragment,
.reveal div.slides section iframe.fragment {
  border: 5px solid #D3D3D3;
}

.reveal .slides section audio.fragment.visible.current-fragment {
  background-color: transparent;
  border: 5px solid #{conf["progress_color"]};
}


.reveal div.slides section img {
  border: none ;
  -webkit-box-shadow: none;
     -moz-box-shadow: none;
          box-shadow: none;
}

.switches div#left_switches{
  visibility: visible;
  position:absolute;
  top: 0.5em;
  left: 0.5em;
}

.switches div#right_switches{
  visibility: visible;
  position:absolute;
  top: 0.5em;
  right: 0.5em;
}

.switches span#playall_icon{
  cursor: pointer;
  font-size: 0.8em;
  opacity: 0.8;
  color: gray;
}

@keyframes spin {
  50% {transform: rotate(45deg);}
  100% {transform: rotate(0deg);}
}

.switches span#playall_icon.playing{
  color: #{conf["progress_color"]};
  animation: spin 3s linear infinite;
}

.switches span#speaker_icon{
  display: none;
  cursor: pointer;
  font-size: 0.8em;
  opacity: 0.8;
  color: gray;
}

.switches span#pointer_icon{
  cursor: pointer;
  font-size: 0.8em;
  opacity: 0.8;
  color: gray;
}

.switches span#speaker_icon.playing{
  color: #{conf["progress_color"]};
}


.switches span#sticky_icon{
  cursor: pointer;
  opacity: 0.8;
  font-size: 0.8em;
  color: gray;
}

.switches span#sticky_icon .fa-sticky-note-o{
  visibility: visible;
}

.switches span#sticky_icon.editing{
  color: #{conf["progress_color"]};
}


.switches span#overview_icon{
  cursor: pointer;
  opacity: 0.8;
  font-size: 0.8em;
  color: gray;
}

.switches span#overview_icon.playing{
  color: #{conf["progress_color"]};
}

.reveal .box h3{
  text-align:center;
  position:relative;
  top:80px;
}

.reveal div#coffee {
  display: none;
  text-align: right;
  font-size: 1em;
  color: #{conf["progress_color"]};
  background-color:transparent;
  opacity: 1;
  text-shadow:-1px 1px 2px rgba(0,0,0,0.25);
}

.reveal .slides section video.fragment,
.reveal .slides section iframe.fragment{
  background-color: black;
}

.reveal .slides section img.fragment.visible.current-fragment {
  background-color: transparent;
  border: 5px solid #{conf["progress_color"]};
}

.reveal .slides section video.fragment.visible.current-fragment,
.reveal .slides section iframe.fragment.visible.current-fragment {
  background-color: black;
  border: 5px solid #{conf["progress_color"]};
}

.reveal ul {
  list-style: none;
  margin-left: 0;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  display: table;
  width: 90%;
}

.reveal ::selection {
  background: darkgray;
}


.reveal ol {
  counter-reset:ctr;
  list-style:none;
  margin-left: 0;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  display: table;
  width: 90%;
}

.reveal ul li,
.reveal ol li{
  display: table-row;
}

.reveal ul li:before {
  display: inline-block !important;
  content: "•";
  display: table-cell;
  color: gray;
  opacity: 1;
}

.reveal ol li:before {
  display: inline-block !important;
  content: counter(ctr);
  counter-increment: ctr;
  display:table-cell;
  color: gray;
  opacity: 1;
}

div.list-table table{
  border: none;
}

div.div.list-table tr{
}

div.list-table td {
  border: none;
  vertical-align: baseline;
  padding-right: 10px;
  padding-left: 0px;
  padding-top: 5px;
  padding-bottom: 5px;
}

.reveal blockquote{
  margin-left: 2em;
  width:85%;
  color: #555555;
}

.reveal audio{
  text-align:left;
}

.reveal li {
  text-align: justify;
}

.reveal li.fragment.visible.current-fragment:before {
  color: white;
}

.reveal li span{
  position: relative; left: 20px;
}

.reveal li.fragment.visible.current-fragment:before {
  border-color: #F45B69;
}

.reveal sup{
  font-size: 0.6em;
}

.reveal span.fragment.quiz {
  color: lightgray;
  background-color: lightgray;
  margin-right: 0px;
  display: inline-block;
  padding-right: 4px;
  padding-left: 4px;
  padding-top: 3px;
  padding-bottom: 3px;
  margin-top: 4px;
  margin-bottom: 4px;
  line-height:1.2em;
  color:transparent !important;
  border-bottom: 4px solid lightgray
}

.reveal span.fragment.quiz.visible.current-fragment {
  color: transparent !important;
  background-color: #{conf["highlight_color"]} !important;
  border-color: #{conf["highlight_color"]} !important;
  text-shadow: none;
  border-bottom: 4px solid lightgray;
}

.reveal span.fragment.quiz.current-fragment.playingall{
  color: #555 !important;
  background-color: lightgray !important;;
  border-bottom: 4px solid #{conf["highlight_color"]};
}

.reveal span.fragment.quiz.visible{
  color: #555 !important;
  border-bottom: 4px solid #{conf["highlight_color"]};
}

.reveal.inverted span.fragment.quiz {
  color: lightgray;
  background-color: lightgray;
  margin-right: 0px;
  display: inline-block;
  padding-right: 4px;
  padding-left: 4px;
  padding-top: 3px;
  padding-bottom: 3px;
  margin-top: 4px;
  margin-bottom: 4px;
  line-height:1.2em;
  color:transparent !important;
  border-bottom: 4px solid lightgray
}

.reveal.inverted span.fragment.quiz.visible.current-fragment {
  color: transparent !important;
  background-color: #{conf["highlight_background_color"]} !important;
  border-color: #{conf["highlight_background_color"]} !important;
  text-shadow: none;
  border-bottom: 4px solid lightgray;
}

.reveal.inverted span.fragment.quiz.current-fragment.playingall{
  color: #333 !important;
  background-color: lightgray !important;
  border-bottom: 4px solid #{conf["highlight_background_color"]};
}
.reveal.inverted span.fragment.quiz.visible{
  color: #333 !important;
  border-bottom: 4px solid #{conf["highlight_background_color"]};
}

.reveal i{
    font-style: normal;
}

.reveal i.fa-solid.fa-play{
  color: #F45B69;
}

textarea::selection{
  color: #333;
  background-color: lightgray;
}

.reveal div.controls-arrow{
  color: #{conf["highlight_color"]};
}

.reveal.inverted div.controls-arrow{
  color: #{conf["highlight_background_color"]};
}

</style>
EOD
end

def process_quiz(sentence)
  sentence = sentence.gsub(/\{([^\}]+)\}\s*/) do
    "</span> <span class='fragment quiz'>" + $1 + "</span><span class='fragment quiz_dummy' style='margin: 0;'></span><span>&nbsp;"
  end
end
