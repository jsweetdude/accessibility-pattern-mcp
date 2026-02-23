---
id: carousel.dots
stack: web/react
status: beta
tags: [marquee, carousel, slider, gallery, dots, autoplay, reduced-motion]
aliases: [hero carousel, marquee, featured gallery, hero gallery, image gallery, slider]
summary: Horizontally-advancing carousel (aka hero or marquee carousel) with 'dot' navigation, prev/next buttons, and pause behavior.
---

# Carousel with Dot Navigation

## Use When
- Use when slides are navigated sequentially using next/previous controls or dot indicators.
- Use when dot buttons indicate slide position but do not display image previews.

## Do Not Use When
- Do not use when thumbnail images are shown for direct slide selection (use `carousel.thumbnails`).
- Do not use when multiple slides are visible at once in a horizontal list (use `content-shelf`).

## Must Haves
- Render a carousel container with `aria-roledescription="carousel"` and an accessible name (`aria-label`).
- Ensure the carousel container has a semantic HTML5 element or role, such as `<section>` or `role="region"`.
- Each slide must have `role="group"`, `aria-roledescription="slide"` and an `aria-label` like “1 of N” (N is total number of slides).
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) on each focusable element, including the previous/next buttons, pause button, and dots.
- Provide Previous/Next buttons as real `<button>` elements, with `aria-label` like "Previous Slide" and "Next Slide".
- Provide dot navigation as real `<button>` elements in normal tab order (no roving tabindex), with `aria-label` like "Go to slide 2", and with `aria-current="true"` on the button corresponding to the active slide.
- Provide a Pause/Play button as the first focusable element inside the carousel container.
- Default to paused when `prefers-reduced-motion: reduce`.
- Pause when keyboard focus enters the carousel region.
 
## Customizable
- The contents of each slide are customizable. However, if they contain a title, then these should usually be `<h2>`.

## Don’ts
- Don’t auto-advance the slides without a visible Pause/Play control.
- Don’t ignore `prefers-reduced-motion`.
- Don’t keep moving while the user is interacting (focus inside carousel must pause autoplay).

## Golden Pattern
```js
"use client";

import * as React from "react";
import { Pause, Play } from "lucide-react";

export function CarouselDotsDemo({
  ariaLabel = "Featured content",
  items = DEFAULT_ITEMS,
  autoplay = true,
  intervalMs = 5000,
}) {
  const [index, setIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const hasUserToggledPauseRef = React.useRef(false);
  const reducedMotionRef = React.useRef(false);
  const timerRef = React.useRef(null);
  const skipFocusPauseRef = React.useRef(false);

  const count = items.length;

  // Reduced motion: paused by default.
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reducedMotionRef.current = !!mq.matches;
      if (mq.matches) {
        setIsPaused(true);
      }
    };

    apply();

    // Safari still supports addListener in some versions
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
  }, []);

  function goTo(nextIndex) {
    const clamped = ((nextIndex % count) + count) % count;
    setIndex(clamped);
  }

  function goPrev() {
    goTo(index - 1);
  }

  function goNext() {
    goTo(index + 1);
  }

  function pause() {
    setIsPaused(true);
  }

  function togglePause() {
    skipFocusPauseRef.current = false;
    hasUserToggledPauseRef.current = true;
    setIsPaused((p) => !p);
  }

  function onPauseButtonPointerDown() {
    skipFocusPauseRef.current = true;
  }

  // Pause autoplay when focus enters the carousel.
  function onFocusCapture() {
    if (skipFocusPauseRef.current) {
      skipFocusPauseRef.current = false;
      return;
    }
    pause();
  }

  // Autoplay (respects reduced motion, focus-paused state, and user pause).
  React.useEffect(() => {
    // Clear any existing timer.
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!autoplay) return;
    if (isPaused) return;
    if (reducedMotionRef.current) return;

    timerRef.current = window.setInterval(() => {
      // Do not rotate if user paused manually.
      // (If you want “Play” to resume, that’s handled by togglePause.)
      goTo((prev) => {
        // React state setter form not used here; keep simple:
        return prev;
      });
    }, intervalMs);

    // The above setInterval can’t see “index” reliably if we keep it simple,
    // so we rotate by scheduling a next tick that uses current state:
    // We’ll do it with a functional update to avoid stale closures.
    window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setIndex((i) => ((i + 1) % count));
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoplay, isPaused, intervalMs, count]);

  const active = items[index];

  // aria-live: off while moving, polite when paused so changes can be announced if user moves slides.
  const ariaLive = isPaused ? "polite" : "off";

  return (
    <section
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onFocusCapture={onFocusCapture}
      style={{
        position: "relative",
        maxWidth: 960,
        margin: "0 auto",
        padding: 16,
        background: "#fff",
        color: "#111",
        borderRadius: 12,
      }}
    >
      {/* Slides viewport */}
      <div
        aria-live={ariaLive}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 12,
          minHeight: 400,
          background: "#000",
        }}
      >
        <button
          type="button"
          onPointerDown={onPauseButtonPointerDown}
          onClick={togglePause}
          aria-label={isPaused ? "Play automatic rotation" : "Pause automatic rotation"}
          aria-pressed={isPaused}
          style={pauseButtonStyle}
        >
          {isPaused ? (
            <Play size={18} aria-hidden="true" focusable="false" />
          ) : (
            <Pause size={18} aria-hidden="true" focusable="false" />
          )}
        </button>

        {/* Slide */}
        <div
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${count}`}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            alignItems: "end",
            minHeight: 400,
            padding: "16px 72px 40px",
            backgroundImage: active.image ? `url(${active.image})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            style={{
              maxWidth: 520,
              background: "#000",
              color: "#fff",
              padding: 12,
              borderRadius: 10,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 24 }}>{active.title}</h2>
            <p style={{ marginTop: 8, marginBottom: 12, lineHeight: 1.4 }}>
              {active.description}
            </p>
            <a
              href={active.href}
              style={{
                display: "inline-block",
                padding: "10px 12px",
                borderRadius: 10,
                background: "#fff",
                color: "#000",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              View details
            </a>
          </div>
        </div>

        {/* Prev / Next (inside visible slide area) */}
        <button
          type="button"
          onClick={() => {
            pause();
            goPrev();
          }}
          aria-label="Previous slide"
          style={navButtonStyle("left")}
        >
          ‹
        </button>

        <button
          type="button"
          onClick={() => {
            pause();
            goNext();
          }}
          aria-label="Next slide"
          style={navButtonStyle("right")}
        >
          ›
        </button>
      </div>

      {/* Controls row below the viewport */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8 }} aria-label="Choose a slide">
          {items.map((_, i) => {
            const isActive = i === index;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  pause();
                  goTo(i);
                }}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={isActive ? "true" : undefined}
                style={dotStyle(isActive)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function navButtonStyle(side) {
  return {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    [side]: 12,
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(0,0,0,0.45)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    fontSize: 28,
    lineHeight: 1,
  };
}

const pauseButtonStyle = {
  position: "absolute",
  top: 12,
  left: 12,
  zIndex: 2,
  width: 40,
  height: 40,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.25)",
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

function dotStyle(active) {
  return {
    width: 12,
    height: 12,
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.35)",
    background: active ? "#111" : "rgba(0,0,0,0.18)",
    cursor: "pointer",
  };
}

const DEFAULT_ITEMS = [
  {
    title: "Neighbors",
    description: "A chaotic dispute spirals. Watch the latest episode now.",
    href: "#",
    image: "https://picsum.photos/seed/hero-1/1200/600",
  },
  {
    title: "UCLA at Michigan",
    description: "Tip-off at 12:45 PM ET. Catch it live.",
    href: "#",
    image: "https://picsum.photos/seed/hero-2/1200/600",
  },
  {
    title: "Fire Country",
    description: "A risky mission tests loyalties and nerves.",
    href: "#",
    image: "https://picsum.photos/seed/hero-3/1200/600",
  },
];
```

## Acceptance Checks
- Semantics:
  - The carousel container has `aria-roledescription="carousel"` and an accessible name.
  - Each slide has `aria-roledescription="slide"` and exposes position (e.g., “2 of 3”).
- Autoplay:
  - With `prefers-reduced-motion: reduce`, autoplay is paused by default.
  - Tabbing into the carousel pauses autoplay.
  - Autoplay does not run while paused.
- Controls (keyboard):
  - Previous and Next buttons are reachable via Tab and move one slide per activation.
  - Each dot is reachable via Tab and activates its corresponding slide.
  - The active dot exposes state (e.g., `aria-current="true"`).
- Content:
  - Each slide includes a visible title (`<h2>`), a short description, and one primary CTA link.
- Screen reader:
  - When changing slides while paused, the carousel name and slide position are announced without duplicate announcements.
