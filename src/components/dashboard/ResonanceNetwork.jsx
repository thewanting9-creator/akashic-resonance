import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const FREQ_COLORS = {
  unity:          0xc4a35a,
  creation:       0xa78bfa,
  transformation: 0xf472b6,
  healing:        0x34d399,
  awakening:      0x60a5fa,
  remembrance:    0xfb923c,
  vision:         0xe879f9,
  connection:     0x2dd4bf,
};
const DEFAULT_COLOR = 0x8888aa;

function hexToCSS(hex) {
  return "#" + hex.toString(16).padStart(6, "0");
}

// Simple 3D force simulation
function buildGraph(participants, records) {
  // Map participant id → dominant frequency
  const partFreqCount = {};
  for (const r of records) {
    const pid = r.created_by; // email
    if (!pid) continue;
    if (!partFreqCount[pid]) partFreqCount[pid] = {};
    partFreqCount[pid][r.frequency] = (partFreqCount[pid][r.frequency] || 0) + 1;
  }

  const nodes = participants.map((p, i) => {
    const freqs = partFreqCount[p.user_email] || {};
    const dominant = Object.entries(freqs).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const angle = (i / participants.length) * Math.PI * 2;
    const radius = 2.5 + Math.random() * 1.5;
    return {
      id: p.user_email || p.atomic_consciousness_number,
      label: p.alias || "Unknown",
      dominant,
      color: FREQ_COLORS[dominant] || DEFAULT_COLOR,
      recordCount: Object.values(freqs).reduce((s, v) => s + v, 0),
      x: Math.cos(angle) * radius,
      y: (Math.random() - 0.5) * 3,
      z: Math.sin(angle) * radius,
      vx: 0, vy: 0, vz: 0,
    };
  });

  // Build edges: participants share same frequency records
  const freqToParticipants = {};
  for (const r of records) {
    if (!r.created_by || !r.frequency) continue;
    if (!freqToParticipants[r.frequency]) freqToParticipants[r.frequency] = new Set();
    freqToParticipants[r.frequency].add(r.created_by);
  }

  const edgeSet = new Set();
  const edges = [];
  for (const [freq, pids] of Object.entries(freqToParticipants)) {
    const arr = [...pids];
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const key = [arr[i], arr[j]].sort().join("||");
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({ source: arr[i], target: arr[j], freq });
        }
      }
    }
  }

  return { nodes, edges };
}

function runForce(nodes, edges, steps = 80) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const REPEL = 0.8, ATTRACT = 0.04, DAMPING = 0.85, CENTER = 0.01;

  for (let s = 0; s < steps; s++) {
    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.001;
        const force = REPEL / (dist * dist);
        const fx = (dx / dist) * force, fy = (dy / dist) * force, fz = (dz / dist) * force;
        a.vx -= fx; a.vy -= fy; a.vz -= fz;
        b.vx += fx; b.vy += fy; b.vz += fz;
      }
    }
    // Attraction along edges
    for (const e of edges) {
      const a = nodeMap[e.source], b = nodeMap[e.target];
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.001;
      const force = (dist - 1.5) * ATTRACT;
      const fx = (dx / dist) * force, fy = (dy / dist) * force, fz = (dz / dist) * force;
      a.vx += fx; a.vy += fy; a.vz += fz;
      b.vx -= fx; b.vy -= fy; b.vz -= fz;
    }
    // Centering + integrate
    for (const n of nodes) {
      n.vx = (n.vx - n.x * CENTER) * DAMPING;
      n.vy = (n.vy - n.y * CENTER) * DAMPING;
      n.vz = (n.vz - n.z * CENTER) * DAMPING;
      n.x += n.vx; n.y += n.vy; n.z += n.vz;
    }
  }
  return nodes;
}

export default function ResonanceNetwork({ participants = [], records = [], onSelectNode }) {
  const mountRef = useRef(null);
  const hoveredRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, node: null });

  useEffect(() => {
    const el = mountRef.current;
    if (!el || participants.length === 0) return;
    const W = el.clientWidth, H = el.clientHeight;

    // Build + simulate
    const { nodes, edges } = buildGraph(participants, records);
    runForce(nodes, edges, 120);
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.01, 100);
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    el.appendChild(renderer.domElement);

    // Edges as line segments
    const edgePositions = [];
    const edgeColors = [];
    for (const e of edges) {
      const a = nodeMap[e.source], b = nodeMap[e.target];
      if (!a || !b) continue;
      edgePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      const c = new THREE.Color(FREQ_COLORS[e.freq] || DEFAULT_COLOR);
      edgeColors.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
    edgeGeo.setAttribute("color",    new THREE.Float32BufferAttribute(edgeColors, 3));
    const edgeMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.2 });
    scene.add(new THREE.LineSegments(edgeGeo, edgeMat));

    // Node meshes
    const nodeMeshes = [];
    for (const n of nodes) {
      const size = 0.06 + Math.min(n.recordCount, 12) * 0.012;
      const geo = new THREE.SphereGeometry(size, 10, 10);
      const mat = new THREE.MeshBasicMaterial({ color: n.color, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(n.x, n.y, n.z);
      mesh.userData = { node: n };
      scene.add(mesh);
      nodeMeshes.push(mesh);

      // Glow halo
      const haloGeo = new THREE.SphereGeometry(size * 2.2, 10, 10);
      const haloMat = new THREE.MeshBasicMaterial({ color: n.color, transparent: true, opacity: 0.06, side: THREE.BackSide });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      mesh.add(halo);
    }

    // Raycaster + drag
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.1 };
    const mouse = new THREE.Vector2();
    let isDragging = false, prevMouse = { x: 0, y: 0 };
    const rotGroup = new THREE.Group();
    scene.children.slice().forEach(c => { scene.remove(c); rotGroup.add(c); });
    scene.add(rotGroup);

    const onMouseDown = e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; };
    const onMouseUp   = () => { isDragging = false; };
    const onMouseMove = e => {
      const rect = el.getBoundingClientRect();
      if (isDragging) {
        rotGroup.rotation.y += (e.clientX - prevMouse.x) * 0.005;
        rotGroup.rotation.x += (e.clientY - prevMouse.y) * 0.005;
        prevMouse = { x: e.clientX, y: e.clientY };
        return;
      }
      mouse.x =  ((e.clientX - rect.left) / W) * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / H) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(nodeMeshes);
      if (hits.length) {
        const n = hits[0].object.userData.node;
        hoveredRef.current = n.id;
        setTooltip({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top, node: n });
        el.style.cursor = "pointer";
      } else {
        hoveredRef.current = null;
        setTooltip(t => ({ ...t, visible: false }));
        el.style.cursor = "grab";
      }
    };
    const onClick = e => {
      const rect = el.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / W) * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / H) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(nodeMeshes);
      if (hits.length && onSelectNode) onSelectNode(hits[0].object.userData.node);
    };
    const onWheel = e => {
      camera.position.z = Math.max(3, Math.min(18, camera.position.z + e.deltaY * 0.01));
    };

    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mouseup",   onMouseUp);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("click",     onClick);
    el.addEventListener("wheel",     onWheel, { passive: true });
    el.style.cursor = "grab";

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!isDragging) rotGroup.rotation.y += 0.001;
      nodeMeshes.forEach(m => {
        const isHov = m.userData.node.id === hoveredRef.current;
        m.scale.setScalar(isHov ? 1.7 : 1);
      });
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nW = el.clientWidth, nH = el.clientHeight;
      camera.aspect = nW / nH; camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mouseup",   onMouseUp);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("click",     onClick);
      el.removeEventListener("wheel",     onWheel);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [participants, records]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />

      {/* Frequency legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-x-3 gap-y-1">
        {Object.entries(FREQ_COLORS).map(([freq, hex]) => (
          <div key={freq} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: hexToCSS(hex) }} />
            <span className="text-[10px] font-body text-muted-foreground capitalize">{freq}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.node && (
        <div
          className="absolute pointer-events-none bg-card/90 backdrop-blur-md border border-border/40 rounded-xl px-3 py-2 text-xs font-body shadow-xl max-w-[180px]"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <div className="font-medium text-foreground/90 mb-0.5">{tooltip.node.label}</div>
          {tooltip.node.dominant && (
            <div className="capitalize mb-0.5" style={{ color: hexToCSS(FREQ_COLORS[tooltip.node.dominant] || DEFAULT_COLOR) }}>
              {tooltip.node.dominant}
            </div>
          )}
          <div className="text-muted-foreground">{tooltip.node.recordCount} records</div>
        </div>
      )}
    </div>
  );
}