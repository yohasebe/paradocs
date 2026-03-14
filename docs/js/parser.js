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

function segmentSentences(text, locale) {
  // Try Intl.Segmenter first (available in modern browsers)
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter(locale || undefined, { granularity: 'sentence' });
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

/**
 * Escape HTML angle brackets in user text before markdown processing.
 * This prevents XSS while preserving all markdown syntax (**, *, _, ==, etc.).
 */
function sanitizeUserText(text) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMarkdown(text) {
  return marked.parse(text);
}

function renderInlineMarkdown(text) {
  // Use marked.parse but strip wrapping <p> tags for inline use
  return marked.parse(text).replace(/<\/?p[^>]*>/g, '').trim();
}

// ---------------------------------------------------------------------------
// Quiz processing (ported from helper.rb process_quiz)
// ---------------------------------------------------------------------------

function processQuiz(sentence) {
  // Skip MCQ blocks — they use {mcq:...} syntax
  if (/\{mcq:/i.test(sentence)) return sentence;
  return sentence.replace(/\{([^}]+)\}\s*/g,
    "</span> <span class='fragment quiz'>$1</span><span class='fragment quiz_dummy' style='margin: 0;'></span><span>&nbsp;"
  );
}

// ---------------------------------------------------------------------------
// MCQ (Multiple Choice Quiz) processing
// ---------------------------------------------------------------------------

function processMCQ(text, lang) {
  return text.replace(/\{mcq:\s*(.+?)\n([\s\S]*?)\}/g, function(_match, question, optionsBlock) {
    const options = parseMCQOptions(optionsBlock);
    if (options.length === 0) return _match; // fallback: leave as-is
    return buildMCQHtml(question.trim(), options, lang);
  });
}

function parseMCQOptions(block) {
  const lines = block.trim().split('\n');
  const options = [];
  for (const line of lines) {
    const cleaned = line.replace(/^\s*\|\s*/, '').trim();
    if (!cleaned) continue;
    const isCorrect = cleaned.startsWith('*');
    const text = isCorrect ? cleaned.substring(1).trim() : cleaned;
    const m = text.match(/^([a-zA-Z])\)\s*(.+)$/);
    if (m) {
      options.push({ label: m[1], text: m[2].trim(), correct: isCorrect });
    }
  }
  return options;
}

function buildMCQHtml(question, options, lang) {
  var incorrectLabels = { 'ja': '\u2717 不正解', 'zh': '\u2717 不正确', 'ko': '\u2717 오답' };
  var correctLabels = { 'ja': '\u2713 正解!', 'zh': '\u2713 正确!', 'ko': '\u2713 정답!' };
  var resetLabels = { 'ja': '\u21bb もう一度', 'zh': '\u21bb 再试一次', 'ko': '\u21bb 다시 시도' };
  var langPrefix = (lang || '').split('-')[0].toLowerCase();
  var incorrectText = incorrectLabels[langPrefix] || '\u2717 Incorrect';
  var correctText = correctLabels[langPrefix] || '\u2713 Correct!';
  var resetText = resetLabels[langPrefix] || '\u21bb Try Again';

  let html = "<div class='mcq-quiz' data-answered='false' data-correct-label='" + sanitizeUserText(correctText) + "' data-incorrect-label='" + sanitizeUserText(incorrectText) + "'>\n";
  html += "  <div class='mcq-question'>" + renderInlineMarkdown(sanitizeUserText(question)) + "</div>\n";
  html += "  <div class='mcq-options'>\n";
  for (const opt of options) {
    html += "    <div class='mcq-option' data-correct=\"" + opt.correct + "\" data-label='" + sanitizeUserText(opt.label) + "'>";
    html += "<span class='mcq-label'>" + sanitizeUserText(opt.label) + ")</span> " + renderInlineMarkdown(sanitizeUserText(opt.text));
    html += "</div>\n";
  }
  html += "  </div>\n";
  html += "  <div class='mcq-feedback' style='display:none;'></div>\n";
  html += "  <div class='mcq-reset' style='display:none;' role='button' tabindex='0'>" + sanitizeUserText(resetText) + "</div>\n";
  html += "</div>";
  return html;
}

// ---------------------------------------------------------------------------
// Markdown table detection
// ---------------------------------------------------------------------------

function isMarkdownTable(lines) {
  if (lines.length < 2) return false;
  // All lines must start and end with |
  const allPiped = lines.every(l => /^\s*\|.*\|\s*$/.test(l));
  if (!allPiped) return false;
  // Second line must be a separator (|---|---|)
  return /^\s*\|[\s\-:]+(\|[\s\-:]+)+\|\s*$/.test(lines[1]);
}

// ---------------------------------------------------------------------------
// Parser class
// ---------------------------------------------------------------------------

class Parser {
  /**
   * @param {string} text - The raw Paradocs document text
   * @param {object} config - Configuration object with `prefix` property
   * @param {function} [imageResolver] - Optional function(name) that resolves local image names to data URLs
   */
  constructor(text, config, imageResolver) {
    config = config || {};
    // Normalize line endings
    this.data = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    this.output = '';
    this.config = config;
    const prefix = config.prefix || '';
    this.poster = prefix + 'img/loading.gif';
    this.imageResolver = imageResolver || null;

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
      // Split by ---- or ~~~~ (slide separator / auto-animate separator)
      // Keep the separator tokens so we know which type was used
      let parts = deck.split(/^(\s*(?:- ?){4,}\s*|\s*(?:~ ?){4,}\s*)$/m);

      // Build slides array with auto-animate flags
      let slides = [];
      let autoAnimateNext = false;
      for (let pi = 0; pi < parts.length; pi++) {
        let part = parts[pi];
        if (/^\s*(?:- ?){4,}\s*$/.test(part)) {
          autoAnimateNext = false;
          continue;
        }
        if (/^\s*(?:~ ?){4,}\s*$/.test(part)) {
          autoAnimateNext = true;
          continue;
        }
        if (part.trim().length > 0) {
          slides.push({ content: part, autoAnimate: autoAnimateNext });
          autoAnimateNext = false;
        }
      }

      // Mark previous slide for auto-animate pairs (both slides need the attribute)
      for (let si = 1; si < slides.length; si++) {
        if (slides[si].autoAnimate) {
          slides[si - 1].autoAnimate = true;
        }
      }

      slides.forEach((slideObj, j) => {
        const slide = slideObj.content;
        const lastSlide = (j === slides.length - 1);

        var sectionAttrs = slideObj.autoAnimate ? "data-auto-animate" : "";
        this.output += "<section " + sectionAttrs + ">\n";

        // Split by blank lines (paragraph separator)
        let paragraphs = slide.split(/\n\n+/);
        paragraphs = paragraphs.filter(pg => pg.trim().length > 0);

        let mode = null;

        paragraphs.forEach((paragraph) => {
          let noFrag = false;

          // Markdown table: lines starting and ending with |, with separator row
          const tableLines = paragraph.trim().split('\n');
          if (isMarkdownTable(tableLines)) {
            const tableHtml = renderMarkdown(sanitizeUserText(paragraph.trim())).trim();
            this.output += "<div class='text'>\n" + tableHtml + '\n</div>\n';
            return; // skip rest of paragraph processing
          }

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

            // MCQ quiz: check for {mcq:...} in static text
            if (/\{mcq:/i.test(paragraph)) {
              const mcqHtml = processMCQ(paragraph, this.config.speech_lang);
              this.output += "<div class='text'>\n" + mcqHtml + '\n</div>\n';
              return; // skip rest of paragraph processing
            }
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
              const segmented = segmentSentences(cleaned, this.config.speech_lang);
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
              var noteText = noteMatch[3].trim();
              // For image/img notes, resolve local: or validate URL
              if (note.type === 'image' || note.type === 'img') {
                if (/^local:/.test(noteText) && this.imageResolver) {
                  var resolved = this.imageResolver(noteText.replace(/^local:/, ''));
                  noteText = resolved || '';
                } else if (!/^https?:\/\//i.test(noteText) && !/^data:image\//i.test(noteText)) {
                  noteText = '';  // discard non-http, non-data URLs
                }
              }
              note.text = noteText
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
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
            // youtube/yt: youtu.be URL (capture video ID, not query params)
            else if ((m = sentence.match(/^(?:youtube|yt):\s*?https?:\/\/youtu\.be\/([^?\s]+(?:\?.+)?)/))) {
              mode = 'yt';
              spans.push(m[1] || '');
              numYtVideos += 1;
            }
            // image/img:
            else if ((m = sentence.match(/^(?:image|img):\s*?(.+)/))) {
              let imgSrc = (m[1] || '').trim();
              // Resolve local: prefix to data URL via imageResolver
              if (imgSrc.match(/^local:/)) {
                const localName = imgSrc.replace(/^local:/, '');
                if (this.imageResolver) {
                  const resolved = this.imageResolver(localName);
                  imgSrc = resolved || 'LOCAL_NOT_FOUND:' + localName;
                }
              }
              spans.push(imgSrc);
              mode = 'im';
            }
            // inline image ![...](...)
            else if ((m = sentence.match(/^!\[[^\]]*\]\((.*?)\)/))) {
              let inlineImgSrc = (m[1] || '').trim();
              // Resolve local: prefix to data URL via imageResolver
              if (inlineImgSrc.match(/^local:/)) {
                const localName = inlineImgSrc.replace(/^local:/, '');
                if (this.imageResolver) {
                  const resolved = this.imageResolver(localName);
                  inlineImgSrc = resolved || 'LOCAL_NOT_FOUND:' + localName;
                }
              }
              spans.push(inlineImgSrc);
              mode = 'im';
            }
            // unordered list: * item
            else if ((m = sentence.match(/^\* (.+)$/))) {
              const classStr = noFrag ? '' : 'fragment';
              const rendered = renderInlineMarkdown(sanitizeUserText(m[1]));
              const alpha = '•';
              const markerTd = `<td style='white-space:nowrap;width:1px;padding:5px 0.4em 5px 0;vertical-align:baseline;'>${alpha}</td>`;
              const contentTd = `<td style='padding:5px 0;vertical-align:baseline;'><span class='${classStr}' data-note='${noteId}'>${rendered}</span></td>`;
              if (startFrom === null) {
                startFrom = alpha;
                spans.push(`<table style='margin-right:auto;border-collapse:collapse;'><tbody><tr>${markerTd}${contentTd}</tr>`);
              } else {
                spans.push(`<tr>${markerTd}${contentTd}</tr>`);
              }
              mode = 'list-table';
            }
            // ordered list: N. item  or  a. item
            else if ((m = sentence.match(/^([^.\s]+)\. (.*)$/))) {
              const classStr = noFrag ? '' : 'fragment';
              const alpha = m[1];
              const rendered = renderInlineMarkdown(sanitizeUserText(m[2]));
              const markerTd = `<td style='white-space:nowrap;width:1px;padding:5px 0.4em 5px 0;vertical-align:baseline;text-align:right;'>${alpha}.</td>`;
              const contentTd = `<td style='padding:5px 0;vertical-align:baseline;'><span class='${classStr}' data-note='${noteId}'>${rendered}</span></td>`;

              if (startFrom === null) {
                startFrom = alpha;
                spans.push(`<table style='margin-right:auto;border-collapse:collapse;'><tbody><tr>${markerTd}${contentTd}</tr>`);
              } else if (startFrom !== alpha) {
                startFrom = alpha;
                spans.push(`<tr>${markerTd}${contentTd}</tr>`);
              } else {
                // startFrom === alpha: append to last span
                spans[spans.length - 1] += `<tr>${markerTd}${contentTd}</tr>`;
              }
              mode = 'list-table';
            }
            // blockquote
            else if (/^> /.test(sentence)) {
              // Preserve '> ' prefix for stripping in case 'bq';
              // sanitize only the content after the prefix.
              spans.push('> ' + sanitizeUserText(sentence.slice(2)));
              mode = 'bq';
            }
            // code block (4 spaces or tab)
            else if (/^(?:\t|\s{4,})/.test(sentence)) {
              spans.push(sentence);  // code blocks are escaped via _escapeHtml later
              mode = 'cb';
            }
            // headings
            else if (/^#+/.test(sentence)) {
              spans.push(sanitizeUserText(sentence));
              mode = 'hd';
            }
            // regular sentence
            else {
              const classStr = noFrag ? '' : 'fragment';
              spans.push(`<span class='${classStr}' data-note='${noteId}'>${sanitizeUserText(sentence)}</span>`);
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
              // Validate YouTube ID: only alphanumeric, hyphens, underscores
              if (!/^[a-zA-Z0-9_-]+$/.test(ytid)) {
                renderedSentences = `<div class='text'><p><span class='${classStr}' style='color:#e15759;'>Invalid YouTube video ID</span></p></div>`;
                break;
              }
              let ytUrl = `https://www.youtube.com/embed/${ytid}?enablejsapi=1&autoplay=0`;
              params.slice(1).forEach(param => {
                const pm = param.match(/^(start|end)=([\d:]+)$/);
                if (pm) {
                  ytUrl += `&${pm[1]}=${this.colonToSec(pm[2])}`;
                }
                // Ignore unrecognized parameters to prevent injection
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
              if (!this._isValidMediaUrl(vidUrl.split('#')[0])) {
                renderedSentences = `<div class='text'><p><span class='${classStr}' style='color:#e15759;'>Invalid video URL: ${this._escapeHtml(vidUrl)}</span></p></div>`;
                break;
              }
              if (paragraphs.length === 1) {
                renderedSentences = `<img class='${classStr}' src='${this.poster}' id='poster-${numMedia}' alt='Video loading' />\n`;
                renderedSentences += `<video class='${classStr}' src='${vidUrl}' preload='auto' id='md${numMedia}' controls style='display: none;' />\n`;
              } else {
                renderedSentences = `<div class='text'><p><span class='${classStr}'><a target='_blank' href='${vidUrl}'> <i class='fa-solid fa-download'></i> <span>download to video</span></a></span></p></div>`;
              }
              break;
            }

            // Audio
            case 'au': {
              const audioUrl = spans.join('').trim();
              if (!this._isValidMediaUrl(audioUrl.split('#')[0])) {
                renderedSentences = `<div class='text'><p><span class='${classStr}' style='color:#e15759;'>Invalid audio URL: ${this._escapeHtml(audioUrl)}</span></p></div>`;
                break;
              }
              const audio = `<audio class='${classStr}' src='${audioUrl}' preload='auto' id='md${numMedia}' controls />`;
              renderedSentences = `<div class='text'><p>${audio}</p></div>`;
              break;
            }

            // Image
            case 'im': {
              const imgUrl = spans.join('').trim();
              if (imgUrl.startsWith('LOCAL_NOT_FOUND:')) {
                const missingName = imgUrl.replace('LOCAL_NOT_FOUND:', '');
                renderedSentences = `<div class='text'><p><span class='${classStr}' style='color:#e15759;'>Local image not found: ${this._escapeHtml(missingName)}</span></p></div>`;
                break;
              }
              if (!this._isValidMediaUrl(imgUrl)) {
                renderedSentences = `<div class='text'><p><span class='${classStr}' style='color:#e15759;'>Invalid image URL: ${this._escapeHtml(imgUrl)}</span></p></div>`;
                break;
              }
              if (paragraphs.length === 1) {
                renderedSentences = `<img class='${classStr} large_img' src='${imgUrl}' alt='Slide image' style='cursor:zoom-in;' title='Click to enlarge'/>`;
              } else {
                renderedSentences = `<div class='text'><p><img class='${classStr}' src='${imgUrl}' alt='Slide image' style='max-width:60%;max-height:50vh;cursor:zoom-in;' title='Click to enlarge'/></p></div>`;
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
                const safeText = notes[nid].text;
                return ` data-note='${safeText}' data-notetype='${notes[nid].type}'>`;
              });
              if (noFrag) {
                renderedSentences = processQuiz(renderedSentences);
              }
              renderedSentences = "<div class='list-table'>\n" + renderedSentences + '\n</div>';
              break;
            }

            // Blockquote
            case 'bq': {
              // Each span is already sanitized via sanitizeUserText() at detection time.
              // Strip '> ' prefix and render inline markdown per line.
              const bqLines = spans.map(s => renderInlineMarkdown(s.replace(/^> /, '')));
              renderedSentences = "<blockquote style='font-size: 0.9em; box-shadow: none; border-left: 4px solid; padding-left: 0.8em; text-align: left;'>"
                + bqLines.join('<br>') + '</blockquote>';
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
                const safeText = notes[nid].text;
                return ` data-note='${safeText}' data-notetype='${notes[nid].type}'>`;
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
   * Validate that a URL looks like a valid media URL.
   */
  _isValidMediaUrl(url) {
    // http(s) URLs
    if (/^https?:\/\/[^\s'"<>]+$/i.test(url)) return true;
    // data:image/ URLs (for local uploaded images, reject non-image data URLs)
    if (/^data:image\/(jpeg|png|gif|webp);base64,[A-Za-z0-9+/=]+$/i.test(url)) return true;
    return false;
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

// Configure marked once at load time
configureMarked();

// Export globally
window.Parser = Parser;
