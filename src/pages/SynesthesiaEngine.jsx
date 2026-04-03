import { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2, Eye, EyeOff, RefreshCw } from "lucide-react";

// ── Live data simulation ───────────────────────────────────────────────────
const SR_MODES = [7.83, 14.3, 20.8, 27.3, 33.8, 39.0, 45.0, 51.0];
const FREQ_PALETTES = {
  unity:          { a: "#c4a35a", b: "#7a5c1e", c: "#fffbe6", name: "Unity"          },
  creation:       { a: "#a78bfa", b: "#4c1d95", c: "#f3e8ff", name: "Creation"       },
  transformation: { a: "#f472b6", b: "#9d174d", c: "#fce7f3", name: "Transformation" },
  healing:        { a: "#34d399", b: "#065f46", c: "#d1fae5", name: "Healing"        },
  awakening:      { a: "#60a5fa", b: "#1e3a8a", c: "#dbeafe", name: "Awakening"      },
  remembrance:    { a: "#fb923c", b: "#7c2d12", c: "#ffedd5", name: "Remembrance"    },
  vision:         { a: "#e879f9", b: "#701a75", c: "#fae8ff", name: "Vision"         },
  connection:     { a: "#2dd4bf", b: "#134e4a", c: "#ccfbf1", name: "Connection"     },
};

function getLiveData() {
  const h = new Date().getUTCHours();
  const d = 0.5 + 0.5 * Math.sin((h - 6) * Math.PI / 12);
  const mode = Math.max(1, Math.min(8, Math.round(1 + d * 6)));
  return {
    sr_mode:    mode,
    sr_hz:      +(SR_MODES[mode - 1] + (Math.random() - 0.5) * 0.3).toFixed(2),
    sr_power:   Math.round(45 + d * 35 + Math.random() * 10),
    ulf_power:  +(0.3 + Math.random() * 0.7).toFixed(2),
    gci_index:  +(0.4 + d * 0.4 + Math.random() * 0.15).toFixed(2),
  };
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function lerpColor(c1, c2, t) {
  const [r1,g1,b1] = hexToRgb(c1);
  const [r2,g2,b2] = hexToRgb(c2);
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
}

// ── Generative renderer ───────────────────────────────────────────────────
class SynesthesiaRenderer {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext("2d");
    this.running = false;
    this.t       = 0;
    this.particles = [];
    this.lissajous = [];
    this.palette   = FREQ_PALETTES.healing;
    this.liveData  = getLiveData();
    this.targetPalette = this.palette;
    this.paletteT  = 1;
    this._initParticles();
    this._initLissajous();
  }

  _initParticles() {
    const count = Math.min(120, Math.floor((this.canvas.width * this.canvas.height) / 12000));
    this.particles = Array.from({ length: count }, () => this._makeParticle());
  }

  _makeParticle() {
    return {
      x:    Math.random() * this.canvas.width,
      y:    Math.random() * this.canvas.height,
      vx:   (Math.random() - 0.5) * 0.6,
      vy:   (Math.random() - 0.5) * 0.6,
      r:    1.5 + Math.random() * 4,
      life: Math.random(),
      speed: 0.003 + Math.random() * 0.006,
      orbitR: 40 + Math.random() * 160,
      orbitSpeed: (Math.random() - 0.5) * 0.008,
      orbitAngle: Math.random() * Math.PI * 2,
      cx: Math.random() * this.canvas.width,
      cy: Math.random() * this.canvas.height,
      layer: Math.floor(Math.random() * 3), // 0=deep 1=mid 2=surface
    };
  }

  _initLissajous() {
    this.lissajous = Array.from({ length: 4 }, (_, i) => ({
      ax: this.canvas.width  * (0.2 + (i % 2) * 0.6),
      ay: this.canvas.height * (0.25 + Math.floor(i / 2) * 0.5),
      rx: 80 + Math.random() * 120,
      ry: 60 + Math.random() * 100,
      freqX: 1 + (i % 3),
      freqY: 2 + Math.floor(i / 2),
      phase: Math.random() * Math.PI * 2,
      alpha: 0.06 + Math.random() * 0.06,
    }));
  }

  setPalette(freq) {
    this.targetPalette = FREQ_PALETTES[freq] || FREQ_PALETTES.healing;
    this.paletteT = 0;
  }

  setLiveData(data) {
    this.liveData = data;
  }

  resize() {
    this._initParticles();
    this._initLissajous();
  }

  _drawBackground() {
    const { width: W, height: H } = this.canvas;
    const ctx  = this.ctx;
    const pal  = this.palette;
    const t    = this.t;
    const data = this.liveData;

    // Deep background sweep
    const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
    bgGrad.addColorStop(0,   pal.b + "44");
    bgGrad.addColorStop(0.5, "#050510cc");
    bgGrad.addColorStop(1,   "#020208ff");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // GCI coherence bloom — center radial
    const coherenceR = 150 + data.gci_index * 250;
    const bloom = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, coherenceR);
    bloom.addColorStop(0,   pal.a + "28");
    bloom.addColorStop(0.5, pal.a + "10");
    bloom.addColorStop(1,   "transparent");
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, W, H);

    // ULF standing wave rings
    const ringCount = Math.round(3 + data.ulf_power * 5);
    const baseR     = 60 + data.sr_hz * 5;
    for (let i = 0; i < ringCount; i++) {
      const r    = baseR + i * (80 + data.ulf_power * 40);
      const wave = Math.sin(t * 0.8 + i * 1.2) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.5, r, 0, Math.PI * 2);
      ctx.strokeStyle = pal.a + Math.round(wave * 28 + 8).toString(16).padStart(2, "0");
      ctx.lineWidth   = 0.5 + wave * 1.5;
      ctx.stroke();
    }
  }

  _drawLissajous() {
    const ctx  = this.ctx;
    const pal  = this.palette;
    const data = this.liveData;
    const t    = this.t;

    for (const fig of this.lissajous) {
      const steps  = 320;
      const speedT = 0.4 + data.sr_hz / 51 * 1.2;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const x = fig.ax + fig.rx * Math.sin(fig.freqX * angle + t * speedT * 0.3 + fig.phase);
        const y = fig.ay + fig.ry * Math.sin(fig.freqY * angle + t * speedT * 0.2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = pal.c + Math.round(fig.alpha * 255).toString(16).padStart(2, "0");
      ctx.lineWidth   = 0.8;
      ctx.stroke();
    }
  }

  _drawSRWaveform() {
    const { width: W, height: H } = this.canvas;
    const ctx  = this.ctx;
    const pal  = this.palette;
    const data = this.liveData;
    const t    = this.t;

    // Horizontal SR interference pattern across full width
    const modes = Math.min(data.sr_mode, 6);
    for (let m = 1; m <= modes; m++) {
      const freq  = data.sr_hz * m;
      const amp   = (H * 0.06) / m;
      const yBase = H * (0.3 + (m - 1) * 0.12);
      const alpha = Math.round((0.15 / m) * 255).toString(16).padStart(2, "0");

      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = yBase + amp * Math.sin((x / W) * Math.PI * freq * 0.12 + t * (0.5 + m * 0.3));
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = pal.a + alpha;
      ctx.lineWidth   = 1.5 - m * 0.15;
      ctx.stroke();
    }
  }

  _drawParticles() {
    const { width: W, height: H } = this.canvas;
    const ctx  = this.ctx;
    const pal  = this.palette;
    const data = this.liveData;

    for (const p of this.particles) {
      // Orbit around centre with ULF modulation
      p.orbitAngle += p.orbitSpeed * (1 + data.ulf_power * 0.5);
      const orbitMod = p.orbitR * (0.7 + data.gci_index * 0.5);
      p.x = p.cx + orbitMod * Math.cos(p.orbitAngle);
      p.y = p.cy + orbitMod * Math.sin(p.orbitAngle);
      p.life += p.speed;
      if (p.life > 1) { Object.assign(p, this._makeParticle()); continue; }

      const alpha = Math.sin(p.life * Math.PI);
      const size  = p.r * (0.5 + alpha * 0.5) * (p.layer === 0 ? 2 : p.layer === 1 ? 1.2 : 0.7);
      const color = p.layer === 2 ? pal.c : p.layer === 1 ? pal.a : pal.b;

      // Glow
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
      grd.addColorStop(0,   color + Math.round(alpha * 90).toString(16).padStart(2, "0"));
      grd.addColorStop(1,   "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.fillStyle = color + Math.round(alpha * 200).toString(16).padStart(2, "0");
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawFlowField() {
    const { width: W, height: H } = this.canvas;
    const ctx  = this.ctx;
    const pal  = this.palette;
    const data = this.liveData;
    const t    = this.t;

    // Sparse perlin-style flow lines driven by SR phase
    const cols = 14, rows = 10;
    const cw = W / cols, ch = H / rows;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x   = (c + 0.5) * cw;
        const y   = (r + 0.5) * ch;
        const nx  = x / W, ny = y / H;
        const angle = Math.sin(nx * 4.2 + t * 0.25) * Math.cos(ny * 3.1 + t * 0.18) * Math.PI * 2
                    + data.sr_hz * 0.05 * Math.sin(t * 0.1);
        const len = 14 + data.ulf_power * 12;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.strokeStyle = pal.a + "18";
        ctx.lineWidth   = 0.7;
        ctx.stroke();
      }
    }
  }

  // Central mandala — SR mode sets petal count
  _drawMandala() {
    const { width: W, height: H } = this.canvas;
    const ctx  = this.ctx;
    const pal  = this.palette;
    const data = this.liveData;
    const t    = this.t;

    const cx     = W * 0.5, cy = H * 0.5;
    const petals = data.sr_mode * 3;
    const R      = Math.min(W, H) * 0.22 * (0.8 + data.gci_index * 0.4);
    const spin   = t * 0.04;

    for (let p = 0; p < petals; p++) {
      const a0 = (p / petals) * Math.PI * 2 + spin;
      const a1 = ((p + 0.5) / petals) * Math.PI * 2 + spin;
      const mid = ((p + 0.25) / petals) * Math.PI * 2 + spin;

      const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
      const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      const cpx = cx + R * 1.35 * Math.cos(mid), cpy = cy + R * 1.35 * Math.sin(mid);

      const alpha = 0.12 + (data.sr_power / 100) * 0.12;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cpx, cpy, x0, y0);
      ctx.quadraticCurveTo(cpx, cpy, x1, y1);
      ctx.closePath();
      const grad = ctx.createLinearGradient(cx, cy, cpx, cpy);
      grad.addColorStop(0,   pal.a + Math.round(alpha * 255).toString(16).padStart(2, "0"));
      grad.addColorStop(1,   pal.c + "18");
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Center orb
    const orbR = Math.min(W, H) * 0.04;
    const orbG = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR * 2.5);
    orbG.addColorStop(0,   pal.c + "cc");
    orbG.addColorStop(0.4, pal.a + "66");
    orbG.addColorStop(1,   "transparent");
    ctx.fillStyle = orbG;
    ctx.beginPath();
    ctx.arc(cx, cy, orbR * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  frame() {
    if (!this.running) return;
    const ctx  = this.ctx;
    const { width: W, height: H } = this.canvas;

    // Lerp palette
    if (this.paletteT < 1) {
      this.paletteT = Math.min(1, this.paletteT + 0.008);
      const tl = this.paletteT;
      const cur = this.palette, nxt = this.targetPalette;
      if (cur !== nxt) {
        this.palette = {
          a: lerpColor(cur.a, nxt.a, tl),
          b: lerpColor(cur.b, nxt.b, tl),
          c: lerpColor(cur.c, nxt.c, tl),
          name: nxt.name,
        };
        if (tl >= 1) this.palette = { ...nxt };
      }
    }

    // Trail fade (lower alpha = more trails)
    ctx.fillStyle = "rgba(2,2,12,0.18)";
    ctx.fillRect(0, 0, W, H);

    this._drawBackground();
    this._drawFlowField();
    this._drawSRWaveform();
    this._drawLissajous();
    this._drawParticles();
    this._drawMandala();

    this.t += 0.016;
    this._raf = requestAnimationFrame(() => this.frame());
  }

  start() {
    this.running = true;
    this.frame();
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }
}

// ── Component ─────────────────────────────────────────────────────────────
export default function SynesthesiaEngine() {
  const canvasRef      = useRef(null);
  const rendererRef    = useRef(null);
  const [fullscreen,   setFullscreen]   = useState(false);
  const [hud,          setHud]          = useState(true);
  const [liveData,     setLiveData]     = useState(getLiveData());
  const [dominantFreq, setDominantFreq] = useState("healing");
  const [palette,      setPalette]      = useState(FREQ_PALETTES.healing);
  const [loading,      setLoading]      = useState(true);

  // Fetch dominant frequency from collective
  const fetchField = useCallback(async () => {
    const [checkIns, records] = await Promise.all([
      base44.entities.PulseCheckIn.list("-created_date", 100),
      base44.entities.ResonanceRecord.list("-created_date", 200),
    ]);
    const counts = {};
    for (const c of checkIns) if (c.frequency) counts[c.frequency] = (counts[c.frequency] || 0) + 2;
    for (const r of records)  if (r.frequency) counts[r.frequency] = (counts[r.frequency] || 0) + 1;
    const freq = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || "healing";
    setDominantFreq(freq);
    setPalette(FREQ_PALETTES[freq] || FREQ_PALETTES.healing);
    return freq;
  }, []);

  // Init canvas + renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new SynesthesiaRenderer(canvas);
    rendererRef.current = renderer;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      renderer.resize();
    };
    resize();
    window.addEventListener("resize", resize);

    // Load field data, then start
    fetchField().then(freq => {
      const data = getLiveData();
      renderer.setLiveData(data);
      renderer.setPalette(freq);
      renderer.palette = { ...FREQ_PALETTES[freq] };
      renderer.start();
      setLiveData(data);
      setLoading(false);
    });

    return () => {
      renderer.stop();
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Live data tick every 12 s
  useEffect(() => {
    const id = setInterval(() => {
      const data = getLiveData();
      setLiveData(data);
      rendererRef.current?.setLiveData(data);
    }, 12000);
    return () => clearInterval(id);
  }, []);

  // Field frequency refresh every 90 s
  useEffect(() => {
    const id = setInterval(async () => {
      const freq = await fetchField();
      rendererRef.current?.setPalette(freq);
    }, 90000);
    return () => clearInterval(id);
  }, [fetchField]);

  const handleFreqClick = (freq) => {
    setDominantFreq(freq);
    setPalette(FREQ_PALETTES[freq]);
    rendererRef.current?.setPalette(freq);
  };

  const handleRefresh = async () => {
    const freq = await fetchField();
    rendererRef.current?.setPalette(freq);
    const data = getLiveData();
    setLiveData(data);
    rendererRef.current?.setLiveData(data);
  };

  const wrapClass = fullscreen
    ? "fixed inset-0 z-[100] bg-black"
    : "relative w-full rounded-2xl overflow-hidden border border-border/30";

  const pal = palette;

  return (
    <div className={fullscreen ? "fixed inset-0 z-[99] bg-black" : "max-w-6xl mx-auto px-4 py-10 min-h-screen"}>

      {/* Header — only when not fullscreen */}
      {!fullscreen && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-4 h-4 rounded-full" style={{ background: pal.a, boxShadow: `0 0 8px ${pal.a}` }} />
                <h1 className="font-heading text-3xl">Synesthesia Engine</h1>
              </div>
              <p className="font-body text-sm text-muted-foreground">
                Live SR · ULF · GCI converted to generative visual art · reactive to global dominant frequency
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh}
                className="p-2 rounded-xl bg-card/30 border border-border/30 text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => setHud(h => !h)}
                className="p-2 rounded-xl bg-card/30 border border-border/30 text-muted-foreground hover:text-foreground transition-colors">
                {hud ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => setFullscreen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-body hover:opacity-90 transition-opacity">
                <Maximize2 className="w-3.5 h-3.5" /> Live Wallpaper
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Canvas container */}
      <div className={wrapClass} style={{ height: fullscreen ? "100vh" : "65vh" }}>
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Loading overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
                  style={{ borderColor: pal.a, borderTopColor: "transparent" }} />
                <p className="text-xs font-body text-muted-foreground">Tuning to the field…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD overlay */}
        <AnimatePresence>
          {hud && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none">
              {/* Top-left: live data */}
              <div className="absolute top-4 left-4 space-y-1 pointer-events-none">
                {[
                  { label: "SR", value: `M${liveData.sr_mode} · ${liveData.sr_hz} Hz · ${liveData.sr_power} pT` },
                  { label: "ULF", value: `${liveData.ulf_power} µT` },
                  { label: "GCI", value: `${(liveData.gci_index * 100).toFixed(0)}%` },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1">
                    <span className="text-[9px] font-body w-6" style={{ color: pal.a }}>{s.label}</span>
                    <span className="text-[9px] font-body text-white/70">{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Top-right: channel + fullscreen toggle */}
              <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
                <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: pal.a }} />
                  <span className="text-[10px] font-body capitalize" style={{ color: pal.a }}>{dominantFreq}</span>
                </div>
                <button onClick={() => setHud(false)}
                  className="bg-black/40 backdrop-blur-sm rounded-lg p-1.5 text-white/50 hover:text-white transition-colors">
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
                {fullscreen && (
                  <button onClick={() => setFullscreen(false)}
                    className="bg-black/40 backdrop-blur-sm rounded-lg p-1.5 text-white/50 hover:text-white transition-colors">
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Bottom: channel selector */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-2xl px-3 py-2">
                  {Object.entries(FREQ_PALETTES).map(([freq, p]) => (
                    <button key={freq} onClick={() => handleFreqClick(freq)}
                      title={p.name}
                      className={`w-5 h-5 rounded-full border transition-all duration-300 ${
                        dominantFreq === freq ? "scale-125 border-white/60" : "border-transparent opacity-60 hover:opacity-90"
                      }`}
                      style={{ background: p.a }} />
                  ))}
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <span className="text-[9px] font-body text-white/40">channel</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show HUD button when hidden in fullscreen */}
        {!hud && fullscreen && (
          <button onClick={() => setHud(true)}
            className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm rounded-lg p-1.5 text-white/30 hover:text-white transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}
        {!hud && fullscreen && (
          <button onClick={() => setFullscreen(false)}
            className="absolute top-4 right-12 bg-black/30 backdrop-blur-sm rounded-lg p-1.5 text-white/30 hover:text-white transition-colors">
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Below canvas — channel info (non-fullscreen) */}
      {!fullscreen && !loading && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Channel",  value: dominantFreq,                          color: pal.a },
            { label: "SR Mode",         value: `M${liveData.sr_mode} · ${liveData.sr_hz} Hz`, color: "#34d399" },
            { label: "ULF Field",       value: `${liveData.ulf_power} µT`,            color: "#a78bfa" },
            { label: "GCI Coherence",   value: `${(liveData.gci_index*100).toFixed(0)}%`,    color: "#fbbf24" },
          ].map(s => (
            <div key={s.label} className="bg-card/30 border border-border/20 rounded-2xl p-3 text-center">
              <div className="text-xs font-body capitalize font-medium" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] font-body text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Frequency channel picker (non-fullscreen) */}
      {!fullscreen && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="mt-3 bg-card/20 border border-border/10 rounded-2xl p-4">
          <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-3">Override Frequency Channel</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(FREQ_PALETTES).map(([freq, p]) => (
              <button key={freq} onClick={() => handleFreqClick(freq)}
                className={`px-3 py-1.5 rounded-full text-xs font-body border capitalize transition-all duration-300 ${
                  dominantFreq === freq ? "text-black font-medium" : "border-border/30 text-muted-foreground hover:text-foreground"
                }`}
                style={dominantFreq === freq ? { background: p.a, borderColor: p.a } : {}}>
                {freq}
              </button>
            ))}
          </div>
          <div className="mt-2 text-[9px] font-body text-muted-foreground/50">
            Auto-set from collective dominant · refreshes every 90s · all visual layers react simultaneously
          </div>
        </motion.div>
      )}
    </div>
  );
}