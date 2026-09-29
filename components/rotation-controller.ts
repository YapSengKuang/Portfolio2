import gsap from "gsap";
import {
  angularDistance,
  sectionIndexForRotation,
  shortestTarget,
  snapRotation,
  STEP,
} from "@/lib/rotation";

type SectionListener = (index: number) => void;

export class RotationController {
  target = 0;
  displayed = 0;
  tilt = 0;
  tiltTarget = 0;
  dragging = false;
  reduced = false;

  private lastX = 0;
  private lastY = 0;
  private pointerType = "mouse";
  private snapTimer: number | null = null;
  private snapTween: gsap.core.Tween | null = null;
  private listeners = new Set<SectionListener>();
  private lastIndex = 0;
  private userInterrupt: (() => void) | null = null;

  setReduced(value: boolean) {
    this.reduced = value;
  }

  setUserInterrupt(fn: (() => void) | null) {
    this.userInterrupt = fn;
  }

  subscribe(listener: SectionListener) {
    this.listeners.add(listener);
    listener(sectionIndexForRotation(this.displayed));
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(index: number) {
    if (index === this.lastIndex) return;
    this.lastIndex = index;
    this.listeners.forEach((listener) => listener(index));
  }

  private clearSnapTimer() {
    if (this.snapTimer != null) {
      window.clearTimeout(this.snapTimer);
      this.snapTimer = null;
    }
  }

  private killTween() {
    this.snapTween?.kill();
    this.snapTween = null;
  }

  private scheduleSnap() {
    this.clearSnapTimer();
    const delay = this.reduced ? 80 : 160;
    this.snapTimer = window.setTimeout(() => {
      this.snapTimer = null;
      const destination = snapRotation(this.target);
      if (angularDistance(this.target, destination) < 0.0008) {
        this.target = destination;
        return;
      }
      this.killTween();
      this.snapTween = gsap.to(this, {
        target: destination,
        duration: this.reduced ? 0 : 0.9,
        ease: "power3.out",
        overwrite: "auto",
      });
    }, delay);
  }

  beginDrag(x: number, y: number, pointerType: string) {
    this.userInterrupt?.();
    this.dragging = true;
    this.pointerType = pointerType;
    this.lastX = x;
    this.lastY = y;
    this.clearSnapTimer();
    this.killTween();
  }

  drag(x: number, y: number) {
    if (!this.dragging) return;
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    this.lastX = x;
    this.lastY = y;

    if (this.pointerType === "touch") {
      const delta = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
      this.target -= delta * 0.0075;
      return;
    }

    this.target -= dx * 0.0075;
    const nextTilt = this.tiltTarget - dy * 0.0024;
    this.tiltTarget = Math.max(-0.26, Math.min(0.26, nextTilt));
  }

  endDrag() {
    if (!this.dragging) return;
    this.dragging = false;
    this.tiltTarget = 0;
    this.scheduleSnap();
  }

  scroll(deltaPx: number) {
    this.userInterrupt?.();
    this.killTween();
    const clamped = Math.max(-220, Math.min(220, deltaPx));
    this.target -= clamped * 0.0048;
    this.scheduleSnap();
  }

  goTo(index: number) {
    this.clearSnapTimer();
    this.killTween();
    const destination = shortestTarget(this.target, index);
    if (this.reduced || angularDistance(this.target, destination) < 0.0008) {
      this.target = destination;
      this.displayed = destination;
      this.lastIndex = -1;
      this.emit(sectionIndexForRotation(destination));
      return;
    }
    this.snapTween = gsap.to(this, {
      target: destination,
      duration: 1.05,
      ease: "power3.inOut",
      overwrite: "auto",
    });
  }

  jumpTo(index: number) {
    this.clearSnapTimer();
    this.killTween();
    const destination = -index * STEP;
    this.target = destination;
    this.displayed = destination;
    this.tilt = 0;
    this.tiltTarget = 0;
    this.lastIndex = -1;
    this.emit(index);
  }

  tick(dt: number) {
    const step = Math.min(dt, 0.05);
    if (this.reduced) {
      this.displayed = this.target;
      this.tilt = this.tiltTarget;
    } else {
      const follow = this.dragging ? 22 : 9;
      const blend = 1 - Math.exp(-follow * step);
      this.displayed += (this.target - this.displayed) * blend;
      const tiltFollow = this.dragging ? 16 : 7;
      const tiltBlend = 1 - Math.exp(-tiltFollow * step);
      this.tilt += (this.tiltTarget - this.tilt) * tiltBlend;
    }
    this.emit(sectionIndexForRotation(this.displayed));
  }
}
