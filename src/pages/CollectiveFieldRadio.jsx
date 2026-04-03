import { useEffect, useState, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Loader2, Volume2, VolumeX, RefreshCw, Waves, Users } from "lucide-react";

// ── Live SR simulation (matches rest of app) ──────────────────────────────
const SR_MODES = [7.83, 14.3, 20.8, 27.3, 33.8, 39.0, 45.0, 51.0];
const FREQ_COLORS = {
  unity:"#c4a35a", creation:"#a78bfa", transformation:"#f472b6",
  healing:"#34d399", awakening:"#60a5fa", remembrance:"#fb923c",
  vision:"#e879f9", connection:"#2dd4bf",
};
const MOOD_COLORS = {
  calm:"#60a5fa", creative:"#a78bfa", focused:"#34d399", inspired:"#fbbf24",
  anxious:"#f87171", flow:"#2dd4bf", grateful:"#c4a35a", insight:"#e879f9", heightened:"#fb923c",
};

function getLiveSR() {
  const h = new Date().getUTCHours();
  const d = 0.5 + 0.5 * Math.sin((h - 6) * Math.PI / 12);
  const mode = Math.max(1, Math.min(8, Math.round(1 + d * 6)));
  return { mode, hz: +(SR_MODES[mode - 1] + (Math.random() - 0.5) * 0.3).toFixed(2), power: Math.round(45 + d * 35 + Math.random() * 10) };
}

// ── Aggregate collective state ────────────────────────────────────────────
function aggregateField(checkIns, records) {
  const moodCounts = {}, freqCounts = {};
  for (const c of checkIns) {
    if (c.mood_tag)  moodCounts[c.mood_tag]   = (moodCounts[c.mood_tag]   || 0) + 1;
    if (c.frequency) freqCounts[c.frequency]  = (freqCounts[c.frequency]  || 0) + 1;
  }
  for (const r of records) {
    if (r.frequency) freqCounts[r.frequency] = (freqCounts[r.frequency] || 0) + 1;
  }
  const dominantMood = Object.entries(moodCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || "calm";
  const dominantFreq = Object.entries(freqCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || "healing";
  const totalEchoes  = checkIns.reduce((s,c)=>(s + (c.echo_count||0)), 0);
  const avgResonance = checkIns.length
    ? Math.round(checkIns.reduce((s,c)=>(s+(c.resonance_score||0)),0) / checkIns.length)
    : 0;
  return { dominantMood, dominantFreq, totalEchoes, avgResonance, moodCounts, freqCounts, activeCount: checkIns.length };
}

// ── Audio engine ──────────────────────────────────────────────────────────
class FieldRadioEngine {
  constructor() {
    this.ctx = null;
    this.nodes = {};
    this.masterGain = null;
  }

  start(fieldState, srHz, volume) {
    this.stop();
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = this.ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = volume / 100;
    this.masterGain.connect(ctx.destination);
    const master = this.masterGain;

    // 1. SR carrier tone (fundamental)
    const srGain = ctx.createGain(); srGain.gain.value = 0.18; srGain.connect(master);
    const srOsc  = ctx.createOscillator(); srOsc.type = "sine"; srOsc.frequency.value = srHz;
    const srOsc2 = ctx.createOscillator(); srOsc2.type = "sine"; srOsc2.frequency.value = srHz + 0.3;
    srOsc.connect(srGain); srOsc2.connect(srGain); srOsc.start(); srOsc2.start();

    // 2. Mood-mapped drone (frequency determines pitch layer)
    const moodFreqMap = { unity:128, creation:160, transformation:192, healing:111,
                          awakening:144, remembrance:136, vision:172, connection:120 };
    const droneBase = moodFreqMap[fieldState.dominantFreq] || 136;
    const droneGain = ctx.createGain(); droneGain.gain.value = 0.14; droneGain.connect(master);
    const droneOsc  = ctx.createOscillator(); droneOsc.type = "triangle"; droneOsc.frequency.value = droneBase;
    const droneOsc2 = ctx.createOscillator(); droneOsc2.type = "triangle"; droneOsc2.frequency.value = droneBase * 1.5;
    // slow vibrato
    const vibLfo = ctx.createOscillator(); vibLfo.frequency.value = 0.08;
    const vibG   = ctx.createGain(); vibG.gain.value = 2;
    vibLfo.connect(vibG); vibG.connect(droneOsc.frequency); vibLfo.start();
    droneOsc.connect(droneGain); droneOsc2.connect(droneGain); droneOsc.start(); droneOsc2.start();

    // 3. Collective pulse (beat = active user count modulated)
    const pulseRate  = 0.2 + Math.min(fieldState.activeCount / 50, 1) * 1.2;
    const pulseGain  = ctx.createGain(); pulseGain.gain.value = 0;
    const pulseOsc   = ctx.createOscillator(); pulseOsc.type = "sine"; pulseOsc.frequency.value = 40;
    const pulseLfo   = ctx.createOscillator(); pulseLfo.type = "sine"; pulseLfo.frequency.value = pulseRate;
    const pulseLfoG  = ctx.createGain(); pulseLfoG.gain.value = 0.12;
    pulseLfo.connect(pulseLfoG); pulseLfoG.connect(pulseGain.gain);
    pulseOsc.connect(pulseGain); pulseGain.connect(master);
    pulseOsc.start(); pulseLfo.start();

    // 4. Ambient noise texture (filtered by resonance score → warmer = higher avg)
    const noiseLen = ctx.sampleRate * 3;
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;
    const noiseSrc = ctx.createBufferSource(); noiseSrc.buffer = noiseBuf; noiseSrc.loop = true;
    const lpf = ctx.createBiquadFilter(); lpf.type = "lowpass";
    lpf.frequency.value = 200 + (fieldState.avgResonance / 100) * 1200; // warmer as collective aligns
    const noiseGain = ctx.createGain(); noiseGain.gain.value = 0.07;
    noiseSrc.connect(lpf); lpf.connect(noiseGain); noiseGain.connect(master); noiseSrc.start();

    // 5. Echo shimmer (high-passed, very low volume — represents echoes)
    const shimmerBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const sd = shimmerBuf.getChannelData(0);
    for (let i = 0; i < sd.length; i++) sd[i] = Math.random() * 2 - 1;
    const shimSrc  = ctx.createBufferSource(); shimSrc.buffer = shimmerBuf; shimSrc.loop = true;
    const hpf      = ctx.createBiquadFilter(); hpf.type = "highpass"; hpf.frequency.value = 4000;
    const shimGain = ctx.createGain(); shimGain.gain.value = Math.min(fieldState.totalEchoes / 500, 1) * 0.04;
    shimSrc.connect(hpf); hpf.connect(shimGain); shimGain.connect(master); shimSrc.start();

    this.nodes = { srOsc, srOsc2, droneOsc, droneOsc2, vibLfo, pulseOsc, pulseLfo, noiseSrc, shimSrc };
  }

  setVolume(v) {
    if (this.masterGain) this.masterGain.gain.value = v / 100;
  }

  stop() {
    Object.values(this.nodes).forEach(n => { try { n.stop(); } catch {} });
    this.nodes = {};
    if (this.ctx) { try { this.ctx.close(); } catch {} this.ctx = null; }
    this.masterGain = null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────
export default function CollectiveFieldRadio() {
  const [tuned,        setTuned]        = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [fieldState,   setFieldState]   = useState(null);
  const [srData,       setSrData]       = useState(getLiveSR());
  const [volume,       setVolume]       = useState(65);
  const [muted,        setMuted]        = useState(false);
  const [aiNarration,  setAiNarration]  = useState(null);
  const [loadingAI,    setLoadingAI]    = useState(false);
  const [lastRefresh,  setLastRefresh]  = useState(null);

  const engineRef = useRef(new FieldRadioEngine());

  // Fetch collective data
  const fetchField = useCallback(async () => {
    setLoading(true);
    const [checkIns, records] = await Promise.all([
      base44.entities.PulseCheckIn.list("-created_date", 200),
      base44.entities.ResonanceRecord.list("-created_date", 300),
    ]);
    const state = aggregateField(checkIns, records);
    const sr    = getLiveSR();
    setFieldState(state);
    setSrData(sr);
    setLastRefresh(new Date());
    setLoading(false);
    return { state, sr };
  }, []);

  const generateNarration = useCallback(async (state, sr) => {
    setLoadingAI(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the voice of the Akashic Field Radio. Generate a brief, poetic 2-sentence description of the current collective field state for users tuning in now. Be evocative, symbolic, and grounded in the data below. Do not use the word "quantum".

Current collective data:
- Active participants in field: ${state.activeCount}
- Dominant collective mood: ${state.dominantMood}
- Dominant resonance frequency channel: ${state.dominantFreq}
- Average collective coherence score: ${state.avgResonance}%
- Total resonance echoes recorded: ${state.totalEchoes}
- Live Schumann Resonance: Mode ${sr.mode} at ${sr.hz} Hz, power ${sr.power} pT

Respond with exactly 2 sentences. Do not use lists or headers.`,
    });
    setAiNarration(result);
    setLoadingAI(false);
  }, []);

  const tuneIn = async () => {
    setLoading(true);
    const { state, sr } = await fetchField();
    engineRef.current.start(state, sr.hz, muted ? 0 : volume);
    setTuned(true);
    setLoading(false);
    generateNarration(state, sr);
  };

  const tuneOut = () => {
    engineRef.current.stop();
    setTuned(false);
    setAiNarration(null);
  };

  const refresh = async () => {
    if (!tuned) return;
    const { state, sr } = await fetchField();
    engineRef.current.start(state, sr.hz, muted ? 0 : volume);
    generateNarration(state, sr);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    engineRef.current.setVolume(next ? 0 : volume);
  };

  const handleVolume = (v) => {
    setVolume(v);
    if (!muted) engineRef.current.setVolume(v);
  };

  // Auto-refresh every 3 minutes when tuned
  useEffect(() => {
    if (!tuned) return;
    const id = setInterval(refresh, 3 * 60 * 1000);
    return () => clearInterval(id);
  }, [tuned]);

  // SR tick
  useEffect(() => {
    const id = setInterval(() => setSrData(getLiveSR()), 12000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => engineRef.current.stop(), []);

  const dominantColor = fieldState ? (FREQ_COLORS[fieldState.dominantFreq] || "#c4a35a") : "#c4a35a";
  const moodColor     = fieldState ? (MOOD_COLORS[fieldState.dominantMood]  || "#60a5fa") : "#60a5fa";

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <Radio className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-3xl">Collective Field Radio</h1>
          </div>
          <p className="font-body text-sm text-muted-foreground max-w-md mx-auto">
            An AI-mixed ambient soundscape generated from the live aggregate state of the collective field. Tune in to hear the global mind.
          </p>
        </motion.div>

        {/* Orb / Tune-in button */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="flex justify-center mb-8">
          <div className="relative">
            {/* Outer glow rings */}
            {tuned && [1, 2, 3].map(i => (
              <motion.div key={i}
                className="absolute inset-0 rounded-full border pointer-events-none"
                style={{ borderColor: dominantColor + "40", margin: `-${i * 18}px` }}
                animate={{ scale: [1, 1.04, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 2 + i, repeat: Infinity, delay: i * 0.5 }}
              />
            ))}

            <button onClick={tuned ? tuneOut : tuneIn} disabled={loading}
              className="relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 border-2 transition-all duration-500 cursor-pointer overflow-hidden"
              style={tuned
                ? { borderColor: dominantColor, boxShadow: `0 0 60px ${dominantColor}30, 0 0 120px ${dominantColor}15` }
                : { borderColor: "hsl(var(--border))" }}>

              {/* Inner animated background */}
              {tuned && (
                <motion.div className="absolute inset-0 rounded-full"
                  style={{ background: `radial-gradient(circle, ${dominantColor}25 0%, transparent 70%)` }}
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity }} />
              )}

              {loading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin relative z-10" />
              ) : tuned ? (
                <>
                  {/* Waveform bars */}
                  <div className="flex items-end gap-0.5 h-8 relative z-10">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <motion.div key={i} className="w-1.5 rounded-t-sm"
                        style={{ background: dominantColor }}
                        animate={{ height: [`${16 + Math.random() * 16}px`, `${4 + Math.random() * 28}px`] }}
                        transition={{ duration: 0.3 + i * 0.08, repeat: Infinity, repeatType: "mirror" }} />
                    ))}
                  </div>
                  <span className="text-[10px] font-body relative z-10" style={{ color: dominantColor }}>LIVE · tap to stop</span>
                </>
              ) : (
                <>
                  <Radio className="w-8 h-8 text-muted-foreground relative z-10" />
                  <span className="text-xs font-body text-muted-foreground relative z-10">Tune In</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* AI Narration */}
        <AnimatePresence>
          {(loadingAI || aiNarration) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 px-6 py-4 rounded-2xl bg-card/30 border border-border/20 text-center">
              {loadingAI ? (
                <div className="flex items-center justify-center gap-2 text-xs font-body text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Reading the field…
                </div>
              ) : (
                <p className="font-heading text-base text-foreground/80 leading-relaxed italic">
                  "{aiNarration}"
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Field state panel */}
        <AnimatePresence>
          {fieldState && tuned && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">

              {/* Collective metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Active Voices",    value: fieldState.activeCount,   color: "#60a5fa", icon: Users },
                  { label: "Dominant Mood",     value: fieldState.dominantMood,  color: moodColor  },
                  { label: "Freq Channel",      value: fieldState.dominantFreq,  color: dominantColor },
                  { label: "Field Coherence",   value: `${fieldState.avgResonance}%`, color: "#34d399" },
                ].map(s => (
                  <div key={s.label} className="bg-card/30 border border-border/20 rounded-2xl p-3 text-center">
                    {s.icon && <s.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: s.color }} />}
                    <div className="text-sm font-body capitalize font-medium" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[9px] font-body text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Mood distribution */}
              <div className="bg-card/30 border border-border/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Waves className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-body text-foreground/80">Collective Mood Field</span>
                  </div>
                  <div className="text-[9px] font-body text-muted-foreground">
                    {lastRefresh && `Updated ${lastRefresh.toLocaleTimeString()}`}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(fieldState.moodCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([mood, count]) => {
                      const total = Object.values(fieldState.moodCounts).reduce((s, v) => s + v, 0);
                      const pct   = total ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={mood} className="flex items-center gap-2">
                          <span className="text-[10px] font-body capitalize text-foreground/60 w-20 flex-shrink-0">{mood}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-border/20 overflow-hidden">
                            <motion.div className="h-full rounded-full"
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              style={{ background: MOOD_COLORS[mood] || "#888" }} />
                          </div>
                          <span className="text-[9px] font-body text-muted-foreground w-6 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* SR + Volume + Refresh */}
              <div className="bg-card/30 border border-border/20 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-body">
                  <span className="text-muted-foreground">SR Mode {srData.mode} · {srData.hz} Hz · {srData.power} pT</span>
                  <button onClick={refresh} disabled={loading}
                    className="flex items-center gap-1 text-primary hover:opacity-70 transition-opacity disabled:opacity-40">
                    <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                    Resync
                  </button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-3">
                  <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground transition-colors">
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input type="range" min={0} max={100} value={volume}
                    onChange={e => handleVolume(Number(e.target.value))}
                    className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-primary" />
                  <span className="text-[10px] font-body text-muted-foreground w-6 text-right">{muted ? 0 : volume}</span>
                </div>
              </div>

              {/* Sound layer legend */}
              <div className="bg-card/20 border border-border/10 rounded-2xl p-4">
                <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-2">Active Sound Layers</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  {[
                    { label: "SR Carrier Tone",     note: `${srData.hz} Hz fundamental · binaural drift` },
                    { label: "Collective Drone",     note: `${fieldState.dominantFreq} channel mapped pitch` },
                    { label: "Field Pulse",          note: `${fieldState.activeCount} voices → beat rate` },
                    { label: "Coherence Texture",    note: `${fieldState.avgResonance}% → filter warmth` },
                    { label: "Echo Shimmer",         note: `${fieldState.totalEchoes} echoes → shimmer depth` },
                  ].map(s => (
                    <div key={s.label} className="flex items-start gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] font-body text-foreground/70">{s.label}</span>
                        <span className="text-[9px] font-body text-muted-foreground/60 ml-1">· {s.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pre-tune teaser */}
        {!tuned && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-center text-xs font-body text-muted-foreground/50 space-y-1">
            <p>The soundscape is shaped by active check-ins, resonance scores, SR mode, and collective echoes.</p>
            <p>It shifts in real time as the global field evolves.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}