import { useEffect, useRef } from "react";
import * as THREE from "three";

const FREQ_COLORS = {
  unity: "#c4a35a", creation: "#a78bfa", transformation: "#f472b6",
  healing: "#34d399", awakening: "#60a5fa", remembrance: "#fb923c",
  vision: "#e879f9", connection: "#2dd4bf",
};

// Fixed globe positions per frequency — distributed across the sphere
const FREQ_NODES = {
  unity:          { lat:  30,  lon:  20 },
  creation:       { lat: -20,  lon:  80 },
  transformation: { lat:  50,  lon: -60 },
  healing:        { lat: -40,  lon: 140 },
  awakening:      { lat:  10,  lon: -120 },
  remembrance:    { lat:  60,  lon:  160 },
  vision:         { lat: -55,  lon: -80 },
  connection:     { lat:  20,  lon:  60 },
};

function latLonToVec(lat, lon, r) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

export default function TemporalGlobe({ snapshot, onHover }) {
  const mountRef  = useRef(null);
  const sceneRef  = useRef({});
  const sphereRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 0, 2.8);

    // Ambient + directional light
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 3, 5);
    scene.add(dir);

    // Globe sphere
    const geo  = new THREE.SphereGeometry(1, 64, 64);
    const mat  = new THREE.MeshPhongMaterial({
      color: 0x0d0a1f, emissive: 0x0d0a1f, shininess: 20,
      transparent: true, opacity: 0.92,
      wireframe: false,
    });
    const globe = new THREE.Mesh(geo, mat);
    scene.add(globe);
    sphereRef.current = globe;

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x3d2f6d, wireframe: true, transparent: true, opacity: 0.12 });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.001, 32, 32), wireMat));

    // Atmosphere glow
    const atmMat = new THREE.MeshBasicMaterial({ color: 0x5b21b6, side: THREE.BackSide, transparent: true, opacity: 0.08 });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.15, 32, 32), atmMat));

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const stars = new Float32Array(1500 * 3);
    for (let i = 0; i < stars.length; i++) stars[i] = (Math.random() - 0.5) * 40;
    starGeo.setAttribute("position", new THREE.BufferAttribute(stars, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.4 })));

    sceneRef.current = { renderer, scene, camera, nodeGroup: null };

    // Mouse rotation
    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0, rotY = 0;
    const onDown = e => { isDragging = true; prevX = e.clientX || e.touches?.[0]?.clientX; prevY = e.clientY || e.touches?.[0]?.clientY; };
    const onUp   = () => { isDragging = false; };
    const onMove = e => {
      if (!isDragging) return;
      const x = e.clientX || e.touches?.[0]?.clientX;
      const y = e.clientY || e.touches?.[0]?.clientY;
      rotY += (x - prevX) * 0.005;
      rotX += (y - prevY) * 0.003;
      prevX = x; prevY = y;
    };
    renderer.domElement.addEventListener("mousedown", onDown);
    renderer.domElement.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchend", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging) rotY += 0.002;
      globe.rotation.y = rotY;
      globe.rotation.x = rotX;
      if (sceneRef.current.nodeGroup) {
        sceneRef.current.nodeGroup.rotation.y = rotY;
        sceneRef.current.nodeGroup.rotation.x = rotX;
      }
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const W2 = el.clientWidth, H2 = el.clientHeight;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  // Update nodes when snapshot changes
  useEffect(() => {
    const { scene, nodeGroup } = sceneRef.current;
    if (!scene) return;
    if (nodeGroup) scene.remove(nodeGroup);

    const group = new THREE.Group();

    Object.entries(FREQ_NODES).forEach(([freq, pos]) => {
      const count  = snapshot?.freqCounts?.[freq] || 0;
      const total  = snapshot?.total || 1;
      const ratio  = Math.min(count / Math.max(total * 0.3, 1), 1);
      if (count === 0) return;

      const color  = new THREE.Color(FREQ_COLORS[freq] || "#888");
      const radius = 0.025 + ratio * 0.065;
      const vec    = latLonToVec(pos.lat, pos.lon, 1.02);

      // Core sphere
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 12, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
      );
      mesh.position.copy(vec);
      group.add(mesh);

      // Glow ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius * 1.3, radius * 2.0, 24),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
      );
      ring.position.copy(vec);
      ring.lookAt(0, 0, 0);
      group.add(ring);

      // Pulse ring
      const pulse = new THREE.Mesh(
        new THREE.RingGeometry(radius * 2.0, radius * 2.6, 24),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1, side: THREE.DoubleSide })
      );
      pulse.position.copy(vec);
      pulse.lookAt(0, 0, 0);
      group.add(pulse);
    });

    scene.add(group);
    sceneRef.current.nodeGroup = group;
  }, [snapshot]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}