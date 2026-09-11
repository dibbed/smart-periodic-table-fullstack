import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, FastForward } from 'lucide-react';

/**
 * AtomViewer: High-Performance 3D Atomic Model built with Three.js.
 * Renders protons, neutrons, and electron shells with dynamic orbital rotation.
 * Features strict Zero Memory-Leak architecture with explicit WebGL cleanup.
 *
 * @param {object} props
 * @param {object} props.element - Element data object containing protons, neutrons, shells, etc.
 */
export const AtomViewer = ({ element }) => {
  const mountRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  // References to keep animation loop decoupled from React state updates
  const isPausedRef = useRef(isPaused);
  const speedRef = useRef(speed);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (!element || !mountRef.current) return;

    const mountElement = mountRef.current;
    let animationFrameId = null;
    let renderer = null;
    let scene = null;
    let camera = null;
    let nucleusGroup = null;
    let electronsList = [];

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    // 1. Mouse and Touch Interaction Handlers
    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging || !scene) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      scene.rotation.y += deltaX * 0.008;
      scene.rotation.x += deltaY * 0.008;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e) => {
      if (!isDragging || !scene || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;
      scene.rotation.y += deltaX * 0.008;
      scene.rotation.x += deltaY * 0.008;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      if (!camera) return;
      camera.position.z = Math.max(4, Math.min(26, camera.position.z + e.deltaY * 0.01));
    };

    // 2. Responsive Resize Handler
    const handleResize = () => {
      if (!mountElement || !renderer || !camera) return;
      const width = Math.max(1, mountElement.clientWidth);
      const height = Math.max(1, mountElement.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    // 3. Scene Initialization
    const initThreeScene = () => {
      const width = Math.max(1, mountElement.clientWidth);
      const height = Math.max(1, mountElement.clientHeight);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 6.5, 13);
      camera.lookAt(0, 0, 0);

      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height, false);
        mountElement.innerHTML = '';
        mountElement.appendChild(renderer.domElement);
      } catch (err) {
        console.warn('WebGL initialization failed:', err);
        mountElement.innerHTML = '<div class="flex items-center justify-center h-full text-xs text-slate-400 p-4 text-center">رندر سه‌بعدی WebGL در این محیط در دسترس نیست.</div>';
        return;
      }

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0x00f0ff, 2, 100);
      pointLight.position.set(10, 12, 10);
      scene.add(pointLight);

      // Nucleus: Protons (rose) & Neutrons (amber)
      nucleusGroup = new THREE.Group();
      const actualNeutrons = Number.isFinite(element.neutrons) ? element.neutrons : 0;
      const actualProtons = Number.isFinite(element.protons) ? element.protons : (element.number || 1);
      const actualNucleons = Math.max(1, actualProtons + actualNeutrons);
      const totalNucleons = Math.min(actualNucleons, 60);
      const visibleProtons = Math.round((totalNucleons * actualProtons) / actualNucleons);

      for (let i = 0; i < totalNucleons; i++) {
        const isProton = i < visibleProtons;
        const sphereGeo = new THREE.SphereGeometry(0.14, 16, 16);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: isProton ? 0xf43f5e : 0xf59e0b,
          roughness: 0.25,
          metalness: 0.2,
          emissive: isProton ? 0x881337 : 0x78350f,
          emissiveIntensity: 0.4,
        });
        const nucleonMesh = new THREE.Mesh(sphereGeo, sphereMat);

        const phi = Math.acos(-1 + (2 * i) / totalNucleons);
        const theta = Math.sqrt(totalNucleons * Math.PI) * phi;
        const radius = 0.4 * Math.cbrt(Math.random());

        nucleonMesh.position.set(
          radius * Math.cos(theta) * Math.sin(phi),
          radius * Math.sin(theta) * Math.sin(phi),
          radius * Math.cos(phi)
        );
        nucleusGroup.add(nucleonMesh);
      }
      scene.add(nucleusGroup);

      // Electron Shells and Orbits
      const shellsGroup = new THREE.Group();
      electronsList = [];
      const shells = Array.isArray(element.shells) ? element.shells : [];

      shells.forEach((electronCount, shellIdx) => {
        const shellRadius = 1.5 + shellIdx * 0.75;
        const orbitHolder = new THREE.Group();
        orbitHolder.rotation.x = (shellIdx * Math.PI) / 6;
        orbitHolder.rotation.z = (shellIdx * Math.PI) / 8;

        const ringGeo = new THREE.RingGeometry(shellRadius - 0.018, shellRadius + 0.018, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.35,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        orbitHolder.add(ringMesh);

        for (let e = 0; e < electronCount; e++) {
          const eGeo = new THREE.SphereGeometry(0.09, 16, 16);
          const eMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x00f0ff,
            emissiveIntensity: 1.0,
          });
          const eMesh = new THREE.Mesh(eGeo, eMat);
          const initialAngle = (e / electronCount) * Math.PI * 2;
          electronsList.push({
            mesh: eMesh,
            radius: shellRadius,
            angle: initialAngle,
            baseSpeed: 0.025 / (shellIdx + 1),
          });
          orbitHolder.add(eMesh);
        }
        shellsGroup.add(orbitHolder);
      });
      scene.add(shellsGroup);

      // Event listeners for user interaction
      mountElement.addEventListener('mousedown', onMouseDown);
      mountElement.addEventListener('touchstart', onTouchStart, { passive: true });
      mountElement.addEventListener('wheel', onWheel, { passive: true });
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('resize', handleResize);

      // Animation Render Loop
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        if (!isPausedRef.current) {
          const currentSpeed = speedRef.current;
          if (nucleusGroup) {
            nucleusGroup.rotation.y += 0.005 * currentSpeed;
          }
          electronsList.forEach((item) => {
            item.angle += item.baseSpeed * currentSpeed;
            item.mesh.position.x = Math.cos(item.angle) * item.radius;
            item.mesh.position.z = Math.sin(item.angle) * item.radius;
          });
        }

        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };

      animate();
    };

    initThreeScene();

    // 4. ZERO MEMORY-LEAK CLEANUP
    return () => {
      // 1. متوقف‌سازی حلقه رندر
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      // 2. پیمایش صحنه (Scene Traversal) و اجرای geometry.dispose() و material.dispose() روی تمام Meshها
      if (scene) {
        scene.traverse((object) => {
          if (object.isMesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((mat) => mat.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }

      // 3. پاکسازی کامل WebGL context با renderer.dispose() و حذف المان Canvas از DOM
      if (renderer) {
        renderer.dispose();
        if (typeof renderer.forceContextLoss === 'function') {
          renderer.forceContextLoss();
        }
        try {
          const gl = renderer.getContext?.();
          if (gl && typeof gl.getExtension === 'function') {
            gl.getExtension('WEBGL_lose_context')?.loseContext?.();
          }
        } catch {
          // Ignore environments without WebGL context extension
        }
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }

      // 4. حذف لیسنر تغییر سایز صفحه با window.removeEventListener('resize', handleResize)
      window.removeEventListener('resize', handleResize);

      // حذف سایر لیسنرهای متصل به پنجره و کانتینر
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      if (mountElement) {
        mountElement.removeEventListener('mousedown', onMouseDown);
        mountElement.removeEventListener('touchstart', onTouchStart);
        mountElement.removeEventListener('wheel', onWheel);
        mountElement.innerHTML = '';
      }
    };
  }, [element?.number]);

  if (!element) return null;

  return (
    <div className="relative w-full h-80 bg-slate-950/90 rounded-2xl border border-slate-800/80 overflow-hidden cursor-grab active:cursor-grabbing cyber-glass select-none shadow-2xl">
      {/* Micro HUD Status Bar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 text-[11px] bg-slate-950/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
        <span>پروتون: <strong className="text-rose-400 font-mono">{element.protons}p⁺</strong></span>
        <span title={element.neutronNote || ''}>
          نوترون: <strong className="text-amber-400 font-mono">{element.neutrons ?? '?'}n⁰</strong>
        </span>
        <span>الکترون: <strong className="text-cyan-400 font-mono">{element.electrons}e⁻</strong></span>
      </div>

      {/* Play/Pause and Speed Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur p-1 rounded-xl border border-slate-800 text-[11px]">
        <button
          onClick={() => setIsPaused((prev) => !prev)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition active:scale-95"
          title={isPaused ? 'ادامه چرخش الکترون‌ها' : 'توقف موقت چرخش'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
          <span>{isPaused ? 'ادامه' : 'توقف'}</span>
        </button>

        <button
          onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 0.5 : 1))}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono font-bold transition active:scale-95"
          title="تغییر سرعت انیمیشن مداری"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>{speed}x</span>
        </button>
      </div>

      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        className="w-full h-full"
        data-atom-3d-mount={element.number}
      />

      {/* Footer Helper Legend */}
      <div className="absolute bottom-2 left-3 right-3 text-[10px] text-slate-500 pointer-events-none flex justify-between gap-2">
        <span>چرخش ۳ بعدی با درگ | زوم با غلتک ماوس</span>
        <span>
          ایزوتوپ مرجع مدل: {element.representativeIsotopeMassNumber ? `${element.symbol}-${element.representativeIsotopeMassNumber}` : 'نامشخص'}
        </span>
      </div>
    </div>
  );
};

export default AtomViewer;
