# Changelog

All notable changes to Paradocs are documented in this file.

## [1.0.0] - 2026-03-26

### Added
- Page separation: app page (`index.html`) and docs page (`docs.html`) are now independent
- Collapsible settings panel with categorized groups (Presentation, Appearance, Speech)
- Settings toggle button in button row, auto-scrolls to panel on open
- Style panel smart toggle: inline markers (bold, italic, etc.) and line-level prefixes (headings, lists) now toggle on/off
- Sync toggle label dynamically shows current mode ("Click to scroll" / "Click to preview")
- Google Fonts (News Cycle, Lato) loaded in deck.html and preview iframes for correct heading display
- Fixed sticky footer (single line, always visible at bottom)

### Fixed
- CPU leak: `setInterval` without `clearInterval` in `waitUntilFinished()` caused infinite polling
- CPU leak: `setInterval` instead of `setTimeout` for timed media stop caused permanent loop
- Media polling now clears previous interval before starting new one, with 5-minute safety timeout
- Overview blank slides: FOUC `opacity:0` style was leaking into overview iframe CSS
- Overview now uses inline CSS (same as filmstrip preview) for reliable rendering
- Exporter: overview icon updated (`fa-grip`), beep icon added, image lightbox included
- Exporter: YouTube thumbnail preserves aspect ratio (`object-fit:contain`), text no longer overflows
- `.` key opens URL in new tab when a link fragment is focused (including YouTube in downloaded HTML)
- Sample text URLs updated from `yohasebe.com` to `yohasebe.github.io`
- Security: API keys no longer exposed on `window` global; access via closure-scoped getter/setter
- Security: `showError()` uses `.text()` instead of `.html()` to prevent XSS
- Security: Image list UI rebuilt with DOM API (`createElement`/`textContent`) instead of `innerHTML`
- Security: Content Security Policy (CSP) meta tag added to all HTML pages
- Security: Exporter fetch checks `r.ok` status before using response
- Style panel buttons now use `type="button"` to prevent unintended form submission
- CSP updated to allow external images, media, and source maps
- Preview updates no longer cause page or filmstrip scroll during editing
- Performance: `mousemove` cursor tracking throttled via `requestAnimationFrame`
- Parser errors now log full stack trace to console for debugging

### Changed
- Slide separator changed from `----` (4+) to `---` (3+), matching Markdown convention
- Deck concept removed: `====` now treated as regular slide separator
- Deck button removed from style panel
- Doc sources reorganized into `docs/<lang>/` directories
- Japanese README (`README_ja.md`) added
- App page: large center logo removed (navbar logo only)
- Documentation navbar item now includes Overview in dropdown menu
- Editor textarea height adjusts automatically when style panel opens/closes (flex layout)
- Editor default font size reduced from 16px to 14px
- Style panel background color changed for visual distinction
- Build system generates 2 pages per language (app + docs) from separate templates
- Obsolete `page-template.html` removed
- Default resolution values extracted to named constants (`DEFAULT_RESOLUTION`, `DEFAULT_WIDTH`, `DEFAULT_HEIGHT`)
- Allowed resolutions list extracted to `ALLOWED_RESOLUTIONS` constant

## [0.9.0] - 2026-03-14

### Added
- Local image upload with drag-and-drop, localStorage persistence
- Inline image syntax `![alt](local:filename)` for uploaded images
- Unified lightbox for all slide images (click or `.` key to zoom)
- `.` key shortcut: image zoom, audio/video play/pause, TTS read-aloud (context-aware)
- Multiple Choice Quiz (MCQ) i18n labels (EN/JA/ZH/KO)
- Dark mode (inverted colors) with full CSS support
- HTML export as standalone file
- Auto-save per language (text, form settings, images)
- Clear Text / Reset All split buttons
- Two-column responsive layout (settings + image upload)
- Navbar icon with theme color
- Strikethrough (`~~text~~`) and fenced code block support in Markdown compatibility table
- Inline code (`` `code` ``) and blockquote (`>`) added to Markdown compatibility table
- Link (`[text](url)`) and image (`![alt](url)`) Markdown syntax support
- `b` key as alternative to `.` key documented
- Deck separator (`====`) documented with explanation
- TTS word-level highlighting during read-aloud
- Ordered list support for multi-digit numbers (10., 11., etc.)
- `Intl.Segmenter` locale-aware sentence splitting
- Comprehensive Jest test suite (184 tests across 7 suites)
- Chinese (zh-CN) and Korean (ko-KR) language support
- 4-language navigation dropdown (EN/JA/ZH/KO)
- Template-based page build system (`scripts/build-pages.js`)
- Filmstrip preview panel with virtual scroll, lightbox, and resize handle
- Auto-animate transition support (`~~~~` slide separator)
- Overview mode mouse wheel scrolling
- Drop zone and button row side-by-side layout on wide screens
- Custom grid-based overview (ESC key toggle, arrow key navigation, Enter to select)
- Beep sound on fragment advance (toggle via bell icon)
- Save/Load source text via File dropdown menu (with security validation)
- YouTube thumbnail placeholders in filmstrip and overview (maxresdefault with hqdefault fallback)
- Cloud TTS integration (OpenAI and ElevenLabs) with streaming playback, prefetching, and per-provider API key management
- Cloud TTS speed control (OpenAI), API key verification, and ElevenLabs voice list auto-fetch
- Toggle switch UI for filmstrip sync control
- Style panel for quick insertion of Paradocs markdown and custom tags
- Blockquote rendering with left border and line break preservation

### Fixed
- Blockquote `> ` prefix was HTML-escaped by `sanitizeUserText()`, preventing marked from parsing it
- Preview sanitizer regex incorrectly stripped `data-onclick` / `aria-on*` attributes
- Preview sanitizer script tag regex strengthened for multiline and orphaned tags
- Cloud TTS API key management unified: single source of truth via `_cloudKeys` object
- Cloud TTS voice restore `setInterval` now exits early on fetch failure
- Cloud TTS synthesis timeout hardcoded values replaced with `SYNTHESIS_TIMEOUT` constant
- Unused marked `renderer.blockquote` override removed (blockquote now rendered directly)
- XSS: file name escaping in error messages and image list display
- XSS: `fromJSON()` now sanitizes keys and validates data URL MIME types
- XSS: CSS injection in deck.html uses `createElement('style')` with `textContent`
- SVG data URLs rejected in image validation (XSS prevention)
- MCQ no longer reveals correct answer on wrong selection
- `restoreTimer` infinite loop bug (primitive property assignment)
- `setInterval`/`clearTimeout` mismatch in `paradocs.js`
- `hasSavedData()` returns false for empty strings
- Sample image URLs updated from yohasebe.com to yohasebe.github.io
- `MAX_CHARS` constant used consistently (no hardcoded 50000)
- Keyboard shortcuts skip INPUT/TEXTAREA elements in deck.html
- Lightbox closes gracefully on image load error
- Fetch error handling for sample text loading
- `renderInlineMarkdown` p-tag regex handles attributes
- `<option>` tags no longer contain invalid `<span>` elements
- `og:image` / `twitter:image` meta tag duplication resolved
- Keycode comment corrected (13 = ENTER, not ESC)
- Duplicate `keyboard: true` property removed from Reveal.js config
- Footer trailing pipe character removed
- Security: postMessage origin validation in deck.html
- Security: `document.write()` replaced with dynamic script loading
- CSS syntax fix: missing colon in `margin-top` declaration
- Documentation: "Dark Mode" → "Invert Colors" (4 languages)
- Documentation: "URL Sharing" → "Slide Position and Internal Links" (4 languages)
- Documentation: "ignored" → "removed" for auto-segmentation note handling (EN/ZH/KO)
- Documentation: Markdown compatibility notes expanded (underline vs italic, slide/deck separators, HTML escaping, Setext headings, nested lists)
- Removed unused `data-header`/`data-footer` attributes from parser output
- MP3 sample URLs updated to GitHub Pages domain
- List item spacing (bullet/number to text gap) adjusted via inline table styles
- Overview icon changed from arrows to grid icon (`fa-grip`)
- File operation buttons consolidated into dropdown menu
- `alert()` replaced with inline messages for file load errors
- Security: `parseInt` radix specified, event listener deduplication, HTML sanitization refined

### Changed
- Migrated from Ruby/Sinatra server to fully static client-side site
- All processing happens in the browser (no server needed)
- Library versions: Reveal.js 5.2.1, Bootstrap 5.3.8, Font Awesome 6.7.2, jQuery 3.7.1, Ace Editor 1.36.5

## [0.8.0] - 2026-03-10

### Changed
- Updated Ruby gems and frontend CDN libraries
- Security fixes (XSS, injection, parameter validation)
- Codebase cleanup (unused constants, debug code, CSS bugs)
