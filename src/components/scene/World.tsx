import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sky } from "@react-three/drei";
import * as THREE from "three";
import {
  buildTerrainGeometry,
  flowCurve,
  sampleFlow,
  toWorld,
  type FlowData,
  SITES,
} from "@/lib/geo";
import { flowAmount, useSim } from "@/lib/sim-store";

const _head = new THREE.Vector3();
const _look = new THREE.Vector3();
const _cam = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _tangent = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();

type Props = {
  heights: Float32Array;
  flow: FlowData;
};

export function World({ heights, flow }: Props) {
  const terrainGeo = useMemo(() => buildTerrainGeometry(heights), [heights]);
  const curve = useMemo(() => flowCurve(flow.points), [flow.points]);
  const drape = useMemo(() => {
    const t = new THREE.TextureLoader().load("/terrain/drape.jpg");
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    return t;
  }, []);

  useEffect(() => {
    return () => {
      terrainGeo.dispose();
      drape.dispose();
    };
  }, [terrainGeo, drape]);

  return (
    <>
      <color attach="background" args={["#8fa3b3"]} />
      <fog attach="fog" args={["#9aadb8", 900, 6200]} />
      <hemisphereLight args={["#d7e3ee", "#6a5c4c", 0.55]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[420, 680, 280]}
        intensity={1.85}
        color="#fff4e5"
      />
      <Sky
        sunPosition={[120, 48, 70]}
        mieCoefficient={0.004}
        mieDirectionalG={0.82}
        rayleigh={1.6}
        turbidity={5.5}
      />

      <mesh geometry={terrainGeo} frustumCulled={false}>
        <meshStandardMaterial
          map={drape}
          roughness={0.94}
          metalness={0.02}
          envMapIntensity={0.3}
        />
      </mesh>

      <Glacier origin={toWorld(SITES.glacier.lat, SITES.glacier.lon, SITES.glacier.alt)} />
      <PortComplex />
      <DebrisFlow curve={curve} points={flow.points} />
      <SiteMarkers />
      <CinematicRig curve={curve} points={flow.points} />
    </>
  );
}

function SiteMarkers() {
  const g = toWorld(SITES.glacier.lat, SITES.glacier.lon, SITES.glacier.alt + 40);
  const p = toWorld(SITES.port.lat, SITES.port.lon, SITES.port.alt + 30);
  return (
    <group>
      <mesh position={g}>
        <sphereGeometry args={[3.2, 12, 12]} />
        <meshBasicMaterial color="#cfe8f2" />
      </mesh>
      <mesh position={p}>
        <sphereGeometry args={[3.2, 12, 12]} />
        <meshBasicMaterial color="#efe6d2" />
      </mesh>
    </group>
  );
}

function Glacier({ origin }: { origin: THREE.Vector3 }) {
  const chunks = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return {
        pos: new THREE.Vector3(
          origin.x + Math.cos(a) * (4 + (i % 5)),
          origin.y + 6 + (i % 3) * 2,
          origin.z + Math.sin(a) * (3 + (i % 4)),
        ),
        vel: new THREE.Vector3(
          (Math.sin(i * 1.7) - 0.2) * 18,
          4 + (i % 4),
          (Math.cos(i * 1.3) - 0.4) * 10,
        ),
        size: 2.2 + (i % 5) * 0.7,
        rot: new THREE.Vector3(i * 0.4, i * 0.7, i * 0.2),
      };
    });
  }, [origin]);

  const group = useRef<THREE.Group>(null);
  const iceRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const t = useSim.getState().progress;
    const fall = THREE.MathUtils.smoothstep(t, 0.12, 0.28);
    const groupObj = group.current;
    if (!groupObj) return;
    groupObj.children.forEach((child, i) => {
      const c = chunks[i];
      if (!c) return;
      const y = c.pos.y + c.vel.y * fall * 4 - 70 * fall * fall;
      child.position.set(
        c.pos.x + c.vel.x * fall * 6,
        Math.max(origin.y - 80, y),
        c.pos.z + c.vel.z * fall * 6,
      );
      child.rotation.set(c.rot.x + fall * 4, c.rot.y + fall * 6, c.rot.z);
      const s = c.size * (1 - fall * 0.35);
      child.scale.setScalar(s);
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat) mat.opacity = 1 - fall * 0.85;
    });
    if (iceRef.current) {
      iceRef.current.scale.setScalar(1 - fall * 0.55);
      const mat = iceRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.92 - fall * 0.5;
    }
  });

  return (
    <group>
      <mesh ref={iceRef} position={[origin.x, origin.y + 8, origin.z]}>
        <icosahedronGeometry args={[14, 1]} />
        <meshStandardMaterial
          color="#d9eef6"
          roughness={0.28}
          metalness={0.08}
          transparent
          opacity={0.92}
        />
      </mesh>
      <group ref={group}>
        {chunks.map((c, i) => (
          <mesh key={i} position={c.pos}>
            <dodecahedronGeometry args={[c.size, 0]} />
            <meshStandardMaterial
              color={i % 2 ? "#e8f4f8" : "#c5d5dc"}
              roughness={0.4}
              transparent
              opacity={1}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function PortComplex() {
  const base = toWorld(SITES.port.lat, SITES.port.lon, SITES.port.alt);
  const buried = useRef(0);
  const group = useRef<THREE.Group>(null);
  const mud = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const amt = flowAmount(useSim.getState().progress);
    const hit = THREE.MathUtils.smoothstep(amt, 0.9, 1);
    buried.current = hit;
    if (group.current) {
      group.current.position.y = base.y - hit * 4.5;
    }
    if (mud.current) {
      const s = 2 + hit * 18;
      mud.current.scale.set(s, 0.4 + hit * 1.6, s * 0.7);
      const mat = mud.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.15 + hit * 0.72;
    }
  });

  return (
    <group position={[base.x, 0, base.z]}>
      <group ref={group} position={[0, base.y, 0]}>
        <mesh position={[0, 2.4, 0]} castShadow>
          <boxGeometry args={[9.2, 4.8, 5.4]} />
          <meshStandardMaterial color="#cfc6b6" roughness={0.86} />
        </mesh>
        <mesh position={[7.4, 1.5, 1.2]}>
          <boxGeometry args={[5.2, 3.0, 4.0]} />
          <meshStandardMaterial color="#b7b0a2" roughness={0.9} />
        </mesh>
        <mesh position={[-6.8, 1.2, -0.6]}>
          <boxGeometry args={[4.4, 2.4, 3.6]} />
          <meshStandardMaterial color="#c2b8a8" roughness={0.88} />
        </mesh>
        <mesh position={[1, 0.12, 8]} rotation={[-Math.PI / 2, 0, 0.12]}>
          <planeGeometry args={[28, 14]} />
          <meshStandardMaterial color="#5a5854" roughness={1} />
        </mesh>
        <mesh position={[-2, 0.14, -7]} rotation={[-Math.PI / 2, 0, 0.4]}>
          <planeGeometry args={[40, 5]} />
          <meshStandardMaterial color="#4a4946" roughness={1} />
        </mesh>
      </group>
      <mesh ref={mud} position={[0, base.y + 0.6, 0]} rotation={[-Math.PI / 2, 0, 0.15]}>
        <circleGeometry args={[6, 28]} />
        <meshStandardMaterial
          color="#4a3426"
          roughness={1}
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function DebrisFlow({
  curve,
  points,
}: {
  curve: THREE.CatmullRomCurve3;
  points: FlowData["points"];
}) {
  const iceGeo = useMemo(
    () => new THREE.TubeGeometry(curve, 180, 2.1, 8, false),
    [curve],
  );
  const mudGeo = useMemo(
    () => new THREE.TubeGeometry(curve, 180, 4.6, 10, false),
    [curve],
  );
  const iceMat = useMemo(() => makeFlowMaterial(true), []);
  const mudMat = useMemo(() => makeFlowMaterial(false), []);
  const head = useRef<THREE.Mesh>(null);
  const dust = useRef<THREE.Points>(null);
  const rocks = useRef<THREE.InstancedMesh>(null);

  const dustGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 420;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const p = curve.getPointAt(t);
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y + 4;
      pos[i * 3 + 2] = p.z;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [curve]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, dt) => {
    const t = useSim.getState().progress;
    const amt = flowAmount(t);
    iceMat.uniforms.uProgress.value = amt;
    iceMat.uniforms.uTime.value += dt;
    mudMat.uniforms.uProgress.value = Math.max(0, (amt - 0.42) / 0.58);
    mudMat.uniforms.uTime.value += dt;

    const pt = sampleFlow(points, amt);
    _head.copy(toWorld(pt.lat, pt.lon, pt.alt + 10));
    if (head.current) {
      head.current.position.copy(_head);
      const s = 3.5 + amt * 6;
      head.current.scale.setScalar(amt > 0.02 ? s : 0.001);
    }
    if (dust.current) {
      const pos = dust.current.geometry.getAttribute("position");
      const shown = Math.floor(amt * 420);
      dust.current.geometry.setDrawRange(0, shown);
      for (let i = Math.max(0, shown - 40); i < shown; i++) {
        pos.setY(i, pos.getY(i) + Math.sin(t * 40 + i) * 0.04);
      }
      pos.needsUpdate = true;
    }
    if (rocks.current) {
      const n = rocks.current.count;
      for (let i = 0; i < n; i++) {
        const u = i / n;
        if (u > amt) {
          dummy.scale.set(0, 0, 0);
        } else {
          const p = curve.getPointAt(Math.min(0.999, u));
          curve.getTangentAt(Math.min(0.999, u), _tangent);
          _offset
            .copy(_tangent)
            .cross(_up)
            .normalize()
            .multiplyScalar(((i % 7) - 3) * 1.4);
          dummy.position.copy(p).add(_offset);
          dummy.position.y += 1.2;
          dummy.rotation.set(i * 0.7, i * 1.1, i * 0.4);
          const sc = 0.7 + (i % 5) * 0.35;
          dummy.scale.setScalar(sc);
        }
        dummy.updateMatrix();
        rocks.current.setMatrixAt(i, dummy.matrix);
      }
      rocks.current.instanceMatrix.needsUpdate = true;
    }
  });

  useEffect(() => {
    return () => {
      iceGeo.dispose();
      mudGeo.dispose();
      iceMat.dispose();
      mudMat.dispose();
      dustGeo.dispose();
    };
  }, [iceGeo, mudGeo, iceMat, mudMat, dustGeo]);

  return (
    <group>
      <mesh geometry={iceGeo} material={iceMat} frustumCulled={false} />
      <mesh geometry={mudGeo} material={mudMat} frustumCulled={false} />
      <mesh ref={head}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#5a3c28" roughness={0.95} />
      </mesh>
      <points ref={dust} geometry={dustGeo} frustumCulled={false}>
        <pointsMaterial
          color="#c4b09a"
          size={4.5}
          sizeAttenuation
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </points>
      <instancedMesh ref={rocks} args={[undefined, undefined, 90]} frustumCulled={false}>
        <dodecahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial color="#6a5340" roughness={1} />
      </instancedMesh>
    </group>
  );
}

function makeFlowMaterial(ice: boolean) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uIce: { value: ice ? 1 : 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uProgress;
      uniform float uTime;
      uniform float uIce;
      varying vec2 vUv;
      void main() {
        if (vUv.x > uProgress) discard;
        float edge = 1.0 - smoothstep(uProgress - 0.04, uProgress, vUv.x);
        vec3 iceCol = vec3(0.78, 0.88, 0.93);
        vec3 rockCol = vec3(0.45, 0.32, 0.22);
        vec3 mudCol = vec3(0.28, 0.18, 0.12);
        vec3 col = mix(iceCol, rockCol, smoothstep(0.0, 0.38, vUv.x));
        col = mix(col, mudCol, smoothstep(0.4, 0.85, vUv.x));
        if (uIce < 0.5) col = mix(rockCol, mudCol, vUv.x);
        float foam = pow(abs(vUv.y - 0.5) * 2.0, 4.0);
        float pulse = 0.05 * sin(vUv.x * 55.0 - uTime * 9.0);
        float alpha = (0.55 + 0.35 * uIce) * edge;
        gl_FragColor = vec4(col + foam * 0.14 + pulse, alpha);
      }
    `,
  });
}

function CinematicRig({
  curve,
  points,
}: {
  curve: THREE.CatmullRomCurve3;
  points: FlowData["points"];
}) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  const explore = useSim((s) => s.mode === "explore");

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    useSim.getState().tick(dt);
    if (explore) return;

    const t = useSim.getState().progress;
    const amt = flowAmount(t);
    const head = sampleFlow(points, Math.max(amt, 0.001));
    _head.copy(toWorld(head.lat, head.lon, head.alt));
    const glacier = toWorld(SITES.glacier.lat, SITES.glacier.lon, SITES.glacier.alt);
    const port = toWorld(SITES.port.lat, SITES.port.lon, SITES.port.alt);

    poseCamera(t, amt, glacier, port, _head, curve, _cam, _look);
    const k = 1 - Math.exp(-dt * 2.4);
    camera.position.lerp(_cam, k);
    target.current.lerp(_look, k);
    camera.lookAt(target.current);
    camera.updateMatrixWorld();
  });

  return (
    <OrbitControls
      enabled={explore}
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI / 2.05}
      minDistance={40}
      maxDistance={4200}
      target={toWorld(SITES.port.lat, SITES.port.lon, SITES.port.alt + 40).toArray()}
    />
  );
}

function poseCamera(
  t: number,
  amt: number,
  glacier: THREE.Vector3,
  port: THREE.Vector3,
  head: THREE.Vector3,
  curve: THREE.CatmullRomCurve3,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3,
) {
  if (t < 0.12) {
    const u = t / 0.12;
    outPos.set(-200 + u * 400, 980 - u * 220, 1600 - u * 400);
    outLook.lerpVectors(_a.set(400, 420, 0), glacier, u);
    return;
  }
  if (t < 0.2) {
    const u = (t - 0.12) / 0.08;
    outPos.copy(glacier).add(_a.set(-70, 40 - u * 8, 90));
    outLook.copy(glacier);
    return;
  }
  if (t < 0.86) {
    const u = Math.min(0.999, Math.max(0.01, amt));
    curve.getPointAt(u, head);
    curve.getTangentAt(u, _tangent).normalize();
    outPos
      .copy(head)
      .addScaledVector(_tangent, -55)
      .add(_a.set(18, 28 + (1 - u) * 22, 32));
    outLook.copy(head).addScaledVector(_tangent, 40);
    return;
  }
  const u = (t - 0.86) / 0.14;
  _a.copy(port).add(_b.set(-40, 55, 80));
  _c.set(420, 920, 1100);
  outPos.lerpVectors(_a, _c, u);
  outLook.lerpVectors(port, _b.set(500, 280, -40), u);
}
