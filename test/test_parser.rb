require_relative 'test_helper'

# Parser needs PREFIX constant
CONFIG_FILE = File.expand_path(File.dirname(__FILE__) + "/../paradocs.conf")
CONFIG_JSON = File.read(CONFIG_FILE).gsub("\n", " ").gsub(/\s+/, " ")
CONFIG = JSON.parse(CONFIG_JSON)
PREFIX = CONFIG["prefix"]

require 'parser'
require 'helper'

class TestParser < Minitest::Test
  def test_simple_paragraph
    text = "----\nHello world.\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "<section"
    assert_includes result, "Hello world."
  end

  def test_multiple_slides
    text = "----\nSlide 1\n----\nSlide 2\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "Slide 1"
    assert_includes result, "Slide 2"
    # Two inner sections (slides split by ----)
    assert_equal 2, result.scan(/<section data-header/).length
  end

  def test_heading
    text = "----\n# Main Heading\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "<h1>"
    assert_includes result, "Main Heading"
  end

  def test_unordered_list
    text = "----\n* Item A\n* Item B\n* Item C\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "Item A"
    assert_includes result, "Item B"
    assert_includes result, "Item C"
    assert_includes result, "list-table"
  end

  def test_ordered_list
    text = "----\n1. First\n2. Second\n3. Third\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "First"
    assert_includes result, "Second"
    assert_includes result, "list-table"
  end

  def test_static_paragraph
    text = "----\n| This is static.\n| No highlight.\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "This is static."
    # Static paragraphs have empty class (no 'fragment' keyword)
    assert_includes result, "class=''"
  end

  def test_image_block
    text = "----\nimg: https://example.com/photo.png\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "https://example.com/photo.png"
    assert_includes result, "<img"
  end

  def test_youtube_block
    text = "----\nyoutube: https://www.youtube.com/watch?v=abc123\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "iframe"
    assert_includes result, "abc123"
  end

  def test_youtube_time_colon_notation
    text = "----\nyoutube: https://www.youtube.com/watch?v=abc123&start=1:30&end=2:00\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "start=90"
    assert_includes result, "end=120"
  end

  def test_video_block
    text = "----\nvideo: https://example.com/vid.mp4\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "<video"
    assert_includes result, "https://example.com/vid.mp4"
  end

  def test_audio_block
    text = "----\naudio: https://example.com/sound.mp3\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "<audio"
    assert_includes result, "https://example.com/sound.mp3"
  end

  def test_note_annotation
    text = "----\nSome text. {note: This is a note}\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "This is a note"
    assert_includes result, "data-notetype='note'"
  end

  def test_image_popup_annotation
    text = "----\nSome text. {image: https://example.com/img.png}\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "https://example.com/img.png"
    assert_includes result, "data-notetype='image'"
  end

  def test_auto_segmentation
    text = "----\n!! This is sentence one. This is sentence two.\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "This is sentence one."
    assert_includes result, "This is sentence two."
  end

  def test_bold_and_italic
    text = "----\nThis is **bold** and *italic* text.\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "<strong>bold</strong>"
    assert_includes result, "<em>italic</em>"
  end

  def test_end_of_slides_marker
    text = "----\nOnly slide\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "id='eos'"
    assert_includes result, "fa-mug-hot"
  end

  def test_code_block
    text = "----\n```\nvar x = 1;\n```\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "<pre"
    assert_includes result, "<code>"
    assert_includes result, "var x = 1;"
  end

  def test_quiz
    text = "----\n| Words in {curly brackets} will be quiz items.\n----"
    parser = Parser.new(text)
    result = parser.parse
    assert_includes result, "quiz"
    assert_includes result, "curly brackets"
  end
end

class TestHelper < Minitest::Test
  def test_create_css_sans
    conf = {
      "wallpaper" => "none",
      "font_size" => 40,
      "font_family" => "sans",
      "accent_color" => "#e15759",
      "highlight_color" => "#4e79a7",
      "highlight_background_color" => "transparent",
      "progress_color" => "#4e79a7",
      "note_background_color" => "#F4F1BB",
      "note_marker_color" => "#FFD700",
      "note_color" => "#303030",
      "height" => 800,
      "line_height" => 1.4,
    }
    css = create_css(conf)
    assert_includes css, "<style"
    assert_includes css, "Lato"
    assert_includes css, "#e15759"
  end

  def test_create_css_serif
    conf = {
      "wallpaper" => "none",
      "font_size" => 40,
      "font_family" => "serif",
      "accent_color" => "#e15759",
      "highlight_color" => "#4e79a7",
      "highlight_background_color" => "transparent",
      "progress_color" => "#4e79a7",
      "note_background_color" => "#F4F1BB",
      "note_marker_color" => "#FFD700",
      "note_color" => "#303030",
      "height" => 800,
      "line_height" => 1.4,
    }
    css = create_css(conf)
    assert_includes css, "Palatino"
  end

  def test_process_quiz
    result = process_quiz("Hello {world} end")
    assert_includes result, "fragment quiz"
    assert_includes result, "world"
  end
end
