import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Zap, Globe, Waves, Star, Info, X, RefreshCw, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ─── Simulated live data generators ──────────────────────────────────────────
function simSR() {
  const hour = new Date().getUTCHours();
  const day  = 0.5 + 0.5 * Math.sin((hour - 6) * Math.PI / 12);
  return {
    mode: Math.round(1 + day * 4),
    hz:   +(7.83 + day * 3.2 + (Math.random() - 0.5) * 0.4).toFixed(2),
    power: Math.round(50 + day * 30 + Math.random() * 10),
  };
}
function simULF() {
  const base = 2 + Math.random() * 3;
  return {
    hz:     +base.toFixed(3),
    power:  Math.round(5 + Math.random() * 20),
    alert:  base > 4.2,
    status: base > 4.2 ? "Anomaly detected" : "Quiet",
  };
}
function simIAR() {
  return {
    hz:    +(0.8 + Math.random() * 3.5).toFixed(2),
    power: Math.round(8 + Math.random() * 25),
    coupling: Math.round(40 + Math.random() * 50),
  };
}
function simPc() {
  const types = ["Pc1 (0.2–5 Hz)","Pc2 (0.1–0.2 Hz)","Pc3 (0.02–0.1 Hz)","Pc4 (0.007–0.02 Hz)","Pc5 (0.002–0.007 Hz)"];
  const active = Math.floor(Math.random() * 5);
  return { active: types[active], kp: +(Math.random() * 4).toFixed(1), storm: Math.random() > 0.8 };
}
function simPlanetarySR() {
  return [
    { name: "Venus",   hz: +(8.8  + Math.random() * 0.3).toFixed(2), power: Math.round(Math.random() * 12) },
    { name: "Mars",    hz: +(11.5 + Math.random() * 0.5).toFixed(2), power: Math.round(Math.random() * 8)  },
    { name: "Jupiter", hz: +(0.77 + Math.random() * 0.1).toFixed(3), power: Math.round(Math.random() * 5)  },
    { name: "Titan",   hz: +(28.0 + Math.random() * 1.0).toFixed(2), power: Math.round(Math.random() * 6)  },
  ];
}
function simGW() {
  return {
    strain:   (1e-15 * (0.5 + Math.random())).toExponential(2),
    nanoHz:   +(5 + Math.random() * 15).toFixed(1),
    source:   "SMBH binary background",
    ptaAlert: Math.random() > 0.9,
  };
}
function simGCI() {
  const hr = new Date().getUTCHours();
  return {
    coherence: Math.round(30 + Math.sin(hr * 0.5) * 25 + Math.random() * 15),
    gcp_deviation: +(Math.random() * 4 - 2).toFixed(2),
    hrv_index: Math.round(60 + Math.random() * 30),
    event_flag: Math.random() > 0.85,
  };
}

function buildHistory(simFn, key, count = 20) {
  return Array.from({ length: count }, (_, i) => ({ t: i, v: simFn()[key] }));
}

const LAYER_DEFS = [
  {
    id: "sr",      label: "Schumann Resonances",      icon: Waves,    color: "#34d399",
    range: "7.83–62+ Hz", source: "Tomsk / Tallinn / HeartMath",
    bio: "Overlaps brainwaves — core entrainment",
    note: null,
  },
  {
    id: "ulf",     label: "ULF/ELF Seismogenic",       icon: Activity, color: "#f472b6",
    range: "0.001–30 Hz", source: "Chubu Univ / Kamchatka arrays",
    bio: "Detectable in quiet periods — earthquake precursors",
    note: null,
  },
  {
    id: "iar",     label: "Ionospheric Alfvén Resonator", icon: Zap,  color: "#60a5fa",
    range: "0.5–5 Hz", source: "Global magnetometer arrays",
    bio: "Marginal overlap — magnetosphere-ionosphere coupling",
    note: null,
  },
  {
    id: "pc",      label: "Geomagnetic Pulsations (Pc1–5)", icon: Radio, color: "#a78bfa",
    range: "0.002–5 Hz", source: "HeartMath GCI + observatories",
    bio: "Space weather / global coherence",
    note: null,
  },
  {
    id: "planets", label: "Planetary SR Models",        icon: Globe,   color: "#fb923c",
    range: "Planet-specific", source: "NASA/ESA probe models",
    bio: "No biological effect on Earth — cosmic context only",
    note: "Educational overlay only",
  },
  {
    id: "gw",      label: "NanoHz Gravitational Waves",  icon: Star,   color: "#e879f9",
    range: "1–100 nHz", source: "NANOGrav / EPTA / IPTA",
    bio: "Strain ~10⁻¹⁵ — ZERO biological effect",
    note: "Experimental coincidence log only — no causation",
  },
  {
    id: "gci",     label: "GCI / GCP Coherence",         icon: Waves,  color: "#fbbf24",
    range: "Geomagnetic + RNG", source: "HeartMath GCI + Princeton GCP",
    bio: "Correlated with HRV & collective events",
    note: null,
  },
];

function LayerCard({ def, enabled, onToggle }) {
  const [data, setData]       = useState(null);
  const [history, setHistory] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const intervalRef = useRef(null);

  const refresh = () => {
    let d, histKey;
    if (def.id === "sr")      { d = simSR();      histKey = "power"; }
    if (def.id === "ulf")     { d = simULF();     histKey = "power"; }
    if (def.id === "iar")     { d = simIAR();     histKey = "power"; }
    if (def.id === "pc")      { d = simPc();      histKey = null; }
    if (def.id === "planets") { d = simPlanetarySR(); histKey = null; }
    if (def.id === "gw")      { d = simGW();      histKey = null; }
    if (def.id === "gci")     { d = simGCI();     histKey = "coherence"; }
    setData(d);
    if (histKey) setHistory(h => [...h.slice(-29), { t: Date.now(), v: d[histKey] }]);
  };

  useEffect(() => {
    refresh();
    if (enabled) {
      intervalRef.current = setInterval(refresh, 4000);
    }
    return () => clearInterval(intervalRef.current);
  }, [enabled, def.id]);

  const Icon = def.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-card/30 border rounded-2xl overflow-hidden transition-all duration-300 ${
        enabled ? "border-border/40" : "border-border/20 opacity-50"
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4" style={{ color: def.color }} />
          <span className="font-heading text-sm text-foreground/90">{def.label}</span>
          {data?.alert && <span className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">Alert</span>}
          {data?.ptaAlert && <span className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">PTA Signal</span>}
          {data?.event_flag && <span className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Event</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInfo(i => !i)} className="text-muted-foreground hover:text-foreground">
            <Info className="w-3.5 h-3.5" />
          </button>
          <button onClick={onToggle}
            className={`w-9 h-5 rounded-full transition-all relative ${enabled ? "bg-primary" : "bg-border/40"}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled ? "left-4" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Info bubble */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 py-2 bg-secondary/20 text-[10px] font-body space-y-0.5">
              <div><span className="text-muted-foreground">Range: </span><span className="text-foreground/70">{def.range}</span></div>
              <div><span className="text-muted-foreground">Source: </span><span className="text-foreground/70">{def.source}</span></div>
              <div className="text-foreground/60 italic">{def.bio}</div>
              {def.note && <div className="text-amber-400/70">⚠ {def.note}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data */}
      {enabled && data && (
        <div className="px-4 py-3">
          {def.id === "sr" && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Stat label="Mode" value={`M${data.mode}`} color={def.color} />
              <Stat label="Hz"   value={data.hz} color={def.color} />
              <Stat label="Power" value={`${data.power} pT`} color={def.color} />
            </div>
          )}
          {def.id === "ulf" && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Stat label="Freq"   value={`${data.hz} Hz`}  color={def.color} />
              <Stat label="Power"  value={`${data.power}`}  color={def.color} />
              <Stat label="Status" value={data.status} color={data.alert ? "#f87171" : def.color} />
            </div>
          )}
          {def.id === "iar" && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Stat label="Freq"     value={`${data.hz} Hz`} color={def.color} />
              <Stat label="Power"    value={data.power}       color={def.color} />
              <Stat label="Coupling" value={`${data.coupling}%`} color={def.color} />
            </div>
          )}
          {def.id === "pc" && (
            <div className="flex items-center gap-4 mb-2">
              <Stat label="Active" value={data.active.split(" ")[0]} color={def.color} />
              <Stat label="Kp Index" value={data.kp} color={data.kp > 3 ? "#f87171" : def.color} />
              {data.storm && <span className="text-[9px] font-body text-rose-400">Storm conditions</span>}
            </div>
          )}
          {def.id === "planets" && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              {data.map(p => (
                <div key={p.name} className="flex justify-between text-[10px] font-body bg-card/20 rounded-lg px-2 py-1.5">
                  <span className="text-foreground/60">{p.name}</span>
                  <span style={{ color: def.color }}>{p.hz} Hz</span>
                </div>
              ))}
            </div>
          )}
          {def.id === "gw" && (
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-[10px] font-body">
                <span className="text-muted-foreground">Strain</span>
                <span style={{ color: def.color }}>{data.strain}</span>
              </div>
              <div className="flex justify-between text-[10px] font-body">
                <span className="text-muted-foreground">Frequency</span>
                <span className="text-foreground/70">{data.nanoHz} nHz</span>
              </div>
              <div className="flex justify-between text-[10px] font-body">
                <span className="text-muted-foreground">Source</span>
                <span className="text-foreground/60 italic">{data.source}</span>
              </div>
              <div className="text-[9px] font-body text-amber-400/60 italic mt-1">Strain ~10⁻¹⁵ — no biological interaction. Experimental log only.</div>
            </div>
          )}
          {def.id === "gci" && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Stat label="Coherence" value={`${data.coherence}%`} color={def.color} />
              <Stat label="GCP Dev"   value={data.gcp_deviation}   color={Math.abs(data.gcp_deviation) > 1.5 ? "#f472b6" : def.color} />
              <Stat label="HRV Idx"  value={data.hrv_index}        color={def.color} />
            </div>
          )}

          {/* Mini sparkline */}
          {history.length > 3 && (
            <ResponsiveContainer width="100%" height={40}>
              <LineChart data={history} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <Line type="monotone" dataKey="v" stroke={def.color} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </motion.div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="text-center">
      <div className="font-heading text-base" style={{ color }}>{value}</div>
      <div className="text-[9px] font-body text-muted-foreground">{label}</div>
    </div>
  );
}

export default function FrequencyMonitor() {
  const [enabled, setEnabled] = useState({ sr: true, ulf: true, iar: true, pc: true, planets: false, gw: false, gci: true });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-3xl">Frequency Monitor</h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-body text-muted-foreground">
            <RefreshCw className="w-3 h-3" /> Live simulation · Updates every 4s · Real data via Builder+
          </div>
        </div>
        <p className="font-body text-sm text-muted-foreground">
          Extended multi-layer monitoring — SR · ULF/ELF · Magnetospheric · Planetary · nanoHz GW · GCI/GCP
        </p>
        <div className="mt-3 px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[10px] font-body text-amber-400/70 leading-relaxed">
          ⚠ All frequencies below are displayed for experimental correlation study. No causation is claimed. 
          Planetary SR, nanoHz GW, and molecular lines have <strong>zero documented biological effect</strong> at Earth. 
          Strongest practical entrainment: Earth SR + binaural + photic (32–40 Hz).
        </div>
      </motion.div>

      {/* Summary row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {LAYER_DEFS.map(d => (
          <button key={d.id} onClick={() => setEnabled(e => ({ ...e, [d.id]: !e[d.id] }))}
            className={`px-2 py-2 rounded-xl border text-center transition-all ${
              enabled[d.id] ? "border-border/40 bg-card/30" : "border-border/20 bg-card/10 opacity-40"
            }`}>
            <d.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: d.color }} />
            <div className="text-[9px] font-body text-muted-foreground leading-tight">{d.label.split(" ")[0]}</div>
          </button>
        ))}
      </div>

      {/* Combined effects note */}
      <div className="mb-5 bg-card/20 border border-border/20 rounded-2xl p-4">
        <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-2">Combined Effects Summary (v1.7)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-body">
            <thead><tr className="text-muted-foreground/50 border-b border-border/10">
              <th className="text-left pb-1 pr-3">Component</th>
              <th className="text-left pb-1 pr-3">Biological Effect</th>
              <th className="text-left pb-1">Combined Value</th>
            </tr></thead>
            <tbody>
              {[
                ["Earth SR + Photic Flicker", "Strong multi-modal gamma/theta entrainment", "★★★ Highest practical synergy"],
                ["GCI + GCP Coherence",        "Correlated with HRV & collective events",  "★★ Useful overlay"],
                ["Planetary SR",               "None documented on Earth humans",           "Cosmic context only"],
                ["NanoHz GW",                  "Zero (strain ~10⁻¹⁵)",                     "Experimental coincidence log"],
              ].map(([c, b, v]) => (
                <tr key={c} className="border-b border-border/10 last:border-0">
                  <td className="py-1 pr-3 text-foreground/70">{c}</td>
                  <td className="py-1 pr-3 text-muted-foreground italic">{b}</td>
                  <td className="py-1 text-foreground/60">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Layer cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LAYER_DEFS.map(def => (
          <LayerCard key={def.id} def={def} enabled={enabled[def.id]}
            onToggle={() => setEnabled(e => ({ ...e, [def.id]: !e[def.id] }))} />
        ))}
      </div>
    </div>
  );
}