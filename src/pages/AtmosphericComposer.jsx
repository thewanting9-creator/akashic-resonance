import { useEffect, useState, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Circle, Square, Upload, Share2, Loader2, Play, Music, Check, X } from "lucide-react";
import LayerStrip from "../components/composer/LayerStrip";

const SR_MODES = [7.83, 14.3, 20.8, 27.3, 33.8, 39.0, 45.0, 51.0];

function liveSRData() {
  const h = new Date().getUTCHours();
  const d = 0.5 + 0.5 * Math.sin((h - 6) * Math.PI / 12);
  const mode = Math.max(1, Math.min(8, Math.round(1 + d * 6)));
  return {
    sr_mode: mode,
    sr_hz: +(SR_MODES[mode - 1] + (Math.random() - 0.5) * 0.3).toFixed(2),
    sr_power_pt: Math.round(45 + d * 35 + Math.random() * 10),
    ulf_power: +(0.3 + Math.random() * 0.7).toFixed(2),
    gci_index: +(0.4 + d * 0.4 + Math.random() * 0.15).toFixed(2),
  };
}

const FREQ_CHANNELS = ["unity","creation","transformation","healing","awakening","remembrance","vision","connection"];
const MOODS = ["calm","creative","focused","inspired","flow","grateful","insight","heightened"];

const DEFAULT_LAYERS = [
  {
    id: "sr_tone", label: "SR Fundamental Tone", sublabel: "Earth's 7.83 Hz carrier",
    active: true, volume: 60, freq: 7.83, liveSync: true,
    freqControl: { min: 4, max: 51, step: 0.01 },
  },
  {
    id: "ulf_rumble", label: "ULF Rumble", sublabel: "Sub-bass field texture 0.01–4 Hz",
    active: true, volume: 40, freq: 0.5, liveSync: true,
    freqControl: { min: 0.01, max: 4, step: 0.01 },
  },
  {
    id: "gci_pulse", label: "GCI Coherence Pulse", sublabel: "Rhythmic heart-field beat",
    active: false, volume: 50, rate: 1.0, liveSync: true,
    rateControl: { min: 0.2, max: 4, step: 0.1 },
  },
  {
    id: "cosmic_pad", label: "Cosmic Pad", sublabel: "Slow-evolving harmonic shimmer",
    active: false, volume: 45, freq: 432, liveSync: false,
    freqControl: { min: 100, max: 800, step: 1 },
  },
  {
    id: "static_rain", label: "Field Static / Rain", sublabel: "Filtered white noise atmosphere",
    active: false, volume: 30, liveSync: false,
  },
];

export default function AtmosphericComposer() {
  const [liveData,    setLiveData]    = useState(liveSRData());
  const [layers,      setLayers]      = useState(DEFAULT_LAYERS);
  const [playing,     setPlaying]     = useState(false);
  const [recording,   setRecording]   = useState(false);
  const [elapsed,     setElapsed]     = useState(0);
  const [saved,       setSaved]       = useState(null); // saved soundscape object
  const [saving,      setSaving]      = useState(false);
  const [showSave,    setShowSave]    = useState(false);
  const [saveForm,    setSaveForm]    = useState({ title: "", description: "", mood: "calm", channel: "healing", isPublic: true });
  const [participant, setParticipant] = useState(null);

  const ctxRef      = useRef(null);
  const destRef     = useRef(null); // MediaStreamDestination
  const nodesRef    = useRef({});
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);
  const layersRef   = useRef(layers);
  layersRef.current = layers;

  useEffect(() => {
    base44.auth.me().then(me =>
      base44.entities.Participant.filter({ user_email: me.email }, "-created_date", 1)
        .then(p => setParticipant(p[0] || null))
    );
    const id = setInterval(() => setLiveData(liveSRData()), 10000);
    return () => clearInterval(id);
  }, []);

  // ── Audio Engine ─────────────────────────────────────────────────────────
  const buildNodes = useCallback((ctx, dest, currentLayers) => {
    // Tear down old nodes
    Object.values(nodesRef.current).forEach(n => {
      try { n.osc?.stop(); n.osc2?.stop(); n.src?.stop(); } catch {}
    });
    nodesRef.current = {};

    currentLayers.forEach(layer => {
      if (!layer.active) return;
      const gain = ctx.createGain();
      gain.gain.value = layer.volume / 100 * 0.4;
      gain.connect(dest);

      if (layer.id === "sr_tone") {
        // Binaural: left ear carrier, right ear carrier + beat
        const splitter = ctx.createChannelMerger(2);
        splitter.connect(dest);
        const L = ctx.createOscillator(); L.type = "sine"; L.frequency.value = 200; L.start();
        const R = ctx.createOscillator(); R.type = "sine"; R.frequency.value = 200 + layer.freq; R.start();
        const gL = ctx.createGain(); gL.gain.value = layer.volume / 100 * 0.35;
        const gR = ctx.createGain(); gR.gain.value = layer.volume / 100 * 0.35;
        L.connect(gL); R.connect(gR);
        gL.connect(splitter, 0, 0); gR.connect(splitter, 0, 1);
        nodesRef.current[layer.id] = { osc: L, osc2: R, gainL: gL, gainR: gR };

      } else if (layer.id === "ulf_rumble") {
        // Low-pass filtered noise modulated at ULF freq
        const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const lpf = ctx.createBiquadFilter(); lpf.type = "lowpass"; lpf.frequency.value = 80;
        const lfo = ctx.createOscillator(); lfo.frequency.value = layer.freq;
        const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.4;
        lfo.connect(lfoGain); lfoGain.connect(gain.gain);
        src.connect(lpf); lpf.connect(gain); gain.connect(dest); lfo.start(); src.start();
        nodesRef.current[layer.id] = { src, osc: lfo, gain };

      } else if (layer.id === "gci_pulse") {
        // Rhythmic pulse via LFO on a sine tone
        const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = 40; osc.start();
        const pulseGain = ctx.createGain(); pulseGain.gain.value = 0;
        const lfo = ctx.createOscillator(); lfo.type = "square"; lfo.frequency.value = layer.rate; lfo.start();
        const lfoScale = ctx.createGain(); lfoScale.gain.value = layer.volume / 100 * 0.3;
        lfo.connect(lfoScale); lfoScale.connect(pulseGain.gain);
        osc.connect(pulseGain); pulseGain.connect(dest);
        nodesRef.current[layer.id] = { osc, osc2: lfo, gain: pulseGain };

      } else if (layer.id === "cosmic_pad") {
        // Two detuned oscillators with slow vibrato
        const o1 = ctx.createOscillator(); o1.type = "triangle"; o1.frequency.value = layer.freq; o1.start();
        const o2 = ctx.createOscillator(); o2.type = "triangle"; o2.frequency.value = layer.freq * 1.5; o2.start();
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.1;
        const lfoG = ctx.createGain(); lfoG.gain.value = 3;
        lfo.connect(lfoG); lfoG.connect(o1.frequency); lfo.start();
        o1.connect(gain); o2.connect(gain);
        nodesRef.current[layer.id] = { osc: o1, osc2: o2, gain };

      } else if (layer.id === "static_rain") {
        // Bandpass-filtered white noise
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const bpf = ctx.createBiquadFilter(); bpf.type = "bandpass"; bpf.frequency.value = 800; bpf.Q.value = 0.5;
        src.connect(bpf); bpf.connect(gain); src.start();
        nodesRef.current[layer.id] = { src, gain };
      }
    });
  }, []);

  const stopEngine = useCallback(() => {
    Object.values(nodesRef.current).forEach(n => {
      try { n.osc?.stop(); n.osc2?.stop(); n.src?.stop(); } catch {}
    });
    nodesRef.current = {};
    if (ctxRef.current) { try { ctxRef.current.close(); } catch {} ctxRef.current = null; }
    destRef.current = null;
  }, []);

  const startEngine = useCallback((currentLayers) => {
    stopEngine();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = ctx.createMediaStreamDestination();
    ctxRef.current = ctx;
    destRef.current = dest;
    buildNodes(ctx, dest, currentLayers);
  }, [buildNodes, stopEngine]);

  const handlePlay = () => {
    if (playing) {
      stopEngine();
      setPlaying(false);
    } else {
      startEngine(layers);
      setPlaying(true);
    }
  };

  // Rebuild audio nodes when layers change (only if playing)
  const handleLayerChange = (updated) => {
    const newLayers = layers.map(l => l.id === updated.id ? updated : l);
    setLayers(newLayers);
    if (playing && ctxRef.current && destRef.current) {
      buildNodes(ctxRef.current, destRef.current, newLayers);
    }
  };

  useEffect(() => () => stopEngine(), [stopEngine]);

  // ── Recording ────────────────────────────────────────────────────────────
  const startRecording = () => {
    if (!destRef.current) return;
    chunksRef.current = [];
    const rec = new MediaRecorder(destRef.current.stream, { mimeType: "audio/webm" });
    rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.start(100);
    recorderRef.current = rec;
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
    setShowSave(true);
  };

  const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Save + Share ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!chunksRef.current.length) return;
    setSaving(true);
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const file = new File([blob], "soundscape.webm", { type: "audio/webm" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const record = await base44.entities.FieldSoundscape.create({
      title:            saveForm.title || "Untitled Soundscape",
      description:      saveForm.description,
      audio_url:        file_url,
      duration_seconds: elapsed,
      layers_config:    Object.fromEntries(layers.map(l => [l.id, { active: l.active, volume: l.volume, freq: l.freq, rate: l.rate }])),
      live_data_snapshot: liveData,
      mood_tag:         saveForm.mood,
      frequency_channel: saveForm.channel,
      is_public:        saveForm.isPublic,
      atomic_id:        participant?.atomic_consciousness_number,
    });

    setSaved(record);
    setSaving(false);
    setShowSave(false);
    chunksRef.current = [];
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Wind className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-3xl">Atmospheric Composer</h1>
        </div>
        <p className="font-body text-sm text-muted-foreground">
          Blend live SR, ULF & GCI data with synthetic layers · Record your Field Soundscape · Share to the Collective
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left: Layer mixer */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-3">

          {/* Live data strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "SR Mode",   value: `M${liveData.sr_mode} · ${liveData.sr_hz} Hz`, color: "#34d399" },
              { label: "ULF Power", value: `${liveData.ulf_power} µT`,                    color: "#a78bfa" },
              { label: "GCI Index", value: `${(liveData.gci_index * 100).toFixed(0)}%`,   color: "#fbbf24" },
            ].map(s => (
              <div key={s.label} className="bg-card/30 border border-border/20 rounded-xl px-3 py-2 text-center">
                <div className="text-xs font-body" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[9px] font-body text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Layers */}
          {layers.map(layer => (
            <LayerStrip key={layer.id} layer={layer} onChange={handleLayerChange} />
          ))}
        </motion.div>

        {/* Right: Transport + save */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="flex flex-col gap-4">

          {/* Transport */}
          <div className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="font-heading text-base">Transport</h3>

            {/* Play/Stop */}
            <button onClick={handlePlay}
              className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-sm font-body font-medium transition-all ${
                playing ? "bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive/30"
                        : "bg-primary text-primary-foreground hover:opacity-90"
              }`}>
              {playing ? <><Square className="w-4 h-4" /> Stop Engine</> : <><Play className="w-4 h-4" /> Start Engine</>}
            </button>

            {/* Record */}
            {playing && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={recording ? stopRecording : startRecording}
                  className={`w-full py-2.5 rounded-full flex items-center justify-center gap-2 text-sm font-body border transition-all ${
                    recording ? "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30 animate-pulse"
                              : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70"
                  }`}>
                  <Circle className={`w-4 h-4 ${recording ? "fill-red-400" : ""}`} />
                  {recording ? `Recording ${fmtTime(elapsed)}` : "Start Recording"}
                </button>
              </motion.div>
            )}

            {/* Elapsed after stop */}
            {!playing && !recording && elapsed > 0 && !showSave && !saved && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => setShowSave(true)}
                className="w-full py-2.5 rounded-full flex items-center justify-center gap-2 text-sm font-body border border-primary/40 text-primary hover:bg-primary/10 transition-all">
                <Upload className="w-4 h-4" /> Save Recording ({fmtTime(elapsed)})
              </motion.button>
            )}
          </div>

          {/* Visualizer — animated bars */}
          <div className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-4">
            <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-3">Field Visualizer</div>
            <div className="flex items-end justify-center gap-0.5 h-14">
              {Array.from({ length: 28 }).map((_, i) => (
                <motion.div key={i}
                  className="flex-1 rounded-t-sm bg-primary/60"
                  animate={playing ? {
                    height: [`${8 + Math.random() * 50}%`, `${8 + Math.random() * 50}%`],
                  } : { height: "6%" }}
                  transition={{ duration: 0.4 + (i % 5) * 0.1, repeat: Infinity, repeatType: "mirror", delay: i * 0.03 }}
                />
              ))}
            </div>
          </div>

          {/* Saved success */}
          {saved && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-start gap-3">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-body text-green-400 font-medium">Soundscape shared to Collective</div>
                <div className="text-[10px] font-body text-muted-foreground mt-0.5">"{saved.title}"</div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Save Modal */}
      <AnimatePresence>
        {showSave && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="bg-card border border-border/40 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-primary" />
                  <h3 className="font-heading text-lg">Save Soundscape</h3>
                </div>
                <button onClick={() => setShowSave(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-body text-muted-foreground uppercase tracking-wide block mb-1">Title</label>
                  <input value={saveForm.title} onChange={e => setSaveForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="My Field Soundscape…"
                    className="w-full bg-secondary/30 border border-border/40 rounded-xl px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40" />
                </div>
                <div>
                  <label className="text-[10px] font-body text-muted-foreground uppercase tracking-wide block mb-1">Intention (optional)</label>
                  <textarea value={saveForm.description} onChange={e => setSaveForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What was the field like? What were you holding?"
                    rows={2}
                    className="w-full bg-secondary/30 border border-border/40 rounded-xl px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-body text-muted-foreground uppercase tracking-wide block mb-1">Mood</label>
                    <select value={saveForm.mood} onChange={e => setSaveForm(f => ({ ...f, mood: e.target.value }))}
                      className="w-full bg-secondary/30 border border-border/40 rounded-xl px-3 py-2 text-xs font-body text-foreground outline-none capitalize">
                      {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-body text-muted-foreground uppercase tracking-wide block mb-1">Channel</label>
                    <select value={saveForm.channel} onChange={e => setSaveForm(f => ({ ...f, channel: e.target.value }))}
                      className="w-full bg-secondary/30 border border-border/40 rounded-xl px-3 py-2 text-xs font-body text-foreground outline-none capitalize">
                      {FREQ_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={saveForm.isPublic} onChange={e => setSaveForm(f => ({ ...f, isPublic: e.target.checked }))}
                    className="rounded accent-primary" />
                  <span className="text-xs font-body text-foreground/70">Share to Collective Feed</span>
                </label>
              </div>

              <button onClick={handleSave} disabled={saving}
                className="mt-5 w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-body font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Share2 className="w-4 h-4" /> Save & Share</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}