"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import * as THREE from "three";
import type { RotationController } from "@/components/rotation-controller";
import { STEP } from "@/lib/rotation";
import { sections, type SectionId } from "@/lib/sections";

export type PanelNodeMap = Partial<Record<SectionId, HTMLDivElement | null>>;

type SceneProps = {
  controller: RotationController;
  panelNodes: React.RefObject<PanelNodeMap>;
  onReady: () => void;
};

const BALL_RADIUS = 1;

function createSeamGeometry(euler: THREE.Euler, amplitude: number, lobes: number) {
  const points: THREE.Vector3[] = [];
  const steps = 180;

  for (let index = 0; index < steps; index += 1) {
    const t = (index / steps) * Math.PI * 2;
    const latitude = Math.sin(lobes * t) * amplitude;
    const ring = Math.cos(latitude);
    const point = new THREE.Vector3(Math.cos(t) * ring, Math.sin(latitude), Math.sin(t) * ring);
    point.normalize().multiplyScalar(BALL_RADIUS + 0.012);
    point.applyEuler(euler);
    points.push(point);
  }

  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.08);
  return new THREE.TubeGeometry(curve, 220, 0.032, 8, true);
}

function useSeamGeometries() {
  const geometries = useMemo(
    () => [
      createSeamGeometry(new THREE.Euler(0.15, 0.2, 0.1), 0.62, 3),
      createSeamGeometry(new THREE.Euler(1.15, 0.35, 0.2), 0.48, 2),
      createSeamGeometry(new THREE.Euler(0.25, 0.8, 1.35), 0.5, 2),
    ],
    [],
  );

  useLayoutEffect(() => {
    return () => {
      geometries.forEach((geometry) => geometry.dispose());
    };
  }, [geometries]);

  return geometries;
}

function Volleyball() {
  const seams = useSeamGeometries();
  const seamColors = ["#1a3f78", "#d7a441", "#161614"];

  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[BALL_RADIUS, 96, 64]} />
        <meshPhysicalMaterial
          color="#f6f3ec"
          roughness={0.48}
          metalness={0}
          clearcoat={0.35}
          clearcoatRoughness={0.42}
        />
      </mesh>
      {seams.map((geometry, index) => (
        <mesh key={seamColors[index]} geometry={geometry}>
          <meshStandardMaterial color={seamColors[index]} roughness={0.72} />
        </mesh>
      ))}
    </group>
  );
}

function SoftShadow() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    if (!context) return null;
    const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64);
    gradient.addColorStop(0, "rgba(0,0,0,0.5)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);

  useLayoutEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  if (!texture) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.18, 0]} renderOrder={-1}>
      <planeGeometry args={[3.1, 3.1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

function panelRadius(width: number) {
  return width < 760 ? 1.55 : 1.92;
}

function cameraPose(width: number) {
  const narrow = width < 760;
  const y = narrow ? 0.04 : 0.16;
  const z = narrow ? 14.6 : 7.6;
  return {
    fov: narrow ? 36 : 30,
    position: [0, y, z] as const,
    rotation: [-Math.atan2(y, z), 0, 0] as const,
  };
}

function placePanel(
  rawX: number,
  rawY: number,
  centerX: number,
  centerY: number,
  ballRadius: number,
  viewportWidth: number,
  viewportHeight: number,
  angle: number,
) {
  if (viewportWidth < 760) {
    const spread = Math.min(viewportWidth * 0.3, 120);
    const x = Math.min(viewportWidth - 28, Math.max(28, centerX + Math.sin(angle) * spread));
    const y = Math.max(108, centerY - ballRadius - 56);
    return { x, y, shift: "-50%, -100%" };
  }

  const dx = rawX - centerX;
  const dy = rawY - centerY;
  const distance = Math.hypot(dx, dy);
  if (distance < ballRadius * 0.72) {
    return {
      x: centerX,
      y: centerY - ballRadius - 22,
      shift: "-50%, -100%",
    };
  }

  let x = centerX + dx;
  let y = centerY + dy;
  const growRight = x >= centerX;
  const budget = 168;
  if (growRight) x = Math.min(x, viewportWidth - budget - 20);
  else x = Math.max(x, budget + 20);
  y = Math.min(viewportHeight - 210, Math.max(96, y));
  return { x, y, shift: growRight ? "0, -50%" : "-100%, -50%" };
}

function StudioEnv() {
  const gl = useThree((state) => state.gl);
  const environment = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return texture;
  }, [gl]);

  useEffect(() => {
    return () => environment.dispose();
  }, [environment]);

  return <primitive object={environment} attach="environment" />;
}

function FrameCamera() {
  const width = useThree((state) => state.size.width);
  const camera = useThree((state) => state.camera);

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const pose = cameraPose(width);
    // Three.js cameras are mutable scene objects; React state cannot describe this update.
    // eslint-disable-next-line react-hooks/immutability
    camera.fov = pose.fov;
    camera.position.set(pose.position[0], pose.position[1], pose.position[2]);
    camera.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2]);
    camera.updateProjectionMatrix();
  }, [camera, width]);

  return null;
}

function Turntable({
  controller,
  panelNodes,
}: {
  controller: RotationController;
  panelNodes: React.RefObject<PanelNodeMap>;
}) {
  const yaw = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const anchors = useRef<Array<THREE.Object3D | null>>([]);
  const center = useMemo(() => new THREE.Vector3(), []);
  const edge = useMemo(() => new THREE.Vector3(), []);
  const point = useMemo(() => new THREE.Vector3(), []);
  const { camera, size } = useThree();

  useFrame((_, delta) => {
    controller.tick(delta);
    if (yaw.current) yaw.current.rotation.y = controller.displayed;
    if (tilt.current) tilt.current.rotation.x = controller.tilt;

    const radius = panelRadius(size.width);
    anchors.current.forEach((anchor, index) => {
      if (!anchor) return;
      const angle = index * STEP;
      anchor.position.set(Math.sin(angle) * radius, 0.22, Math.cos(angle) * radius);
    });

    center.set(0, 0, 0);
    center.project(camera);
    const ballDepth = center.z;
    const centerX = (center.x * 0.5 + 0.5) * size.width;
    const centerY = (-center.y * 0.5 + 0.5) * size.height;

    edge.set(BALL_RADIUS, 0, 0);
    edge.project(camera);
    const edgeX = (edge.x * 0.5 + 0.5) * size.width;
    const edgeY = (-edge.y * 0.5 + 0.5) * size.height;
    const ballScreenRadius = Math.hypot(edgeX - centerX, edgeY - centerY);

    sections.forEach((section, index) => {
      const node = panelNodes.current[section.id];
      const anchor = anchors.current[index];
      if (!node || !anchor) return;

      anchor.getWorldPosition(point);
      const worldZ = point.z;
      const angle = Math.atan2(point.x, point.z);
      point.project(camera);
      const depth = point.z;
      const rawX = (point.x * 0.5 + 0.5) * size.width;
      const rawY = (-point.y * 0.5 + 0.5) * size.height;
      const distance = Math.hypot(rawX - centerX, rawY - centerY);
      const occluded = depth > ballDepth + 0.001 && distance < ballScreenRadius * 0.92;
      const closeness = THREE.MathUtils.clamp((worldZ + 1.55) / 3.35, 0, 1);
      const scale = 0.86 + closeness * 0.14;
      const opacity = occluded ? 0 : 0.72 + closeness * 0.28;
      const placed = placePanel(
        rawX,
        rawY,
        centerX,
        centerY,
        ballScreenRadius,
        size.width,
        size.height,
        angle,
      );

      node.style.opacity = opacity.toFixed(3);
      node.style.transform = `translate(${placed.x}px, ${placed.y}px) translate(${placed.shift}) scale(${scale.toFixed(3)})`;
      node.style.pointerEvents = opacity < 0.45 ? "none" : "auto";
    });

  });

  return (
    <group ref={yaw}>
      <group ref={tilt}>
        <Volleyball />
      </group>
      {sections.map((section, index) => (
        <object3D
          key={section.id}
          name={`anchor-${section.id}`}
          ref={(node) => {
            anchors.current[index] = node;
          }}
        />
      ))}
    </group>
  );
}

function FirstFrame({ onReady }: { onReady: () => void }) {
  const onReadyRef = useRef(onReady);
  const sent = useRef(false);

  useEffect(() => {
    onReadyRef.current = onReady;
  });

  useFrame(() => {
    if (sent.current) return;
    sent.current = true;
    onReadyRef.current();
  });

  return null;
}

function SceneContents({ controller, panelNodes, onReady }: SceneProps) {
  return (
    <>
      <StudioEnv />
      <FrameCamera />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4.5, 6.5, 5]} intensity={2.4} color="#fff8ef" />
      <directionalLight position={[-5, 2.2, -3]} intensity={0.7} color="#d5e2ff" />
      <directionalLight position={[0, 1.5, -5]} intensity={0.45} color="#ffe7c2" />
      <SoftShadow />
      <Turntable controller={controller} panelNodes={panelNodes} />
      <FirstFrame onReady={onReady} />
    </>
  );
}

export function VolleyballScene({ controller, panelNodes, onReady }: SceneProps) {
  return (
    <Canvas
      className="webgl"
      camera={{ position: [0, 0.16, 7.6], fov: 30, near: 0.1, far: 40 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
      style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}
    >
      <SceneContents controller={controller} panelNodes={panelNodes} onReady={onReady} />
    </Canvas>
  );
}
