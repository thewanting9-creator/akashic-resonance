import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, X, Loader2, Layers } from "lucide-react";
import ResonanceGlobe from "../components/dashboard/ResonanceGlobe";

const FREQUENCY_COLORS = {
  unity: "#c4a35a", creation: "#a78bfa", transformation: "#f472b6",
  healing: "#34d399", awakening: "#60a5fa", remembrance: "#fb923c",
  vision: "#e879f9", connection: "#2dd4bf",
};

export default function ResonanceField() {
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [filterFreq, setFilterFreq] = useState(null);

  useEffect(() => {
    base44.entities.ResonanceRecord.list("-created_date", 300).then(data => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () => filterFreq ? records.filter(r => r.frequency === filterFreq) : records,
    [records, filterFreq]
  );

  // Local motifs near selected point: same frequency, same emotion
  const localMotifs = useMemo(() => {
    if (!selected) return [];
    return records.filter(
      r => r.id !== selected.id &&
        (r.frequency === selected.frequency || r.emotion === selected.emotion)
    ).slice(0, 8);
  }, [selected, records]);

  // Density by frequency
  const densityByFreq = useMemo(() => {
    const counts = {};
    for (const r of records) counts[r.frequency] = (counts[r.frequency] || 0) + 1;
    const max = Math.max(...Object.values(counts), 1);
    return Object.entries(counts).map(([freq, count]) => ({ freq, count, pct: count / max }));
  }, [records]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5 mb-1">
          <Globe className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-3xl">Resonance Field</h1>
        </div>
        <p className="font-body text-sm text-muted-foreground">
          {filtered.length} resonance points mapped · drag to rotate · scroll to zoom · click to explore
        </p>

        {/* Frequency filters */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => setFilterFreq(null)}
            className={`px-3 py-1 rounded-full text-xs font-body border transition-all ${
              !filterFreq ? "bg-primary text-primary-foreground border-primary" : "border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {Object.keys(FREQUENCY_COLORS).map(freq => (
            <button
              key={freq}
              onClick={() => setFilterFreq(f => f === freq ? null : freq)}
              className={`px-3 py-1 rounded-full text-xs font-body border capitalize transition-all ${
                filterFreq === freq ? "text-primary-foreground border-transparent" : "border-border/40 text-muted-foreground hover:text-foreground"
              }`}
              style={filterFreq === freq ? { background: FREQUENCY_COLORS[freq] + "cc", borderColor: FREQUENCY_COLORS[freq] } : {}}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Globe */}
        <div className="lg:col-span-2 bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden" style={{ minHeight: 480 }}>
          <ResonanceGlobe records={filtered} onSelectCluster={setSelected} />
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-4">

          {/* Density distribution */}
          <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="font-heading text-base">Density Distribution</h3>
            </div>
            <div className="space-y-2">
              {densityByFreq.sort((a, b) => b.count - a.count).map(({ freq, count, pct }) => (
                <div key={freq}>
                  <div className="flex justify-between text-[11px] font-body mb-0.5">
                    <span className="capitalize text-foreground/70">{freq}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border/20 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: FREQUENCY_COLORS[freq] || "#888" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct * 100}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected point detail */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div
                      className="text-xs font-body capitalize font-medium mb-0.5"
                      style={{ color: FREQUENCY_COLORS[selected.frequency] || "#fff" }}
                    >
                      {selected.frequency} · {selected.emotion}
                    </div>
                    <p className="font-heading text-base text-foreground/90">"{selected.thought}"</p>
                    {selected.intention && (
                      <p className="text-xs font-body text-muted-foreground/70 italic mt-1">{selected.intention}</p>
                    )}
                    {selected.echoes > 0 && (
                      <div className="text-xs text-primary mt-1">{selected.echoes} echoes</div>
                    )}
                  </div>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground ml-2 mt-0.5">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Local motifs */}
                {localMotifs.length > 0 && (
                  <div>
                    <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-1.5">
                      Nearby resonance ({localMotifs.length})
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {localMotifs.map(r => (
                        <button
                          key={r.id}
                          onClick={() => setSelected(r)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="text-[10px] font-body capitalize text-muted-foreground mb-0.5">{r.frequency} · {r.emotion}</div>
                          <div className="text-xs font-body text-foreground/70 line-clamp-1">"{r.thought}"</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}