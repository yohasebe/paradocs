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
end
