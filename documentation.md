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
| `.`                       | Play/Stop **TTS read-aloud**; Play/Stop **video/audio clips** (including YouTube videos); Enlarge/Shrink **pop-up images** |
| `a`                       | Play/Stop **automatic presentation**                                           |
| `/`                       | Enter/Exit screen **blackout**                                                 |
| `f`                       | Enter **fullscreen-mode**                                                      |
| `ESC`                     | Enter **overview-mode**; Exit **fullscreen-mode**                              |
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
| Tables | `\| col \| col \|` | `\| col \| col \|` | GFM-compatible; rendered via [marked.js](https://marked.js.org/) |
| Headings | `# Heading` | `# Heading` | Same syntax (levels 1-3) |
| Unordered Lists | `* item` | `* item` | Same syntax |
| Ordered Lists | `1. item` | `1. item` | Same syntax; also supports `a. item` |

**N.B.** Paradocs has its own text parser designed for presentation use. While some syntax overlaps with Markdown, the following standard Markdown features are **not supported**: inline code (`` `code` ``), blockquotes (`>`), images (`![alt](url)`), and nested lists. Use the dedicated Paradocs commands (`image:`, `video:`, etc.) for embedding media.

#### Showing Notes and Pop-up Images

It is possible to display short text in notes that are separated from the body text. Notes are created using braces and the `note` command. In addition to the text notes, you can create an image popup by specifying the file URL with the `image` command.

```text
This is part of main text. {note: This is a note}
This is also part of main text. {note: This is another note}
You can also add a pop-up image. {image: url_to_your_image_file.(png|jpg|gif)}
```

**N.B.** Notes and pop-up images are available in "regular paragraphs" and "unordered/ordered lists" (not available in static paragraphs). You cannot display notes and pop-up images when the automatic sentence-segmentation function is used. The curly brackets `{ }` and the text inside will be ignored.

#### Quizzes

Using curly brackets and the `quiz` command, you can create a quiz in such a way that you initially keep the text hidden from your audience and reveal it at the appropriate time.

```text
| In a static context, words and phrases in {curly brackets}
| will be rendered as {quiz items} overlayed by an opaque box.
```

**N.B.** When creating a quiz, you must use a static paragraph or a static ordered/unordered list.

#### Multiple Choice Quiz (MCQ)

You can create a multiple choice quiz with options that the audience can click to answer. Place the MCQ block inside a static paragraph (lines starting with `|`).

```text
| {mcq: What is the capital of France?
|   a) London
|   b) Berlin
|   *c) Paris
|   d) Rome
| }
```

Mark the correct answer with `*` before the option letter. When a user clicks an option, it is highlighted green (correct) or red (incorrect), and the correct answer is revealed. A **Try Again** button appears after answering, allowing the quiz to be reset and retried.

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

To insert a local image into a slide, click the filename in the image list, or type:

```text
image: local:your_image_file.jpg
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

Sentences in regular paragraphs can be played back with a text-to-speech engine available in your browser. The available languages and audio variations vary by OS and browser.

When TTS is available for highlighted content, a speaker icon appears in the upper left corner of the presentation screen. Click on this icon or press the `.` key on the keyboard to play the TTS voice. You can stop playback by clicking the button or hitting the key again.

During TTS playback, the word currently being spoken is highlighted with a yellow background. This word-level highlighting helps the audience follow along with the read-aloud text. The highlighting is automatically cleaned up when playback ends or is stopped.

**N.B.** Word-level highlighting depends on the browser's `onboundary` event support. It works well in Chrome and Edge but may not be available in all browsers.

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

#### Download HTML

Click the **Download HTML** button to export your presentation as a standalone HTML file. The file includes all slide content, configuration, and styles embedded directly, so it can be opened in any browser without needing to access the Paradocs website. External library dependencies (jQuery, Reveal.js, etc.) are loaded via CDN.

**N.B.** YouTube video embeds are automatically converted to clickable thumbnail links in the exported file, because local HTML files cannot embed YouTube iframes due to browser security restrictions. Click the thumbnail to open the video on YouTube.

#### URL Sharing

The presentation URL updates automatically as you navigate through slides and fragments. You can share a specific position by copying the URL from the browser's address bar (e.g., `#/0/1/3`). When someone opens the shared URL, they will jump directly to that slide and fragment.

#### Dark Mode (Inverted Colors)

Check the **Invert Colors** checkbox to switch to dark mode. All presentation elements — including sticky notes, annotation popups, markers, slide numbers, and navigation controls — adapt their colors for comfortable viewing on dark backgrounds.
