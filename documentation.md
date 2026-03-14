## Documentation

<div id="bindings" class="anchor"></div>

### 1. Key Bindings

Many operations available during the presentation can be performed using the mouse, but can also be operated using the keyboard.


| Key                       | Function                                                                       |
|:--------------------------|:-------------------------------------------------------------------------------|
| `↓`                      | Move to the **next** item                                                     |
| `↑`                      | Move back to the **previous** item                                             |
| `j`                       | Move to the **next** item                                                     |
| `k`                       | Move back to the **previous** item                                             |
| `SPACE`                   | Move to the **next** item                                                     |
| `SHIFT+SPACE`             | Move back to the **previous** item                                             |
| `.` or `b`                | Play/Stop **TTS read-aloud**; Play/Stop **video/audio clips** (including YouTube videos); Enlarge/Shrink **pop-up images** |
| `a`                       | Play/Stop **automatic presentation**                                           |
| `/`                       | Enter/Exit screen **blackout**                                                 |
| `f`                       | Enter **fullscreen-mode**                                                      |
| `ESC`                     | Toggle **overview mode** (grid view of all slides); Exit **fullscreen-mode**   |
| `s`                       | Show/hide **sticky note**                                                      |
| `p`                       | Enable/disable **laser pointer** mode                                          |
| `SHIFT+TAB`               | Finish editing (de-focus) **sticky note**                                      |
| `g`                       | Open **Google** in a new browser tab and search text string currently selected |

**TIPS** 

> I recommend [Logitech Wireless Presenter R400/R800](https://www.logitech.com/en-us/presenters), a presentation pointer device. It allows you to use the physical buttons to move between items while presenting in Paradocs and to start/stop text-to-speech, video, and audio.

----

<div id="concepts" class="anchor"></div>

### 2. Basic Concepts

**Sentence**

Sentences are separated by a single line break (`↩`). In a paragraph, they are treated as adjacent elements, each of which are highlighted one after the other.
The automatic sentence-segmentation feature allows you to automatically split the text into sentences according to the language used. To perform automatic sentence-segmentation, prefix the text with `!!` at the beginning of the text.

**Paragraph**

A block made up of multiple sentences is called a paragraph. A paragraph is represented by a block consisting of multiple lines, each of which has a single sentence.

**Block**

A block is separated by two or more consecutive line breaks `↩↩`; a single block can have more than one element. A block composed of multiple sentences is specifically called a paragraph.

**Slide**

A slide can also be called a "page." Slides are separated by a single line break after four or more hyphens (`----↩` or`- - - -↩`). A single slide can have more than one block.

**Deck**

A deck is a group of slides. Decks are separated by four or more equals signs (`====`). When a presentation contains multiple decks, slides within each deck are arranged vertically within the same horizontal section in Reveal.js.

#### How to describe a paragraph

Multiple sentences are arranged vertically with a line break to form a paragraph.

```text
----
Sentence #1 
Sentence #2  
Sentence #3 
----
```

With the automatic sentence splitting feature, the above can be written as follows:

```text
----
!! Sentence #1 Sentence #2 Sentence #3
----
```

To perform automatic sentence splitting, prefix the text with `!!` at the beginning of the text. Also, each sentence must end with a sentence delimiter, such as a period or some other punctuation mark.


#### How to arrange multiple blocks in a slide

To place more than one block on a single slide, place a single line of space between blocks.

```text
----
Block #1 Sentence #1
Block #1 Sentence #2

Block #2 Sentence #1
Block #2 Sentence #2
----
```

#### Create multiple slides (pages)

A slide can also be said to be a page. A single slide can contain multiple blocks.

```text
----
Slide #1
----
Slide #2
----
Slide #3
----
```

----

<div id="blocks" class="anchor"></div>

### 3. Types of Blocks

The following is a description of the various types of blocks.

#### Headings

You can create different levels of headings. The headings will be displayed in the selected accent color.

```text
----
# Heading 1 

## Heading 2 

### Heading 3 
----
```

#### Regular Paragraphs

A regular paragraph is created by describing a block with one sentence per line.

```text
This is regular paragraph. 
Sentences in static text are highlighted when focused. 
They are printed in grey when not focused. 
```

In a normal paragraph, pressing a key will move the highlight from sentence to sentence. The slide frame automatically scrolls when the text cannot fit on it at the same time.

#### Static Paragraphs

To create a static paragraph, place a vertical bar sign and a space at the head of each sentence that makes up the paragraph.

```text
| This is static paragraph. 
| Sentences in static text are not highlighted 
| They are always printed in black. 
```

or

```text
| This is static paragraph. 
  Sentences in static text are not highlighted 
  They are always printed in black. 
```

When you are viewing a static paragraph, the per-sentence highlighting is turned off. It is important to note that a static paragraph does not automatically scroll when it does not fit on the slide.

#### Unordered Lists 

This is the so-called bullet point format. To describe the elements of an unordered list, put an asterisk and a space at the beginning of each line.

```text
* Unordered list item 1
* Unordered list item 2 
* Unordered list item 3 
```

The list scrolls automatically when all the elements don't fit on the slide.

#### Ordered Lists

This is the format of a sequential list. To describe the elements of this type of list, put a number/letter, a period, and a space at the beginning of each line.

```text
1. Ordered list item 1
2. Ordered list item 2
3. Ordered list item 3

a. Ordered list item 1
b. Ordered list item 2
c. Ordered list item 3
```

The list scrolls automatically when all the elements don't fit on the slide.

**N.B.** It is not possible to specify the first number/letter in the list.

#### Numbered Blocks

You can create a block with a specified number.  This is useful when you want to present formulas or exercises in your presentation.

```text
365. The number in a numbered block will be printed only once; 
     the left-hand side of the text can have multiple lines 
     the lines are aligned nicely
```

**N.B.** The white spaces to the left of the second and subsequent lines in the above example are important.

----

<div id="decoration" class="anchor"></div>

### 4. Decoration and Annotation

#### Text Decoration

Text segments can be bolded, italicized, underlined, or highlighted.

```text
Italic:    orange *strawberry* apple
Bold:      orange **strawberry** apple
Underline: orange _strawberry_ apple
Highlight: orange ==strawberry== apple
```

#### Markdown Compatibility

Paradocs supports a subset of Markdown syntax alongside its own formatting rules. The table below summarizes what is supported and how it differs from standard Markdown (GFM).

| Feature | Paradocs Syntax | Standard Markdown | Notes |
|:--------|:----------------|:------------------|:------|
| Bold | `**text**` | `**text**` | Same syntax |
| Italic | `*text*` | `*text*` | Same syntax |
| Underline | `_text_` | `_text_` (italic) | Paradocs uses `_` for underline, not italic |
| Highlight | `==text==` | N/A | Paradocs extension |
| Strikethrough | `~~text~~` | `~~text~~` | GFM-compatible |
| Tables | `\| col \| col \|` | `\| col \| col \|` | GFM-compatible; rendered via [marked.js](https://marked.js.org/) |
| Links | `[text](url)` | `[text](url)` | Same syntax |
| Images | `![alt](url)` | `![alt](url)` | Same syntax; also supports `![alt](local:filename)` for uploaded images |
| Headings | `# Heading` | `# Heading` | Same syntax (levels 1-3) |
| Unordered Lists | `* item` | `* item` | Same syntax |
| Ordered Lists | `1. item` | `1. item` | Same syntax; also supports `a. item` |
| Inline Code | `` `code` `` | `` `code` `` | Same syntax |
| Blockquotes | `> text` | `> text` | Same syntax |
| Code Block | ` ``` ` | ` ``` ` | Fenced code blocks; language specifier (e.g. ` ```python `) is ignored |

**N.B.** Paradocs has its own text parser designed for presentation use. While some syntax overlaps with Markdown, please note the following differences:

- `_text_` produces **underline**, not italic (use `*text*` for italic)
- `----` (4+ hyphens) is a **slide separator**, not a horizontal rule
- `====` (4+ equals) is a **deck separator** (groups of slides)
- Raw HTML tags (e.g. `<b>`, `<div>`) are **escaped** and displayed as plain text
- **Nested lists** are not supported (use flat lists only)
- **Setext-style headings** (`Title` followed by `===` or `---`) are not supported; use ATX-style (`# Title`) instead
- For full-slide media, use the dedicated Paradocs commands (`image:`, `video:`, etc.)

#### Showing Notes and Pop-up Images

It is possible to display short text in notes that are separated from the body text. Notes are created using braces and the `note` command. In addition to the text notes, you can create an image popup by specifying the file URL with the `image` command.

```text
This is part of main text. {note: This is a note}
This is also part of main text. {note: This is another note}
You can also add a pop-up image. {image: url_to_your_image_file.(png|jpg|gif)}
```

**N.B.** Notes and pop-up images are available in "regular paragraphs" and "unordered/ordered lists" (not available in static paragraphs). You cannot display notes and pop-up images when the automatic sentence-segmentation function is used. The curly brackets `{ }` and the text inside will be removed.

#### Quizzes

Using curly brackets and the `quiz` command, you can create a quiz in such a way that you initially keep the text hidden from your audience and reveal it at the appropriate time.

```text
| In a static context, words and phrases in {curly brackets}
| will be rendered as {quiz items} overlayed by an opaque box.
```

**N.B.** When creating a quiz, you must use a static paragraph or a static ordered/unordered list.

#### Multiple Choice Quiz (MCQ)

You can create a multiple choice quiz with clickable options. The presenter clicks an option to reveal whether it is correct. Place the MCQ block inside a static paragraph (lines starting with `|`).

```text
| {mcq: What is the capital of France?
|   a) London
|   b) Berlin
|   *c) Paris
|   d) Rome
| }
```

Mark the correct answer with `*` before the option letter. Clicking the correct option highlights it green. Clicking a wrong option highlights only that option red and shows a **Try Again** prompt—the correct answer is not revealed, so the user can keep trying. A **Try Again** button appears after answering correctly, allowing the quiz to be reset.

#### Tables

You can create tables using standard Markdown table syntax. All lines must start and end with `|`, and the second line must be a separator.

```text
| Name  | Score |
|-------|-------|
| Alice | 95    |
| Bob   | 87    |
```

**N.B.** Table rows starting and ending with `|` are distinguished from static paragraphs, which only have `|` at the start of each line.

----

<div id="embedding" class="anchor"></div>

### 5. Embedding Media Files

You can embed images, videos, and audio into your slides.

#### Embed Images

You can specify the URL of an image file in PNG/JPG/GIF format uploaded on the web and display it on the slide. The image will be enlarged as much as possible.

```text
image: url_to_your_image_file.png
```

or

```text
img: url_to_your_image_file.png
```

**N.B.** 
To display an image on a slide, make sure that the above command is the only block on that slide. If multiple blocks are described, the images themselves are not displayed, but links to the images are used.

**TIPS** 

> If you want to embed your own diagrams, you can use [Google Drawings](https://docs.google.com/drawings/u/0/create) and can paste image links generated by its `Publish to the web` function. Or you can also use [Mermaid Live Editor](https://mermaid-js.github.io/mermaid-live-editor) and get `Link to SVG` to embed business diagrams such as flowcharts or Gantt charts.

#### Local Images

You can upload images from your device using the drop zone next to the editor. Supported formats: JPEG, PNG, GIF, WebP (max 5MB each). Uploaded images are stored in the browser's local storage and persist across page reloads and browser restarts. They are cleared when you click the **Reset All** button or manually clear your browser data.

To insert a local image as a full-slide image, click the filename in the image list, or type:

```text
image: local:your_image_file.jpg
```

You can also use standard Markdown image syntax for inline local images:

```text
![description](local:your_image_file.jpg)
```

#### Embed YouTube Video

You can specify the URL of the YouTube video and display it on the slide. The video will be enlarged as much as possible.

```text
youtube: https://www.youtube.com/watch?v=Ks-_Mh1QhMc
```

or

```text
yt: https://www.youtube.com/watch?v=Ks-_Mh1QhMc
```

You can specify the start and end points in the URL of the youtube video. It is possible to specify them by the number of seconds that have elapsed since the beginning of the video. Add the options to the URL in the `&start=x&end=y` format. The following will play from 30 seconds (`x=30`) to 60 seconds (`y=60`) of the video.

```text
youtube: https://www.youtube.com/watch?v=MMmOLN5zBLY&start=30&end=60
```

You can also specify the start time and the end time by "hour:min:sec" notation, which may be easier for many users.

```text
youtube: https://www.youtube.com/watch?v=MMmOLN5zBLY&start=0:30&end=1:00
```

**N.B.** To display a YouTube video on a slide, make sure that the above command is the only block on that slide. If multiple blocks are described, the videos themselves are not displayed, but links to the videos are used.

#### Embed MP4 Video

You can specify the URL of a video file in MP4 format uploaded on the web and display it on the slide. The video will be enlarged to the (nearly) entire slide page.

```text
video: url_to_your_video_file.mp4
```

You can specify the start and end points in the URL of the video. Note that each is represented by the number of seconds that have elapsed since the beginning of the video. Add the options to the URL in the `#t=x,y` format. The following will play from the very beginning of the video (`x=0`) and stop it after 5 seconds (`y=5`).

```text
video: url_to_your_video_file.mp4#t=0,5
```

**N.B.** To display an MP4 video on a slide, make sure that the above command is the only block on that slide. If multiple blocks are described, the videos themselves are not displayed, but links to the videos are used.

#### Embed MP3 Audio

You can specify the URLs of audio files in MP3 format uploaded on the web and display them on the slide. 

```text
audio: url_to_your_audio_file.mp3
```

You can specify the start and end points in the URL of the mp3 audio. Note that each is represented by the number of seconds that have elapsed since the beginning of the audio clip. Add the options to the URL in the `#t=x,y` format. The following will play from the very beginning of the audio clip (`x=0`) and stop it after 5 seconds (`y=5`).

```text
audio: url_to_your_audio_file.mp3#t=0,5
```

**N.B.** It is possible to have multiple audio files in a single slide. The slide page automatically scrolls when all the blocks do not fit on the current viewport.

<div id="additional" class="anchor"></div>

----

### 6. Additional Features

#### Text-to-Speech

Sentences in regular paragraphs can be read aloud using the browser's built-in Web Speech API (`speechSynthesis`). This is a standard browser API, not limited to Chrome — it works in Safari, Firefox, Edge, and other modern browsers.

The available voices include both browser-provided voices (e.g., Google TTS in Chrome, Microsoft TTS in Edge) and OS-level system voices (e.g., macOS Siri voices, Windows SAPI voices). You can select the **Speech Language** and **Speech Voice** from the dropdowns on the input page. The **Speech Rate** can also be adjusted, though some voices may not support rate changes.

When TTS is available for highlighted content, a speaker icon appears in the upper left corner of the presentation screen. Click on this icon or press the `.` key on the keyboard to play the TTS voice. You can stop playback by clicking the button or hitting the key again.

During TTS playback, the word currently being spoken is highlighted with a yellow background. This word-level highlighting helps the audience follow along with the read-aloud text. The highlighting is automatically cleaned up when playback ends or is stopped.

**N.B.** Word-level highlighting depends on the browser's `onboundary` event support. It works well in Chrome and Edge but may not be available in all browsers. The set of available languages and voices depends entirely on your OS and browser — installing additional language packs on your OS may add more voices.

#### Cloud TTS (Advanced)

In addition to the browser's built-in TTS, Paradocs supports cloud-based text-to-speech via **OpenAI** and **ElevenLabs** APIs. Cloud TTS offers higher-quality, more natural-sounding voices.

To use Cloud TTS, expand the **Cloud TTS (Advanced)** section on the input page:

1. **TTS Provider**: Select *OpenAI* or *ElevenLabs* from the dropdown. Selecting a cloud provider hides the browser TTS controls and shows cloud-specific options.
2. **API Key**: Enter your API key for the selected provider. Click **Verify** to check that the key is valid. Your key is stored only in your browser's local storage and is never sent to any server other than the provider's API.
3. **Voice**: For OpenAI, choose from a fixed list of voices (alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer). For ElevenLabs, the voice list is fetched from your account after entering a valid API key.
4. **Speed** (OpenAI only): Adjust the playback speed from 0.5× to 2.0×.

**Limitations:**

- Cloud TTS does not support word-level highlighting during playback (the browser's `onboundary` event is not available for cloud-generated audio).
- An active internet connection and a valid API key are required.
- API usage may incur costs according to the provider's pricing.
- When exporting as a standalone HTML file, API keys are **not** included in the exported file for security reasons. Cloud TTS will not be available in exported files.

#### Sticky Note

You can show your audience what comes to mind during your presentation by writing it in a sticky note. 

You can show or hide the sticky note by clicking its icon at the top left of the presentation screen. The contents of the sticky note will be retained even if the slide changes.

#### Laser Pointer

You can change shape/color of your mouse cursor from the ordinary one to a laser-pointer-like colored dot. Click on ● at the top left of the screen to toggle modes.

The color of the modified mouse pointer is determined by the selection for the "accent color" in the setting panel.


#### Automatic Presentation

Click on the magic wand icon in the upper left corner of the screen. From the next fragment of the current slide to the final fragment of the entire presentation, text read-aloud, video playback, etc. will be performed automatically, one after another.

#### Auto-Save

Your input text, form settings, and uploaded local images are automatically saved to the browser's local storage. When you revisit the page, your previous work is restored automatically—even after closing the browser. Click **Clear Text** to clear only the editor text, or **Reset All** to clear the editor, saved settings, and all uploaded images.

#### File Menu (Save / Load / Download)

The **File** dropdown button provides file operations:

- **Save Text** — Downloads the current editor text as a `.txt` file (`paradocs-source.txt`).
- **Load Text** — Opens a file picker to load a `.txt` or `.md` file into the editor. Files are validated for type (text only), size (max 1MB), and content safety (script tags and event handlers are stripped).
- **Download HTML** — Exports the presentation as a standalone HTML file (see below).

#### Download HTML

Click **Download HTML** in the File menu to export your presentation as a standalone HTML file. The file includes all slide content, configuration, and styles embedded directly, so it can be opened in any browser without needing to access the Paradocs website. External library dependencies (jQuery, Reveal.js, etc.) are loaded via CDN.

**N.B.** YouTube video embeds are automatically converted to clickable thumbnail links in the exported file, because local HTML files cannot embed YouTube iframes due to browser security restrictions. Click the thumbnail to open the video on YouTube.

#### Slide Position and Internal Links

The presentation URL updates automatically as you navigate through slides and fragments (e.g., `#/0/1/3`). You can use these hash-based URLs to create internal links that jump to a specific slide within your presentation — for example, linking from one slide to another using an anchor tag like `<a href="#/2">Go to slide 3</a>`.

#### Filmstrip Preview

Click the **Preview** button (eye icon) next to the action buttons to open a filmstrip panel on the right side of the editor. The panel displays slide thumbnails that update automatically as you type (after an 800ms delay).

- When **sync is ON** (default): **Click** a thumbnail to jump the editor cursor to the corresponding slide text and select it.
- When **sync is OFF**: **Click** a thumbnail to open a lightbox showing the slide at full size. Use **arrow keys** to navigate between slides, and **Escape** or click outside to close.
- The **sync toggle** (link icon in the editor header) enables automatic scrolling of the filmstrip to follow the editor cursor position.
- The filmstrip width is adjustable by dragging the resize handle between the editor and the panel.

If a parse error occurs while typing, the preview retains the last successfully rendered content.

**N.B.** The filmstrip panel is only available when the browser window is wider than 900px. On smaller screens, the preview button is hidden automatically. The filmstrip uses virtual scrolling to keep memory usage low even with many slides.

#### Overview Mode

Press **ESC** during a presentation to toggle the overview mode. This displays all slides as a grid of thumbnails, making it easy to navigate large presentations.

- Use **arrow keys** (←→↑↓) to move the selection between slides.
- Press **Enter** to jump to the selected slide and return to the presentation.
- Press **ESC** again to close the overview and return to the current slide.
- **Click** any thumbnail to navigate directly to that slide.

YouTube video slides show a thumbnail preview image instead of the embedded player. The grid icon in the top-right corner of the presentation screen also toggles the overview.

#### Beep Sound

Click the **bell icon** in the left toolbar of the presentation screen to enable a short beep sound that plays each time a fragment (sentence or list item) is advanced. This can help the audience notice each step in the presentation. Click the icon again to disable the beep.

#### Invert Colors

Check the **Invert Colors** checkbox to swap the highlight colors — the highlight background color is applied as a filled background and the text turns white, instead of the default colored text on a transparent background.
