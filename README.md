# <a href='https://yohasebe.com/paradocs'>Paradocs</a>

A Paragraph-Oriented Text Document Presentation System

<a href='https://yohasebe.com/paradocs'><img src="https://yohasebe.com/paradocs/img/paradocs.png"></a>

<hr />
<div id="overview" class="anchor"></div>

## Overview 

<span class='marker'>**Paradocs** (<a href="https://yohasebe.com/paradocs">https://yohasebe.com/paradocs</a>) is a paragraph-oriented text presentation system.</span> It is suitable for presenting a large piece of text, typically paragraph by paragraph, while making comments and explanations. With Paradocs, each press of a key or button highlights one sentence after another. This allows the audience to know which particular sentence the presenter is focusing on at the moment.

The creator of Paradocs originally developed it for personal use in an ESL reading class at the university he works at. In reading classes, both teachers and students tend to spend most of their time looking down, which, he thought, was a sad thing. <span class='marker'>With Paradocs, you can easily prepare presentations for use in class by simply formatting the original text into a "one sentence per line" format.</span> You can use it in conjunction with a remote meeting app such as Zoom to conduct online classes.

<span class='marker'>Paradocs has multi-lingual text-to-speech (TTS) capability,</span> which uses the Web Speech API of browsers such as Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge, allowing you to choose one of the multiple languages installed on your computer and have the sentence read out for you and your audience whenever you want during your presentation. (The TTS read-aloud function and some other functions cannot be used with Microsoft Internet Explorer.)

The presentation can be used by the user to give an oral presentation. <span class='marker'>Or, you can have the whole thing presented automatically.</span> Click on the magic wand icon in the upper right hand corner of the screen. From the next fragment of the current slide to the final fragment of the entire presentation, text reading, video playback, etc. will be performed automatically, one after another.

Many of the features of Paradocs rely on the presentation slide creation library [Reveal.js](https://revealjs.com) developed by Hakim El Hattab. I am truly grateful to him and his collaborators for this wonderful library.  The beautiful background wallpaper is provided by <a href='https://www.transparenttextures.com/'>Transparent Textures</a>.

Paradocs was developed by [Yoichiro Hasebe] (https://yohasebe.com). This site uses Google Analytics to analyze traffic, but does not collect user information through any other mechanism. The text data entered into this system is converted into a presentation and sent back to the user's browser, but is not stored on the server.
## Documentation

<div id="bindings" class="anchor"></div>

### 1. Key Bindings

Many available during the presentation can be performed using the mouse, but can also be operated using the keyboard.


| Key | Function |
|:--------------------------|:----------------------------------------------------------------------------|
| `↓`                       | Move to  the **next** item                                                  |
| `↑`                       | Move back to the **previous** item                                          |
| `j`                       | Move to  the **next** item                                                  |
| `k`                       | Move back to the **previous** item                                          |
| `SPACE`                   | Move to  the **next** item                                                  |
| `SHIFT+SPACE`             | Move back to the **previous** item                                          |
| `.`                       | Play/Stop **TTS read-aloud**; Play/Stop **video/audio clips** (including YouTube videos); Enlarge/Shrink **pop-up images** |
| `a`                       | Play/Stop **automatic presentation**                                        |
| `/`                       | Enter/Exit screen **blackout**                                              |
| `f`                       | Enter **fullscreen-mode**                                                   |
| `ESC`                     | Enter **overview-mode**; Exit **fullscreen-mode**                           |
| `s`                       | Show/hide **sticky note**                                                   |
| `SHIFT+TAB`                     | Finish editing (de-focus) **sticky note**                             |
| `g`                       | Open **Google** in a new browser tab                                        |

**TIPS** 

> I recommend [Logitech Wireless Presenter R400/R800](https://www.logitech.com/en-us/presenters), a presentation pointer device. It allows you to use the physical buttons to move between items while presenting in Paradocs and to start/stop text-to-speech, video, and audio.

----

<div id="concepts" class="anchor"></div>

### 2. Basic Concepts

**Sentence**

Sentences are separated by a single line break (`↩`). In a paragraph, they are treated as adjacent elements, each of which are highlighted one after the other.

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

#### How to arrange multiple blocks in a slide

To place more than one block on a single slide, place a single line of space between blocks.

```text
----
Block #1
Block #2  

Block #2 
Block #2 
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

In a normal paragraph, pressing a key will move the highlight from sentence to sentence.The slide frame automatically scrolls when the text cannot fit on it at the same time.

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

#### Showing Notes and Pop-up Images

It is possible to display short text in notes that are separated from the body text. Notes are created using braces and the `note` command. In addition to the text notes, you can create an image popup by specifying the file URL with the `image` command.

```text
This is part of main text. {note: This is a note}
This is also part of main text. {note: This is another note}
You can also add a pop-up image. {image: url_to_your_image_file.(png|jpg|gif)}
```

**N.B.** Notes and pop-up images are available in "regular paragraphs" and "unordered/ordered lists" (not available in static paragraphs).

#### Quizzes

Using curly brackets and the `quiz` command, you can create a quiz in such a way that you initially keep the text hidden from your audience and reveal it at the appropriate time.

```text
| In a static context, words and phrases in {curly brackets}
| will be rendered as {quize items} overlayed by an opaque box.
```

**N.B.** When creating a quiz, you must use a static paragraph or a static ordered/unordered list.

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

#### Embed YouTube Video

You can specify the URL of the YouTube video and display it on the slide. The video will be enlarged as much as possible.

```text
youtube: https://www.youtube.com/watch?v=Ks-_Mh1QhMc
```

or

```text
yt: https://www.youtube.com/watch?v=Ks-_Mh1QhMc
```

You can specify the start and end points in the URL of the youtube video. Note that each is represented by the number of seconds that have elapsed since the beginning of the video. Add the options to the URL in the `&start=x&end=y` format. The following will play from 12 minutes 27 seconds (`x=747`) to 12 minutes 55 seconds (`x=775`) of the video.

```text
youtube: https://www.youtube.com/watch?v=RKK7wGAYP6k&start=747&end=775
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

You can specify the start and end points in the URL of the mp3 video. Note that each is represented by the number of seconds that have elapsed since the beginning of the audio clip. Add the options to the URL in the `#t=x,y` format. The following will play from the very beginning of the audio clip (`x=0`) and stop it after 5 seconds (`y=5`).

```text
audio: url_to_your_audio_file.mp3#t=0,5
```

**N.B.** It is possible to have multiple audio files in a single slide. The slide page automatically scrolls when all the blocks do not fit on the current viewport.

<div id="additional" class="anchor"></div>

----

### 6. Additional Features

#### Text-to-Speech

Sentences in regular paragraphs can be played back with a text-to-speech engine available in your browser. The available languages and audio variations vary by OS and browser.

When TTS is available for highlighted content, a speaker icon appears in the upper right hand corner of the presentation screen. Click on this icon or press the `.` key on the keyboard to play the TTS voice. You can stop playback by clicking the button or hitting the key again.

#### Sticky Note

You can show your audience what comes to mind during your presentation by writing it in a sticky note. 

You can show or hide the sticky note by clicking its icon at the top right of the presentation screen. The contents of the sticky note will be retained even if the slide changes.

#### Automatic Presentation

Click on the magic wand icon in the upper right hand corner of the screen. From the next fragment of the current slide to the final fragment of the entire presentation, text read-aloud, video playback, etc. will be performed automatically, one after another.
