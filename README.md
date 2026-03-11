<p align="center">
  <img src="docs/img/paradocs.png" alt="Paradocs" width="120">
</p>

<h1 align="center">Paradocs</h1>

<p align="center">
  <strong>Paragraph-Oriented Document Presentation System</strong><br>
  <a href="https://yohasebe.github.io/paradocs">https://yohasebe.github.io/paradocs</a>
</p>

---

**Paradocs** is a browser-based presentation tool that lets you present text documents sentence by sentence. Each key press highlights the next sentence, so the audience always knows exactly where the presenter is focusing.

Originally developed for ESL reading classes, it is well-suited for any scenario where you walk through text in a structured way — language lessons, reading seminars, document reviews, and more.

All processing runs entirely in the browser. No server, no account, no data sent anywhere.

<p align="center">
  <img src="docs/img/paradocs-demo.gif" alt="Paradocs demo" width="720">
</p>

## Features

- **Sentence-by-sentence highlighting** — Navigate through text one sentence at a time
- **Text-to-Speech** — Read sentences aloud with word-level highlighting
- **Automatic presentation** — Auto-advance through all slides with TTS
- **Rich content** — Headings, lists, tables, static text, and numbered blocks
- **Media embedding** — Images, YouTube videos, MP4 video, and MP3 audio
- **Quizzes** — Fill-in-the-blank and multiple-choice quizzes with retry
- **Notes and pop-ups** — Tooltips and image popups on any sentence
- **Text decoration** — Bold, italic, underline, and highlight (Markdown-compatible)
- **Dark mode** — Inverted color scheme for comfortable viewing
- **Auto-save** — Your text and settings are saved automatically
- **HTML export** — Download as a standalone HTML file for offline use
- **Laser pointer and sticky notes** — Tools for live presentations
- **Multi-language UI** — English, Japanese, Chinese, and Korean

## Quick Start

1. Open **[https://yohasebe.github.io/paradocs](https://yohasebe.github.io/paradocs)**
2. Type or paste your text (or load the sample)
3. Adjust settings if needed (font, colors, TTS language, etc.)
4. Click **Convert Text**
5. Present! Use arrow keys or space bar to advance

## How It Works

Write your text with **one sentence per line**. Separate slides with `----`.

<p align="center">
  <img src="docs/img/text.png" alt="Input and output" width="640">
</p>

Various block types are available:

<p align="center">
  <img src="docs/img/blocks.png" alt="Block types" width="640">
</p>

For the full format reference and all features, see the **Documentation** tab in the app.

## Key Bindings

| Key | Function |
|:----|:---------|
| `↓` `j` `SPACE` | Next item |
| `↑` `k` `SHIFT+SPACE` | Previous item |
| `.` | Play/stop TTS, video, or audio |
| `a` | Toggle automatic presentation |
| `f` | Fullscreen |
| `s` | Show/hide sticky note |
| `p` | Toggle laser pointer |
| `/` | Screen blackout |
| `ESC` | Overview mode |

> **Tip:** A wireless presenter like [Logitech R400/R800](https://www.logitech.com/en-us/presenters) works great with Paradocs — use its physical buttons to navigate and control TTS.

## Background

I started building Paradocs in **2018** for my ESL reading classes. In a typical reading class, both the teacher and students spend most of their time looking down at printed text — I wanted to change that by projecting the text on screen and walking through it sentence by sentence.

Since then, it has evolved from a server-based tool into a **fully client-side application** — all processing now runs in the browser with no server dependency. The presentation engine is powered by [Reveal.js](https://revealjs.com) by Hakim El Hattab. Background wallpapers are from [Transparent Textures](https://www.transparenttextures.com/).

## For Developers

Paradocs is a fully static site. See the `docs/` directory for the source. Contributions are welcome.

```bash
npm install          # Install dev dependencies
npm test             # Run tests
npm run build:docs   # Rebuild documentation fragments
npm run build:pages  # Rebuild language pages from template
npm run build        # Run both
```

## License

MIT

## Author

[Yoichiro Hasebe](https://yohasebe.com)
