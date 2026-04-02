import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { GitCompare, Loader2, ChevronDown, X } from "lucide-react";
import ResonanceVenn from "../components/dashboard/ResonanceVenn";

const EMOTION_COLORS = {
  love:"#f472b6", wonder:"#a78bfa", peace:"#34d399", joy:"#fbbf24",
  gratitude:"#60a5fa", clarity:"#2dd4bf", longing:"#fb923c",
  awe:"#e879f9", compassion:"#f87171", transcendence:"#c4a35a"
};
const FREQ_COLORS = {
  unity:"#c4a35a", creation:"#a78bfa", transformation:"#f472b6",
  healing:"#34d399", awakening:"#60a5fa", remembrance:"#fb923c",
  vision:"#e879f9", connection:"#2dd4bf"
};

function RecordPicker({ records, selected, onSelect, side, color }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = records.filter(r =>
    !search ||
    r.thought?.toLowerCase().includes(search.toLowerCase()) ||
    r.frequency?.includes(search) ||
    r.emotion?.includes(search)
  );

  return (
    <div className="flex flex-col gap-3 h-full">
      <div
        className="text-xs font-body uppercase tracking-widest mb-1"
        style={{ color }}
      >
        Record {side}
      </div>

      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border/40 bg-card/30 text-sm font-body hover:bg-card/50 transition-colors"
      >
        {selected ? (
          <span className="text-foreground/80 truncate text-left mr-2">"{selected.thought?.slice(0, 50)}{selected.thought?.length > 50 ? "…" : ""}"</span>
        ) : (
          <span className="text-muted-foreground">Choose a record…</span>
        )}
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/40 bg-card/90 backdrop-blur-xl overflow-hidden z-20"
        >
          <div className="p-2 border-b border-border/20">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search thought, emotion, frequency…"
              className="w-full bg-transparent text-sm font-body outline-none text-foreground placeholder:text-muted-foreground px-2 py-1"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.slice(0, 50).map(r => (
              <button
                key={r.id}
                onClick={() => { onSelect(r); setOpen(false); setSearch(""); }}
                className="w-full text-left px-3 py-2.5 hover:bg-secondary/40 transition-colors border-b border-border/10 last:border-0"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] capitalize font-body px-1.5 py-0.5 rounded-full border" style={{ color: FREQ_COLORS[r.frequency] || "#888", borderColor: FREQ_COLORS[r.frequency] + "44" || "#888" }}>
                    {r.frequency}
                  </span>
                  <span className="text-[10px] capitalize text-muted-foreground font-body">{r.emotion}</span>
                </div>
                <div className="text-xs font-body text-foreground/70 line-clamp-1">"{r.thought}"</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-muted-foreground font-body text-center">No records found</div>
            )}
          </div>
        </motion.div>
      )}

      {/* Selected detail card */}
      {selected && (
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 rounded-xl border p-4 bg-card/30 relative"
          style={{ borderColor: color + "33" }}
        >
          <button
            onClick={() => onSelect(null)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <p className="font-heading text-base text-foreground/90 mb-3 pr-4">"{selected.thought}"</p>

          <div className="flex flex-wrap gap-2">
            {selected.emotion && (
              <span className="px-2 py-0.5 rounded-full text-xs font-body border capitalize"
                style={{ color: EMOTION_COLORS[selected.emotion] || "#aaa", borderColor: (EMOTION_COLORS[selected.emotion] || "#aaa") + "44" }}>
                {selected.emotion}
              </span>
            )}
            {selected.frequency && (
              <span className="px-2 py-0.5 rounded-full text-xs font-body border capitalize"
                style={{ color: FREQ_COLORS[selected.frequency] || "#aaa", borderColor: (FREQ_COLORS[selected.frequency] || "#aaa") + "44" }}>
                {selected.frequency}
              </span>
            )}
            {selected.depth && (
              <span className="px-2 py-0.5 rounded-full text-xs font-body border border-border/30 text-muted-foreground">
                depth {selected.depth}
              </span>
            )}
            {selected.echoes > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-body border border-primary/20 text-primary">
                {selected.echoes} echoes
              </span>
            )}
          </div>

          {selected.intention && (
            <p className="mt-2 text-xs font-body text-muted-foreground/70 italic">{selected.intention}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function ResonanceComparison() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordA, setRecordA] = useState(null);
  const [recordB, setRecordB] = useState(null);

  useEffect(() => {
    base44.entities.ResonanceRecord.list("-created_date", 300).then(data => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <GitCompare className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-3xl">Resonance Comparison</h1>
        </div>
        <p className="font-body text-sm text-muted-foreground">
          Select two records to surface emotional overlaps, shared frequencies, and divergence points.
        </p>
      </motion.div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Record A */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5 flex flex-col min-h-[360px]"
        >
          <RecordPicker
            records={records}
            selected={recordA}
            onSelect={setRecordA}
            side="A"
            color="#a78bfa"
          />
        </motion.div>

        {/* Venn centre */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="lg:col-span-1 bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5 flex items-center justify-center"
        >
          <ResonanceVenn recordA={recordA} recordB={recordB} />
        </motion.div>

        {/* Record B */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5 flex flex-col min-h-[360px]"
        >
          <RecordPicker
            records={records}
            selected={recordB}
            onSelect={setRecordB}
            side="B"
            color="#f472b6"
          />
        </motion.div>

      </div>

      {/* Divergence summary bar */}
      {recordA && recordB && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-4 bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5"
        >
          <h3 className="font-heading text-base text-foreground/80 mb-3">Divergence Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <Stat label="Emotion A" value={recordA.emotion} color={EMOTION_COLORS[recordA.emotion]} />
            <Stat label="Frequency A" value={recordA.frequency} color={FREQ_COLORS[recordA.frequency]} />
            <Stat label="Emotion B" value={recordB.emotion} color={EMOTION_COLORS[recordB.emotion]} />
            <Stat label="Frequency B" value={recordB.frequency} color={FREQ_COLORS[recordB.frequency]} />
          </div>
          {recordA.frequency === recordB.frequency && (
            <div className="mt-3 text-center text-xs font-body text-primary">
              ✦ Both records resonate on the same frequency — <span className="capitalize">{recordA.frequency}</span>
            </div>
          )}
          {recordA.emotion === recordB.emotion && (
            <div className="mt-1 text-center text-xs font-body text-primary">
              ✦ Shared emotional tone — <span className="capitalize">{recordA.emotion}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
      <div className="text-sm font-body capitalize" style={{ color: color || "#aaa" }}>{value || "—"}</div>
    </div>
  );
}