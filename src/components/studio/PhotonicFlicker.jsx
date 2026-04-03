import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertTriangle, Zap } from "lucide-react";

const PHOTIC_PRESETS = [
  { hz: 7.83,  label: "SR Fundamental",  color: "#34d399", effect: "Deep relaxation · theta-alpha crossover" },
  { hz: 32,    label: "Gamma Entry",     color: "#60a5fa", effect: "Wide gamma entrainment · gentle for beginners" },
  { hz: 34,    label: "Optimal Gamma",   color: "#a78bfa", effect: "Best balance of power & comfort" },
  { hz: 40,    label: "Classic Gamma",   color: "#f472b6", effect: "40 Hz target · focus & insight · Alzheimer's research" },
  { hz: 62.64, label: "High Gamma",      color: "#fbbf24", effect: "Experimental · near SR 8th harmonic" },
];

export default function PhotonicFlicker({ srHz = 7.83 }) {
  const [active,      setActive]      = useState(false);
  const [selectedHz,  setSelectedHz]  = useState(40);
  const [brightness,  setBrightness]  = useState(60);
  const [syncToSR,    setSyncToSR]    = useState(false);
  const [safetyAck,   setSafetyAck]   = useState(false);
  const [flickerOn,   setFlickerOn]   = useState(false);
  const frameRef = useRef(null);
  const lastRef  = useRef(0);

  const hz = syncToSR ? Math.min(srHz, 62.64) : selectedHz;
  const periodMs = 1000 / hz;

  useEffect(() => {
    if (!active) { setFlickerOn(false); cancelAnimationFrame(frameRef.current); return; }
    let state = false;
    const tick = (ts) => {
      if (ts - lastRef.current >= periodMs / 2) {
        state = !state;
        setFlickerOn(state);
        lastRef.current = ts;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [active, periodMs]);

  const activePreset = PHOTIC_PRESETS.find(p => Math.abs(p.hz - selectedHz) < 0.5);

  return (
    <div className="space-y-5">
      {/* Safety notice */}
      {!safetyAck && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-body text-amber-300 font-medium mb-1">Safety Notice — Read Before Use</div>
              <p className="text-[10px] font-body text-amber-400/70 leading-relaxed">
                Photic gamma flicker uses visible screen pulsing. <strong className="text-amber-300">Do not use if you have photosensitive epilepsy or a history of seizures.</strong> Start with low brightness and short durations. Stop immediately if you experience discomfort, headache, or visual disturbance.
              </p>
            </div>
          </div>
          <button onClick={() => setSafetyAck(true)}
            className="w-full py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-body hover:bg-amber-500/30 transition-colors">
            I understand — continue
          </button>
        </div>
      )}

      {safetyAck && (
        <>
          {/* Frequency presets */}
          <div>
            <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-2">Frequency Presets</div>
            <div className="space-y-1.5">
              {PHOTIC_PRESETS.map(p => (
                <button key={p.hz} onClick={() => { setSelectedHz(p.hz); setSyncToSR(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between ${
                    !syncToSR && Math.abs(selectedHz - p.hz) < 0.5
                      ? "bg-secondary/50 border-primary/30"
                      : "bg-card/20 border-border/20 hover:bg-card/40"
                  }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-body font-medium text-foreground/80">{p.label}</span>
                      <span className="text-[10px] font-body" style={{ color: p.color }}>{p.hz} Hz</span>
                    </div>
                    <div className="text-[9px] font-body text-muted-foreground/60 mt-0.5">{p.effect}</div>
                  </div>
                </button>
              ))}

              {/* SR Sync option */}
              <button onClick={() => setSyncToSR(s => !s)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between ${
                  syncToSR ? "bg-primary/10 border-primary/30" : "bg-card/20 border-border/20 hover:bg-card/40"
                }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-xs font-body font-medium text-foreground/80">Sync to Live SR</span>
                    <span className="text-[10px] font-body text-primary">{srHz} Hz</span>
                  </div>
                  <div className="text-[9px] font-body text-muted-foreground/60 mt-0.5">Auto-tracks current Schumann Resonance estimate</div>
                </div>
              </button>
            </div>
          </div>

          {/* Brightness */}
          <div>
            <div className="flex justify-between text-[10px] font-body mb-1.5">
              <span className="text-muted-foreground uppercase tracking-wide">Brightness</span>
              <span className="text-foreground/70">{brightness}%</span>
            </div>
            <input type="range" min={20} max={85} step={5} value={brightness}
              onChange={e => setBrightness(parseInt(e.target.value))}
              className="w-full h-1.5 rounded-full accent-primary cursor-pointer" />
            <div className="text-[9px] font-body text-muted-foreground/50 mt-0.5">Max 85% — start low, increase gradually</div>
          </div>

          {/* Active display */}
          <div className="text-center py-2">
            <div className="font-heading text-4xl text-foreground/90">{hz.toFixed(2)} <span className="text-xl text-muted-foreground">Hz</span></div>
            {activePreset && <div className="text-xs font-body mt-0.5" style={{ color: activePreset.color }}>{activePreset.effect}</div>}
          </div>

          {/* Flicker canvas */}
          <div className="relative rounded-2xl overflow-hidden border border-border/30"
            style={{ height: 120, background: "#000" }}>
            <motion.div className="absolute inset-0"
              animate={{ opacity: active ? (flickerOn ? brightness / 100 : 0) : 0 }}
              transition={{ duration: 0 }}
              style={{ background: `radial-gradient(ellipse, hsl(45 60% 70% / 0.9) 0%, hsl(45 60% 50% / 0.6) 40%, transparent 80%)` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {active ? (
                <span className="text-xs font-body text-white/50">{hz.toFixed(2)} Hz flicker active</span>
              ) : (
                <span className="text-xs font-body text-white/20">Flicker preview — press Play to activate</span>
              )}
            </div>
          </div>

          {/* Play button */}
          <button onClick={() => setActive(a => !a)}
            className={`w-full py-3 rounded-full flex items-center justify-center gap-2 text-sm font-body transition-all ${
              active
                ? "bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive/30"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}>
            {active ? <><EyeOff className="w-4 h-4" /> Stop Flicker</> : <><Eye className="w-4 h-4" /> Start Photic Session</>}
          </button>

          <div className="text-[9px] font-body text-muted-foreground/40 text-center leading-relaxed">
            Best combined with binaural audio for multi-sensory entrainment. Use in low ambient light.
          </div>
        </>
      )}
    </div>
  );
}