<div id="overview" class="anchor"></div>

## Overview 

<span class='marker'>**Paradocs** (<a href="https://yohasebe.com/paradocs">https://yohasebe.com/paradocs</a>) is a paragraph-oriented text presentation system.</span> It is suitable for presenting a large piece of text, typically paragraph by paragraph, while making comments and explanations. With Paradocs, each press of a key or button highlights one sentence after another. This allows the audience to know which particular sentence the presenter is focusing on at the moment.

The creator of Paradocs originally developed it for personal use in an ESL reading class at the university he works at. In reading classes, both teachers and students tend to spend most of their time looking down, which, he thought, was a sad thing. <span class='marker'>With Paradocs, you can easily prepare presentations for use in class by simply formatting the original text into a "one sentence per line" format.</span> You can use it in conjunction with a remote meeting app such as Zoom to conduct online classes.

<span class='marker'>Paradocs has multi-lingual text-to-speech (TTS) capability,</span> which uses the Web Speech API of browsers such as Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge, allowing you to choose one of the multiple languages installed on your computer and have the sentence read out for you and your audience whenever you want during your presentation.

The presentation can be used by the user to give an oral presentation. <span class='marker'>Or, you can have the whole thing presented automatically.</span> Click on the magic wand icon in the upper right hand corner of the screen. From the next fragment of the current slide to the final fragment of the entire presentation, text reading, video playback, etc. will be performed automatically, one after another.

Many of the features of Paradocs rely on the presentation slide creation library [Reveal.js](https://revealjs.com) developed by Hakim El Hattab. I am truly grateful to him and his collaborators for this wonderful library.  The beautiful background wallpaper is provided by <a href='https://www.transparenttextures.com/'>Transparent Textures</a>.

Paradocs was developed by [Yoichiro Hasebe](https://yohasebe.com). All text processing is done entirely in the browser — no data is sent to any server.

## Architecture

Paradocs is a fully static site with no server-side dependencies. The text-to-slides conversion is done entirely in the browser using client-side JavaScript.

- **Input page** (`docs/index.html`, `docs/ja/index.html`) — Ace editor for text input, configuration form, client-side parsing
- **Presentation page** (`docs/deck.html`) — Reveal.js-based slide viewer, reads data from `sessionStorage`
- **Parser** (`docs/js/parser.js`) — Converts Paradocs custom text format to Reveal.js HTML
- **CSS generator** (`docs/js/helper.js`) — Generates presentation styles from configuration
- **Doc builder** (`scripts/build-docs.js`) — Node.js script that converts Markdown documentation to HTML fragments

### Key libraries (via CDN)

jQuery 3.7.1, jQuery UI 1.14.1, Bootstrap 5.3.8, Reveal.js 5.2.1, Ace Editor 1.36.5, Font Awesome 6.7.2, marked 15.x, Tippy.js 6.3.7

### Development

```bash
npm install            # Install dev dependencies (marked)
npm run build:docs     # Rebuild documentation fragments in docs/data/
```

### Deployment

The site is served from the `docs/` folder via GitHub Pages. Push to `master` and configure GitHub Pages to serve from the `docs/` directory.
