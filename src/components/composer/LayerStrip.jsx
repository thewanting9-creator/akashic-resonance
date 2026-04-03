import { motion } from "framer-motion";

export default function LayerStrip({ layer, onChange }) {
  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 ${
      layer.active ? "bg-card/50 border-border/50" : "bg-card/20 border-border/20 opacity-60"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {/* Toggle */}
          <button
            onClick={() => onChange({ ...layer, active: !layer.active })}
            className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${layer.active ? "bg-primary" : "bg-border/50"}`}
          >
            <motion.div
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow"
              animate={{ x: layer.active ? 16 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <div>
            <div className="text-xs font-body font-medium text-foreground/90">{layer.label}</div>
            <div className="text-[9px] font-body text-muted-foreground">{layer.sublabel}</div>
          </div>
        </div>
        {/* Live badge */}
        {layer.liveSync && layer.active && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] font-body text-green-400">Live</span>
          </div>
        )}
      </div>

      {layer.active && (
        <div className="space-y-2">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-body text-muted-foreground w-12">Volume</span>
            <input type="range" min={0} max={100} value={layer.volume}
              onChange={e => onChange({ ...layer, volume: Number(e.target.value) })}
              className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-primary"
            />
            <span className="text-[9px] font-body text-muted-foreground w-6 text-right">{layer.volume}</span>
          </div>

          {/* Frequency (if applicable) */}
          {layer.freqControl && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-body text-muted-foreground w-12">Freq</span>
              <input type="range" min={layer.freqControl.min} max={layer.freqControl.max}
                step={layer.freqControl.step || 0.01}
                value={layer.freq}
                onChange={e => onChange({ ...layer, freq: Number(e.target.value) })}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[9px] font-body text-muted-foreground w-10 text-right">{layer.freq} Hz</span>
            </div>
          )}

          {/* Rate (if applicable) */}
          {layer.rateControl && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-body text-muted-foreground w-12">Rate</span>
              <input type="range" min={layer.rateControl.min} max={layer.rateControl.max}
                step={layer.rateControl.step || 0.1}
                value={layer.rate}
                onChange={e => onChange({ ...layer, rate: Number(e.target.value) })}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[9px] font-body text-muted-foreground w-10 text-right">{layer.rate}/s</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}