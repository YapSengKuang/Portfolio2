"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DetailPanel } from "@/components/detail-panel";
import { Loader } from "@/components/loader";
import { Nav } from "@/components/nav";
import { RotationController } from "@/components/rotation-controller";
import type { ScenePick } from "@/components/volleyball-scene";
import { sections, sectionById, type SectionId } from "@/lib/sections";

const VolleyballScene = dynamic(
  () => import("@/components/volleyball-scene").then((mod) => mod.VolleyballScene),
  { ssr: false },
);

function normalizeWheel(event: WheelEvent) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

export function Portfolio() {
  const [controller] = useState(() => new RotationController());
  const stageRef = useRef<HTMLDivElement>(null);
  const pickRef = useRef<((clientX: number, clientY: number) => ScenePick | null) | null>(null);
  const spikeRef = useRef<(() => void) | null>(null);
  const pendingHit = useRef<SectionId | null>(null);
  const pointerStart = useRef({ x: 0, y: 0 });
  const pending = useRef<{ index: number; itemId: string | null } | null>(null);
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [targeting, setTargeting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<SectionId | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeSection = sections[activeIndex] ?? sections[0];

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => controller.setReduced(media.matches);
    applyMotion();
    media.addEventListener("change", applyMotion);

    const hashId = window.location.hash.replace("#", "");
    const hashed = sections.findIndex((section) => section.id === hashId);
    controller.jumpTo(hashed >= 0 ? hashed : 0);

    controller.setUserInterrupt(() => {
      pending.current = null;
    });

    const unsubscribe = controller.subscribe((index) => {
      setActiveIndex(index);
      const request = pending.current;
      if (request && request.index === index) {
        setSelectedItemId(request.itemId);
        pending.current = null;
      } else if (!request) {
        setSelectedItemId(null);
      }

      const hash = `#${sections[index].id}`;
      if (window.location.hash !== hash) {
        window.history.replaceState(null, "", hash);
      }
    });

    const onHashChange = () => {
      const id = window.location.hash.replace("#", "");
      const index = sections.findIndex((section) => section.id === id);
      if (index >= 0) controller.goTo(index);
    };
    window.addEventListener("hashchange", onHashChange);

    return () => {
      media.removeEventListener("change", applyMotion);
      controller.setUserInterrupt(null);
      unsubscribe();
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [controller]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (event: WheelEvent) => {
      if (!ready || event.ctrlKey) return;
      const target = event.target;
      if (target instanceof Element) {
        const scroller = target.closest("[data-scroll]");
        if (scroller instanceof HTMLElement && scroller.scrollHeight > scroller.clientHeight + 4) {
          return;
        }
      }
      event.preventDefault();
      controller.scroll(normalizeWheel(event));
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [controller, ready]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, a")) return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = (activeIndex + direction + sections.length) % sections.length;
      pending.current = null;
      controller.goTo(next);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keydown", onEscape);
    };
  }, [activeIndex, controller]);

  function revealSection(id: SectionId) {
    const index = sections.findIndex((section) => section.id === id);
    if (index < 0) return;
    pending.current = null;
    setSelectedItemId(null);
    controller.goTo(index);
    setSheetId(id);
    setSheetOpen(true);
  }

  function openSection(id: SectionId) {
    const index = sections.findIndex((section) => section.id === id);
    if (index < 0) return;
    pending.current = null;
    setSelectedItemId(null);
    controller.goTo(index);
    setSheetId(id);
    setSheetOpen((current) => !(current && sheetId === id));
  }

  function openItem(id: SectionId, itemId: string) {
    const index = sections.findIndex((section) => section.id === id);
    if (index < 0) return;
    if (index === activeIndex) {
      pending.current = null;
      setSelectedItemId(itemId);
      return;
    }
    pending.current = { index, itemId };
    controller.goTo(index);
  }

  return (
    <div
      ref={stageRef}
      className={`stage ${dragging ? "is-dragging" : ""} ${targeting ? "is-targeting" : ""}`}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        pointerStart.current = { x: event.clientX, y: event.clientY };
        if (event.target instanceof Element && event.target.closest("[data-ui]")) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        controller.beginDrag(event.clientX, event.clientY, event.pointerType);
        setDragging(true);
      }}
      onPointerMove={(event) => {
        if (controller.dragging) {
          controller.drag(event.clientX, event.clientY);
          return;
        }
        if (event.target instanceof Element && event.target.closest("[data-ui]")) {
          setTargeting(false);
          return;
        }
        setTargeting(Boolean(pickRef.current?.(event.clientX, event.clientY)?.ball));
      }}
      onPointerUp={(event) => {
        const moved = Math.hypot(
          event.clientX - pointerStart.current.x,
          event.clientY - pointerStart.current.y,
        );
        const hit = moved < 8 ? (pickRef.current?.(event.clientX, event.clientY) ?? null) : null;
        if (controller.dragging) {
          controller.endDrag();
          setDragging(false);
        }
        if (!hit?.ball || pendingHit.current) return;
        const id = hit.sectionId ?? sections[activeIndex]?.id;
        if (!id) return;
        pendingHit.current = id;
        if (spikeRef.current) spikeRef.current();
        else revealSection(id);
      }}
      onPointerCancel={() => {
        if (!controller.dragging) return;
        controller.endDrag();
        setDragging(false);
      }}
    >
      <Nav activeId={activeSection.id} onSelect={openSection} />
      <DetailPanel
        section={sectionById(sheetId ?? "") ?? null}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        selectedItemId={selectedItemId}
        onSelectItem={openItem}
      />
      <VolleyballScene
        controller={controller}
        onReady={() => setReady(true)}
        pickRef={pickRef}
        spikeRef={spikeRef}
        onSpikeDone={() => {
          const id = pendingHit.current;
          pendingHit.current = null;
          if (id) revealSection(id);
        }}
      />
      <p className="hint">Drag or scroll to turn</p>
      <Loader ready={ready} />
    </div>
  );
}
