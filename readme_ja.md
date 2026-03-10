<div id="overview" class="anchor"></div>

## これは何？

<span class='marker'>**Paradocs** (paragraph-oriented document presentation system) はパラグラフ指向のテキスト・プレゼンテーション・システムです。</span>
たくさんのテキストをパラグラフ（段落）ごとに示すのに適しています。
Paradocs では1枚のスライドに1つのパラグラフを表示することを基本としています。
キーやボタンを1回押すたびに、センテンスが次々とハイライトされます。
これにより、発表者が今どのセンテンスに注目しているか、聴衆は把握することができます。

Paradocsの開発者は、これを自身が担当する大学の英語リーディングの授業で個人的に使うため開発しました。リーディングの授業では教師も学生も終始下を向いて時間のほとんどを過ごしがちですが、これは悲しいことです。<span class='marker'>1行1センテンス形式のテキスト・データさえ用意すれば、授業中に使用するプレゼン資料を簡単に用意できます。</span>Zoomなどの遠隔ミーティングアプリと一緒に使えば、オンライン授業を行う際にも活用できるでしょう。

<span class='marker'>Paradocsには 多言語の音声読み上げ機能があります。</span>Google Chrome、Mozilla Firefox、Apple Safari、Microsoft EdgeといったブラウザのWeb Speech APIを用いており、コンピュータにインストールされている複数の言語から1つ選んで、プレゼン中の好きなときにセンテンスを読み上げさせることができます。

作成したプレゼンは、ユーザー自身による口頭での発表に使うことができます。<span class='marker'>あるいは、全体を自動でプレゼンさせることもできます。</span>画面右上の魔法の杖アイコンをクリックしてください。現在のスライドの次の断片から発表全体の最終の断片まで、テキストの読み上げや動画再生などが次々と自動で実行されます。

Paradocsの多くの機能は、Hakim El Hattab さんが開発したプレゼン用スライド作成ライブラリ [Reveal.js](https://revealjs.com)に依存しています（MIT License）。素晴らしいライブラリを提供していただき感謝します。背景の美しい壁紙は <a href='https://www.transparenttextures.com/'>Transparent Textures</a> で提供されているものを使っています。

Paradocsは[長谷部陽一郎](https://yohasebe.com)が開発しました。テキストの変換処理はすべてブラウザ内で完結しており、サーバーにデータが送信されることはありません。

## アーキテクチャ

Paradocsはサーバーサイドの依存がない完全な静的サイトです。テキストからスライドへの変換はクライアントサイドJavaScriptでブラウザ内で実行されます。

- **入力ページ** (`docs/index.html`, `docs/ja/index.html`) — Aceエディタによるテキスト入力、設定フォーム、クライアントサイドでの変換処理
- **プレゼンページ** (`docs/deck.html`) — Reveal.jsベースのスライドビューア、`sessionStorage`からデータを読み込み
- **パーサー** (`docs/js/parser.js`) — Paradocs独自のテキスト形式をReveal.js HTMLに変換
- **CSSジェネレータ** (`docs/js/helper.js`) — 設定からプレゼン用スタイルを生成
- **ドキュメントビルダー** (`scripts/build-docs.js`) — MarkdownドキュメントをHTMLフラグメントに変換するNode.jsスクリプト

### 主要ライブラリ（CDN経由）

jQuery 3.7.1, jQuery UI 1.14.1, Bootstrap 5.3.8, Reveal.js 5.2.1, Ace Editor 1.36.5, Font Awesome 6.7.2, marked 15.x, Tippy.js 6.3.7

### 開発

```bash
npm install            # 開発用依存のインストール（marked）
npm run build:docs     # docs/data/ のドキュメントフラグメントを再生成
```

### デプロイ

GitHub Pages の `docs/` フォルダから配信します。`master`ブランチにプッシュし、GitHub Pages の設定で`docs/`ディレクトリを指定してください。
