import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { Globe, Info } from "lucide-react";
import RegionSoundscape from "../components/globe/RegionSoundscape";

// Named regions mapped to lat/lng for click identification
const REGIONS = [
  { name: "North Atlantic",       lat: 50,   lng: -30  },
  { name: "Northern Europe",      lat: 55,   lng: 15   },
  { name: "Siberia",              lat: 65,   lng: 90   },
  { name: "East Asia",            lat: 35,   lng: 115  },
  { name: "North Pacific",        lat: 45,   lng: -160 },
  { name: "North America",        lat: 45,   lng: -95  },
  { name: "Amazon Basin",         lat: -5,   lng: -60  },
  { name: "Sub-Saharan Africa",   lat: -5,   lng: 25   },
  { name: "Indian Ocean",         lat: -15,  lng: 75   },
  { name: "Southeast Asia",       lat: 10,   lng: 110  },
  { name: "Mediterranean",        lat: 38,   lng: 18   },
  { name: "Middle East",          lat: 28,   lng: 48   },
  { name: "Southern Ocean",       lat: -55,  lng: 0    },
  { name: "Australia",            lat: -25,  lng: 135  },
  { name: "Arctic Circle",        lat: 82,   lng: 0    },
  { name: "Antarctica",           lat: -80,  lng: 0    },
  { name: "Caribbean",            lat: 17,   lng: -66  },
  { name: "Central Asia",         lat: 43,   lng: 65   },
  { name: "West Africa",          lat: 10,   lng: -5   },
  { name: "South Atlantic",       lat: -30,  lng: -20  },
];

// SR mode power simulation (by lat/lng + time)
function srPowerForRegion(lat, lng) {
  const hour = (new Date().getUTCHours() + lng / 15 + 24) % 24;
  const day  = 0.5 + 0.5 * Math.sin((hour - 6) * Math.PI / 12);
  const latF = 1 - Math.abs(lat) / 90;
  return 0.3 + latF * 0.4 + day * 0.3;
}

function latLngToVec3(lat, lng, r = 1) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

const MODE_COLORS_HEX = [0x34d399,0x60a5fa,0xa78bfa,0xf472b6,0xfb923c,0xe879f9,0x2dd4bf,0xfbbf24];

export default function ResonanceGlobe3D() {
  const mountRef   = useRef(null);
  const sceneRef   = useRef({});
  const [selected, setSelected] = useState(null);
  const [hovered,  setHovered]  = useState(null);
  const [rotating, setRotating] = useState(true);
  const rotatingRef = useRef(true);

  useEffect(() => { rotatingRef.current = rotating; }, [rotating]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth, H = el.clientHeight;

    // Scene setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.z = 2.8;

    // Lighting
    const ambient = new THREE.AmbientLight(0x334455, 1.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xc4a35a, 1.2);
    sun.position.set(3, 2, 3);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x4433aa, 0.5);
    rim.position.set(-3, -1, -2);
    scene.add(rim);

    // Globe sphere
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x0a0f1e,
      emissive: 0x060c18,
      specular: 0x334488,
      shininess: 25,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Atmosphere glow
    const atmGeo = new THREE.SphereGeometry(1.08, 64, 64);
    const atmMat = new THREE.MeshPhongMaterial({
      color: 0x2244aa,
      emissive: 0x112244,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    // Grid lines (lat/lng)
    const gridMat = new THREE.LineBasicMaterial({ color: 0x1a2444, transparent: true, opacity: 0.4 });
    for (let lat = -80; lat <= 80; lat += 20) {
      const pts = [];
      for (let lng = 0; lng <= 360; lng += 4)
        pts.push(latLngToVec3(lat, lng - 180, 1.002));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    for (let lng = -180; lng < 180; lng += 20) {
      const pts = [];
      for (let lat = -90; lat <= 90; lat += 4)
        pts.push(latLngToVec3(lat, lng, 1.002));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }

    // Region markers
    const markerMeshes = [];
    REGIONS.forEach((reg, idx) => {
      const power  = srPowerForRegion(reg.lat, reg.lng);
      const mode   = Math.max(1, Math.min(8, Math.round(1 + power * 7)));
      const color  = MODE_COLORS_HEX[mode - 1];
      const size   = 0.018 + power * 0.022;

      const geo  = new THREE.SphereGeometry(size, 12, 12);
      const mat  = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.6, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      const pos  = latLngToVec3(reg.lat, reg.lng, 1.012);
      mesh.position.copy(pos);
      mesh.userData = { region: reg, power, mode, color, idx };
      scene.add(mesh);
      markerMeshes.push(mesh);

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(size * 1.5, size * 2.2, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
      const ring    = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      ring.userData = { isRing: true, baseOpacity: 0.3 };
      scene.add(ring);
    });

    // SR field lines (equatorial glow)
    for (let i = 0; i < 3; i++) {
      const pts = [];
      for (let a = 0; a <= 360; a += 3) {
        const r = 1.04 + i * 0.018;
        pts.push(new THREE.Vector3(r * Math.cos(a * Math.PI / 180), (Math.random() - 0.5) * 0.06, r * Math.sin(a * Math.PI / 180)));
      }
      const lineMat = new THREE.LineBasicMaterial({ color: [0x34d399,0x60a5fa,0xa78bfa][i], transparent: true, opacity: 0.12 });
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    }

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starVerts = [];
    for (let i = 0; i < 2000; i++) {
      const r = 30 + Math.random() * 20;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      starVerts.push(r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t));
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xaabbcc, size: 0.06, transparent: true, opacity: 0.6 })));

    sceneRef.current = { renderer, scene, camera, globe, markerMeshes };

    // Mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();
    let isDragging = false, mouseDownPos = null;
    let spherical  = { theta: 0, phi: Math.PI / 2 };
    let lastMouse  = null;

    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left)  / W) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / H) * 2 + 1;

      if (isDragging && lastMouse) {
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;
        globe.rotation.y += dx * 0.005;
        globe.rotation.x += dy * 0.005;
        markerMeshes.forEach(m => { m.parent === scene && (m.rotation.y = globe.rotation.y, m.rotation.x = globe.rotation.x); });
      }
      lastMouse = { x: e.clientX, y: e.clientY };

      // Hover detection
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(markerMeshes);
      if (hits.length > 0) {
        el.style.cursor = "pointer";
        setHovered(hits[0].object.userData.region.name);
      } else {
        el.style.cursor = "grab";
        setHovered(null);
      }
    };

    const onMouseDown = (e) => { isDragging = true; mouseDownPos = { x: e.clientX, y: e.clientY }; el.style.cursor = "grabbing"; };
    const onMouseUp   = (e) => {
      el.style.cursor = "grab";
      const dx = Math.abs(e.clientX - (mouseDownPos?.x || 0));
      const dy = Math.abs(e.clientY - (mouseDownPos?.y || 0));
      if (dx < 4 && dy < 4) {
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(markerMeshes);
        if (hits.length > 0) {
          setSelected(hits[0].object.userData.region);
          setRotating(false);
        }
      }
      isDragging = false;
    };

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mouseup",   onMouseUp);

    // Touch support
    const onTouchStart = (e) => { mouseDownPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onTouchEnd   = (e) => {
      const rect = el.getBoundingClientRect();
      const tx = e.changedTouches[0].clientX, ty = e.changedTouches[0].clientY;
      const dx = Math.abs(tx - (mouseDownPos?.x || 0)), dy = Math.abs(ty - (mouseDownPos?.y || 0));
      if (dx < 8 && dy < 8) {
        mouse.x =  ((tx - rect.left) / W) * 2 - 1;
        mouse.y = -((ty - rect.top)  / H) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(markerMeshes);
        if (hits.length > 0) setSelected(hits[0].object.userData.region);
      }
    };
    el.addEventListener("touchstart", onTouchStart);
    el.addEventListener("touchend",   onTouchEnd);

    // Scroll zoom
    el.addEventListener("wheel", (e) => { camera.position.z = Math.max(1.8, Math.min(5, camera.position.z + e.deltaY * 0.003)); });

    // Animation loop
    let frame;
    let t = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.01;
      if (rotatingRef.current) globe.rotation.y += 0.0015;

      // Pulse rings
      scene.children.forEach(c => {
        if (c.userData?.isRing) {
          c.material.opacity = 0.15 + 0.2 * Math.sin(t * 1.5 + c.position.x);
          const s = 1 + 0.15 * Math.sin(t * 1.2 + c.position.z);
          c.scale.set(s, s, s);
        }
      });

      // Marker pulse
      markerMeshes.forEach((m, i) => {
        const s = 1 + 0.12 * Math.sin(t * (1 + m.userData.power) + i);
        m.scale.set(s, s, s);
        m.material.emissiveIntensity = 0.4 + 0.4 * Math.sin(t + i * 0.5);
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const W2 = el.clientWidth, H2 = el.clientHeight;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mouseup",   onMouseUp);
      el.removeEventListener("touchstart",onTouchStart);
      el.removeEventListener("touchend",  onTouchEnd);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 pt-8 pb-3 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <Globe className="w-5 h-5 text-primary" />
              <h1 className="font-heading text-3xl">Resonance Globe</h1>
            </div>
            <p className="font-body text-sm text-muted-foreground">
              Click any region to hear its Schumann Resonance soundscape · Drag to rotate · Scroll to zoom
            </p>
          </div>
          <button onClick={() => setRotating(r => !r)}
            className={`px-3 py-1.5 rounded-full text-xs font-body border transition-all ${
              rotating ? "bg-primary/10 border-primary/30 text-primary" : "border-border/30 text-muted-foreground"
            }`}>
            {rotating ? "⟳ Rotating" : "⏸ Paused"}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 560 }}>

        {/* Globe canvas */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-border/30 bg-background/60"
          style={{ minHeight: 480 }}>
          <div ref={mountRef} className="w-full h-full" style={{ minHeight: 480 }} />

          {/* Hover label */}
          <AnimatePresence>
            {hovered && !selected && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur border border-border/40 text-xs font-body text-foreground/80 pointer-events-none">
                {hovered}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend */}
          <div className="absolute top-3 left-3 bg-card/60 backdrop-blur rounded-xl px-3 py-2 border border-border/20">
            <div className="text-[9px] font-body text-muted-foreground uppercase tracking-wide mb-1.5">SR Intensity</div>
            <div className="flex gap-1 items-center">
              {["#34d399","#60a5fa","#a78bfa","#f472b6","#fb923c"].map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
              ))}
              <span className="text-[9px] font-body text-muted-foreground ml-1">Low → High</span>
            </div>
          </div>

          {/* Hint */}
          {!selected && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-card/50 backdrop-blur border border-border/20 text-[10px] font-body text-muted-foreground">
              <Info className="w-3 h-3" /> Click a node to explore
            </motion.div>
          )}
        </div>

        {/* Side panel */}
        <div className="lg:col-span-1 flex flex-col">
          <AnimatePresence mode="wait">
            {selected ? (
              <RegionSoundscape key={selected.name} region={selected} onClose={() => { setSelected(null); setRotating(true); }} />
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center gap-4 bg-card/20 border border-border/20 rounded-2xl p-6 text-center">
                <Globe className="w-10 h-10 text-muted-foreground/20" />
                <div>
                  <p className="font-heading text-base text-muted-foreground/60 mb-1">Select a Region</p>
                  <p className="text-xs font-body text-muted-foreground/40 leading-relaxed">
                    Click any glowing node on the globe to hear its Schumann Resonance soundscape and receive an AI-generated ambient description.
                  </p>
                </div>
                <div className="space-y-1.5 w-full">
                  {REGIONS.slice(0, 5).map(r => (
                    <button key={r.name} onClick={() => { setSelected(r); setRotating(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl bg-card/30 hover:bg-card/50 transition-colors border border-border/20 text-xs font-body text-muted-foreground hover:text-foreground">
                      {r.name}
                    </button>
                  ))}
                  <p className="text-[9px] font-body text-muted-foreground/30 pt-1">+{REGIONS.length - 5} more regions on the globe</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}