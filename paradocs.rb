#!/usr/bin/env ruby
# -*- coding: utf-8 -*-

$LOAD_PATH << File.dirname(__FILE__)
$LOAD_PATH << File.dirname(__FILE__) + "/lib"

require 'redcarpet'
require 'i18n_data'
require 'parser'
require 'helper'
require 'json'
require 'cgi'
require 'pp'

Encoding.default_external = 'utf-8'

class CustomRenderer < Redcarpet::Render::HTML
  def image(link, title, alt_text)
    safe_link = CGI.escapeHTML(link.to_s)
    safe_alt = CGI.escapeHTML(alt_text.to_s)
    safe_title = CGI.escapeHTML(title.to_s)
    if safe_title =~ /([^=\s]+)=([^=\s]+)/
      attr_name = $1
      attr_val = $2
      # Only allow safe HTML attributes
      allowed_attrs = %w[width height style]
      if allowed_attrs.include?(attr_name)
        %(<a href="#{safe_link}" target="_blank"><img src="#{safe_link}" #{attr_name}="#{attr_val}" class='md-img' alt="#{safe_alt}" /></a>)
      else
        %(<a href="#{safe_link}" target="_blank"><img src="#{safe_link}" class='md-img' alt="#{safe_alt}" /></a>)
      end
    else
      %(<a href="#{safe_link}" target="_blank"><img src="#{safe_link}" title="#{safe_title}" class='md-img' alt="#{safe_alt}" /></a>)
    end
  end
  def table(header, body)
    "<table class='table table-sm table-striped'>" \
      "<thead>#{header}</thead>" \
      "<tbody>#{body}</tbody>" \
    "</table>"
  end
end

$IMAGE_PATH = File.join(File.dirname(__FILE__), "public/img")

markdown = Redcarpet::Markdown.new(CustomRenderer, autolink: true, fenced_code_blocks: true, with_toc_data: true, tables: true)

SAMPLE_TEXT_PATH = File.dirname(__FILE__) + "/decks/sample.txt"
SAMPLE_TEXT = File.read(SAMPLE_TEXT_PATH)


TLDR_TEXT_PATH = File.dirname(__FILE__)
tldr_md = File.read(TLDR_TEXT_PATH + "/tldr.md")
TLDR_HTML = markdown.render(tldr_md)

README_TEXT_PATH = File.dirname(__FILE__)
readme_md = File.read(README_TEXT_PATH + "/readme.md")
README_HTML = markdown.render(readme_md)

DOCUMENT_TEXT_PATH = File.dirname(__FILE__) 
document_md    = File.read(DOCUMENT_TEXT_PATH + "/documentation.md")
DOCUMENT_HTML = markdown.render(document_md)

SAMPLE_TEXT_PATH_JA = File.dirname(__FILE__) + "/decks/sample_ja.txt"
SAMPLE_TEXT_JA = File.read(SAMPLE_TEXT_PATH_JA)

readme_md_ja = File.read(README_TEXT_PATH + "/readme_ja.md")
README_HTML_JA = markdown.render(readme_md_ja)

TLDR_TEXT_PATH_JA = File.dirname(__FILE__)
tldr_md_ja = File.read(TLDR_TEXT_PATH + "/tldr_ja.md")
TLDR_HTML_JA = markdown.render(tldr_md_ja)

document_md_ja = File.read(DOCUMENT_TEXT_PATH + "/documentation_ja.md")
DOCUMENT_HTML_JA = markdown.render(document_md_ja)

PD_KEYWORDS = {
  "language" => "en-US",
  "slogan" => "A Paragraph-Oriented Document Presentation System",
  "home" => "Home",
  "overview" => "Overview",
  "visual" => "Visual Illustration",
  "use" => "Use Paradocs",
  "documentation" => "Documentation",
  "keybindings" => "Key Bindings",
  "concepts" => "Basic Concepts",
  "blocks" => "Types of Blocks",
  "decoration" => "Decoration and Annotation",
  "additional" => "Additional Features",
  "embedding" => "Embedding Media Files",
  "input" => "Text Input (syntax highlighting enabled)",
  "textarea" => "Textarea is vertically resizable",
  "speech_language" => "Speech Language",
  "speech_voice" => "Speech Voice",
  "speech_rate" => "Speech Rate",
  "fontsize" => "Font Size",
  "fontfamily" => "Font Family",
  "accent_color" => "Accent Color",
  "highlight_background_color" => "Highlight Color",
  "resolution" => "Screen Resolution",
  "convert" => "Convert Text",
  "clear" => "Clear Text",
  "fig1" => "Overview of Paradocs: input and output",
  "fig2" => "Including different types of blocks in one slide",
  "text_visual" => "/img/text.png",
  "block_visual" => "/img/blocks.png",
  "invert" => "Invert Colors",
  "wallpaper" => "Background Wallpaper",
}

PD_KEYWORDS_JA = {
  "language" => "ja-JP",
  "slogan" => "パラグラフ指向 テキスト・プレゼンテーション・システム",
  "home" => "ホーム",
  "overview" => "概要と背景",
  "visual" => "図解",
  "key" => "キーバインディング",
  "use" => "使ってみる",
  "documentation" => "詳しい仕様",
  "keybindings" => "キーバインディング",
  "concepts" => "いくつかの基本的概念",
  "blocks" => "ブロックの種類",
  "decoration" => "装飾と注記",
  "additional" => "その他の機能",
  "embedding" => "メディアの埋め込み",
  "input" => "入力テキスト（自動的に色がつきます）",
  "textarea" => "テキストエリアは縦に拡張できます",
  "speech_language" => "音声合成用言語",
  "speech_voice" => "音声合成用ボイス",
  "speech_rate" => "音声発話スピード",
  "fontsize" => "フォント・サイズ",
  "fontfamily" => "フォント・ファミリー",
  "accent_color" => "アクセント・カラー",
  "highlight_background_color" => "ハイライト・カラー",
  "resolution" => "スクリーンの解像度",
  "convert" => "プレゼンに変換",
  "clear" => "クリア",
  "fig1" => "Paradocsの概要：入力テキストと変換後の表示例",
  "fig2" => "1枚のスライドに異なった種類のブロックを含める（非推奨）",
  "text_visual" => "/img/text_ja.png",
  "block_visual" => "/img/blocks_ja.png",
  "invert" => "文字/背景の色を逆転",
  "wallpaper" => "背景の壁紙",
}

DEFAULT_HEADER = ""
DEFAULT_FOOTER = ""

# Allowed wallpaper filenames for security
ALLOWED_WALLPAPERS = %w[
  absurdity.png arches.png bedge-grunge.png bright-squares.png
  fabric-plaid.png food.png gplay.png gray-floral.png
  inspiration-geometry.png project-paper.png sandpaper.png
].freeze

CONFIG_FILE = File.expand_path(File.dirname(__FILE__) + "/paradocs.conf")
CONFIG_JSON = File.read(CONFIG_FILE).gsub("\n", " ").gsub(/\s+/, " ")
CONFIG = JSON.parse(CONFIG_JSON)
PREFIX = CONFIG["prefix"]
PARA_VERSION = CONFIG["para_version"]

DECKS_PATH = File.expand_path(File.dirname(__FILE__) + "/decks")
DECKS = {}

Dir::glob(DECKS_PATH + "/*.{txt}").each do |file|
  url = File.basename(file, ".*")
  DECKS[url] = File.expand_path(file) if url != ""
end

class Paradocs < Sinatra::Base

  before do
    @current_lang = ""
  end

  get '/' do
    @current_lang = ""
    @readme_html = README_HTML
    @tldr_html = TLDR_HTML
    @document_html = DOCUMENT_HTML
    @keywords = PD_KEYWORDS
    @sample_text = SAMPLE_TEXT
    @language = "en-US"
    erb :upload
  end

  get '/ja' do
    @current_lang = "ja"
    @readme_html = README_HTML_JA
    @tldr_html = TLDR_HTML_JA
    @document_html = DOCUMENT_HTML_JA
    @keywords = PD_KEYWORDS_JA
    @sample_text = SAMPLE_TEXT_JA
    @language = "ja-JP"
    erb :upload
  end

  # get '/img/:imgfile' do
  #   send_file(File.join($IMAGE_PATH, params['imgfile']))
  # end


  get '/lctags' do
    languages = I18nData.languages
    countries = I18nData.countries
    return {"languages" => languages, "countries" => countries}.to_json
  end

  get '/deck' do
    if !params || params.empty?
      redirect CONFIG["prefix"]
    end
  end

  post '/deck' do
    if !params || params.empty?
      redirect "/"
    end

    config = CONFIG.clone

    if params[:file]
      file  = params[:file]
      content_type file[:type]
      tempfile = file[:tempfile]
      text = File.read(tempfile)
      File.delete tempfile.path
    else
      text = params[:text]
    end

    parser = Parser.new(text)

    config["speech_voice"]   = params[:speech_voice]
    config["speech_lang"]    = params[:speech_lang]
    config["speech_rate"]    = params[:speech_rate]
    config["font_size"]      = params[:font_size].to_i.to_s
    config["note_size"]      = params[:font_size].to_i.to_s
    config["font_family"]    = params[:font_family]
    accent_color = params[:accent_color].to_s
    config["accent_color"]   = accent_color =~ /\A#[0-9a-fA-F]{3,8}\z/ ? accent_color : "#e15759"
    config["color_inverted"] = params[:text_background]

    wp = params[:wallpaper].to_s
    wallpaper = if wp == "none" || !ALLOWED_WALLPAPERS.include?(wp)
                  "none"
                else
                  "url(" + CONFIG["prefix"] + "img/wallpaper/" + wp + ")"
                end
    config["wallpaper"] = wallpaper

    raw_hl_color = params[:highlight_background_color].to_s
    safe_hl_color = raw_hl_color =~ /\A#[0-9a-fA-F]{3,8}\z/ ? raw_hl_color : "#4e79a7"

    if config["color_inverted"]
      highlight_background_color = safe_hl_color
      highlight_color = "#ffffff"
      progress_color = safe_hl_color
    else
      highlight_background_color = "transparent"
      highlight_color = safe_hl_color
      progress_color = highlight_color
    end

    config["highlight_background_color"] = highlight_background_color
    config["highlight_color"] = highlight_color
    config["progress_color"] = progress_color

    resolution = params[:resolution]
    config["width"], config["height"] = resolution.split("x").map{|r|r.to_i}

    @slides = parser.parse()
    @config = config.to_json
    @css = create_css(config)
    @if_inverted = config["color_inverted"] ? "inverted" : ""

    content_type 'text/html', :charset => 'utf-8'
    erb :deck, :layout => false
  end
end
