#!/usr/bin/env ruby

require 'redcarpet'
require 'pragmatic_segmenter'
require 'pp'

$alpha_set = %w(A B C D E F G H I J K L M N O P Q R S T U V W X Y Z)

options = {
  safe_links_only: true
}

extensions = {
  autolink: true,
  space_after_headers: true,
  underline: true,
  highlight: true,
  quote: false,
  footnotes: false,
  fenced_code_blocks: false,
  disable_indented_code_blocks: true,
  lax_spacing: false,
  no_intra_emphasis: true,
  strikethrough: false,
  superscript: false,
  tables: false,
}

class CustomRender < Redcarpet::Render::HTML
  def block_quote(quote)
    %(<blockquote style='font-size: 0.9em; box-shadow:none;'>#{quote}</blockquote>)
  end
end

custom_render = CustomRender.new(options)
$markdown = Redcarpet::Markdown.new(custom_render, extensions)

class Parser
  def initialize(text)
    # 改行コードを統一
    @data = text.gsub("\r\n", "\n").gsub("\r", "\n")
    # 最終的な出力を格納する変数
    @output = +""
    # ローディング用gifファイル
    @poster = PREFIX + "img/loading.gif"
  end

  # YouTube用時間指定文字列変換("day:hour:min:sec"を秒数に)
  def colon_to_sec(text)
    begin
      units = [1, 60, 60 * 60, 60 * 60 * 24]
      blocks = text.split(":")
      if blocks.size > 1
        total = 0
        blocks.reverse.each_with_index do |b, i|
          total += b.to_i * units[i]
        end
        return total.to_s
      else 
        return text
      end
    rescue => e
      return text
    end
  end

  # パーシング実行用メソッド
  def parse()
    # 全体の中でYouTube動画はいくつあるか
    num_yt_videos = 0
    # 全体の中で音声・動画がいくつあるか
    num_media = 0
    
    # ドキュメントは====で分割されている
    decks = @data.split(/(?:\= ?){4,}/m)
    # 空白のドキュメントは削除
    decks.delete_if {|dk| /\A\s*\z/m =~ dk}

    @output << "<section class='deck'>\n"
    decks.each_with_index do |deck, i|
      # last_deck = true if i == decks.size - 1
      # スライドは----で分割されている
      slides = deck.split(/(?:\- ?){4,}/m)

      # ヘッダとフッタは使わない
      # header = footer = ""

      # 空白のスライドは削除
      slides.delete_if {|sl| /\A\s*\z/m =~ sl}

      slides.each_with_index do |slide, j|
        last_slide = true if j == slides.size - 1

        #### process header and footer on every slide
        # slide, header, footer = get_header_and_footer(slide, header, footer)
        # @output << "<section data-header='#{header}' data-footer='#{footer}'>\n"
        
        @output << "<section data-header='' data-footer=''>\n"

        # パラグラフは\n\nで分割されている
        paragraphs = slide.split(/\n\n+/)
        # 空白のパラグラフは削除
        paragraphs.delete_if {|pg| /\A\s*\z/m =~ pg}
        mode = nil;
        paragraphs.each do |paragraph|
          # フラグメントでない==静的テキスト
          no_frag = false
         
          # コードブロックの処理（スペース4つのcodeに変換）
          if /^```/m =~ paragraph.strip
            paragraph = paragraph.split("\n").map do |line|
              result = nil
              unless /^```/ =~ line
                result = "    " + line
              end
              result
            end.compact.join("\n")
          end

          # 静的テキスト
          if /\A(\s*\|)\s*(.*)\z/m =~ paragraph
            paragraph = $2.gsub(/\n\|\s*/, "\n")
            no_frag = true
          end
         
          last_paragraph = true if i == paragraphs.size - 1

          # センテンスは\nで分割される
          sentences = paragraph.split("\n")

          # 自動センテンス分割を行う
          sentences_new = []
          sentences.each do |sent|
            if /\A\s*\!\!\s*(.+)\z/ =~ sent
              sent = $1.gsub(/\{[^\{\}]*\}/){""}
              sentences_new << PragmaticSegmenter::Segmenter.new(text: sent, clean: false).segment
            else
              sentences_new << sent
            end
          end
          sentences = sentences_new.flatten

          # 空白のセンテンスは削除
          sentences.delete_if {|snt| /\A\s*\z/ =~ snt}

          # 実際のセンテンスの内容が入る
          spans = []
          # ノートの内容が入る
          notes = []

          # 連番モードに入るとstart_fromに最初の番号が入る
          start_from = nil;
          
          sentences.each do |sentence|

            # 連番モードの場合
            if start_from && /\A(\s+)([^\s].+)\z/ =~ sentence
              num_spaces = $1
              rest = $2
              if num_spaces && num_spaces.size == start_from.to_s.size + 2
                sentence = "#{start_from}. #{rest}"
              end
            end

            # ノート（センテンス末に{note:}または{img:}の処理
            note = {:type => nil, :text => ""}
            sentence = sentence.gsub(/\s/, " ")
            if /\A(.*?)\{(note|img|image)\:(.+)\}\s*/ =~ sentence
              sentence = $1.strip
              note[:type] = $2.strip
              note[:text] = $3.gsub('"', "&quot;").strip;
            end
            
            notes << note
            note_id = notes.size - 1

            # 実際のセンテンスの内容に応じた処理
            case sentence
            ##### video
            when /\Avideo\:\s*?(.+)/
              mode = "vi"
              url = $1
              spans << url || ""
              num_media += 1
            ##### audio
            when /\Aaudio\:\s*?(.+)/
              mode = "au"
              url = $1
              spans << url || ""
              num_media += 1
            ##### iframe
            when /\A(?:youtube|yt)\:\s*?.+?\/embed\/(.+)/
              mode = "yt"
              spans << $1 || ""
              num_yt_videos += 1
              # no_frag = true
            when /\A(?:youtube|yt)\:\s*?.+?[\?\&]v\=(.+)/
              mode = "yt"
              spans << $1 || ""
              num_yt_videos += 1
              # no_frag = true
            when /\A(?:youtube|yt)\:\s*?https?\:\/\/youtu\.be\/(.+)/
              mode = "yt"
              spans << $1 || ""
              num_yt_videos += 1
              # no_fgag = true
            ##### image
            when  /\A(?:image|img)\:\s*?(.+)/
              url = $1
              spans << url || ""
              mode = "im"
            #### inline URL
            when /\A\!\[[^\]*]\]\((.*?)\)/
              url = $1
              spans << url || ""
              mode = "im"
            ##### unordered list
            when /\A\* (.+)\z/
              class_str = no_frag ? "" : "fragment"
              sentence = $markdown.render($1).gsub(/<\/?p>/, "").strip
              alpha = "•"
              if !start_from
                start_from = alpha
                spans << "<table align='left'><tbody><tr><td>#{alpha}</td><td><span class='#{class_str}' data-note='#{note_id}'>#{sentence}</span></td></tr>"
              else
                spans << "<tr><td>#{alpha}</td><td><span class='#{class_str}' data-note='#{note_id}'>#{sentence}</span></td></tr>"
              end
              mode = "list-table"
            ##### ordered list 
            when /\A([^\.])\. (.*)\z/
              class_str = no_frag ? "" : "fragment"
              alpha = $1
              sentence = $markdown.render($2).gsub(/<\/?p>/, "").strip

              if !start_from
                start_from = alpha
                spans << "<table align='left'><tbody><tr><td>#{alpha}.</td><td><span class='#{class_str}' data-note='#{note_id}'>#{sentence}</span></td></tr>"
              elsif start_from != alpha
                start_from = alpha
                spans << "<tr><td>#{alpha}.</td><td><span class='#{class_str}' data-note='#{note_id}'>#{sentence}</span></td></tr>"
              elsif start_from == alpha
                spans[-1] << "<tr><td>#{alpha}.</td><td><span class='#{class_str}' data-note='#{note_id}'>#{sentence}</span></td></tr>"
              end
              mode = "list-table"
            ##### blockquote
            when /\A\> /
              spans << "#{sentence}"
              mode = "bq"
            ##### code block
            when /\A(?:\t|\s{4,})/
              spans << "#{sentence}"
              mode = "cb"
            #### headings
            when /\A\#+/
              spans << "#{sentence}"
              mode = "hd"
            #### 通常のセンテンス
            else
              class_str = no_frag ? "" : "fragment"
              spans << "<span class='#{class_str}' data-note='#{note_id}'>#{sentence}</span>"
              mode = "sp"
            end
          end

          class_str = no_frag ? "" : "fragment"
          
          case mode
          ##### for youtube
          when "yt"
            params  = spans.join("").strip.split(/[\?\&]/)
            ytid = params[0]
            yt_url = "https://www.youtube.com/embed/#{ytid}?enablejsapi=1&autoplay=0"
            params[1..-1].each do |param|
              if /\A(start|end)\=([\d\:]+)\z/ =~ param
                yt_url += "&#{$1}=#{colon_to_sec($2)}"
              else
                yt_url += "&#{param}"
              end
            end

            if paragraphs.size == 1
              sentences = "<iframe class='#{class_str}' width='100%' style='opacity: 1;' allow='autoplay' data-ytid='#{ytid}' src='#{yt_url}' id='yt#{num_yt_videos}' data-ignore='true' ></iframe>"
            else
              sentences = "<div class='text'><p><span class='#{class_str}'><a target='_blank' href='#{yt_url}'> <i class='fas fa-play'></i> <span>click to play YouTube video</span></a></span></p></div>"
            end
          ##### for non-youtube video
          when "vi"
            vid_url = spans.join("").strip
            if paragraphs.size == 1
              sentences = "<img class='#{class_str}' src='#{@poster}' id='poster-#{num_media}' />\n"
              sentences << "<video class='#{class_str}' src='#{vid_url}' preload='auto' id='md#{num_media}' controls style='display: none;' />\n"
            else
              sentences = "<div class='text'><p><span class='#{class_str}'><a target='_blank' href='#{vid_url}'> <i class='fas fa-download'></i> <span>download to video</span></a></span></p></div>"
            end
          when "au"
            audio_url = spans.join("").strip
            audio = "<audio class='#{class_str}' src='#{audio_url}' preload='auto' id='md#{num_media}' controls />"
            sentences = "<div class='text'><p>#{audio}</p></div>"
          ### for image
          when "im"
            img_url = spans.join("").strip
            if paragraphs.size == 1
              sentences = "<img class='#{class_str} large_img' src='#{img_url}'/>"
            else
              sentences = "<div class='text'><p><span class='#{class_str}'><a target='_blank' href='#{img_url}'> <i class='fas fa-picture-o'></i> <span>click to show image</span></a></span></p></div>"
            end
          ##### for (un)ordered lists
          when "list-table"
            spans << "</tbody></table>"
            sentences = spans.join("\n")
            sentences = sentences.gsub(/ data-note=\'(.*?)\'\>/) do
              note_id = $1.to_i
              " data-note='#{notes[note_id][:text]}' data-notetype='#{notes[note_id][:type]}''>"
            end
            sentences = process_quiz(sentences) if no_frag
            sentences = "<div class='list-table'>\n" + sentences + "\n</div>" 
          ##### for blockquote
          when "bq"
            sentences = $markdown.render(spans.join("\n")).strip
          ##### for code block
          when "cb"
            # コードブロックの内部はMarkdown処理しない
            sentences = "<pre style='box-shadow:none; font-size: 0.75em;'><code>" + spans.map{|span| span.sub(/\A\s{4}/, "")}.join("\n").strip + "</code></pre>"
          ##### for headers
          when "hd"
            sentences = $markdown.render(spans.join("\n")).strip
          ##### for spans
          when "sp"
            sentences = $markdown.render(spans.join("\n")).strip
            sentences = sentences.gsub(/data-note='(\d+)'>/) do
              note_id = $1.to_i
              " data-note='#{notes[note_id][:text]}' data-notetype='#{notes[note_id][:type]}'>"
            end
            sentences = process_quiz(sentences) if no_frag
          end

          # 画像・YouTube・動画・音声ならtextタグなし 
          if mode == "im" || mode == "yt" || mode == "vi" || mode == "au"
            @output << sentences
          else
            @output << "<div class='text'>\n"
            @output << sentences
            @output << "</div>\n"
          end
        end
        
        if last_slide
          @output << "<div class='fragment' id='eos'></div>"
          @output << "<div class='coffee' id='coffee'><i class='fa fa-coffee'></i></div>"
        end
        @output << "</section>\n"
      end

    end
    @output << "</section>\n"
    return @output
  end
end
