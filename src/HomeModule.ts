export class HomeModule {
  public static readonly REQUIRED_SELECTORS = [
    "#home-mv",
    "#press-release",
    "#business",
    "#home-works",
    "#company",
    "#contact-wrapper",
  ];

  public static readonly BLACK_SECTIONS = [
    "#home-mv",
    "#press-release",
    "#home-works",
  ];

  public static readonly TEXTURE_SECTIONS = ["#home-works"];

  public static isReady(): boolean {
    return HomeModule.REQUIRED_SELECTORS.every((selector) => {
      return document.querySelector(selector) !== null;
    });
  }

  private observers: IntersectionObserver[] = [];

  constructor() {
    this.init();
  }

  private init() {
    console.log("HomeModule init");
    // #business 直下に divを配置する. absoluteでtopは50vhの位置に置く
    HomeModule.REQUIRED_SELECTORS.forEach((selector) => {
      const el = document.querySelector(selector);

      if (el) {
        // 画面の上下から50%ずつ縮めた「中心線」を判定基準にする
        const options = {
          rootMargin: "-50% 0px -50% 0px",
          threshold: 0,
        };

        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            intersectionCallback(selector, entry.isIntersecting);
          });
        }, options);

        observer.observe(el);
        this.observers.push(observer);
      }
    });
  }

  public destroy() {
    console.log("HomeModule destroy");
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

const intersectionCallback = (target: string, isIntersecting: boolean) => {
  if (!isIntersecting) {
    return;
  }
  console.log(`${target}が${isIntersecting ? "表示" : "非表示"}になりました`);

  let toBlack = false;
  if (HomeModule.BLACK_SECTIONS.includes(target)) {
    toBlack = true;
  }

  HomeModule.REQUIRED_SELECTORS.forEach((selector) => {
    const section = document.querySelector(selector) as HTMLElement;
    if (section) {
      section.style.background = `var(--active-bg-color, ${toBlack ? "black" : "white"})`;
      section.style.transition = "background-color 0.5s";
    }
  });

  if (HomeModule.TEXTURE_SECTIONS.includes(target)) {
    document.body.style.setProperty("--active-texture-opacity", "0.7");
  } else {
    document.body.style.setProperty("--active-texture-opacity", "0");
  }

  // 中央に重なったらカスタムイベントを発行
  const event = new CustomEvent("header:change-color", {
    detail: {
      color: toBlack ? "white" : "black",
      timestamp: Date.now(),
      reason: `Section ${target} is shown`,
    },
  });
  window.dispatchEvent(event);

  // transition後に色判定を実行
  setTimeout(() => {
    // header:check-overlapイベントを発行して、重なり判定を実行
    const overlapEvent = new CustomEvent("header:check-overlap", {
      detail: {
        timestamp: Date.now(),
        reason: `Triggered by intersection change of ${target}`,
      },
    });
    window.dispatchEvent(overlapEvent);
  }, 600); // transition時間より少し長めに設定
};
