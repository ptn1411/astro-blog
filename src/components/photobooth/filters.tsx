import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type FilterMode = 'none' | 'mask' | 'particles' | 'shader' | 'frame';

export interface FaceData {
  // normalized landmarks 0..1 (mediapipe space: x/y screen, z depth)
  points: { x: number; y: number; z: number }[] | null;
}

// Helper: convert mediapipe (0..1) to scene coords for a plane that fills [-aspect/2..aspect/2, -0.5..0.5, 0]
function lmToScene(lm: { x: number; y: number; z: number }, aspect: number) {
  return new THREE.Vector3((0.5 - lm.x) * aspect, (0.5 - lm.y), -lm.z * 0.5);
}

/* ------------------ AR Mask (glasses + hat) ------------------ */

export function ARMask({ face, aspect }: { face: FaceData; aspect: number }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current) return;
    const pts = face.points;
    if (!pts) {
      group.current.visible = false;
      return;
    }
    group.current.visible = true;

    // Key landmark indices (MediaPipe 468-pt face mesh)
    const leftEye = lmToScene(pts[33], aspect);
    const rightEye = lmToScene(pts[263], aspect);
    const nose = lmToScene(pts[1], aspect);
    const forehead = lmToScene(pts[10], aspect);

    // Position at face center
    const center = new THREE.Vector3().addVectors(leftEye, rightEye).multiplyScalar(0.5);
    group.current.position.copy(center);

    // Scale by inter-pupillary distance
    const ipd = leftEye.distanceTo(rightEye);
    group.current.scale.setScalar(ipd * 2.5);

    // Rotate to align with eye line
    const eyeDir = new THREE.Vector3().subVectors(rightEye, leftEye);
    group.current.rotation.z = Math.atan2(eyeDir.y, eyeDir.x);

    // Tilt: compute approximate pitch from nose vs forehead
    const pitch = Math.atan2(forehead.y - nose.y, 0.2) - Math.PI / 2;
    group.current.rotation.x = pitch * 0.3;
  });

  return (
    <group ref={group}>
      {/* Glasses: two rings + bridge */}
      <mesh position={[-0.35, 0, 0]}>
        <torusGeometry args={[0.2, 0.04, 16, 32]} />
        <meshStandardMaterial color="#111" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.35, 0, 0]}>
        <torusGeometry args={[0.2, 0.04, 16, 32]} />
        <meshStandardMaterial color="#111" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.35, 0.03, 0.03]} />
        <meshStandardMaterial color="#111" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Lenses (translucent blue) */}
      <mesh position={[-0.35, 0, 0.01]}>
        <circleGeometry args={[0.18, 32]} />
        <meshBasicMaterial color="#3a86ff" transparent opacity={0.25} />
      </mesh>
      <mesh position={[0.35, 0, 0.01]}>
        <circleGeometry args={[0.18, 32]} />
        <meshBasicMaterial color="#3a86ff" transparent opacity={0.25} />
      </mesh>
      {/* Hat (cylinder on forehead) */}
      <group position={[0, 0.9, 0]}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.6, 32]} />
          <meshStandardMaterial color="#c1121f" />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 0.06, 32]} />
          <meshStandardMaterial color="#c1121f" />
        </mesh>
        <mesh position={[0, 0.05, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.45, 32]} />
          <meshBasicMaterial color="#fdf0d5" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------ Particles (confetti/sparkle) ------------------ */

export function Particles({ aspect }: { aspect: number }) {
  const count = 300;
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const palette = [
      new THREE.Color('#ff006e'),
      new THREE.Color('#ffbe0b'),
      new THREE.Color('#3a86ff'),
      new THREE.Color('#8338ec'),
      new THREE.Color('#06d6a0'),
    ];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * aspect;
      pos[i * 3 + 1] = Math.random() * 1.2 - 0.1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
      spd[i] = 0.002 + Math.random() * 0.006;
    }
    return { positions: pos, colors: col, speeds: spd };
  }, [aspect]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry as THREE.BufferGeometry;
    const attr = geom.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= speeds[i] + delta * 0.2;
      arr[i * 3] += Math.sin((performance.now() / 400 + i) * 0.02) * 0.002;
      if (arr[i * 3 + 1] < -0.6) {
        arr[i * 3 + 1] = 0.7;
        arr[i * 3] = (Math.random() - 0.5) * aspect;
      }
    }
    attr.needsUpdate = true;
    pointsRef.current.rotation.z += delta * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial size={0.03} vertexColors sizeAttenuation transparent opacity={0.95} depthWrite={false} />
    </points>
  );
}

/* ------------------ 3D Frame overlay ------------------ */

export function Frame3D({ aspect }: { aspect: number }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
  });

  const w = aspect * 0.98;
  const h = 0.98;
  const t = 0.04;

  return (
    <group ref={groupRef} position={[0, 0, 0.3]}>
      {/* 4 gold frame bars */}
      {[
        { pos: [0, h / 2, 0] as [number, number, number], scale: [w, t, t] as [number, number, number] },
        { pos: [0, -h / 2, 0] as [number, number, number], scale: [w, t, t] as [number, number, number] },
        { pos: [-w / 2, 0, 0] as [number, number, number], scale: [t, h, t] as [number, number, number] },
        { pos: [w / 2, 0, 0] as [number, number, number], scale: [t, h, t] as [number, number, number] },
      ].map((b, i) => (
        <mesh key={i} position={b.pos} scale={b.scale}>
          <boxGeometry />
          <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.25} />
        </mesh>
      ))}
      {/* Corner gems */}
      {[
        [-w / 2, h / 2, 0],
        [w / 2, h / 2, 0],
        [-w / 2, -h / 2, 0],
        [w / 2, -h / 2, 0],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <octahedronGeometry args={[0.05]} />
          <meshStandardMaterial color="#e63946" metalness={0.5} roughness={0.1} emissive="#c1121f" emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------ Video background plane (with optional shader) ------------------ */

export function VideoPlane({
  videoTexture,
  aspect,
  shader,
}: {
  videoTexture: THREE.VideoTexture | null;
  aspect: number;
  shader: 'none' | 'vhs' | 'neon' | 'bw' | 'dream';
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const uniforms = useMemo(
    () => ({
      uMap: { value: videoTexture },
      uTime: { value: 0 },
      uMode: { value: 0 },
    }),
    []
  );

  useEffect(() => {
    if (mat.current) {
      mat.current.uniforms.uMap.value = videoTexture;
      mat.current.uniforms.uMode.value = shader === 'vhs' ? 1 : shader === 'neon' ? 2 : shader === 'bw' ? 3 : shader === 'dream' ? 4 : 0;
    }
  }, [videoTexture, shader]);

  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform sampler2D uMap;
    uniform float uTime;
    uniform int uMode;
    varying vec2 vUv;

    vec3 applyVHS(vec3 c, vec2 uv) {
      float scan = sin(uv.y * 600.0 + uTime * 5.0) * 0.04;
      vec3 outC = c;
      outC.r = texture2D(uMap, uv + vec2(0.005, 0.0)).r;
      outC.b = texture2D(uMap, uv - vec2(0.005, 0.0)).b;
      outC -= scan;
      return outC;
    }
    vec3 applyNeon(vec3 c) {
      float lum = dot(c, vec3(0.299, 0.587, 0.114));
      vec3 pink = vec3(1.0, 0.2, 0.6);
      vec3 cyan = vec3(0.2, 0.9, 1.0);
      return mix(pink, cyan, lum) * (0.6 + lum);
    }
    vec3 applyBW(vec3 c) {
      float g = dot(c, vec3(0.3, 0.59, 0.11));
      return vec3(g);
    }
    vec3 applyDream(vec3 c, vec2 uv) {
      vec3 blur = vec3(0.0);
      float r = 0.006;
      blur += texture2D(uMap, uv + vec2(r,0)).rgb;
      blur += texture2D(uMap, uv - vec2(r,0)).rgb;
      blur += texture2D(uMap, uv + vec2(0,r)).rgb;
      blur += texture2D(uMap, uv - vec2(0,r)).rgb;
      blur *= 0.25;
      return mix(c, blur, 0.5) + vec3(0.05, 0.02, 0.08);
    }

    void main() {
      // mirror horizontally for selfie feel
      vec2 uv = vec2(1.0 - vUv.x, vUv.y);
      vec3 col = texture2D(uMap, uv).rgb;
      if (uMode == 1) col = applyVHS(col, uv);
      else if (uMode == 2) col = applyNeon(col);
      else if (uMode == 3) col = applyBW(col);
      else if (uMode == 4) col = applyDream(col, uv);
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  return (
    <mesh ref={mesh} position={[0, 0, -0.5]}>
      <planeGeometry args={[aspect, 1]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
}
