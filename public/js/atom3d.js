// ==========================================================================
// Smart Periodic Table - Three.js 3D Atomic Model Module
// Encapsulates scene creation, electron orbital mechanics, lighting,
// dynamic resize handling, and comprehensive canvas/memory disposal.
// ==========================================================================

(function(root) {
  const { useState, useEffect, useRef } = React;

  /**
   * Encapsulated Three.js 3D Atom Controller
   * Handles scene creation, orbital physics, resize reactivity, and disposal.
   */
  function createAtomRenderer(mountElement, element, options = {}) {
    let disposed = false;
    let initFrame = null;
    let animId = null;
    let resizeObserver = null;
    let renderer = null;
    let scene = null;
    let camera = null;
    let domElem = mountElement;
    let nucleusGroup = null;
    let electronsList = [];

    let speed = options.speed ?? 1;
    let isPaused = options.isPaused ?? false;

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

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

    const onWheel = (e) => {
      if (!camera) return;
      camera.position.z = Math.max(4, Math.min(22, camera.position.z + e.deltaY * 0.01));
    };

    const resizeRenderer = () => {
      if (!domElem || !renderer || !camera) return;
      const rect = domElem.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const initializeThree = () => {
      if (disposed || !domElem) return;

      const rect = domElem.getBoundingClientRect();

      // When the 3D tab is opened for the first time, layout may still be completing.
      // Defer WebGL initialization until the mount container has a valid non-zero size.
      if (rect.width < 2 || rect.height < 2) {
        initFrame = requestAnimationFrame(initializeThree);
        return;
      }

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, rect.width / rect.height, 0.1, 1000);
      camera.position.set(0, 6, 11);
      camera.lookAt(0, 0, 0);

      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(rect.width, rect.height, false);
        domElem.innerHTML = '';
        domElem.appendChild(renderer.domElement);
      } catch (err) {
        console.warn('WebGL init failed:', err);
        domElem.innerHTML = '<div class="flex items-center justify-center h-full text-xs text-slate-400 p-4 text-center">رندر سه‌بعدی WebGL در این محیط در دسترس نیست.</div>';
        return;
      }

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0x00f0ff, 2, 100);
      pointLight.position.set(10, 12, 10);
      scene.add(pointLight);

      // --- Core Nucleus Group (Protons & Neutrons) ---
      nucleusGroup = new THREE.Group();
      const actualNeutrons = Number.isFinite(element.neutrons) ? element.neutrons : 0;
      const actualNucleons = Math.max(1, element.protons + actualNeutrons);
      const totalNucleons = Math.min(actualNucleons, 60);
      const visibleProtons = Math.round((totalNucleons * element.protons) / actualNucleons);

      for (let i = 0; i < totalNucleons; i++) {
        const isProton = i < visibleProtons;
        const geo = new THREE.SphereGeometry(0.14, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
          color: isProton ? 0xf43f5e : 0xf59e0b,
          roughness: 0.2,
          metalness: 0.2,
          emissive: isProton ? 0x881337 : 0x78350f,
          emissiveIntensity: 0.4
        });
        const mesh = new THREE.Mesh(geo, mat);

        const phi = Math.acos(-1 + (2 * i) / totalNucleons);
        const theta = Math.sqrt(totalNucleons * Math.PI) * phi;
        const r = 0.4 * Math.cbrt(Math.random());

        mesh.position.set(
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(phi)
        );
        nucleusGroup.add(mesh);
      }
      scene.add(nucleusGroup);

      // --- Electron Shells & Orbits Group ---
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
          opacity: 0.35
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        orbitHolder.add(ring);

        for (let e = 0; e < electronCount; e++) {
          const eGeo = new THREE.SphereGeometry(0.09, 16, 16);
          const eMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x00f0ff,
            emissiveIntensity: 1.0
          });
          const eMesh = new THREE.Mesh(eGeo, eMat);
          const initialAngle = (e / electronCount) * Math.PI * 2;
          electronsList.push({
            mesh: eMesh,
            radius: shellRadius,
            angle: initialAngle,
            baseSpeed: 0.025 / (shellIdx + 1)
          });
          orbitHolder.add(eMesh);
        }
        shellsGroup.add(orbitHolder);
      });
      scene.add(shellsGroup);

      domElem.addEventListener('mousedown', onMouseDown);
      domElem.addEventListener('touchstart', onTouchStart, { passive: true });
      domElem.addEventListener('wheel', onWheel, { passive: true });
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd);

      if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver(resizeRenderer);
        resizeObserver.observe(domElem);
      }

      const animate = () => {
        if (disposed || !renderer || !scene || !camera) return;
        animId = requestAnimationFrame(animate);

        if (!isPaused) {
          nucleusGroup.rotation.y += 0.005 * speed;
          electronsList.forEach(item => {
            item.angle += item.baseSpeed * speed;
            item.mesh.position.x = Math.cos(item.angle) * item.radius;
            item.mesh.position.z = Math.sin(item.angle) * item.radius;
          });
        }
        renderer.render(scene, camera);
      };

      renderer.render(scene, camera);
      animate();
    };

    // Defer first WebGL init until layout is ready
    initFrame = requestAnimationFrame(initializeThree);

    return {
      setSpeed: (newSpeed) => { speed = newSpeed; },
      setPaused: (newPaused) => { isPaused = newPaused; },
      resize: resizeRenderer,
      dispose: () => {
        disposed = true;
        if (initFrame) cancelAnimationFrame(initFrame);
        if (animId) cancelAnimationFrame(animId);
        if (resizeObserver) resizeObserver.disconnect();

        if (domElem) {
          domElem.removeEventListener('mousedown', onMouseDown);
          domElem.removeEventListener('touchstart', onTouchStart);
          domElem.removeEventListener('wheel', onWheel);
        }
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);

        if (scene) {
          scene.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose?.();
            if (obj.material) {
              const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
              materials.forEach(mat => mat.dispose?.());
            }
          });
        }
        if (renderer) {
          renderer.dispose();
          renderer.forceContextLoss?.();
        }
        if (domElem) domElem.innerHTML = '';
      }
    };
  }

  /**
   * Atom3DView React Component
   */
  const Atom3DView = ({ element }) => {
    if (!element) return null;
    const mountRef = useRef(null);
    const [speed, setSpeed] = useState(1);
    const [isPaused, setIsPaused] = useState(false);
    const controllerRef = useRef(null);

    useEffect(() => {
      if (controllerRef.current) {
        controllerRef.current.setSpeed(speed);
      }
    }, [speed]);

    useEffect(() => {
      if (controllerRef.current) {
        controllerRef.current.setPaused(isPaused);
      }
    }, [isPaused]);

    useEffect(() => {
      if (!element || !mountRef.current) return;

      const controller = createAtomRenderer(mountRef.current, element, {
        speed,
        isPaused
      });
      controllerRef.current = controller;

      return () => {
        controller.dispose();
        controllerRef.current = null;
      };
    }, [element?.number]);

    return (
      <div className="relative w-full h-80 bg-slate-950/90 rounded-2xl border border-slate-800/80 overflow-hidden cursor-grab active:cursor-grabbing cyber-glass">
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 text-[11px] bg-slate-950/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-800">
          <span>پروتون: <strong className="text-rose-400">{element.protons}p⁺</strong></span>
          <span title={element.neutronNote || ''}>نوترون*: <strong className="text-amber-400">{element.neutrons ?? '?'}n⁰</strong></span>
          <span>الکترون: <strong className="text-cyan-400">{element.electrons}e⁻</strong></span>
        </div>

        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur p-1 rounded-xl border border-slate-800 text-[11px]">
          <button onClick={() => setIsPaused(p => !p)} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200">
            {isPaused ? '▶ ادامه' : '⏸ توقف'}
          </button>
          <button onClick={() => setSpeed(s => s === 1 ? 2 : (s === 2 ? 0.5 : 1))} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono">
            {speed}x
          </button>
        </div>

        <div ref={mountRef} className="w-full h-full" data-atom-3d-mount={element.number}></div>

        <div className="absolute bottom-2 left-3 right-3 text-[10px] text-slate-500 pointer-events-none flex justify-between gap-2">
          <span>چرخش ۳ بعدی با درگ | زوم با غلتک ماوس</span>
          <span>* ایزوتوپ مرجع مدل: {element.representativeIsotopeMassNumber ? `${element.symbol}-${element.representativeIsotopeMassNumber}` : 'نامشخص'}</span>
        </div>
      </div>
    );
  };

  root.createAtomRenderer = createAtomRenderer;
  root.Atom3DView = Atom3DView;
})(window);
