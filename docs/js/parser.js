/**
 * Paradocs Parser - JavaScript port of parser.rb
 * Converts custom-formatted text into Reveal.js HTML slides.
 *
 * Requires: marked (loaded via CDN)
 */

const ALPHA_SET = [
  'A','B','C','D','E','F','G','H','I','J','K','L','M',
  'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'
];

// ---------------------------------------------------------------------------
// marked configuration
// ---------------------------------------------------------------------------

function configureMarked() {
  const renderer = new marked.Renderer();

  renderer.blockquote = function({ text }) {
    return `<blockquote style='font-size: 0.9em; box-shadow:none;'>${text}</blockquote>`;
  };

  // Extension: ==text== → <mark>text</mark> (highlight)
  const highlightExtension = {
    name: 'highlight',
    level: 'inline',
    start(src) {
      return src.indexOf('==');
    },
    tokenizer(src) {
      const match = /^==([^=]+)==/.exec(src);
      if (match) {
        return {
          type: 'highlight',
          raw: match[0],
          text: match[1]
        };
      }
    },
    renderer(token) {
      return `<mark>${token.text}</mark>`;
    }
  };

  // Extension: _text_ → <u>text</u> (underline)
  // Only match when NOT inside a word (no_intra_emphasis behaviour)
  const underlineExtension = {
    name: 'underline',
    level: 'inline',
    start(src) {
      return src.indexOf('_');
    },
    tokenizer(src) {
      const match = /^_([^_]+)_(?!\w)/.exec(src);
      if (match) {
        return {
          type: 'underline',
          raw: match[0],
          text: match[1]
        };
      }
    },
    renderer(token) {
      return `<u>${token.text}</u>`;
    }
  };

  marked.use({
    renderer,
    extensions: [highlightExtension, underlineExtension],
    gfm: true,
    breaks: false
  });
}

// ---------------------------------------------------------------------------
// Sentence segmentation (replaces PragmaticSegmenter)
// ---------------------------------------------------------------------------

function segmentSentences(text) {
  // Try Intl.Segmenter first (available in modern browsers)
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });
      const segments = [];
      for (const seg of segmenter.segment(text)) {
        const trimmed = seg.segment.trim();
        if (trimmed) segments.push(trimmed);
      }
      if (segments.length > 0) return segments;
    } catch (_e) {
      // fall through to regex
    }
  }

  // Regex fallback: split on sentence-ending punctuation followed by space
  const parts = text.split(/(?<=[.!?。！？])\s+/);
  return parts.map(s => s.trim()).filter(s => s.length > 0);
}

// ---------------------------------------------------------------------------
// Markdown rendering helper
// ---------------------------------------------------------------------------

function renderMarkdown(text) {
  return marked.parse(text);
}

function renderInlineMarkdown(text) {
  // Use marked.parse but strip wrapping <p> tags for inline use
  return marked.parse(text).replace(/<\/?p>/g, '').trim();
}

// ---------------------------------------------------------------------------
// Quiz processing (ported from helper.rb process_quiz)
// ---------------------------------------------------------------------------

function processQuiz(sentence) {
  return sentence.replace(/\{([^}]+)\}\s*/g,
    "</span> <span class='fragment quiz'>$1</span><span class='fragment quiz_dummy' style='margin: 0;'></span><span>&nbsp;"
  );
}

// ---------------------------------------------------------------------------
// Parser class
// ---------------------------------------------------------------------------

class Parser {
  /**
   * @param {string} text - The raw Paradocs document text
   * @param {object} config - Configuration object with `prefix` property
   */
  constructor(text, config) {
    config = config || {};
    // Normalize line endings
    this.data = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    this.output = '';
    const prefix = config.prefix || '';
    this.poster = prefix + 'img/loading.gif';

    // Ensure marked is configured
    configureMarked();
  }

  /**
   * Convert "hour:min:sec" time format to seconds string.
   */
  colonToSec(text) {
    try {
      const units = [1, 60, 60 * 60, 60 * 60 * 24];
      const blocks = text.split(':');
      if (blocks.length > 1) {
        let total = 0;
        const reversed = blocks.slice().reverse();
        reversed.forEach((b, i) => {
          total += parseInt(b, 10) * units[i];
        });
        return total.toString();
      }
      return text;
    } catch (_e) {
      return text;
    }
  }

  /**
   * Parse the document and return HTML string.
   */
  parse() {
    let numYtVideos = 0;
    let numMedia = 0;

    // Split by ==== (deck separator)
    let decks = this.data.split(/(?:= ?){4,}/m);
    decks = decks.filter(dk => dk.trim().length > 0);

    this.output += "<section class='deck'>\n";

    decks.forEach((deck) => {
      // Split by ---- (slide separator)
      let slides = deck.split(/(?:- ?){4,}/m);
      slides = slides.filter(sl => sl.trim().length > 0);

      slides.forEach((slide, j) => {
        const lastSlide = (j === slides.length - 1);

        this.output += "<section data-header='' data-footer=''>\n";

        // Split by blank lines (paragraph separator)
        let paragraphs = slide.split(/\n\n+/);
        paragraphs = paragraphs.filter(pg => pg.trim().length > 0);

        let mode = null;

        paragraphs.forEach((paragraph) => {
          let noFrag = false;

          // Fenced code block: convert ``` blocks to 4-space indented lines
          if (/^```/m.test(paragraph.trim())) {
            const lines = paragraph.split('\n');
            const converted = [];
            for (const line of lines) {
              if (!/^```/.test(line)) {
                converted.push('    ' + line);
              }
            }
            paragraph = converted.join('\n');
          }

          // Static text: lines starting with |
          const staticMatch = paragraph.match(/^\s*\|\s*(.*)/ms);
          if (staticMatch) {
            paragraph = staticMatch[1].replace(/\n\|\s*/g, '\n');
            noFrag = true;
          }

          // Split into sentences by newline
          let sentences = paragraph.split('\n');

          // Auto sentence segmentation for lines starting with !!
          const sentencesNew = [];
          sentences.forEach(sent => {
            const autoSegMatch = sent.match(/^\s*!!\s*(.+)$/);
            if (autoSegMatch) {
              // Remove {note:...} etc. before segmenting
              const cleaned = autoSegMatch[1].replace(/\{[^{}]*\}/g, '');
              const segmented = segmentSentences(cleaned);
              segmented.forEach(s => sentencesNew.push(s));
            } else {
              sentencesNew.push(sent);
            }
          });
          sentences = sentencesNew;

          // Remove blank sentences
          sentences = sentences.filter(snt => !/^\s*$/.test(snt));

          const spans = [];
          const notes = [];
          let startFrom = null;

          sentences.forEach(sentence => {
            // Continuation of ordered list: indented text
            if (startFrom !== null && /^\s+/.test(sentence)) {
              const contMatch = sentence.match(/^(\s+)(\S.+)$/);
              if (contMatch) {
                const numSpaces = contMatch[1];
                const rest = contMatch[2];
                if (numSpaces && numSpaces.length === startFrom.toString().length + 2) {
                  sentence = `${startFrom}. ${rest}`;
                }
              }
            }

            // Note extraction: {note:text}, {img:url}, {image:url}
            const note = { type: null, text: '' };
            sentence = sentence.replace(/\s/g, ' ');
            const noteMatch = sentence.match(/^(.*?)\{(note|img|image):(.+)\}\s*/);
            if (noteMatch) {
              sentence = noteMatch[1].trim();
              note.type = noteMatch[2].trim();
              note.text = noteMatch[3].replace(/"/g, '&quot;').trim();
            }

            notes.push(note);
            const noteId = notes.length - 1;

            // Detect mode and build spans
            let m;

            // video:
            if ((m = sentence.match(/^video:\s*?(.+)/))) {
              mode = 'vi';
              spans.push(m[1] || '');
              numMedia += 1;
            }
            // audio:
            else if ((m = sentence.match(/^audio:\s*?(.+)/))) {
              mode = 'au';
              spans.push(m[1] || '');
              numMedia += 1;
            }
            // youtube/yt: embed URL
            else if ((m = sentence.match(/^(?:youtube|yt):\s*?.+?\/embed\/(.+)/))) {
              mode = 'yt';
              spans.push(m[1] || '');
              numYtVideos += 1;
            }
            // youtube/yt: ?v= URL
            else if ((m = sentence.match(/^(?:youtube|yt):\s*?.+?[?&]v=(.+)/))) {
              mode = 'yt';
              spans.push(m[1] || '');
              numYtVideos += 1;
            }
            // youtube/yt: youtu.be URL
            else if ((m = sentence.match(/^(?:youtube|yt):\s*?https?:\/\/youtu\.be\/(.+)/))) {
              mode = 'yt';
              spans.push(m[1] || '');
              numYtVideos += 1;
            }
            // image/img:
            else if ((m = sentence.match(/^(?:image|img):\s*?(.+)/))) {
              spans.push(m[1] || '');
              mode = 'im';
            }
            // inline image ![...](...)
            else if ((m = sentence.match(/^!\[[^\]]*\]\((.*?)\)/))) {
              spans.push(m[1] || '');
              mode = 'im';
            }
            // unordered list: * item
            else if ((m = sentence.match(/^\* (.+)$/))) {
              const classStr = noFrag ? '' : 'fragment';
              const rendered = renderInlineMarkdown(m[1]);
              const alpha = '•';
              if (startFrom === null) {
                startFrom = alpha;
                spans.push(`<table style='margin-right: auto;'><tbody><tr><td>${alpha}</td><td><span class='${classStr}' data-note='${noteId}'>${rendered}</span></td></tr>`);
              } else {
                spans.push(`<tr><td>${alpha}</td><td><span class='${classStr}' data-note='${noteId}'>${rendered}</span></td></tr>`);
              }
              mode = 'list-table';
            }
            // ordered list: N. item  or  a. item
            else if ((m = sentence.match(/^([^.])\. (.*)$/))) {
              const classStr = noFrag ? '' : 'fragment';
              const alpha = m[1];
              const rendered = renderInlineMarkdown(m[2]);

              if (startFrom === null) {
                startFrom = alpha;
                spans.push(`<table style='margin-right: auto;'><tbody><tr><td>${alpha}.</td><td><span class='${classStr}' data-note='${noteId}'>${rendered}</span></td></tr>`);
              } else if (startFrom !== alpha) {
                startFrom = alpha;
                spans.push(`<tr><td>${alpha}.</td><td><span class='${classStr}' data-note='${noteId}'>${rendered}</span></td></tr>`);
              } else {
                // startFrom === alpha: append to last span
                spans[spans.length - 1] += `<tr><td>${alpha}.</td><td><span class='${classStr}' data-note='${noteId}'>${rendered}</span></td></tr>`;
              }
              mode = 'list-table';
            }
            // blockquote
            else if (/^> /.test(sentence)) {
              spans.push(sentence);
              mode = 'bq';
            }
            // code block (4 spaces or tab)
            else if (/^(?:\t|\s{4,})/.test(sentence)) {
              spans.push(sentence);
              mode = 'cb';
            }
            // headings
            else if (/^#+/.test(sentence)) {
              spans.push(sentence);
              mode = 'hd';
            }
            // regular sentence
            else {
              const classStr = noFrag ? '' : 'fragment';
              spans.push(`<span class='${classStr}' data-note='${noteId}'>${sentence}</span>`);
              mode = 'sp';
            }
          });

          const classStr = noFrag ? '' : 'fragment';
          let renderedSentences = '';

          switch (mode) {
            // YouTube
            case 'yt': {
              const params = spans.join('').trim().split(/[?&]/);
              const ytid = params[0];
              let ytUrl = `https://www.youtube.com/embed/${ytid}?enablejsapi=1&autoplay=0`;
              params.slice(1).forEach(param => {
                const pm = param.match(/^(start|end)=([\d:]+)$/);
                if (pm) {
                  ytUrl += `&${pm[1]}=${this.colonToSec(pm[2])}`;
                } else {
                  ytUrl += `&${param}`;
                }
              });

              if (paragraphs.length === 1) {
                renderedSentences = `<iframe class='${classStr}' width='100%' style='opacity: 1;' allow='autoplay' data-ytid='${ytid}' src='${ytUrl}' id='yt${numYtVideos}' data-ignore='true' ></iframe>`;
              } else {
                renderedSentences = `<div class='text'><p><span class='${classStr}'><a target='_blank' href='${ytUrl}'> <i class='fa-solid fa-play'></i> <span>click to play YouTube video</span></a></span></p></div>`;
              }
              break;
            }

            // Video
            case 'vi': {
              const vidUrl = spans.join('').trim();
              if (paragraphs.length === 1) {
                renderedSentences = `<img class='${classStr}' src='${this.poster}' id='poster-${numMedia}' />\n`;
                renderedSentences += `<video class='${classStr}' src='${vidUrl}' preload='auto' id='md${numMedia}' controls style='display: none;' />\n`;
              } else {
                renderedSentences = `<div class='text'><p><span class='${classStr}'><a target='_blank' href='${vidUrl}'> <i class='fa-solid fa-download'></i> <span>download to video</span></a></span></p></div>`;
              }
              break;
            }

            // Audio
            case 'au': {
              const audioUrl = spans.join('').trim();
              const audio = `<audio class='${classStr}' src='${audioUrl}' preload='auto' id='md${numMedia}' controls />`;
              renderedSentences = `<div class='text'><p>${audio}</p></div>`;
              break;
            }

            // Image
            case 'im': {
              const imgUrl = spans.join('').trim();
              if (paragraphs.length === 1) {
                renderedSentences = `<img class='${classStr} large_img' src='${imgUrl}'/>`;
              } else {
                renderedSentences = `<div class='text'><p><span class='${classStr}'><a target='_blank' href='${imgUrl}'> <i class='fa-solid fa-image'></i> <span>click to show image</span></a></span></p></div>`;
              }
              break;
            }

            // (Un)ordered lists
            case 'list-table': {
              spans.push('</tbody></table>');
              renderedSentences = spans.join('\n');
              // Replace note placeholders (global)
              renderedSentences = renderedSentences.replace(/ data-note='(\d+?)'>/g, (match, id) => {
                const nid = parseInt(id, 10);
                return ` data-note='${notes[nid].text}' data-notetype='${notes[nid].type}'>`;
              });
              if (noFrag) {
                renderedSentences = processQuiz(renderedSentences);
              }
              renderedSentences = "<div class='list-table'>\n" + renderedSentences + '\n</div>';
              break;
            }

            // Blockquote
            case 'bq': {
              renderedSentences = renderMarkdown(spans.join('\n')).trim();
              break;
            }

            // Code block (no Markdown processing - raw content with leading 4 spaces stripped)
            case 'cb': {
              const codeContent = spans.map(span => span.replace(/^\s{4}/, '')).join('\n').trim();
              renderedSentences = "<pre style='box-shadow:none; font-size: 0.75em;'><code>" + this._escapeHtml(codeContent) + '</code></pre>';
              break;
            }

            // Headings
            case 'hd': {
              renderedSentences = renderMarkdown(spans.join('\n')).trim();
              break;
            }

            // Regular spans
            case 'sp': {
              renderedSentences = renderMarkdown(spans.join('\n')).trim();
              // Replace note placeholders
              renderedSentences = renderedSentences.replace(/data-note='(\d+)'>/g, (match, id) => {
                const nid = parseInt(id, 10);
                return ` data-note='${notes[nid].text}' data-notetype='${notes[nid].type}'>`;
              });
              if (noFrag) {
                renderedSentences = processQuiz(renderedSentences);
              }
              break;
            }
          }

          // Output: media types get no text wrapper
          if (mode === 'im' || mode === 'yt' || mode === 'vi' || mode === 'au') {
            this.output += renderedSentences;
          } else {
            this.output += "<div class='text'>\n";
            this.output += renderedSentences;
            this.output += '</div>\n';
          }
        });

        if (lastSlide) {
          this.output += "<div class='fragment' id='eos'></div>";
          this.output += "<div class='coffee' id='coffee'><i class='fa-solid fa-mug-hot'></i></div>";
        }
        this.output += '</section>\n';
      });
    });

    this.output += '</section>\n';
    return this.output;
  }

  /**
   * Escape HTML special characters for code blocks.
   */
  _escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Export globally
window.Parser = Parser;
