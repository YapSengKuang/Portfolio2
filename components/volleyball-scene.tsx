"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type Ref, type RefObject } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import * as THREE from "three";
import type { RotationController } from "@/components/rotation-controller";
import { sections, type SectionId } from "@/lib/sections";
import { STEP } from "@/lib/rotation";

const MODEL_URL = "/models/mikasa/scens/Mikasa_Ball-Smooth.fbx";

export type ScenePick = {
  sectionId: SectionId | null;
  ball: boolean;
};

type SceneProps = {
  controller: RotationController;
  onReady: () => void;
  pickRef: RefObject<((clientX: number, clientY: number) => ScenePick | null) | null>;
  spikeRef: RefObject<(() => void) | null>;
  onSpikeDone: () => void;
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

function MikasaBall({
  onReady,
  ballTargetsRef,
}: {
  onReady: () => void;
  ballTargetsRef: RefObject<THREE.Mesh[]>;
}) {
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

  useEffect(() => {
    const targets = ballTargetsRef.current;
    if (!targets) return;
    const meshes: THREE.Mesh[] = [];
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.userData.ball = true;
      meshes.push(child);
      targets.push(child);
    });
    return () => {
      for (const mesh of meshes) {
        const index = targets.indexOf(mesh);
        if (index >= 0) targets.splice(index, 1);
      }
    };
  }, [ballTargetsRef, model]);

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

type FloatingLabel = THREE.Object3D & {
  fillOpacity: number;
};

function SectionWord({
  title,
  sectionId,
  index,
  targetsRef,
  flyingRef,
}: {
  title: string;
  sectionId: SectionId;
  index: number;
  targetsRef: RefObject<THREE.Mesh[]>;
  flyingRef: RefObject<boolean>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<FloatingLabel>(null);
  const hitRef = useRef<THREE.Mesh>(null);
  const worldPosition = useMemo(() => new THREE.Vector3(), []);
  const angle = index * STEP;
  const orbit = 1.08;

  useEffect(() => {
    const mesh = hitRef.current;
    const targets = targetsRef.current;
    if (!mesh || !targets) return;
    targets.push(mesh);
    return () => {
      const index = targets.indexOf(mesh);
      if (index >= 0) targets.splice(index, 1);
    };
  }, [targetsRef]);

  useFrame(() => {
    const group = groupRef.current;
    const text = textRef.current;
    if (!group || !text) return;

    group.getWorldPosition(worldPosition);
    const facing = flyingRef.current ? 0 : THREE.MathUtils.smoothstep(worldPosition.z, -0.15, 0.9);
    text.fillOpacity = facing;
    group.scale.setScalar(0.82 + facing * 0.18);
    if (hitRef.current) hitRef.current.userData.facing = facing;
  });

  return (
    <group
      ref={groupRef}
      position={[Math.sin(angle) * orbit, 0.18, Math.cos(angle) * orbit]}
      rotation={[0, angle, 0]}
    >
      <Text
        ref={textRef as Ref<THREE.Mesh>}
        font="/fonts/WorkSans-Bold.ttf"
        fontSize={0.2}
        color="#e23d4e"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.04}
      >
        {title}
      </Text>
      <mesh ref={hitRef} position={[0, 0, 0.03]} userData={{ sectionId, facing: 0 }}>
        <planeGeometry args={[1.7, 0.55]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function SectionWords({
  targetsRef,
  flyingRef,
}: {
  targetsRef: RefObject<THREE.Mesh[]>;
  flyingRef: RefObject<boolean>;
}) {
  return (
    <>
      {sections.map((section, index) => (
        <SectionWord
          key={section.id}
          title={section.title}
          sectionId={section.id}
          index={index}
          targetsRef={targetsRef}
          flyingRef={flyingRef}
        />
      ))}
    </>
  );
}

function WordPicker({
  pickRef,
  targetsRef,
  ballTargetsRef,
}: {
  pickRef: SceneProps["pickRef"];
  targetsRef: RefObject<THREE.Mesh[]>;
  ballTargetsRef: RefObject<THREE.Mesh[]>;
}) {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);

  useEffect(() => {
    if (!pickRef) return;
    pickRef.current = (clientX, clientY) => {
      const words = targetsRef.current ?? [];
      const ball = ballTargetsRef.current ?? [];
      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;

      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([...words, ...ball], false);
      for (const hit of hits) {
        const id = hit.object.userData.sectionId;
        if (id === "projects" || id === "about" || id === "contact") {
          if (Number(hit.object.userData.facing) > 0.55) return { sectionId: id, ball: true };
          continue;
        }
        if (hit.object.userData.ball) return { sectionId: null, ball: true };
      }
      return null;
    };

    return () => {
      pickRef.current = null;
    };
  }, [ballTargetsRef, camera, gl, pickRef, pointer, raycaster, targetsRef]);

  return null;
}

function BallFlight({
  spikeRef,
  onDone,
  reduced,
  flyingRef,
  children,
}: {
  spikeRef: SceneProps["spikeRef"];
  onDone: () => void;
  reduced: boolean;
  flyingRef: RefObject<boolean>;
  children: ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const onDoneRef = useRef(onDone);
  const flight = useRef({ playing: false, time: 0, spin: 0 });

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (!spikeRef) return;
    spikeRef.current = () => {
      if (flight.current.playing) return;
      if (reduced) {
        onDoneRef.current();
        return;
      }
      flight.current.playing = true;
      flight.current.time = 0;
      flight.current.spin = 0;
    };
    return () => {
      spikeRef.current = null;
    };
  }, [reduced, spikeRef]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    const state = flight.current;
    if (flyingRef.current !== undefined) flyingRef.current = state.playing;
    if (!group) return;
    if (!state.playing) {
      group.position.set(0, 0, 0);
      group.rotation.x = 0;
      return;
    }

    const duration = 1.15;
    state.time = Math.min(duration, state.time + delta);
    const t = state.time / duration;
    const launch = 1 - (1 - t) * (1 - t);
    group.position.z = -launch * 9.5;
    group.position.y = Math.sin(t * Math.PI) * 1.7;
    group.position.x = 0;
    state.spin += delta * (48 + t * 40);
    group.rotation.x = -state.spin;

    if (t >= 1) {
      state.playing = false;
      state.spin = 0;
      group.position.set(0, 0, 0);
      group.rotation.x = 0;
      onDoneRef.current();
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function Turntable({
  controller,
  onReady,
  targetsRef,
  ballTargetsRef,
  flyingRef,
}: {
  controller: RotationController;
  onReady: () => void;
  targetsRef: RefObject<THREE.Mesh[]>;
  ballTargetsRef: RefObject<THREE.Mesh[]>;
  flyingRef: RefObject<boolean>;
}) {
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
        <MikasaBall onReady={onReady} ballTargetsRef={ballTargetsRef} />
        <SectionWords targetsRef={targetsRef} flyingRef={flyingRef} />
      </group>
    </group>
  );
}

function SceneContents({ controller, onReady, pickRef, spikeRef, onSpikeDone }: SceneProps) {
  const targetsRef = useRef<THREE.Mesh[]>([]);
  const ballTargetsRef = useRef<THREE.Mesh[]>([]);
  const flyingRef = useRef(false);

  return (
    <>
      <StudioEnv />
      <FrameCamera />
      <WordPicker pickRef={pickRef} targetsRef={targetsRef} ballTargetsRef={ballTargetsRef} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4.5, 6.5, 5]} intensity={2.2} color="#fff8ef" />
      <directionalLight position={[-5, 2.2, -3]} intensity={0.4} color="#e23d4e" />
      <directionalLight position={[0, 1.5, -5]} intensity={0.35} color="#1e4db7" />
      <SoftShadow />
      <BallFlight spikeRef={spikeRef} onDone={onSpikeDone} reduced={controller.reduced} flyingRef={flyingRef}>
        <Turntable
          controller={controller}
          onReady={onReady}
          targetsRef={targetsRef}
          ballTargetsRef={ballTargetsRef}
          flyingRef={flyingRef}
        />
      </BallFlight>
    </>
  );
}

export function VolleyballScene({ controller, onReady, pickRef, spikeRef, onSpikeDone }: SceneProps) {
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
      <SceneContents
        controller={controller}
        onReady={onReady}
        pickRef={pickRef}
        spikeRef={spikeRef}
        onSpikeDone={onSpikeDone}
      />
    </Canvas>
  );
}
