import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./main.css";

type Cleanup = () => void;
type RouteSetup = [setup: () => Cleanup | void, isReady?: () => boolean];

const HOME_SECTIONS = [
  "#press-release",
  "#business",
  "#home-works",
  "#company",
];
const TEXTURE_SECTIONS = ["#home-works", "#company"];

let routeCleanup: Cleanup | undefined;
let pageCleanup: Cleanup | undefined;
let currentPath = location.pathname;

gsap.registerPlugin(ScrollTrigger);

function combineCleanups(...factories: Array<() => Cleanup | void>): Cleanup {
  const cleanups = factories.map((factory) => factory());
  return () => {
    cleanups.forEach((cleanup) => {
      cleanup?.();
    });
  };
}

function addHeaderWhite(): void {
  return;
  document.querySelector("#header")?.classList.add("white");
}

function removeHeaderWhite(): void {
  return;
  document.querySelector("#header")?.classList.remove("white");
}

function addHeaderWhite2(): void {
  document.querySelector("#header")?.classList.add("white");
}

function removeHeaderWhite2(): void {
  document.querySelector("#header")?.classList.remove("white");
}

function isTransparentColor(color: string): boolean {
  return (
    color === "rgba(0, 0, 0, 0)" ||
    color === "transparent" ||
    color === "rgb(0 0 0 / 0)"
  );
}

function hexToRgb(color: string): [number, number, number] {
  const shortHex = color.length <= 4;
  const matched = shortHex
    ? /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(color)
    : /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);

  if (!matched) {
    return [0, 0, 0];
  }

  const scale = shortHex ? 17 : 1;
  return [
    Number.parseInt(matched[1] ?? "0", 16) * scale,
    Number.parseInt(matched[2] ?? "0", 16) * scale,
    Number.parseInt(matched[3] ?? "0", 16) * scale,
  ];
}

function colorToRgb(color: string): [number, number, number] {
  if (color.startsWith("#")) {
    return hexToRgb(color);
  }

  const values = color
    .match(/\d+/g)
    ?.slice(0, 3)
    .map((value) => Number(value));
  if (!values || values.length < 3) {
    return [0, 0, 0];
  }

  return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0];
}

function isLightColor([red, green, blue]: [number, number, number]): boolean {
  return red * 0.299 + green * 0.587 + blue * 0.114 >= 186;
}

enum BackgroundTone {
  Dark,
  Light,
  Other,
}

function classifyBackgroundTone(color: string): BackgroundTone {
  if (isTransparentColor(color)) {
    return BackgroundTone.Other;
  }

  const [red, green, blue] = colorToRgb(color);
  const brightness = red * 0.299 + green * 0.587 + blue * 0.114;

  if (brightness <= 80) {
    return BackgroundTone.Dark;
  }

  if (brightness >= 186) {
    return BackgroundTone.Light;
  }

  return BackgroundTone.Other;
}

function setupSectionThemeTriggers(
  selectors: string[],
  textureSelectors: string[] = [],
): Cleanup {
  const context = gsap.context(() => {
    selectors.forEach((selector) => {
      const section = document.querySelector(selector) as HTMLElement | null;
      if (!section) {
        return;
      }

      const backgroundColor = (() => {
        const color = window.getComputedStyle(section).backgroundColor;
        return isTransparentColor(color) ? "black" : color;
      })();

      gsap.set(selector, {
        background: "var(--active-bg-color, black)",
        transition: "background-color 0.5s",
      });

      const switchHeader = isLightColor(colorToRgb(backgroundColor))
        ? removeHeaderWhite
        : addHeaderWhite;

      const onEnter = () => {
        switchHeader();

        for (let i = 1; i <= 5; i++) {
          setTimeout(() => {
            changeHeaderColor();
          }, i * 100);
        }

        gsap.set("body", { "--active-bg-color": backgroundColor });

        if (textureSelectors.includes(selector)) {
          gsap.set("body", { "--active-texture-opacity": 0.7 });
        }
      };

      const onLeave = () => {
        gsap.set("body", { "--active-texture-opacity": 0 });
      };

      ScrollTrigger.create({
        trigger: section,
        start: "top 50%",
        end: "bottom 50%",
        onEnter,
        onEnterBack: onEnter,
        onLeave,
        onLeaveBack: onLeave,
      });
    });

    return () => {
      document.body.style.background = "";
      document.body.style.removeProperty("--active-bg-color");
      document.body.style.removeProperty("--active-texture-opacity");
    };
  });

  return () => {
    context.revert();
  };
}

function hasAllSelectors(
  selectors: string[],
  requiredCount = selectors.length,
): boolean {
  return (
    document.querySelectorAll(selectors.join(", ")).length === requiredCount
  );
}

function setupHomeHeroObserver(): Cleanup {
  const target = document.querySelector("#home-mv");
  if (!target) {
    return () => {
      removeHeaderWhite();
    };
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting }) => {
      if (isIntersecting) {
        addHeaderWhite();
      }
    });
  });

  observer.observe(target);
  return () => {
    removeHeaderWhite();
    observer.disconnect();
  };
}

function resetScrollWithHashRestore(): void {
  const { hash } = location;
  const supportsScrollRestoration = "scrollRestoration" in window.history;
  const previousScrollRestoration = supportsScrollRestoration
    ? window.history.scrollRestoration
    : undefined;

  if (supportsScrollRestoration) {
    window.history.scrollRestoration = "manual";
  }

  const restoreScrollRestoration = () => {
    if (supportsScrollRestoration && previousScrollRestoration) {
      window.history.scrollRestoration = previousScrollRestoration;
    }
  };

  // Route transition直後の自動復元に上書きされないよう、短時間だけ先頭を維持する。
  const lockUntil = performance.now() + 400;
  const keepTop = () => {
    if (hash) {
      const target = document.querySelector(hash);
      target?.scrollIntoView({ block: "start" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    if (performance.now() < lockUntil) {
      requestAnimationFrame(keepTop);
      return;
    }

    // if (!hash) {
    //   restoreScrollRestoration();
    //   return;
    // }

    // const target = document.querySelector(hash);
    // target?.scrollIntoView({ block: "start" });
    restoreScrollRestoration();

    requestAnimationFrame(() => ScrollTrigger.refresh())
  };

  requestAnimationFrame(keepTop);
}

function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delayMs: number,
): (...args: T) => void {
  let timerId: number | undefined;

  return (...args: T) => {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => fn(...args), delayMs);
  };
}

function throttle<T extends unknown[]>(
  fn: (...args: T) => void,
  delayMs: number,
): (...args: T) => void {
  let lastRunAt = 0;
  let timerId: number | undefined;
  let lastArgs: T | undefined;

  return (...args: T) => {
    const now = Date.now();
    const remainingMs = delayMs - (now - lastRunAt);

    lastArgs = args;

    if (remainingMs <= 0) {
      window.clearTimeout(timerId);
      timerId = undefined;
      lastRunAt = now;
      fn(...args);
      return;
    }

    if (timerId !== undefined) {
      return;
    }

    timerId = window.setTimeout(() => {
      lastRunAt = Date.now();
      timerId = undefined;

      if (lastArgs) {
        fn(...lastArgs);
      }
    }, remainingMs);
  };
}

function updateWorksListAlignment(selector: string): void {
  const container = document.querySelector(selector);
  if (!container) {
    return;
  }

  const listItemsCount = container.querySelectorAll(":scope > li").length;
  if (listItemsCount <= 3) {
    return;
  }

  const remainder = listItemsCount % 3;
  if (remainder === 2) {
    container.classList.add("last-two");
    return;
  }

  if (remainder === 1) {
    container.classList.add("last-one");
    return;
  }

  container.classList.add("just");
}

function observeWorksList(selector: string): Cleanup | void {
  const container = document.querySelector(selector);
  if (!container) {
    return;
  }

  updateWorksListAlignment(selector);
  const observer = new MutationObserver(() => {
    updateWorksListAlignment(selector);
  });

  observer.observe(container, { childList: true, subtree: false });
  return () => {
    observer.disconnect();
  };
}

function hasHeaderElement(): boolean {
  return document.querySelector("#header") !== null;
}

function isIOSMobileSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iP(ad|hone|od)/.test(ua);
  const isWebKit = /WebKit/i.test(ua);
  const isCriOS = /CriOS/i.test(ua);
  const isFxiOS = /FxiOS/i.test(ua);

  return isIOS && isWebKit && !isCriOS && !isFxiOS;
}

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/$/, "") || "/";
}

function resolveRoute(
  routes: Record<string, RouteSetup>,
  pathname: string,
): RouteSetup | undefined {
  const normalized = normalizePathname(pathname);
  const exact = routes[normalized];
  if (exact) {
    return exact;
  }

  const parts = normalized.split("/");
  for (let index = parts.length - 1; index > 0; index -= 1) {
    const wildcardPath = `${parts.slice(0, index).join("/")}/*`;
    const matched = routes[wildcardPath];
    if (matched) {
      return matched;
    }
  }

  return undefined;
}

function setupRouteController({
  routes,
  onRouteChange,
}: {
  routes: Record<string, RouteSetup>;
  onRouteChange?: RouteSetup;
}): void {
  const toCleanup = (
    result: Cleanup | void | undefined,
  ): Cleanup | undefined => {
    if (typeof result === "function") {
      return result;
    }

    return undefined;
  };

  Object.keys(routes).some((path) => {
    if (path.endsWith("/") && path !== "/") {
      console.error(`Route path "${path}" ends with a slash`);
    }
    return false;
  });

  const runForPath = (pathname: string) => {
    const route = resolveRoute(routes, pathname);

    document.body.setAttribute("data-route-path", pathname);
    routeCleanup?.();
    pageCleanup?.();

    routeCleanup = toCleanup(onRouteChange?.[0]?.());
    pageCleanup = toCleanup(route?.[0]?.());
  };

  const appRoot = document.querySelector("#__nuxt");
  new MutationObserver(() => {
    const routeReady =
      resolveRoute(routes, location.pathname)?.[1] ?? (() => true);
    const globalReady = onRouteChange?.[1] ?? (() => true);

    if (
      currentPath === location.pathname ||
      appRoot?.children.length === 2 ||
      !globalReady() ||
      !routeReady()
    ) {
      return;
    }

    currentPath = location.pathname;
    runForPath(currentPath);
  }).observe(document.body, { childList: true, subtree: true });

  runForPath(currentPath);
}

const HOME_ROUTE: RouteSetup = [
  () =>
    combineCleanups(
      // setupHomeHeroObserver,
      () => setupSectionThemeTriggers(HOME_SECTIONS, TEXTURE_SECTIONS),
      // resetScrollWithHashRestore,
    ),
  () => hasAllSelectors([...HOME_SECTIONS, "#home-mv"]),
];

const WORKS_ROUTE: RouteSetup = [
  () => combineCleanups(() => observeWorksList("#works-list")),
  () => hasAllSelectors(["#works-list"]),
];

const WORKS_TAG_ROUTE: RouteSetup = [
  () => combineCleanups(() => observeWorksList("#works-list-tag")),
  () => hasAllSelectors(["#works-list-tag"]),
];

const WORKS_CATEGORY_ROUTE: RouteSetup = [
  () => combineCleanups(() => observeWorksList("#works-list-category")),
  () => hasAllSelectors(["#works-list-category"]),
];

let lastViewportWidth = window.innerWidth;

const refreshObserver = new ResizeObserver(
  debounce(() => {
    if (isIOSMobileSafari()) {
      const widthChanged = Math.abs(window.innerWidth - lastViewportWidth) > 1;
      lastViewportWidth = window.innerWidth;

      // iOS SafariのURLバー伸縮による高さ変化ではrefreshしない。
      if (!widthChanged) {
        return;
      }
    }

    ScrollTrigger.refresh();
  }, 400),
);

// refreshObserver.observe(document.body);

setupRouteController({
  routes: {
    "/": HOME_ROUTE,
    "/live/*": HOME_ROUTE,
    "/works": WORKS_ROUTE,
    "/works/category/*": WORKS_CATEGORY_ROUTE,
    "/works/tag/*": WORKS_TAG_ROUTE,
  },
  onRouteChange: [
    () => combineCleanups(resetScrollWithHashRestore),
    () => true,
  ],
});

const changeHeaderColor = () => {
  const header = document.querySelector("#header");
  if (!header) return null;

  // 1. ヘッダーの現在の位置とサイズを取得
  const rect = header.getBoundingClientRect();

  // 2. ヘッダーの「左右中央・上下中央」の座標を計算
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // 3. その座標にある要素を表面から順にすべて取得 (Arrayで返ってくる)
  let elements = document.elementsFromPoint(centerX, centerY);
  elements = elements.filter((el) => el !== header && !header.contains(el));
  // ここで、横幅が60%以上の要素に絞る
  elements = elements.filter((el) => {
    const elRect = el.getBoundingClientRect();
    const overlapWidth =
      Math.min(elRect.right, rect.right) - Math.max(elRect.left, rect.left);
    return overlapWidth > rect.width * 0.6;
  });

  const classifiedElements = elements.map((el) => {
    const backgroundColor = getComputedStyle(el).backgroundColor;
    return {
      element: el,
      backgroundColor,
      tone: classifyBackgroundTone(backgroundColor),
    };
  });

  // classifiedElementsのうち、それ以外は削除する
  const filteredClassifiedElements = classifiedElements.filter(
    ({ tone }) => tone !== BackgroundTone.Other,
  );

  if (filteredClassifiedElements.length === 0) {
    return null;
  }

  // ヘッダの裏の色に基づいて、ヘッダの文字色を変える
  if (filteredClassifiedElements[0]?.tone == BackgroundTone.Dark) {
    addHeaderWhite2();
  } else if (filteredClassifiedElements[0]?.tone == BackgroundTone.Light) {
    removeHeaderWhite2();
  }
};

const handleHeaderOverlapCheck = throttle(() => {
  changeHeaderColor();
}, 200);

function onStudioReady(callback: () => void): void {
  const findStudioCanvas = () => document.querySelector(".StudioCanvas");

  let studioEl = findStudioCanvas();

  const observer = new MutationObserver((a) => {
    studioEl = findStudioCanvas();
    if (studioEl) {
      // observer.disconnect();
      callback();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// 実行
onStudioReady(handleHeaderOverlapCheck);
window.addEventListener("scroll", handleHeaderOverlapCheck, { passive: true });
