export const PANEL_COUNT = 3;
export const STEP = (Math.PI * 2) / PANEL_COUNT;

const TWO_PI = Math.PI * 2;

export function wrapAngle(radians: number) {
  return ((radians % TWO_PI) + TWO_PI) % TWO_PI;
}

/** Smallest absolute difference between two angles, in `[0, π]`. */
export function angularDistance(a: number, b: number) {
  const distance = wrapAngle(a - b);
  return Math.min(distance, TWO_PI - distance);
}

/** Panel index facing the camera. Panel `i` is front when rotation is `-i * STEP`. */
export function sectionIndexForRotation(rotation: number) {
  let best = 0;
  let bestDistance = Infinity;

  for (let index = 0; index < PANEL_COUNT; index += 1) {
    const distance = angularDistance(rotation, -index * STEP);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }

  return best;
}

/** Nearest settled angle for the panel currently facing the camera. */
export function snapRotation(rotation: number) {
  const index = sectionIndexForRotation(rotation);
  const base = -index * STEP;
  const turns = Math.round((rotation - base) / TWO_PI);
  return base + turns * TWO_PI;
}

/** Shortest spin that brings `sectionIndex` to the front. */
export function shortestTarget(current: number, sectionIndex: number) {
  const base = -sectionIndex * STEP;
  const turns = Math.round((current - base) / TWO_PI);
  return base + turns * TWO_PI;
}
