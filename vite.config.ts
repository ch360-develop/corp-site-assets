import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  // 開発サーバー / プレビューで CORS を許可（userscript 等からのクロスオリジン classic script 対応）
  server: { cors: true },
  preview: { cors: true },
  css: {
    // `backdrop-filter` を削除させないため Lightning CSS を使わず PostCSS を使用する
    transformer: "postcss",
  },
  build: {
    outDir: "dist", // 出力先フォルダ
    cssMinify: "esbuild",
    lib: {
      // エントリーポイントの指定
      entry: resolve(__dirname, "src/main.ts"),
      name: "CorpSiteAssets",
      // 出力ファイル名を固定する
      fileName: () => "main.js",
      cssFileName: "main",
      // STUDIOで読み込むため、即時実行関数（IIFE）形式で書き出す
      formats: ["iife"],
    },
    rollupOptions: {
      external: [],
    },
    // ミニファイ（軽量化）を有効にする
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // コンソール出力を削除
      },
    },
  },
});
