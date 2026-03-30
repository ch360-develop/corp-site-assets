import { throttle } from "throttle-debounce";
import { HomeModule } from "./HomeModule";
import "./main.css";

// 監視対象の要素（Nuxtのルート要素）
const targetNode = document.querySelector("#__nuxt");

const InitialPathname = "__INITIAL_PATHNAME__"; // 初期値を特定の文字列に設定

let currentPathname = InitialPathname;
let homeModule: HomeModule | null = null;

const onRouteMaybeChanged = () => {
  console.log(`MutationObserverが変化を検知しました: ${location.pathname}`);
  if (currentPathname !== location.pathname) {
    console.log(
      `ページ遷移によるレンダリングを検知しました: ${currentPathname} -> ${location.pathname}`,
    );

    // ルーティングに応じてHomeModuleをマウント・アンマウント
    if (location.pathname === "/") {
      if (!homeModule) {
        if (HomeModule.isReady()) {
          homeModule = new HomeModule();
          currentPathname = location.pathname;
          console.log("HomeModuleをマウントしました");
        } else {
          console.log("HomeModuleの必要な要素がまだ存在しません。");
        }
      }
    } else {
      currentPathname = location.pathname;
      if (homeModule) {
        homeModule.destroy();
        homeModule = null;
      }
    }
  }
  handleHeaderOverlapCheck();
};

const observer = new MutationObserver(
  // ページ遷移（DOMの変更）を検知
  throttle(100, onRouteMaybeChanged),
);

window.addEventListener("header:change-color", (e) => {
  const detail = (e as CustomEvent).detail;
  console.log(
    `header:change-colorイベントを受け取りました: ${JSON.stringify(detail)}`,
  );
  if (detail && detail.color && detail.color === "white") {
    document.querySelector("#header")?.classList.add("white");
  } else {
    document.querySelector("#header")?.classList.remove("white");
  }
});

enum BackgroundTone {
  Dark,
  Light,
  Other,
}

function classifyBackgroundTone(el: HTMLElement): BackgroundTone {
  const color = getRGBAValues(el);
  if (color.a < 0.6) {
    return BackgroundTone.Other;
  }

  const brightness = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;

  if (brightness <= 80) {
    return BackgroundTone.Dark;
  }

  if (brightness >= 186) {
    return BackgroundTone.Light;
  }

  return BackgroundTone.Other;
}

function getRGBAValues(el: HTMLElement): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  const style = getComputedStyle(el).backgroundColor;

  // 文字列から数字（整数および小数点）だけを抽出して配列にする
  // 例: "rgba(255, 0, 0, 0.5)" -> ["255", "0", "0", "0.5"]
  const matches = style.match(/[\d.]+/g);

  if (!matches || !matches[0] || !matches[1] || !matches[2]) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  return {
    r: parseInt(matches[0], 10),
    g: parseInt(matches[1], 10),
    b: parseInt(matches[2], 10),
    a: matches[3] ? parseFloat(matches[3]) : 1.0,
  };
}

const changeHeaderColor = () => {
  const header = document.getElementById("header");
  if (!header) return null;

  // 1. ヘッダーの現在の位置とサイズを取得
  const rect = header.getBoundingClientRect();

  // 2. ヘッダーの「左右中央・上下中央」の座標を計算
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // ヘッダ幅の60%以上の重なりが必要な閾値を事前計算
  const minOverlapWidth = rect.width * 0.6;

  // 3. その座標にある要素を、除外条件と重なり判定を1パスで絞る
  const elements = document.elementsFromPoint(centerX, centerY).filter((el) => {
    if (el === header || header.contains(el)) return false;
    const elRect = el.getBoundingClientRect();
    const overlapWidth =
      Math.min(elRect.right, rect.right) - Math.max(elRect.left, rect.left);
    return overlapWidth > minOverlapWidth;
  });

  // ヘッダの裏の色に基づいて、ヘッダの文字色を変える。
  // 先頭から順に評価し、有効なトーンが見つかった時点で終了する（getComputedStyle を最小化）。
  for (const el of elements) {
    const tone = classifyBackgroundTone(el as HTMLElement);
    if (tone === BackgroundTone.Dark) {
      const event = new CustomEvent("header:change-color", {
        detail: {
          color: "white",
          timestamp: Date.now(),
          reason: "Background is classified as Dark",
        },
      });
      window.dispatchEvent(event);

      return;
    }
    if (tone === BackgroundTone.Light) {
      const event = new CustomEvent("header:change-color", {
        detail: {
          color: "black",
          timestamp: Date.now(),
          reason: "Background is classified as Light",
        },
      });
      window.dispatchEvent(event);

      return;
    }
  }
};

const handleHeaderOverlapCheck = throttle(200, () => {
  changeHeaderColor();
});

// 監視設定（子要素の変化を追跡）
observer.observe(targetNode!, { childList: true, subtree: true });

// 既に初回レンダリングが完了している場合でも初期化を1回実行する
onRouteMaybeChanged();

window.addEventListener("scroll", handleHeaderOverlapCheck, {
  passive: true,
});

window.addEventListener("header:check-overlap", (e) => {
  console.log(JSON.stringify((e as CustomEvent).detail));
  handleHeaderOverlapCheck();
});
