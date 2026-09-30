"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { Section, SectionId } from "@/lib/sections";

type DetailPanelProps = {
  section: Section | null;
  open: boolean;
  onClose: () => void;
  selectedItemId: string | null;
  onSelectItem: (id: SectionId, itemId: string) => void;
};

export function DetailPanel({ section, open, onClose, selectedItemId, onSelectItem }: DetailPanelProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const expand = useRef(0);

  useEffect(() => {
    const el = windowRef.current;
    if (!el) return;

    const apply = (next: number) => {
      expand.current = next;
      el.style.setProperty("--sheet-expand", next.toFixed(3));
      el.classList.toggle("is-full", next > 0.98);
    };

    if (!open) {
      apply(0);
      return;
    }

    const mobile = () => window.matchMedia("(max-width: 760px)").matches;

    const consume = (delta: number) => {
      if (!mobile() || delta <= 0 || expand.current >= 1) return false;
      apply(Math.min(1, expand.current + delta / 200));
      return true;
    };

    const dismissHome = (delta: number) => {
      if (!mobile() || delta >= 0 || el.scrollTop > 0) return false;
      onClose();
      return true;
    };

    const onWheel = (event: WheelEvent) => {
      if (consume(event.deltaY) || dismissHome(event.deltaY)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    let lastY = 0;
    const onTouchStart = (event: TouchEvent) => {
      lastY = event.touches[0]?.clientY ?? lastY;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? lastY;
      const delta = lastY - y;
      lastY = y;
      if (consume(delta) || dismissHome(delta)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [onClose, open]);

  return (
    <div
      className={`sheet ${open ? "is-open" : ""}`}
      data-ui
      onClick={() => {
        if (open) onClose();
      }}
    >
      <div
        ref={windowRef}
        className="sheet-window"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal={open}
        aria-hidden={!open}
        aria-label={section ? section.title : "Section"}
        data-scroll
      >
        <button type="button" className="sheet-close" onClick={onClose}>
          Close
        </button>
        {section ? (
          <div key={section.id} className="sheet-body">
            <p className="detail-kicker">
              {section.index} / {section.title}
            </p>
            <RevealHeading as="h2" className="sheet-title" active={open}>
              {section.title}
            </RevealHeading>
            <p className="detail-body">{section.lede}</p>
            <ul className="detail-list">
              {section.items.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    aria-current={entry.id === selectedItemId ? "true" : undefined}
                    onClick={() => {
                      onSelectItem(section.id, entry.id);
                      document.getElementById(`${section.id}-${entry.id}`)?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                  >
                    {entry.title}
                  </button>
                </li>
              ))}
            </ul>
            {section.items.map((entry) => (
              <article
                key={entry.id}
                id={`${section.id}-${entry.id}`}
                className={`detail-block ${entry.id === selectedItemId ? "is-selected" : ""}`}
              >
                <RevealHeading as="h3" active={open}>
                  {entry.title}
                </RevealHeading>
                {entry.meta ? <p className="detail-meta">{entry.meta}</p> : null}
                <p className="detail-body">{entry.body}</p>
                {entry.points ? (
                  <ul className="detail-points">
                    {entry.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
                {entry.href ? (
                  <a className="detail-link" href={entry.href}>
                    {entry.linkLabel}
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RevealHeading({
  as: Tag,
  className,
  children,
  active,
}: {
  as: "h2" | "h3";
  className?: string;
  children: string;
  active: boolean;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    el.classList.remove("is-shown");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-shown");
      return;
    }
    const root = el.closest("[data-scroll]");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) el.classList.add("is-shown");
      },
      { root: root instanceof Element ? root : null, threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [active, children]);

  const words = children.split(/\s+/).filter(Boolean);

  return (
    <Tag ref={ref} aria-label={children} className={["reveal-heading", className].filter(Boolean).join(" ")}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="reveal-word"
          aria-hidden="true"
          style={{ "--i": index } as CSSProperties}
        >
          <span className="reveal-word-inner">{word}</span>
        </span>
      ))}
    </Tag>
  );
}
