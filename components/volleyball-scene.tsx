"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import * as THREE from "three";
import type { RotationController } from "@/components/rotation-controller";

const MODEL_URL = "/models/mikasa/scens/Mikasa_Ball-Smooth.fbx";

type SceneProps = {
  controller: RotationController;
  onReady: () => void;
};

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

function textureFile(resource: string) {
  const file = decodeURIComponent(resource).split(/[/\\]/).pop() ?? "";
  if (file.toLowerCase().endsWith(".png")) {
    return `/models/mikasa/Textures/${file}`;
  }
  return resource;
}

type SurfaceMaps = {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  metalnessMap: THREE.Texture;
};

function useSurfaceMaps(kind: "Ball" | "Pimpa"): SurfaceMaps {
  const base = `/models/mikasa/Textures/Mikasa_Ball_${kind}_Mikassa_Material_`;
  const [map, normalMap, roughnessMap, metalnessMap] = useLoader(THREE.TextureLoader, [
    `${base}BaseColor.png`,
    `${base}Normal.png`,
    `${base}Roughness.png`,
    `${base}Metallic.png`,
  ]);

  return useMemo(() => {
    /* eslint-disable react-hooks/immutability -- three.js textures store their color space on the texture object */
    map.colorSpace = THREE.SRGBColorSpace;
    normalMap.colorSpace = THREE.NoColorSpace;
    roughnessMap.colorSpace = THREE.NoColorSpace;
    metalnessMap.colorSpace = THREE.NoColorSpace;
    /* eslint-enable react-hooks/immutability */
    return { map, normalMap, roughnessMap, metalnessMap };
  }, [map, metalnessMap, normalMap, roughnessMap]);
}

function prepareBall(source: THREE.Group, ballMaps: SurfaceMaps, pimpaMaps: SurfaceMaps) {
  const object = source.clone(true);
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const maps = child.name.toLowerCase().includes("pimpa") ? pimpaMaps : ballMaps;
    child.material = new THREE.MeshStandardMaterial({
      map: maps.map,
      normalMap: maps.normalMap,
      roughnessMap: maps.roughnessMap,
      metalnessMap: maps.metalnessMap,
      roughness: 1,
      metalness: 1,
    });
  });

  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  object.position.set(-center.x, -center.y, -center.z);

  const wrapper = new THREE.Group();
  wrapper.add(object);
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  wrapper.scale.setScalar(2 / maxAxis);
  return wrapper;
}

function MikasaBall({ onReady }: { onReady: () => void }) {
  const source = useLoader(FBXLoader, MODEL_URL, (loader) => {
    loader.manager.setURLModifier(textureFile);
  });
  const ballMaps = useSurfaceMaps("Ball");
  const pimpaMaps = useSurfaceMaps("Pimpa");
  const model = useMemo(() => prepareBall(source, ballMaps, pimpaMaps), [ballMaps, pimpaMaps, source]);
  const onReadyRef = useRef(onReady);
  const sent = useRef(false);

  useEffect(() => {
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    onReadyRef.current();
  }, []);

  return <primitive object={model} />;
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} renderOrder={-1}>
      <planeGeometry args={[2.6, 2.6]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
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

function Turntable({ controller, onReady }: { controller: RotationController; onReady: () => void }) {
  const yaw = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    controller.tick(delta);
    if (yaw.current) yaw.current.rotation.y = controller.displayed;
    if (tilt.current) tilt.current.rotation.x = controller.tilt;
  });

  return (
    <group ref={yaw}>
      <group ref={tilt}>
        <MikasaBall onReady={onReady} />
      </group>
    </group>
  );
}

function SceneContents({ controller, onReady }: SceneProps) {
  return (
    <>
      <StudioEnv />
      <FrameCamera />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4.5, 6.5, 5]} intensity={2.4} color="#fff8ef" />
      <directionalLight position={[-5, 2.2, -3]} intensity={0.7} color="#d5e2ff" />
      <directionalLight position={[0, 1.5, -5]} intensity={0.45} color="#ffe7c2" />
      <SoftShadow />
      <Turntable controller={controller} onReady={onReady} />
    </>
  );
}

export function VolleyballScene({ controller, onReady }: SceneProps) {
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
      <SceneContents controller={controller} onReady={onReady} />
    </Canvas>
  );
}
