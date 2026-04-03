import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Info, X, Headphones, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from "recharts";
import { BINAURAL_DATA } from "../lib/binauralData";

const BAND_COLOR = {
  "Theta / Alpha": "#34d399",
  "Alpha / Low Beta": "#60a5fa",
  "Beta": "#a78bfa",
  "Low Gamma": "#fb923c",
  "High Gamma": "#fbbf24",
};

function useBinauralEngine() {
  const ctxRef    = useRef(null);
  const nodesRef  = useRef(null);

  const start = useCallback((carrier, beat, volume, waveform) => {
    stop();
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.value = volume / 100;
    gain.connect(ctx.destination);

    const leftFreq  = carrier;
    const rightFreq = carrier + beat;

    // Left channel
    const leftOsc    = ctx.createOscillator();
    const leftPanner = ctx.createStereoPanner();
    leftOsc.type     = waveform;
    leftOsc.frequency.value = leftFreq;
    leftPanner.pan.value    = -1;
    leftOsc.connect(leftPanner);
    leftPanner.connect(gain);
    leftOsc.start();

    // Right channel
    const rightOsc    = ctx.createOscillator();
    const rightPanner = ctx.createStereoPanner();
    rightOsc.type     = waveform;
    rightOsc.frequency.value = rightFreq;
    rightPanner.pan.value    = 1;
    rightOsc.connect(rightPanner);
    rightPanner.connect(gain);
    rightOsc.start();

    ctxRef.current   = ctx;
    nodesRef.current = { leftOsc, rightOsc, gain };
  }, []);

  const stop = useCallback(() => {
    if (nodesRef.current) {
      try { nodesRef.current.leftOsc.stop(); nodesRef.current.rightOsc.stop(); } catch {}
      nodesRef.current = null;
    }
    if (ctxRef.current) {
      try { ctxRef.current.close(); } catch {}
      ctxRef.current = null;
    }
  }, []);

  useEffect(() => () => stop(), [stop]);
  return { start, stop };
}

const chartData = BINAURAL_DATA.presets.map(p => ({
  name: p.name.split(" ")[0],
  beat: p.beat,
  carrier: p.carrier,
  color: p.color,
  full: p,
}));

export default function BinauralStudio() {
  const [carrier,  setCarrier]  = useState(250);
  const [beat,     setBeat]     = useState(7.83);
  const [volume,   setVolume]   = useState(65);
  const [waveform, setWaveform] = useState("sine");
  const [playing,  setPlaying]  = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [elapsed,  setElapsed]  = useState(0);
  const [duration, setDuration] = useState(15);
  const timerRef   = useRef(null);
  const { start, stop } = useBinauralEngine();

  const activePreset = BINAURAL_DATA.presets.find(p => Math.abs(p.beat - beat) < 0.05 && p.carrier === carrier);

  const handlePlay = () => {
    if (playing) {
      stop();
      clearInterval(timerRef.current);
      setPlaying(false);
      setElapsed(0);
    } else {
      start(carrier, beat, volume, waveform);
      setPlaying(true);
      setElapsed(0);
      const limit = duration * 60;
      timerRef.current = setInterval(() => {
        setElapsed(e => {
          if (e + 1 >= limit) {
            stop();
            clearInterval(timerRef.current);
            setPlaying(false);
            return 0;
          }
          return e + 1;
        });
      }, 1000);
    }
  };

  const loadPreset = (p) => {
    if (playing) { stop(); clearInterval(timerRef.current); setPlaying(false); setElapsed(0); }
    setCarrier(p.carrier);
    setBeat(p.beat);
    setDuration(p.duration);
  };

  const fmtTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const progress = playing ? (elapsed / (duration * 60)) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Headphones className="w-5 h-5 text-primary" />
              <h1 className="font-heading text-3xl">Binaural Studio</h1>
            </div>
            <p className="font-body text-sm text-muted-foreground">SR-tuned brainwave entrainment · use stereo headphones for best effect</p>
          </div>
          <button onClick={() => setInfoOpen(o => !o)} className="text-muted-foreground hover:text-foreground">
            <Info className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {infoOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="mt-3 p-4 rounded-xl bg-card/40 border border-border/30 text-xs font-body text-muted-foreground leading-relaxed relative"
            >
              <button onClick={() => setInfoOpen(false)} className="absolute top-3 right-3"><X className="w-3 h-3" /></button>
              {BINAURAL_DATA.summary_for_info_bubble}
              <div className="mt-1.5 italic text-muted-foreground/50">{BINAURAL_DATA.source_note}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left: Presets */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5">
          <h3 className="font-heading text-base mb-3">SR Presets</h3>
          <div className="space-y-2">
            {BINAURAL_DATA.presets.map(p => {
              const active = activePreset?.name === p.name;
              return (
                <button key={p.name} onClick={() => loadPreset(p)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                    active ? "bg-secondary/50 border-primary/30" : "bg-secondary/20 border-border/20 hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-body font-medium text-foreground/90">{p.name}</span>
                    <span className="text-[10px] font-body" style={{ color: p.color }}>{p.beat} Hz</span>
                  </div>
                  <div className="text-[10px] font-body text-muted-foreground capitalize">{p.band} · {p.duration}min</div>
                  {p.note && <div className="text-[9px] text-muted-foreground/50 mt-0.5 italic">{p.note}</div>}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Centre: Controls + Player */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5 flex flex-col gap-5">

          {/* Active state display */}
          <div className="text-center">
            <div className="font-heading text-5xl text-foreground/90 tracking-tight">{beat} <span className="text-xl text-muted-foreground">Hz</span></div>
            <div className="text-xs font-body text-muted-foreground mt-1">
              {activePreset ? <span style={{ color: activePreset.color }}>{activePreset.band} · {activePreset.state}</span> : "Custom setting"}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            <Slider label="Beat Frequency" value={beat} min={0.5} max={100} step={0.01} unit="Hz" onChange={setBeat}
              note="0.5–40 Hz: entrainment · 40–100 Hz: gamma stim" color={activePreset?.color} />
            <Slider label="Carrier Frequency" value={carrier} min={100} max={1000} step={10} unit="Hz" onChange={setCarrier}
              note="200–400 Hz sweet spot" />
            <Slider label="Volume" value={volume} min={30} max={85} step={5} unit="%" onChange={setVolume}
              note="Never exceed 85% to protect hearing" />
            <Slider label="Duration" value={duration} min={5} max={60} step={1} unit="min" onChange={setDuration} />
          </div>

          {/* Waveform */}
          <div>
            <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-1.5">Waveform</div>
            <div className="flex gap-2">
              {BINAURAL_DATA.waveforms.map(w => (
                <button key={w} onClick={() => setWaveform(w)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-body capitalize border transition-all ${
                    waveform === w ? "bg-primary text-primary-foreground border-primary" : "border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >{w}</button>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          {playing && (
            <div>
              <div className="flex justify-between text-[10px] font-body text-muted-foreground mb-1">
                <span>{fmtTime(elapsed)}</span>
                <span>{fmtTime(duration * 60)}</span>
              </div>
              <div className="h-1 rounded-full bg-border/20 overflow-hidden">
                <motion.div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Play button */}
          <button onClick={handlePlay}
            className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-sm font-body font-medium transition-all ${
              playing
                ? "bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive/30"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            {playing ? <><Square className="w-4 h-4" /> Stop</> : <><Play className="w-4 h-4" /> Play</>}
          </button>

          <p className="text-[9px] font-body text-muted-foreground/50 text-center">
            Left ear: {carrier} Hz · Right ear: {(carrier + beat).toFixed(2)} Hz · Δ = {beat} Hz
          </p>
        </motion.div>

        {/* Right: Chart */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="font-heading text-base">Preset Beat Frequencies</h3>
          </div>
          <p className="text-[10px] font-body text-muted-foreground mb-3">Click a bar to load that preset</p>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} onClick={d => d?.activePayload && loadPreset(d.activePayload[0].payload.full)}>
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 10 }}
                formatter={(v, n, p) => [`${v} Hz`, "Beat"]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.full?.state || ""}
              />
              <ReferenceLine y={60} stroke="#f43f5e" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "60 Hz", position: "insideRight", fontSize: 9, fill: "#f43f5e" }} />
              <Bar dataKey="beat" radius={[4, 4, 0, 0]} cursor="pointer">
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.color} fillOpacity={activePreset?.name === d.full.name ? 1 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Brainwave reference */}
          <div className="mt-auto pt-4 space-y-1.5">
            <div className="text-[10px] font-body text-muted-foreground/50 uppercase tracking-wide mb-2">Brainwave Reference</div>
            {[
              { band: "Delta", range: "0.5–4 Hz", color: "#94a3b8" },
              { band: "Theta", range: "4–8 Hz",   color: "#34d399" },
              { band: "Alpha", range: "8–13 Hz",  color: "#60a5fa" },
              { band: "Beta",  range: "13–30 Hz", color: "#a78bfa" },
              { band: "Gamma", range: "30–100+ Hz", color: "#fbbf24" },
            ].map(b => (
              <div key={b.band} className="flex items-center justify-between text-[10px] font-body">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                  <span className="text-foreground/70">{b.band}</span>
                </div>
                <span className="text-muted-foreground">{b.range}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, unit, onChange, note, color }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-body mb-1">
        <span className="text-muted-foreground uppercase tracking-wide">{label}</span>
        <span style={color ? { color } : {}} className="text-foreground/80">{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-border/30 cursor-pointer accent-primary"
      />
      {note && <div className="text-[9px] font-body text-muted-foreground/50 mt-0.5">{note}</div>}
    </div>
  );
}