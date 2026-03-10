require_relative 'test_helper'
require 'sinatra'
require 'paradocs'

class TestApp < Minitest::Test
  include Rack::Test::Methods

  def app
    Paradocs
  end

  def test_get_root
    get '/'
    assert_equal 200, last_response.status
    assert_includes last_response.body, 'Paradocs'
    assert_includes last_response.body, '<form'
    assert_includes last_response.body, 'submit_button'
  end

  def test_get_ja
    get '/ja'
    assert_equal 200, last_response.status
    assert_includes last_response.body, 'Paradocs'
    assert_includes last_response.body, '<form'
  end

  def test_get_lctags
    get '/lctags'
    assert_equal 200, last_response.status
    json = JSON.parse(last_response.body)
    assert json.key?('languages')
    assert json.key?('countries')
  end

  def test_post_deck_simple
    post '/deck', {
      text: "----\nHello World\n----",
      speech_voice: "Google US English",
      speech_lang: "en-US",
      speech_rate: "1.0",
      font_size: "40",
      font_family: "sans",
      accent_color: "#e15759",
      highlight_background_color: "#4e79a7",
      text_background: nil,
      resolution: "1280x800",
      wallpaper: "sandpaper.png"
    }
    assert_equal 200, last_response.status
    assert_includes last_response.body, 'Hello World'
    assert_includes last_response.body, 'reveal'
  end

  def test_post_deck_with_heading
    post '/deck', {
      text: "----\n# Test Heading\n\nSome text here.\n----",
      speech_voice: "", speech_lang: "en-US", speech_rate: "1.0",
      font_size: "40", font_family: "sans", accent_color: "#e15759",
      highlight_background_color: "#4e79a7", text_background: nil,
      resolution: "1280x800", wallpaper: "sandpaper.png"
    }
    assert_equal 200, last_response.status
    assert_includes last_response.body, 'Test Heading'
  end

  def test_post_deck_inverted
    post '/deck', {
      text: "----\nInverted test\n----",
      speech_voice: "", speech_lang: "en-US", speech_rate: "1.0",
      font_size: "40", font_family: "serif", accent_color: "#e15759",
      highlight_background_color: "#4e79a7", text_background: "text_background",
      resolution: "1920x1080", wallpaper: "none"
    }
    assert_equal 200, last_response.status
    assert_includes last_response.body, 'inverted'
  end

  # Verify CDN URLs are present in the layout (updated versions)
  def test_layout_contains_cdn_references
    get '/'
    body = last_response.body
    # jQuery 3.7.1
    assert_match(/jquery@3\.7\.1/, body)
    # Bootstrap 5.x
    assert_match(/bootstrap@5/, body)
    # Font Awesome 6.x
    assert_match(/font-awesome\/6/, body)
    # Ace editor
    assert_match(/ace-builds/, body)
    # jQuery UI 1.14
    assert_match(/jquery-ui@1\.14/, body)
  end

  # Verify deck page contains Reveal.js 5.x reference
  def test_deck_contains_reveal_reference
    post '/deck', {
      text: "----\nTest\n----",
      speech_voice: "", speech_lang: "en-US", speech_rate: "1.0",
      font_size: "40", font_family: "sans", accent_color: "#e15759",
      highlight_background_color: "#4e79a7", text_background: nil,
      resolution: "1280x800", wallpaper: "sandpaper.png"
    }
    body = last_response.body
    assert_match(/reveal\.js@5/, body)
    assert_match(/tippy/, body)
    assert_match(/font-awesome\/6/, body)
    # Font Awesome 6 icon classes
    assert_match(/fa-solid/, body)
  end

  # --- Security tests ---

  def test_wallpaper_whitelist_rejects_invalid
    post '/deck', {
      text: "----\nTest\n----",
      speech_voice: "", speech_lang: "en-US", speech_rate: "1.0",
      font_size: "40", font_family: "sans", accent_color: "#e15759",
      highlight_background_color: "#4e79a7", text_background: nil,
      resolution: "1280x800", wallpaper: "../../../etc/passwd"
    }
    assert_equal 200, last_response.status
    refute_includes last_response.body, "etc/passwd"
  end

  def test_wallpaper_whitelist_accepts_valid
    post '/deck', {
      text: "----\nTest\n----",
      speech_voice: "", speech_lang: "en-US", speech_rate: "1.0",
      font_size: "40", font_family: "sans", accent_color: "#e15759",
      highlight_background_color: "#4e79a7", text_background: nil,
      resolution: "1280x800", wallpaper: "sandpaper.png"
    }
    assert_equal 200, last_response.status
    assert_includes last_response.body, "sandpaper.png"
  end

  def test_invalid_accent_color_uses_default
    post '/deck', {
      text: "----\nTest\n----",
      speech_voice: "", speech_lang: "en-US", speech_rate: "1.0",
      font_size: "40", font_family: "sans",
      accent_color: "javascript:alert(1)",
      highlight_background_color: "#4e79a7", text_background: nil,
      resolution: "1280x800", wallpaper: "none"
    }
    assert_equal 200, last_response.status
    refute_includes last_response.body, "javascript:alert"
  end

  def test_invalid_highlight_color_uses_default
    post '/deck', {
      text: "----\nTest\n----",
      speech_voice: "", speech_lang: "en-US", speech_rate: "1.0",
      font_size: "40", font_family: "sans", accent_color: "#e15759",
      highlight_background_color: "'; background: url(evil)",
      text_background: nil,
      resolution: "1280x800", wallpaper: "none"
    }
    assert_equal 200, last_response.status
    refute_includes last_response.body, "url(evil)"
  end

  def test_valid_hex_colors_accepted
    post '/deck', {
      text: "----\nTest\n----",
      speech_voice: "", speech_lang: "en-US", speech_rate: "1.0",
      font_size: "40", font_family: "sans",
      accent_color: "#ff0000",
      highlight_background_color: "#00ff00",
      text_background: nil,
      resolution: "1280x800", wallpaper: "none"
    }
    assert_equal 200, last_response.status
    assert_includes last_response.body, "#ff0000"
    assert_includes last_response.body, "#00ff00"
  end

  # --- GA and social widget removal ---

  def test_no_google_analytics_in_layout
    get '/'
    body = last_response.body
    refute_includes body, "google-analytics"
    refute_includes body, "GoogleAnalyticsObject"
    refute_includes body, "UA-644847"
  end

  def test_no_social_widgets_in_layout
    get '/'
    body = last_response.body
    refute_includes body, "twitter-share-button"
    refute_includes body, "fb-like"
    refute_includes body, "facebook-jssdk"
    refute_includes body, "platform.twitter.com"
  end

  # --- Language switching ---

  def test_english_page_navbar_links
    get '/'
    body = last_response.body
    assert_includes body, 'Use Paradocs'
    assert_includes body, 'Documentation'
  end

  def test_japanese_page_navbar_links
    get '/ja'
    body = last_response.body
    assert_includes body, '使ってみる'
    assert_includes body, '詳しい仕様'
  end

  # --- Edge cases ---

  def test_get_deck_redirects_without_params
    get '/deck'
    assert_equal 302, last_response.status
  end

  def test_post_deck_redirects_without_params
    post '/deck'
    assert_equal 302, last_response.status
  end

  def test_footer_year_updated
    get '/'
    assert_includes last_response.body, '2018-2026'
    refute_includes last_response.body, '2018-2020'
  end

  def test_no_navbar_light_class
    get '/'
    refute_includes last_response.body, 'navbar-light'
  end
end
