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
  document.querySelector("#header")?.classList.add("white");
}

function removeHeaderWhite(): void {
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
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0 });

    if (!hash) {
      return;
    }

    requestAnimationFrame(() => {
      document.querySelector(hash)?.scrollIntoView();
    });
  });
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

function setupContactHeaderTrigger(): Cleanup {
  const trigger =
    document.querySelector("#contact-wrapper") ??
    document.querySelector("#contact");
  if (!trigger) {
    return () => {
      removeHeaderWhite();
    };
  }

  const context = gsap.context(() => {
    ScrollTrigger.create({
      trigger,
      onEnter: addHeaderWhite,
      onEnterBack: addHeaderWhite,
      onLeave: removeHeaderWhite,
      onLeaveBack: removeHeaderWhite,
      start: "top top",
      end: "bottom top",
    });

    return () => {
      removeHeaderWhite();
    };
  });

  return () => {
    context.revert();
  };
}

function hasContactSection(): boolean {
  return document.querySelector("#contact") !== null;
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
      setupHomeHeroObserver,
      () => setupSectionThemeTriggers(HOME_SECTIONS, TEXTURE_SECTIONS),
      resetScrollWithHashRestore,
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

const refreshObserver = new ResizeObserver(
  debounce(() => {
    ScrollTrigger.refresh();
  }, 100),
);

refreshObserver.observe(document.body);

setupRouteController({
  routes: {
    "/": HOME_ROUTE,
    "/works": WORKS_ROUTE,
    "/works/category/*": WORKS_CATEGORY_ROUTE,
    "/works/tag/*": WORKS_TAG_ROUTE,
  },
  onRouteChange: [
    setupContactHeaderTrigger,
    () => hasContactSection() && document.querySelector("#header") !== null,
  ],
});

console.log("360Channel Corp Site Assets Loaded");
