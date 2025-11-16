import {
  Center,
  Environment,
  Lightformer,
  PerspectiveCamera,
  RenderTexture,
  Resize,
  Text,
  useGLTF,
  useTexture,
} from '@react-three/drei';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';

import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

extend({ MeshLineGeometry, MeshLineMaterial });

function getAvatarSrc(avatar) {
  if (!avatar) return undefined;
  if (typeof avatar === 'string') return avatar;
  if (typeof avatar === 'object') {
    if ('src' in avatar) return avatar.src;
    return undefined;
  }
}

export default function Badge3D({ attendee, isDark }) {
  const canvasRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsSaving(true);
    requestAnimationFrame(() => {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const username = attendee?.username?.toLowerCase() || 'guest';
        link.download = `badge-${username}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Failed to export badge', error);
      } finally {
        setIsSaving(false);
      }
    });
  };

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 13], fov: 25 }}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
        }}
      >
        <ambientLight intensity={Math.PI} />
        <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
          <Band attendee={attendee} />
        </Physics>
        <Environment background blur={0.75}>
          <color attach="background" args={isDark ? ['#04061e'] : ['#f8f8f9']} />
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isSaving}
        className="group absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:scale-105">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M12 3a.75.75 0 0 1 .75.75v9.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V3.75A.75.75 0 0 1 12 3Z" />
            <path d="M4.5 20.25a.75.75 0 0 1 0-1.5h15a.75.75 0 0 1 0 1.5h-15Z" />
          </svg>
        </span>
        {isSaving ? 'Đang tạo...' : 'Tải về PNG'}
      </button>
    </div>
  );
}

function Band({ maxSpeed = 50, minSpeed = 10, attendee }) {
  const band = useRef(), fixed = useRef(), j1 = useRef(), j2 = useRef(), j3 = useRef(), card = useRef() // prettier-ignore
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3() // prettier-ignore
  const segmentProps = {
    type: 'dynamic',
    canSleep: true,
    colliders: false,
    angularDamping: 2,
    linearDamping: 2,
  };
  useGLTF.preload('/tag.glb');

  const { nodes, materials } = useGLTF('/tag.glb');

  const texture = useTexture('/band.png');
  const { width, height } = useThree((state) => state.size);
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]]) // prettier-ignore

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }
    if (fixed.current) {
      // Fix most of the jitter when over pulling the card
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });
      // Calculate catmul curve
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(32));
      // Tilt it back towards the screen
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  function BadgeTexture({ attendee }) {
    const avatar = getAvatarSrc(attendee?.avatar);
    const qrCode = '/qrcode.png';
    return (
      <>
        <PerspectiveCamera makeDefault manual aspect={1.05} position={[0.49, 0.22, 2]} />

        <Center>
          <Resize maxHeight={2000} maxWidth={2000}>
            <group>
              {/* Avatar với viền gradient */}
              {avatar && (
                <>
                  <mesh scale={[0.8, -0.8, 0.8]} position={[2.5, 1.4, 0.015]}>
                    <circleGeometry args={[0.48, 64]} />
                    <meshBasicMaterial color="#4f46e5" />
                  </mesh>
                  <mesh scale={[0.8, -0.8, 0.8]} position={[2.5, 1.4, 0.02]}>
                    <circleGeometry args={[0.45, 64]} />
                    <meshBasicMaterial map={useTexture(avatar)} transparent />
                  </mesh>
                </>
              )}

              {/* Tên */}
              <Text
                fontSize={0.18}
                position={[1.5, 2, 0]}
                rotation={[0, Math.PI, Math.PI]}
                anchorX="left"
                anchorY="middle"
                color="#ffffff"
                fontStyle="600"
                textAlign="left"
              >
                {attendee.name}
              </Text>

              {/* Username */}
              <Text
                fontSize={0.14}
                position={[1.5, 2.3, 0]}
                rotation={[0, Math.PI, Math.PI]}
                anchorX="left"
                anchorY="middle"
                color="#a5b4fc"
                letterSpacing={0.02}
                textAlign="left"
              >
                @{attendee.username}
              </Text>

              {/* Email */}
              {attendee.email && (
                <Text
                  fontSize={0.11}
                  position={[1.5, 2.6, 0]}
                  rotation={[0, Math.PI, Math.PI]}
                  anchorX="left"
                  anchorY="middle"
                  color="#cbd5f5"
                  textAlign="left"
                >
                  {attendee.email}
                </Text>
              )}

              {/* Bio */}
              {attendee.bio && (
                <Text
                  fontSize={0.09}
                  position={[1.7, 3, 0]}
                  rotation={[0, Math.PI, Math.PI]}
                  anchorX="left"
                  anchorY="middle"
                  color="#94a3b8"
                  textAlign="left"
                  maxWidth={1.0}
                >
                  {attendee.bio}
                </Text>
              )}

              {/* QR Code với background trắng - bên phải bio */}
              {qrCode && (
                <>
                  <mesh scale={[0.55, -0.55, 0.55]} position={[3.2, 3.5, 0.01]}>
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                  <mesh scale={[0.5, -0.5, 0.5]} position={[3.2, 3.5, 0.02]}>
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial map={useTexture(qrCode)} transparent />
                  </mesh>
                </>
              )}

              {/* Website */}
              <Text
                fontSize={0.1}
                position={[1.5, 3.75, 0]}
                rotation={[0, Math.PI, Math.PI]}
                anchorX="left"
                anchorY="bottom"
                color="#818cf8"
                textAlign="left"
              >
                🌐 {attendee.website || 'bug.edu.vn'}
              </Text>
            </group>
          </Resize>
        </Center>
      </>
    );
  }

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={(e) => (
              e.target.setPointerCapture(e.pointerId),
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            )}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                clearcoat={1}
                clearcoatRoughness={0.15}
                iridescence={1}
                iridescenceIOR={1}
                iridescenceThicknessRange={[0, 2400]}
                metalness={0.5}
                roughness={0.3}
              >
                <RenderTexture attach="map" height={2000} width={2000}>
                  <BadgeTexture attendee={attendee} />
                </RenderTexture>
              </meshPhysicalMaterial>
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={[width, height]}
          useMap
          map={texture}
          repeat={[-3, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}
