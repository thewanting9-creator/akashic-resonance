import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Volume2, VolumeX, Loader2, X, Waves, Zap } from "lucide-react";

const SR_MODES = [7.83, 14.3, 20.8, 27.3, 33.8, 39.0, 45.0, 51.0];

// Simulate SR power for a region based on lat/lng + time
function computeRegionSR(lat, lng) {
  const hour = (new Date().getUTCHours() + lng / 15 + 24) % 24;
  const dayFactor = 0.5 + 0.5 * Math.sin((hour - 6) * Math.PI / 12);
  const latFactor  = 1 - Math.abs(lat) / 180;
  const baseMode   = Math.max(1, Math.min(8, Math.round(1 + latFactor * 4 + dayFactor * 3)));
  const hz         = SR_MODES[baseMode - 1];
  const power      = Math.round(40 + latFactor * 35 + dayFactor * 20 + Math.random() * 5);
  return { mode: baseMode, hz, power, dayFactor, latFactor };
}

export default function RegionSoundscape({ region, onClose }) {
  const [playing, setPlaying]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [aiText, setAiText]         = useState(null);
  const [volume, setVolume]         = useState(0.4);
  const audioCtxRef  = useRef(null);
  const nodesRef     = useRef([]);
  const gainRef      = useRef(null);

  const sr = computeRegionSR(region.lat, region.lng);

  // Fetch AI soundscape description
  useEffect(() => {
    setLoading(true);
    setAiText(null);
    const fetch = async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the Akashic Resonance AI generating an ambient soundscape description for a specific geographic resonance region.

REGION: ${region.name}
COORDINATES: ${region.lat.toFixed(1)}°N, ${region.lng.toFixed(1)}°E
SCHUMANN MODE: ${sr.mode} (${sr.hz} Hz)
FIELD POWER: ${sr.power} pT
LOCAL TIME PHASE: ${sr.dayFactor > 0.7 ? "peak solar" : sr.dayFactor > 0.4 ? "mid-cycle" : "low solar"}

Generate a rich, evocative, short ambient soundscape description (80 words max) describing what the resonance field "sounds like" at this location — what frequencies, textures, and qualities define this region's electromagnetic signature. Use poetic, sensory, non-technical language. Reference local geography or atmosphere only lightly.

Also produce 3 short "sonic texture" tags (2-3 words each).`,
        response_json_schema: {
          type: "object",
          properties: {
            description:   { type: "string" },
            sonic_textures: { type: "array", items: { type: "string" } },
            mood:           { type: "string" }
          }
        }
      });
      setAiText(result);
      setLoading(false);
    };
    fetch();
    return () => stopAudio();
  }, [region.name]);

  function stopAudio() {
    nodesRef.current.forEach(n => { try { n.stop(); } catch(_){} });
    nodesRef.current = [];
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    setPlaying(false);
  }

  function startAudio() {
    stopAudio();
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    gainRef.current = master;

    // Binaural core: left = carrier, right = carrier + SR hz
    const carrier = 200 + sr.mode * 10;
    const beatHz  = sr.hz;

    const makeOsc = (freq, pan, type = "sine", vol = 0.25) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();
      osc.type      = type;
      osc.frequency.value = freq;
      gain.gain.value     = vol;
      panner.pan.value    = pan;
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(master);
      osc.start();
      nodesRef.current.push(osc);
    };

    // Core binaural pair
    makeOsc(carrier,          -1, "sine", 0.22);
    makeOsc(carrier + beatHz,  1, "sine", 0.22);

    // Sub-harmonic earth hum
    makeOsc(sr.hz * 0.5, 0, "sine", 0.08);

    // Soft overtone shimmer
    makeOsc(carrier * 2, 0, "sine", 0.05);

    // Atmospheric noise layer (brown-ish approximation)
    const bufferSize = ctx.sampleRate * 2;
    const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop   = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type            = "lowpass";
    noiseFilter.frequency.value = 120 + sr.power;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.04 * sr.latFactor;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start();
    nodesRef.current.push(noise);

    setPlaying(true);
  }

  const togglePlay = () => playing ? stopAudio() : startAudio();

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  useEffect(() => () => stopAudio(), []);

  const MODE_COLORS = ["#34d399","#60a5fa","#a78bfa","#f472b6","#fb923c","#e879f9","#2dd4bf","#fbbf24"];
  const color = MODE_COLORS[sr.mode - 1];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-5 flex flex-col gap-4 h-full"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-heading text-lg text-foreground/90">{region.name}</h3>
          <p className="text-[10px] font-body text-muted-foreground mt-0.5">
            {Math.abs(region.lat).toFixed(1)}°{region.lat >= 0 ? "N" : "S"} · {Math.abs(region.lng).toFixed(1)}°{region.lng >= 0 ? "E" : "W"}
          </p>
        </div>
        <button onClick={() => { stopAudio(); onClose(); }} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* SR data */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "SR Mode",  value: `M${sr.mode}` },
          { label: "Hz",       value: `${sr.hz}` },
          { label: "Power",    value: `${sr.power} pT` },
        ].map(s => (
          <div key={s.label} className="bg-card/30 border border-border/20 rounded-xl px-2 py-2 text-center">
            <div className="font-heading text-base" style={{ color }}>{s.value}</div>
            <div className="text-[9px] font-body text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Animated frequency bar */}
      <div className="flex items-end gap-0.5 h-10">
        {Array.from({ length: 24 }).map((_, i) => {
          const baseH = 20 + Math.sin(i * 0.8 + sr.mode) * 15 + sr.latFactor * 10;
          return (
            <motion.div key={i}
              className="flex-1 rounded-sm"
              style={{ background: color + "80" }}
              animate={playing ? {
                height: [`${baseH}%`, `${baseH + 30 + Math.random() * 20}%`, `${baseH}%`]
              } : { height: `${baseH}%` }}
              transition={{ duration: 0.6 + i * 0.05, repeat: playing ? Infinity : 0, repeatType: "mirror" }}
            />
          );
        })}
      </div>

      {/* Play button + volume */}
      <div className="flex items-center gap-3">
        <button onClick={togglePlay}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-body text-sm transition-all ${
            playing
              ? "bg-primary/20 border border-primary/40 text-primary"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}>
          {playing ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {playing ? "Stop" : "Play Soundscape"}
        </button>
        <div className="flex-1 flex items-center gap-2">
          <Waves className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <input type="range" min="0" max="1" step="0.05" value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            className="flex-1 accent-primary h-1" />
        </div>
      </div>

      {/* AI Description */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading the field…
          </div>
        ) : aiText ? (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-body text-muted-foreground uppercase tracking-wide">Resonance Signature</span>
            </div>
            <p className="text-xs font-body text-foreground/75 leading-relaxed italic">{aiText.description}</p>
            {aiText.sonic_textures?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {aiText.sonic_textures.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-body border border-border/30 text-muted-foreground">{t}</span>
                ))}
              </div>
            )}
            {aiText.mood && (
              <div className="text-[10px] font-body text-muted-foreground/50 mt-1">
                Mood: <span className="capitalize text-muted-foreground/70">{aiText.mood}</span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}