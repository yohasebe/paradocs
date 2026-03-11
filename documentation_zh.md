## 文档

<div id="bindings" class="anchor"></div>

### 1. 快捷键

演示过程中的许多操作可以通过鼠标完成，也可以使用键盘进行操作。


| 按键                       | 功能                                                                       |
|:--------------------------|:-------------------------------------------------------------------------------|
| `↓`                      | 移动到**下一个**项目                                                     |
| `↑`                      | 返回**上一个**项目                                             |
| `j`                       | 移动到**下一个**项目                                                     |
| `k`                       | 返回**上一个**项目                                             |
| `SPACE`                   | 移动到**下一个**项目                                                     |
| `SHIFT+SPACE`             | 返回**上一个**项目                                             |
| `.`                       | 播放/停止**文本转语音朗读**；播放/停止**视频/音频片段**（包括 YouTube 视频）；放大/缩小**弹出图片** |
| `a`                       | 播放/停止**自动演示**                                           |
| `/`                       | 进入/退出屏幕**黑屏**模式                                                 |
| `f`                       | 进入**全屏模式**                                                      |
| `ESC`                     | 进入**概览模式**；退出**全屏模式**                              |
| `s`                       | 显示/隐藏**便签**                                                      |
| `p`                       | 启用/禁用**激光笔**模式                                          |
| `SHIFT+TAB`               | 完成编辑（取消焦点）**便签**                                      |
| `g`                       | 在新标签页中打开 **Google** 搜索当前选中的文本 |

**提示**

> 推荐使用 [Logitech Wireless Presenter R400/R800](https://www.logitech.com/en-us/presenters) 演示遥控器。它可以让您在 Paradocs 演示过程中通过物理按钮切换项目，以及启动/停止文本转语音、视频和音频播放。

----

<div id="concepts" class="anchor"></div>

### 2. 基本概念

**句子**

句子之间通过单个换行符（`↩`）分隔。在段落中，句子被视为相邻元素，依次逐个高亮显示。
自动分句功能可以根据所使用的语言自动将文本拆分为句子。要执行自动分句，请在文本开头添加 `!!` 前缀。

**段落**

由多个句子组成的块称为段落。段落由多行文本组成，每行包含一个句子。

**块**

块之间通过两个或更多连续换行符 `↩↩` 分隔；一个块可以包含多个元素。由多个句子组成的块特别称为段落。

**幻灯片**

幻灯片也可以称为"页面"。幻灯片之间通过四个或更多连字符后跟一个换行符（`----↩` 或 `- - - -↩`）分隔。一张幻灯片可以包含多个块。

#### 如何编写段落

将多个句子垂直排列，每行一个句子，即可构成段落。

```text
----
Sentence #1
Sentence #2
Sentence #3
----
```

使用自动分句功能，以上内容可以写成如下形式：

```text
----
!! Sentence #1 Sentence #2 Sentence #3
----
```

要执行自动分句，请在文本开头添加 `!!` 前缀。同时，每个句子必须以句号或其他标点符号结尾。


#### 如何在一张幻灯片中排列多个块

要在一张幻灯片上放置多个块，请在块之间留一个空行。

```text
----
Block #1 Sentence #1
Block #1 Sentence #2

Block #2 Sentence #1
Block #2 Sentence #2
----
```

#### 创建多张幻灯片（页面）

幻灯片也可以理解为页面。一张幻灯片可以包含多个块。

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

### 3. 块的类型

以下是对各种块类型的说明。

#### 标题

您可以创建不同级别的标题。标题将以所选的强调色显示。

```text
----
# Heading 1

## Heading 2

### Heading 3
----
```

#### 普通段落

普通段落由每行一个句子的块构成。

```text
This is regular paragraph.
Sentences in static text are highlighted when focused.
They are printed in grey when not focused.
```

在普通段落中，按键会将高亮从一个句子移动到下一个句子。当文本无法同时显示在幻灯片中时，幻灯片会自动滚动。

#### 静态段落

要创建静态段落，请在构成段落的每个句子开头放置一个竖线符号和一个空格。

```text
| This is static paragraph.
| Sentences in static text are not highlighted
| They are always printed in black.
```

或

```text
| This is static paragraph.
  Sentences in static text are not highlighted
  They are always printed in black.
```

在查看静态段落时，逐句高亮功能会被关闭。需要注意的是，当静态段落内容超出幻灯片范围时，不会自动滚动。

#### 无序列表

这就是所谓的项目符号格式。要描述无序列表的元素，请在每行开头放置一个星号和一个空格。

```text
* Unordered list item 1
* Unordered list item 2
* Unordered list item 3
```

当所有元素无法在幻灯片中完全显示时，列表会自动滚动。

#### 有序列表

这是顺序列表的格式。要描述此类列表的元素，请在每行开头放置一个数字/字母、一个句点和一个空格。

```text
1. Ordered list item 1
2. Ordered list item 2
3. Ordered list item 3

a. Ordered list item 1
b. Ordered list item 2
c. Ordered list item 3
```

当所有元素无法在幻灯片中完全显示时，列表会自动滚动。

**注意** 无法指定列表的起始数字/字母。

#### 编号块

您可以创建带有指定编号的块。这在演示中展示公式或练习题时非常有用。

```text
365. The number in a numbered block will be printed only once;
     the left-hand side of the text can have multiple lines
     the lines are aligned nicely
```

**注意** 上述示例中第二行及后续行左侧的空格是必需的。

----

<div id="decoration" class="anchor"></div>

### 4. 文本装饰与注释

#### 文本装饰

文本片段可以进行加粗、斜体、下划线或高亮处理。

```text
Italic:    orange *strawberry* apple
Bold:      orange **strawberry** apple
Underline: orange _strawberry_ apple
Highlight: orange ==strawberry== apple
```

#### Markdown 兼容性

Paradocs 支持 Markdown 语法的一个子集，同时也有自己的格式规则。下表总结了支持的内容及其与标准 Markdown (GFM) 的区别。

| 功能 | Paradocs 语法 | 标准 Markdown | 备注 |
|:--------|:----------------|:------------------|:------|
| 加粗 | `**text**` | `**text**` | 语法相同 |
| 斜体 | `*text*` | `*text*` | 语法相同 |
| 下划线 | `_text_` | `_text_`（斜体） | Paradocs 使用 `_` 表示下划线，而非斜体 |
| 高亮 | `==text==` | 不适用 | Paradocs 扩展功能 |
| 表格 | `\| col \| col \|` | `\| col \| col \|` | 兼容 GFM；通过 [marked.js](https://marked.js.org/) 渲染 |
| 标题 | `# Heading` | `# Heading` | 语法相同（支持 1-3 级） |
| 无序列表 | `* item` | `* item` | 语法相同 |
| 有序列表 | `1. item` | `1. item` | 语法相同；还支持 `a. item` |

**注意** Paradocs 拥有专为演示用途设计的文本解析器。虽然部分语法与 Markdown 重叠，但以下标准 Markdown 功能**不受支持**：行内代码（`` `code` ``）、引用块（`>`）、图片（`![alt](url)`）和嵌套列表。请使用 Paradocs 专用命令（`image:`、`video:` 等）来嵌入媒体内容。

#### 显示注释和弹出图片

可以在与正文分开的注释中显示简短文本。注释使用花括号和 `note` 命令创建。除了文本注释之外，您还可以使用 `image` 命令指定文件 URL 来创建图片弹窗。

```text
This is part of main text. {note: This is a note}
This is also part of main text. {note: This is another note}
You can also add a pop-up image. {image: url_to_your_image_file.(png|jpg|gif)}
```

**注意** 注释和弹出图片可用于"普通段落"和"无序/有序列表"中（不适用于静态段落）。使用自动分句功能时无法显示注释和弹出图片。花括号 `{ }` 及其内部的文本将被忽略。

#### 测验

使用花括号和 `quiz` 命令，您可以创建一种测验效果，最初将文本对观众隐藏，在适当时机再予以揭示。

```text
| In a static context, words and phrases in {curly brackets}
| will be rendered as {quiz items} overlayed by an opaque box.
```

**注意** 创建测验时，必须使用静态段落或静态有序/无序列表。

#### 选择题（MCQ）

您可以创建带有可点击选项的选择题，供观众作答。将 MCQ 块放在静态段落中（以 `|` 开头的行）。

```text
| {mcq: What is the capital of France?
|   a) London
|   b) Berlin
|   *c) Paris
|   d) Rome
| }
```

在正确答案的选项字母前加上 `*` 进行标记。当用户点击选项时，正确答案会以绿色高亮显示，错误答案会以红色高亮，同时正确答案会被揭示。回答后会出现一个**重试**按钮，允许重置并再次作答。

#### 表格

您可以使用标准 Markdown 表格语法创建表格。所有行必须以 `|` 开始和结束，第二行必须是分隔符。

```text
| Name  | Score |
|-------|-------|
| Alice | 95    |
| Bob   | 87    |
```

**注意** 以 `|` 开始和结束的表格行与仅在行首有 `|` 的静态段落是有区别的。

----

<div id="embedding" class="anchor"></div>

### 5. 嵌入媒体文件

您可以在幻灯片中嵌入图片、视频和音频。

#### 嵌入图片

您可以指定上传到网络上的 PNG/JPG/GIF 格式图片文件的 URL，并将其显示在幻灯片上。图片会被尽可能放大显示。

```text
image: url_to_your_image_file.png
```

或

```text
img: url_to_your_image_file.png
```

**注意**
要在幻灯片上显示图片，请确保上述命令是该幻灯片上唯一的块。如果存在多个块，图片本身不会显示，而是以图片链接的形式呈现。

**提示**

> 如果您想嵌入自己的图表，可以使用 [Google Drawings](https://docs.google.com/drawings/u/0/create)，并粘贴其"发布到网络"功能生成的图片链接。您也可以使用 [Mermaid Live Editor](https://mermaid-js.github.io/mermaid-live-editor)，获取"Link to SVG"来嵌入流程图或甘特图等商业图表。

#### 嵌入 YouTube 视频

您可以指定 YouTube 视频的 URL 并将其显示在幻灯片上。视频会被尽可能放大显示。

```text
youtube: https://www.youtube.com/watch?v=Ks-_Mh1QhMc
```

或

```text
yt: https://www.youtube.com/watch?v=Ks-_Mh1QhMc
```

您可以在 YouTube 视频的 URL 中指定起止时间点。可以通过视频开头起经过的秒数来指定。以 `&start=x&end=y` 格式将选项添加到 URL。以下示例将播放视频的第 30 秒（`x=30`）到第 60 秒（`y=60`）。

```text
youtube: https://www.youtube.com/watch?v=MMmOLN5zBLY&start=30&end=60
```

您也可以使用"时:分:秒"格式指定起止时间，这对许多用户来说可能更加直观。

```text
youtube: https://www.youtube.com/watch?v=MMmOLN5zBLY&start=0:30&end=1:00
```

**注意** 要在幻灯片上显示 YouTube 视频，请确保上述命令是该幻灯片上唯一的块。如果存在多个块，视频本身不会显示，而是以视频链接的形式呈现。

#### 嵌入 MP4 视频

您可以指定上传到网络上的 MP4 格式视频文件的 URL，并将其显示在幻灯片上。视频会被放大至（接近）整个幻灯片页面。

```text
video: url_to_your_video_file.mp4
```

您可以在视频的 URL 中指定起止时间点。请注意，每个时间点以视频开头起经过的秒数表示。以 `#t=x,y` 格式将选项添加到 URL。以下示例将从视频最开始播放（`x=0`），并在 5 秒后停止（`y=5`）。

```text
video: url_to_your_video_file.mp4#t=0,5
```

**注意** 要在幻灯片上显示 MP4 视频，请确保上述命令是该幻灯片上唯一的块。如果存在多个块，视频本身不会显示，而是以视频链接的形式呈现。

#### 嵌入 MP3 音频

您可以指定上传到网络上的 MP3 格式音频文件的 URL，并将其显示在幻灯片上。

```text
audio: url_to_your_audio_file.mp3
```

您可以在 MP3 音频的 URL 中指定起止时间点。请注意，每个时间点以音频开头起经过的秒数表示。以 `#t=x,y` 格式将选项添加到 URL。以下示例将从音频最开始播放（`x=0`），并在 5 秒后停止（`y=5`）。

```text
audio: url_to_your_audio_file.mp3#t=0,5
```

**注意** 单张幻灯片上可以包含多个音频文件。当所有块无法在当前视口中完全显示时，幻灯片页面会自动滚动。

<div id="additional" class="anchor"></div>

----

### 6. 附加功能

#### 文本转语音

普通段落中的句子可以通过浏览器中可用的文本转语音引擎进行朗读。可用的语言和语音类型因操作系统和浏览器而异。

当高亮内容支持 TTS 时，演示屏幕左上角会出现一个扬声器图标。点击此图标或按键盘上的 `.` 键即可播放 TTS 语音。再次点击按钮或按键即可停止播放。

在 TTS 播放过程中，当前正在朗读的单词会以黄色背景高亮显示。这种单词级高亮可以帮助观众跟随朗读内容。播放结束或停止时，高亮会自动清除。

**注意** 单词级高亮依赖于浏览器的 `onboundary` 事件支持。在 Chrome 和 Edge 中效果良好，但并非所有浏览器都支持此功能。

#### 便签

您可以在演示过程中将想到的内容写在便签上，展示给观众。

点击演示屏幕左上角的便签图标即可显示或隐藏便签。即使幻灯片切换，便签的内容也会保留。

#### 激光笔

您可以将鼠标指针从普通样式切换为类似激光笔的彩色圆点。点击屏幕左上角的 ● 图标即可切换模式。

鼠标指针的颜色由设置面板中"强调色"的选择决定。


#### 自动演示

点击屏幕左上角的魔法棒图标。从当前幻灯片的下一个片段到整个演示文稿的最后一个片段，文本朗读、视频播放等将自动依次执行。

#### 自动保存

您输入的文本和表单设置会在您输入时自动保存到浏览器的本地存储中。当您再次访问页面时，之前的内容会自动恢复。点击**清除文本**按钮可以清除编辑器和已保存的数据。

#### 下载 HTML

点击**下载 HTML**按钮，将您的演示文稿导出为独立的 HTML 文件。该文件包含所有幻灯片内容、配置和样式，因此无需访问 Paradocs 网站即可在任何浏览器中打开。外部库依赖（jQuery、Reveal.js 等）通过 CDN 加载。

**注意** 在导出的文件中，YouTube 视频嵌入会自动转换为可点击的缩略图链接，因为由于浏览器安全限制，本地 HTML 文件无法嵌入 YouTube iframe。点击缩略图即可在 YouTube 上打开视频。

#### URL 分享

演示文稿的 URL 会在您浏览幻灯片和片段时自动更新。您可以通过复制浏览器地址栏中的 URL（例如 `#/0/1/3`）来分享特定位置。当他人打开分享的 URL 时，会直接跳转到该幻灯片和片段。

#### 深色模式（反色）

勾选**反色**复选框即可切换到深色模式。所有演示元素——包括便签、注释弹窗、标记、幻灯片编号和导航控件——都会调整颜色，以便在深色背景下舒适浏览。
