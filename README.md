# 360Channel Corporate Site Assets

株式会社360Channel（[https://corp.360ch.tv/](https://corp.360ch.tv/)）のコーポレートサイトで使用される、カスタムJavaScriptおよび静的アセットを管理・配信するためのリポジトリです。

## 📌 概要
このプロジェクトは、ノーコードツール「STUDIO」で構築されたサイトに対し、軽量なDOMユーティリティやブラウザAPI（IntersectionObserver / MutationObserver 等）を使ってヘッダー色の切替やレイアウト調整などのフロントエンド補助機能を提供するために運用されています。以前はGSAPを利用していましたが、現在は不要なため使用していません。

## 📂 ディレクトリ構成
- **src/**: 開発用のソースコード（TypeScript / 読みやすいJavaScript）。ロジックの修正や機能追加はここで行います。
- **dist/**: 配信用の最適化済みコード。軽量化（Minify）されており、jsDelivr CDNを通じて本番環境に反映されます。

## 🚀 配信方法 (jsDelivr)
本リポジトリ内のファイルは、jsDelivrを使用して以下のURL形式で外部（STUDIO等）から読み込んでいます。

`https://cdn.jsdelivr.net/gh/ch360-develop/corp-site-assets/dist/[ファイル名]`

## 🛠 主な機能
- スクロール位置および特定セクションに応じたヘッダーカラーの動的変更
- 背景色の輝度判定によるテキスト色（White / Black）の自動スイッチ
- 実績リスト（Works）等のグリッドレイアウトにおける要素整列の自動調整
- ページ遷移（Route Change）時のスクロールリセットや必要な初期化処理

## 📝 開発者向けメモ
- **使用ライブラリ（現在）**: `throttle-debounce`、ブラウザ組み込みAPI（`IntersectionObserver`, `MutationObserver` 等）
- **注意**: `package.json` に `gsap` が残っている場合は、不要であれば依存から削除して問題ありません。
- **更新フロー**: 
    1. `src/` 内のコードを修正
    2. 軽量化ビルドを行い `dist/` 内のファイルを更新
    3. 変更をGitHubへPush（jsDelivr経由でサイトに反映）

---
© 360Channel, Inc.
