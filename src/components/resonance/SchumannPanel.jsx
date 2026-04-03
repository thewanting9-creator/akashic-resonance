import { useState } from "react";
import { motion } from "framer-motion";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from "recharts";
import { Info, X } from "lucide-react";
import { SCHUMANN_DATA, freqLabelToSchumann } from "../../lib/schumannData";

const MODE_COLORS = [
  "#34d399","#60a5fa","#a78bfa","#f472b6",
  "#fb923c","#e879f9","#2dd4bf","#fbbf24"
];

const chartData = SCHUMANN_DATA.schumann_resonances.map((s, i) => ({
  name: `M${s.mode}`,
  freq: s.frequency_hz,
  brainwave: s.brainwave_overlap,
  state: s.mental_state,
  color: MODE_COLORS[i],
}));

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-card/95 border border-border/40 rounded-xl px-3 py-2 text-xs font-body shadow-xl max-w-[180px]">
      <div className="font-medium text-foreground/90 mb-1">{d?.freq} Hz</div>
      <div className="text-muted-foreground capitalize mb-0.5">{d?.brainwave}</div>
      <div className="text-muted-foreground/70 italic">{d?.state}</div>
    </div>
  );
};

export default function SchumannPanel({ dominantFreq = null, depth = null, collective = false }) {
  const [infoOpen, setInfoOpen] = useState(false);

  // Alignment callout
  const aligned = dominantFreq ? freqLabelToSchumann(dominantFreq) : null;
  const depthMode = depth ? SCHUMANN_DATA.schumann_resonances[Math.max(0, Math.min(7, Math.round(depth) - 1))] : null;

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="font-heading text-base">Earth's Schumann Resonances</h3>
          <p className="text-[10px] font-body text-muted-foreground mt-0.5">
            {collective ? "Collective field alignment with Earth's electromagnetic heartbeat" : "Your personal resonance aligned to Earth's heartbeat"}
          </p>
        </div>
        <button onClick={() => setInfoOpen(o => !o)} className="text-muted-foreground hover:text-foreground ml-2">
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Info bubble */}
      {infoOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3 rounded-xl bg-secondary/40 border border-border/20 text-xs font-body text-muted-foreground leading-relaxed relative"
        >
          <button onClick={() => setInfoOpen(false)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
          {SCHUMANN_DATA.summary_for_info_bubble}
          <div className="mt-1.5 text-muted-foreground/50 italic">{SCHUMANN_DATA.source_note}</div>
        </motion.div>
      )}

      {/* Alignment callout */}
      {aligned && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-4 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-body text-foreground/80">
              <span className="capitalize text-primary">{dominantFreq}</span> resonance aligns with Schumann Mode {aligned.mode} — <span className="italic">{aligned.brainwave_overlap}</span>
            </div>
            <div className="text-[10px] font-body text-muted-foreground mt-0.5">{aligned.mental_state} · {aligned.frequency_hz} Hz</div>
          </div>
        </motion.div>
      )}

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={60} stroke="#f43f5e" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "60 Hz", position: "right", fontSize: 9, fill: "#f43f5e" }} />
          <Bar dataKey="freq" radius={[3, 3, 0, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.color} fillOpacity={0.8} />
            ))}
          </Bar>
          {/* Highlight aligned mode */}
          {aligned && (
            <ReferenceLine x={`M${aligned.mode}`} stroke="hsl(var(--primary))" strokeOpacity={0.4} strokeWidth={2} />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Mode table (compact) */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[10px] font-body">
          <thead>
            <tr className="text-muted-foreground/50">
              <th className="text-left pb-1 pr-3">Mode</th>
              <th className="text-left pb-1 pr-3">Hz</th>
              <th className="text-left pb-1 pr-3">Brainwave</th>
              <th className="text-left pb-1">State</th>
            </tr>
          </thead>
          <tbody>
            {SCHUMANN_DATA.schumann_resonances.map((s, i) => {
              const isAligned = aligned?.mode === s.mode;
              return (
                <tr key={s.mode} className={`border-t border-border/10 ${isAligned ? "bg-primary/5" : ""}`}>
                  <td className="py-1 pr-3" style={{ color: MODE_COLORS[i] }}>{s.mode}</td>
                  <td className="py-1 pr-3 text-foreground/70">{s.frequency_hz}</td>
                  <td className="py-1 pr-3 text-muted-foreground">{s.brainwave_overlap}</td>
                  <td className="py-1 text-muted-foreground/70 truncate max-w-[120px]">{s.mental_state.split(",")[0]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-[9px] font-body text-muted-foreground/40 text-right">
        {SCHUMANN_DATA.source_note}
      </div>
    </div>
  );
}