# Changelog

All notable changes to Paradocs are documented in this file.

## [0.9.0] - 2026-03-13

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
- Comprehensive Jest test suite (158 tests across 6 suites)
- Chinese (zh-CN) and Korean (ko-KR) language support
- 4-language navigation dropdown (EN/JA/ZH/KO)
- Template-based page build system (`scripts/build-pages.js`)

### Fixed
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
- Documentation: "ignored" → "removed" for auto-segmentation note handling (EN/ZH/KO)
- Documentation: Markdown compatibility notes expanded (underline vs italic, slide/deck separators, HTML escaping, Setext headings, nested lists)

### Changed
- Migrated from Ruby/Sinatra server to fully static client-side site
- All processing happens in the browser (no server needed)
- Library versions: Reveal.js 5.2.1, Bootstrap 5.3.8, Font Awesome 6.7.2, jQuery 3.7.1, Ace Editor 1.36.5

## [0.8.0] - 2026-03-10

### Changed
- Updated Ruby gems and frontend CDN libraries
- Security fixes (XSS, injection, parameter validation)
- Codebase cleanup (unused constants, debug code, CSS bugs)
