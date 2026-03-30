/**
 * Scroll activity sensor -- vanilla JS side-effect module.
 * Import this module to start tracking scroll progress, velocity, and visible sections.
 * Writes to activityStore; panels read imperatively inside their own intervals.
 */
import { useActivityStore } from "./activityStore";
import { useSettingsStore } from "./settingsStore";

if (typeof window !== "undefined") {
  let rafId = 0;
  let lastScrollY = window.scrollY;
  let lastTime = performance.now();
  let smoothVelocity = 0;
  let velocityDecayTimer: ReturnType<typeof setTimeout> | null = null;
  let observer: IntersectionObserver | null = null;
  const visibleSections = new Set<string>();

  function updateScroll() {
    rafId = 0;
    const now = performance.now();
    const dt = now - lastTime;
    if (dt < 1) return;

    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;

    // Velocity: px/ms normalized to 0-1
    const delta = Math.abs(scrollY - lastScrollY);
    const rawVelocity = Math.min(1, delta / (dt * 0.05)); // ~50px per 16ms frame = 1.0
    smoothVelocity = smoothVelocity * 0.85 + rawVelocity * 0.15;

    lastScrollY = scrollY;
    lastTime = now;

    useActivityStore.setState({ scrollProgress: progress, scrollVelocity: smoothVelocity });

    // Decay velocity to 0 after scroll stops
    if (velocityDecayTimer) clearTimeout(velocityDecayTimer);
    velocityDecayTimer = setTimeout(() => {
      const decay = () => {
        smoothVelocity *= 0.8;
        if (smoothVelocity < 0.005) {
          smoothVelocity = 0;
          useActivityStore.setState({ scrollVelocity: 0 });
          return;
        }
        useActivityStore.setState({ scrollVelocity: smoothVelocity });
        requestAnimationFrame(decay);
      };
      requestAnimationFrame(decay);
    }, 300);
  }

  function onScroll() {
    if (!rafId) {
      rafId = requestAnimationFrame(updateScroll);
    }
  }

  function setupSectionObserver() {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const name = (entry.target as HTMLElement).dataset.sectionName;
          if (!name) continue;
          if (entry.isIntersecting) {
            visibleSections.add(name);
          } else {
            visibleSections.delete(name);
          }
        }
        useActivityStore.setState({
          visibleSectionCount: visibleSections.size,
          visibleSectionNames: Array.from(visibleSections),
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll("[data-section-name]").forEach((el) => {
      observer!.observe(el);
    });
  }

  function attach() {
    window.addEventListener("scroll", onScroll, { passive: true });
    setupSectionObserver();
  }

  function detach() {
    window.removeEventListener("scroll", onScroll);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    if (velocityDecayTimer) clearTimeout(velocityDecayTimer);
    observer?.disconnect();
    observer = null;
    visibleSections.clear();
    smoothVelocity = 0;
    useActivityStore.setState({
      scrollProgress: 0,
      visibleSectionCount: 1,
      visibleSectionNames: [],
      scrollVelocity: 0,
    });
  }

  // Respect reduceMotion
  const initialReduceMotion = useSettingsStore.getState().reduceMotion;
  if (!initialReduceMotion) {
    attach();
  }

  useSettingsStore.subscribe(
    (s) => s.reduceMotion,
    (reduceMotion) => {
      if (reduceMotion) {
        detach();
      } else {
        attach();
      }
    },
  );

  // Re-observe sections after Astro View Transitions
  document.addEventListener("astro:page-load", () => {
    if (!useSettingsStore.getState().reduceMotion) {
      observer?.disconnect();
      visibleSections.clear();
      setupSectionObserver();
    }
  });
}
