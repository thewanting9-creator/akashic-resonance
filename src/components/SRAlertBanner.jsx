import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, Bell, BellOff } from "lucide-react";

const SR_MODES = [7.83, 14.3, 20.8, 27.3, 33.8, 39.0, 45.0, 51.0];

function simulateSR() {
  const h = new Date().getUTCHours();
  const m = new Date().getUTCMinutes();
  const base = 0.5 + 0.5 * Math.sin((h - 6) * Math.PI / 12);
  // Occasional surge events (spike every ~17 min)
  const surgeCycle = Math.sin((h * 60 + m) * (Math.PI / 17));
  const surgeSpike = surgeCycle > 0.92 ? (surgeCycle - 0.92) * 12 : 0;
  const mode = Math.max(1, Math.min(8, Math.round(1 + base * 6 + surgeSpike * 2)));
  const hz   = +(SR_MODES[mode - 1] + surgeSpike * 4 + (Math.random() - 0.5) * 0.4).toFixed(2);
  const power = Math.round(45 + base * 35 + surgeSpike * 40 + Math.random() * 8);
  return { mode, hz, power, isSurge: hz > 30 || power > 110 };
}

// Shared SR state — exported so SynesthesiaEngine can subscribe
export const srEventBus = {
  _listeners: [],
  _last: null,
  subscribe(fn) { this._listeners.push(fn); return () => { this._listeners = this._listeners.filter(l => l !== fn); }; },
  emit(data)    { this._last = data; this._listeners.forEach(fn => fn(data)); },
  getLast()     { return this._last; },
};

export default function SRAlertBanner() {
  const [alert,   setAlert]   = useState(null);   // { hz, power, mode }
  const [muted,   setMuted]   = useState(false);
  const [history, setHistory] = useState([]);
  const audioRef = useRef(null);
  const lastSurge = useRef(0);

  useEffect(() => {
    const tick = () => {
      const sr = simulateSR();
      srEventBus.emit(sr);
      if (sr.isSurge && !muted && Date.now() - lastSurge.current > 90_000) {
        lastSurge.current = Date.now();
        setAlert(sr);
        setHistory(h => [{ ...sr, ts: new Date().toLocaleTimeString() }, ...h].slice(0, 8));
        // Play subtle chime
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator(); const g = ctx.createGain();
          osc.type = "sine"; osc.frequency.value = 396;
          g.gain.setValueAtTime(0.15, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(); osc.stop(ctx.currentTime + 1.6);
        } catch {}
      }
    };
    tick();
    const id = setInterval(tick, 12_000);
    return () => clearInterval(id);
  }, [muted]);

  return (
    <>
      {/* Mute toggle — always visible in corner */}
      <button
        onClick={() => setMuted(m => !m)}
        title={muted ? "SR alerts muted" : "SR alerts active"}
        className="fixed bottom-5 right-5 z-40 p-2 rounded-full bg-card/60 backdrop-blur-md border border-border/30 text-muted-foreground hover:text-foreground transition-colors shadow-lg"
      >
        {muted ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
      </button>

      {/* Alert banner */}
      <AnimatePresence>
        {alert && !muted && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg"
          >
            <div className="relative bg-card/80 backdrop-blur-xl border border-amber-500/40 rounded-2xl px-5 py-3.5 shadow-2xl overflow-hidden">
              {/* Animated glow bg */}
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.15) 0%, transparent 70%)" }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-body font-semibold text-amber-300">SR Peak Event Detected</span>
                    <span className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {alert.hz} Hz
                    </span>
                  </div>
                  <p className="text-[10px] font-body text-muted-foreground">
                    Mode M{alert.mode} · Power {alert.power} pT — high-energy global field event in progress
                  </p>
                </div>
                <button onClick={() => setAlert(null)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}