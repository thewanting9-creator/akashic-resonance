import { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { MapPin, X, Volume2, VolumeX, Loader2, Globe } from "lucide-react";

// ── Geo regions with lat/lon ───────────────────────────────────────────────
const REGIONS = [
  { id: "north_america",   label: "North America",   lat:  40,  lon: -100, sr: 7.83  },
  { id: "south_america",   label: "South America",   lat: -15,  lon:  -60, sr: 8.10  },
  { id: "western_europe",  label: "Western Europe",  lat:  50,  lon:   10, sr: 7.95  },
  { id: "eastern_europe",  label: "Eastern Europe",  lat:  55,  lon:   35, sr: 8.02  },
  { id: "africa",          label: "Africa",          lat:   5,  lon:   20, sr: 7.88  },
  { id: "middle_east",     label: "Middle East",     lat:  25,  lon:   45, sr: 8.15  },
  { id: "south_asia",      label: "South Asia",      lat:  20,  lon:   80, sr: 7.92  },
  { id: "east_asia",       label: "East Asia",       lat:  35,  lon:  115, sr: 8.05  },
  { id: "southeast_asia",  label: "Southeast Asia",  lat:   5,  lon:  110, sr: 7.99  },
  { id: "oceania",         label: "Oceania",         lat: -25,  lon:  135, sr: 7.87  },
  { id: "central_asia",    label: "Central Asia",    lat:  45,  lon:   70, sr: 8.08  },
  { id: "arctic",          label: "Arctic",          lat:  80,  lon:    0, sr: 7.76  },
];

const FREQ_COLORS = {
  unity:"#c4a35a", creation:"#a78bfa", transformation:"#f472b6",
  healing:"#34d399", awakening:"#60a5fa", remembrance:"#fb923c",
  vision:"#e879f9", connection:"#2dd4bf",
};

function latLonToVec3(lat, lon, r = 1) {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

// ── Localized SR audio ────────────────────────────────────────────────────
class RegionAudio {
  constructor() { this.ctx = null; this.nodes = {}; }

  play(srHz, coherence) {
    this.stop();
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = this.ctx;
    const master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);

    // SR carrier binaural
    const L = ctx.createOscillator(); L.type = "sine"; L.frequency.value = 200; L.start();
    const R = ctx.createOscillator(); R.type = "sine"; R.frequency.value = 200 + srHz; R.start();
    const pan = ctx.createStereoPanner();
    const gL = ctx.createGain(); gL.gain.value = 0.3; L.connect(gL); gL.connect(master);
    const gR = ctx.createGain(); gR.gain.value = 0.3; R.connect(gR); gR.connect(master);

    // Ambient noise texture — warmth from coherence
    const buf  = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lpf = ctx.createBiquadFilter(); lpf.type = "lowpass";
    lpf.frequency.value = 300 + coherence * 1400;
    const ng = ctx.createGain(); ng.gain.value = 0.06;
    src.connect(lpf); lpf.connect(ng); ng.connect(master); src.start();

    // Slowly fading in
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.5);

    this.nodes = { L, R, src, master };
  }

  stop() {
    Object.values(this.nodes).forEach(n => { try { n.stop?.(); } catch {} });
    this.nodes = {};
    if (this.ctx) { try { this.ctx.close(); } catch {} this.ctx = null; }
  }
}

// ── 3D Globe Renderer ─────────────────────────────────────────────────────
function useGlobe(canvasRef, regions, onSelectRegion) {
  const stateRef = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = canvas.clientWidth, H = canvas.clientHeight;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 2.8);

    // Lighting
    scene.add(new THREE.AmbientLight(0x334466, 1.2));
    const dir = new THREE.DirectionalLight(0x8899ff, 0.8);
    dir.position.set(5, 3, 5); scene.add(dir);

    // Globe sphere
    const geo  = new THREE.SphereGeometry(1, 64, 64);
    const mat  = new THREE.MeshPhongMaterial({
      color: 0x0a0a1a, emissive: 0x111133, shininess: 30,
      wireframe: false, transparent: true, opacity: 0.92,
    });
    const globe = new THREE.Mesh(geo, mat); scene.add(globe);

    // Wireframe overlay
    const wfMat = new THREE.MeshBasicMaterial({ color: 0x223366, wireframe: true, transparent: true, opacity: 0.12 });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.001, 32, 32), wfMat));

    // Atmosphere glow
    const atmMat = new THREE.MeshBasicMaterial({ color: 0x2244aa, transparent: true, opacity: 0.07, side: THREE.BackSide });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.18, 32, 32), atmMat));

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(2400);
    for (let i = 0; i < 2400; i++) starPos[i] = (Math.random() - 0.5) * 60;
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.5 })));

    // Build hotspot markers
    const markerGroup = new THREE.Group(); scene.add(markerGroup);
    const markers = {};

    regions.forEach(region => {
      const density    = region.density || 0;
      const coherence  = region.coherence || 0;
      const intensity  = Math.min(0.3 + (density / 20) * 0.7 + coherence * 0.3, 1);
      const color      = new THREE.Color(region.color || "#60a5fa");
      const pos        = latLonToVec3(region.lat, region.lon, 1.02);

      // Core sphere
      const r    = 0.022 + intensity * 0.038;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 12, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
      );
      mesh.position.copy(pos);
      mesh.userData = { regionId: region.id };

      // Glow ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r * 1.4, r * 2.2, 24),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
      );
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);

      // Pulse ring (animated)
      const pulse = new THREE.Mesh(
        new THREE.RingGeometry(r * 1.5, r * 1.8, 24),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
      );
      pulse.position.copy(pos);
      pulse.lookAt(0, 0, 0);
      pulse.userData.pulsePhase = Math.random() * Math.PI * 2;

      markerGroup.add(mesh); markerGroup.add(ring); markerGroup.add(pulse);
      markers[region.id] = { mesh, ring, pulse, intensity, region };
    });

    stateRef.current.markers = markers;
    stateRef.current.markerGroup = markerGroup;

    // Rotation drag
    let isDragging = false, prevX = 0, prevY = 0;
    let rotX = 0, rotY = 0, velX = 0, velY = 0;
    const autoSpin = 0.0012;

    const onDown = e => { isDragging = true; prevX = e.clientX || e.touches?.[0]?.clientX; prevY = e.clientY || e.touches?.[0]?.clientY; velX = velY = 0; };
    const onUp   = () => { isDragging = false; };
    const onMove = e => {
      if (!isDragging) return;
      const x = e.clientX || e.touches?.[0]?.clientX;
      const y = e.clientY || e.touches?.[0]?.clientY;
      velX = (x - prevX) * 0.008; velY = (y - prevY) * 0.008;
      rotY += velX; rotX += velY;
      rotX = Math.max(-1.2, Math.min(1.2, rotX));
      prevX = x; prevY = y;
    };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });

    // Click / tap to select region
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = e => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX || e.changedTouches?.[0]?.clientX;
      const cy = e.clientY || e.changedTouches?.[0]?.clientY;
      mouse.x =  ((cx - rect.left)  / rect.width)  * 2 - 1;
      mouse.y = -((cy - rect.top)   / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const meshes = Object.values(markers).map(m => m.mesh);
      const hits   = raycaster.intersectObjects(meshes);
      if (hits.length) onSelectRegion(hits[0].object.userData.regionId);
    };
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchend", onClick);

    // Zoom
    const onWheel = e => { camera.position.z = Math.max(1.6, Math.min(5, camera.position.z + e.deltaY * 0.002)); };
    canvas.addEventListener("wheel", onWheel, { passive: true });

    // Resize
    const onResize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // Animate
    let t = 0;
    const animate = () => {
      if (!stateRef.current.running) return;
      t += 0.016;

      if (!isDragging) { velX *= 0.92; velY *= 0.92; rotY += velX + autoSpin; rotX += velY; rotX = Math.max(-1.2, Math.min(1.2, rotX)); }
      markerGroup.rotation.y = rotY;
      markerGroup.rotation.x = rotX;
      globe.rotation.y = rotY;
      globe.rotation.x = rotX;

      // Pulse animation
      Object.values(markers).forEach(({ pulse, intensity }) => {
        const s = 1 + 0.4 * Math.sin(t * 2 + pulse?.userData?.pulsePhase || 0) * intensity;
        pulse.scale.set(s, s, s);
        pulse.material.opacity = 0.15 + 0.35 * (Math.sin(t * 2 + (pulse?.userData?.pulsePhase || 0)) * 0.5 + 0.5) * intensity;
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    stateRef.current.running = true;
    animate();

    return () => {
      stateRef.current.running = false;
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("touchstart", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchend", onClick);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, [regions]);
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ResonanceHotspotMap() {
  const canvasRef    = useRef(null);
  const audioRef     = useRef(new RegionAudio());

  const [loading,     setLoading]     = useState(true);
  const [regions,     setRegions]     = useState([]);
  const [allRecords,  setAllRecords]  = useState([]);
  const [selected,    setSelected]    = useState(null); // { region, records }
  const [muted,       setMuted]       = useState(false);
  const [playingId,   setPlayingId]   = useState(null);

  // Derive density + coherence per region from all records
  const buildRegions = useCallback((records, checkIns) => {
    return REGIONS.map(r => {
      // Assign records to nearest region by a simple hash on created_by email
      const regionRecords = records.filter((rec, i) =>
        REGIONS[Math.abs(hashStr(rec.created_by || rec.id || String(i))) % REGIONS.length].id === r.id
      );
      const regionCheckins = checkIns.filter((c, i) =>
        REGIONS[Math.abs(hashStr(c.created_by || c.id || String(i))) % REGIONS.length].id === r.id
      );

      const density   = regionRecords.length + regionCheckins.length;
      const coherence = regionCheckins.length
        ? regionCheckins.reduce((s, c) => s + (c.resonance_score || 0), 0) / regionCheckins.length / 100
        : 0;

      // Dominant frequency for color
      const freqCount = {};
      for (const rec of regionRecords) if (rec.frequency) freqCount[rec.frequency] = (freqCount[rec.frequency] || 0) + 1;
      const topFreq = Object.entries(freqCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || "healing";
      const color   = FREQ_COLORS[topFreq] || "#60a5fa";

      return { ...r, density, coherence, color, topFreq, records: regionRecords };
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      const [records, checkIns] = await Promise.all([
        base44.entities.ResonanceRecord.list("-created_date", 500),
        base44.entities.PulseCheckIn.list("-created_date", 300),
      ]);
      setAllRecords(records);
      setRegions(buildRegions(records, checkIns));
      setLoading(false);
    };
    load();
  }, [buildRegions]);

  const handleSelect = useCallback((regionId) => {
    const region = regions.find(r => r.id === regionId);
    if (!region) return;

    setSelected({ region, records: region.records.slice(0, 12) });

    if (!muted) {
      audioRef.current.play(region.sr, region.coherence);
      setPlayingId(regionId);
    }
  }, [regions, muted]);

  const handleClose = () => {
    setSelected(null);
    audioRef.current.stop();
    setPlayingId(null);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (next) { audioRef.current.stop(); setPlayingId(null); }
    else if (selected) { audioRef.current.play(selected.region.sr, selected.region.coherence); setPlayingId(selected.region.id); }
  };

  useEffect(() => () => audioRef.current.stop(), []);

  useGlobe(canvasRef, regions, handleSelect);

  const sorted = [...regions].sort((a, b) => b.density - a.density);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Globe className="w-5 h-5 text-primary" />
              <h1 className="font-heading text-3xl">Resonance Hotspot Map</h1>
            </div>
            <p className="font-body text-sm text-muted-foreground">
              Live 3D globe · drag to rotate · scroll to zoom · click any hotspot to tune in
            </p>
          </div>
          <button onClick={toggleMute}
            className="p-2 rounded-xl bg-card/30 border border-border/30 text-muted-foreground hover:text-foreground transition-colors">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Globe */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 relative bg-card/10 border border-border/20 rounded-2xl overflow-hidden"
          style={{ height: "70vh", minHeight: 420 }}>

          <canvas ref={canvasRef} className="w-full h-full block" />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="text-center">
                <Loader2 className="w-7 h-7 text-primary animate-spin mx-auto mb-2" />
                <p className="text-xs font-body text-muted-foreground">Mapping the global field…</p>
              </div>
            </div>
          )}

          {/* Legend */}
          {!loading && (
            <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm rounded-xl p-3 space-y-1.5">
              <div className="text-[9px] font-body text-muted-foreground uppercase tracking-wide mb-1">Hotspot Scale</div>
              {[{ label: "High density",   r: 10 }, { label: "Mid density", r: 6 }, { label: "Emerging", r: 3 }].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/60" style={{ width: l.r, height: l.r }} />
                  <span className="text-[9px] font-body text-white/50">{l.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Playing indicator */}
          {playingId && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-xl px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-body text-primary">
                {regions.find(r => r.id === playingId)?.label} SR · {regions.find(r => r.id === playingId)?.sr} Hz
              </span>
            </div>
          )}
        </motion.div>

        {/* Side panel */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: "70vh" }}>

          <AnimatePresence mode="wait">
            {selected ? (
              /* Region detail */
              <motion.div key="detail" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: selected.region.color }} />
                      <h3 className="font-heading text-base">{selected.region.label}</h3>
                    </div>
                    <div className="text-[10px] font-body text-muted-foreground capitalize">
                      {selected.region.topFreq} · {selected.region.density} signals · {Math.round(selected.region.coherence * 100)}% coherence
                    </div>
                  </div>
                  <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* SR reading */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: "Local SR",    value: `${selected.region.sr} Hz`, color: selected.region.color },
                    { label: "Coherence",  value: `${Math.round(selected.region.coherence * 100)}%`, color: "#34d399" },
                  ].map(s => (
                    <div key={s.label} className="bg-card/30 rounded-xl p-2.5 text-center">
                      <div className="text-sm font-body font-medium" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[9px] font-body text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Audio status */}
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-secondary/30">
                  {muted ? (
                    <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span className="text-[10px] font-body text-muted-foreground">
                    {muted ? "Audio muted" : `Playing localized SR · ${selected.region.sr} Hz`}
                  </span>
                </div>

                {/* Recent inscriptions */}
                <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-2">
                  Recent Inscriptions ({selected.records.length})
                </div>
                {selected.records.length === 0 ? (
                  <p className="text-[10px] font-body text-muted-foreground/50 italic">No inscriptions mapped to this region yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selected.records.map(rec => (
                      <div key={rec.id} className="bg-card/20 rounded-xl p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-body capitalize px-1.5 py-0.5 rounded-full border"
                            style={{ color: FREQ_COLORS[rec.frequency] || "#888", borderColor: (FREQ_COLORS[rec.frequency] || "#888") + "44" }}>
                            {rec.frequency}
                          </span>
                          <span className="text-[9px] font-body text-muted-foreground capitalize">{rec.emotion}</span>
                        </div>
                        <p className="text-[10px] font-body text-foreground/70 line-clamp-2">"{rec.thought}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              /* Hotspot rankings */
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-2 px-1">Active Hotspots</div>
                <div className="space-y-2">
                  {sorted.map((region, i) => (
                    <button key={region.id} onClick={() => handleSelect(region.id)}
                      className="w-full text-left bg-card/30 backdrop-blur-md border border-border/20 hover:border-border/50 rounded-2xl p-3 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-7 h-7 rounded-xl text-[10px] font-body font-medium flex-shrink-0"
                          style={{ background: region.color + "25", color: region.color }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-body font-medium text-foreground/90 truncate">{region.label}</span>
                            {region.density > 0 && (
                              <div className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: region.color }} />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 rounded-full bg-border/20 overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ background: region.color, width: `${Math.min((region.density / (sorted[0]?.density || 1)) * 100, 100)}%` }} />
                            </div>
                            <span className="text-[9px] font-body text-muted-foreground flex-shrink-0">{region.density}</span>
                          </div>
                        </div>
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Frequency channel legend */}
      {!loading && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-4 bg-card/20 border border-border/10 rounded-2xl p-4">
          <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-2">Frequency Channel Map</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(FREQ_COLORS).map(([freq, color]) => (
              <div key={freq} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-[10px] font-body text-muted-foreground capitalize">{freq}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[9px] font-body text-muted-foreground/40">
            Hotspot color = dominant frequency channel in that region · size = inscription + check-in density · audio = localized SR binaural
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Utility ───────────────────────────────────────────────────────────────
function hashStr(str) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}