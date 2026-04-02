import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const FREQUENCY_COLORS = {
  unity:          0xc4a35a,
  creation:       0xa78bfa,
  transformation: 0xf472b6,
  healing:        0x34d399,
  awakening:      0x60a5fa,
  remembrance:    0xfb923c,
  vision:         0xe879f9,
  connection:     0x2dd4bf,
};

// Deterministic pseudo-geo from record id + emotion hash
function recordToSphere(record) {
  let h1 = 0, h2 = 0;
  const s = (record.id || "") + (record.emotion || "") + (record.frequency || "");
  for (let i = 0; i < s.length; i++) {
    h1 = (h1 * 31 + s.charCodeAt(i)) % 100000;
    h2 = (h2 * 37 + s.charCodeAt(i)) % 100000;
  }
  const lat = ((h1 / 100000) * 160 - 80) * (Math.PI / 180);
  const lon = ((h2 / 100000) * 360 - 180) * (Math.PI / 180);
  const r = 1.01;
  return new THREE.Vector3(
    r * Math.cos(lat) * Math.cos(lon),
    r * Math.sin(lat),
    r * Math.cos(lat) * Math.sin(lon)
  );
}

export default function ResonanceGlobe({ records = [], onSelectCluster }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth;
    const H = el.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.z = 2.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    el.appendChild(renderer.domElement);

    // Globe wireframe
    const globeGeo = new THREE.SphereGeometry(1, 48, 48);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x1e1040,
      wireframe: false,
      transparent: true,
      opacity: 0.85,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Grid lines
    const gridGeo = new THREE.SphereGeometry(1.001, 24, 24);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x3b2f6e,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    scene.add(new THREE.Mesh(gridGeo, gridMat));

    // Resonance points
    const pointObjects = [];
    for (const record of records) {
      const pos = recordToSphere(record);
      const color = FREQUENCY_COLORS[record.frequency] || 0xffffff;
      const geo = new THREE.SphereGeometry(0.012 + (record.echoes || 0) * 0.003, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.userData = { record };
      scene.add(mesh);
      pointObjects.push(mesh);
    }

    // Ambient glow
    const ambientGeo = new THREE.SphereGeometry(1.05, 32, 32);
    const ambientMat = new THREE.MeshBasicMaterial({
      color: 0x3b1f8a,
      transparent: true,
      opacity: 0.07,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(ambientGeo, ambientMat));

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Drag rotation
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    const rotGroup = new THREE.Group();
    rotGroup.add(globe, new THREE.Mesh(gridGeo, gridMat));
    pointObjects.forEach(p => rotGroup.add(p));
    scene.add(rotGroup);
    // remove originals
    scene.remove(globe);

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / W) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / H) * 2 + 1;

      if (isDragging) {
        const dx = (e.clientX - prevMouse.x) * 0.005;
        const dy = (e.clientY - prevMouse.y) * 0.005;
        rotGroup.rotation.y += dx;
        rotGroup.rotation.x += dy;
        prevMouse = { x: e.clientX, y: e.clientY };
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(pointObjects);
      if (hits.length > 0) {
        const { record } = hits[0].object.userData;
        setHovered(record.id);
        setTooltip({
          visible: true,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          data: record
        });
        el.style.cursor = "pointer";
      } else {
        setHovered(null);
        setTooltip(t => ({ ...t, visible: false }));
        el.style.cursor = "grab";
      }
    };

    const onClick = (e) => {
      const rect = el.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / W) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / H) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(pointObjects);
      if (hits.length > 0 && onSelectCluster) {
        onSelectCluster(hits[0].object.userData.record);
      }
    };

    // Zoom
    const onWheel = (e) => {
      camera.position.z = Math.max(1.4, Math.min(5, camera.position.z + e.deltaY * 0.003));
    };

    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("click", onClick);
    el.addEventListener("wheel", onWheel, { passive: true });
    el.style.cursor = "grab";

    // Animate
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!isDragging) rotGroup.rotation.y += 0.0015;

      // pulse hovered
      pointObjects.forEach(p => {
        const isHov = p.userData.record.id === stateRef.current.hovered;
        p.scale.setScalar(isHov ? 1.8 : 1);
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const nW = el.clientWidth;
      const nH = el.clientHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("click", onClick);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [records]);

  useEffect(() => { stateRef.current.hovered = hovered; }, [hovered]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-x-3 gap-y-1">
        {Object.entries(FREQUENCY_COLORS).map(([freq, hex]) => (
          <div key={freq} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: `#${hex.toString(16).padStart(6,"0")}` }} />
            <span className="text-[10px] font-body text-muted-foreground capitalize">{freq}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div
          className="absolute pointer-events-none bg-card/90 backdrop-blur-md border border-border/40 rounded-xl px-3 py-2 text-xs font-body max-w-[200px] shadow-xl"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <div className="text-foreground/90 font-medium capitalize mb-0.5">{tooltip.data.frequency}</div>
          <div className="text-muted-foreground capitalize">{tooltip.data.emotion}</div>
          <div className="text-muted-foreground/70 mt-1 line-clamp-2">{tooltip.data.thought}</div>
          {tooltip.data.echoes > 0 && (
            <div className="text-primary mt-1">{tooltip.data.echoes} echoes</div>
          )}
        </div>
      )}
    </div>
  );
}