import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Download, Loader2, X, BookOpen } from "lucide-react";
import PersonalCalendar from "../components/resonance/PersonalCalendar";
import FrequencyTrends from "../components/resonance/FrequencyTrends";

const FREQ_COLORS = {
  unity:"#c4a35a", creation:"#a78bfa", transformation:"#f472b6",
  healing:"#34d399", awakening:"#60a5fa", remembrance:"#fb923c",
  vision:"#e879f9", connection:"#2dd4bf",
};
const EMOTION_ICONS = {
  love:"♥", wonder:"✦", peace:"◎", joy:"☀", gratitude:"✿",
  clarity:"◈", longing:"☽", awe:"✸", compassion:"❋", transcendence:"∞"
};

function buildSymbolicReport(records, user) {
  const freqCounts = {};
  const emotionCounts = {};
  let totalEchoes = 0;
  for (const r of records) {
    freqCounts[r.frequency]    = (freqCounts[r.frequency] || 0) + 1;
    emotionCounts[r.emotion]   = (emotionCounts[r.emotion] || 0) + 1;
    totalEchoes += r.echoes || 0;
  }
  const topFreq    = Object.entries(freqCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || "—";
  const topEmotion = Object.entries(emotionCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || "—";

  const lines = [
    `╔══════════════════════════════════════════╗`,
    `║        PERSONAL RESONANCE REPORT         ║`,
    `╚══════════════════════════════════════════╝`,
    ``,
    `Generated: ${new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}`,
    ``,
    `▸ Total Inscriptions  : ${records.length}`,
    `▸ Total Echoes        : ${totalEchoes}`,
    `▸ Dominant Frequency  : ${topFreq.toUpperCase()}`,
    `▸ Primary Emotion     : ${topEmotion.toUpperCase()}`,
    ``,
    `── FREQUENCY DISTRIBUTION ──────────────────`,
    ...Object.entries(freqCounts).sort((a,b)=>b[1]-a[1]).map(([f,c]) => {
      const bar = "█".repeat(Math.round((c / records.length) * 20));
      return `  ${f.padEnd(16)} ${bar} ${c}`;
    }),
    ``,
    `── EMOTION DISTRIBUTION ────────────────────`,
    ...Object.entries(emotionCounts).sort((a,b)=>b[1]-a[1]).map(([e,c]) => {
      const icon = EMOTION_ICONS[e] || "·";
      return `  ${icon} ${e.padEnd(14)} ${c}`;
    }),
    ``,
    `── RECENT INSCRIPTIONS ─────────────────────`,
    ...records.slice(0, 5).map((r, i) => [
      `  [${i+1}] "${r.thought}"`,
      `       ${r.frequency} · ${r.emotion}${r.intention ? ` · "${r.intention}"` : ""}`,
      ``
    ]).flat(),
    `════════════════════════════════════════════`,
  ];
  return lines.join("\n");
}

export default function MyResonance() {
  const [records, setRecords]         = useState([]);
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [dayRecords, setDayRecords]   = useState(null);
  const [exporting, setExporting]     = useState(false);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const recs = await base44.entities.ResonanceRecord.filter({ created_by: me.email }, "-created_date", 500);
      setRecords(recs);
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const freqCounts = {};
    let totalEchoes = 0;
    for (const r of records) {
      freqCounts[r.frequency] = (freqCounts[r.frequency] || 0) + 1;
      totalEchoes += r.echoes || 0;
    }
    const topFreq = Object.entries(freqCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || null;
    return { freqCounts, totalEchoes, topFreq, uniqueFreqs: Object.keys(freqCounts).length };
  }, [records]);

  const handleExport = () => {
    setExporting(true);
    const report = buildSymbolicReport(records, user);
    const blob = new Blob([report], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "resonance-report.txt"; a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="font-heading text-3xl">My Resonance</h1>
            </div>
            <p className="font-body text-sm text-muted-foreground">
              Personal field of {user?.full_name || user?.email} · {records.length} inscriptions
            </p>
          </div>
          {records.length > 0 && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 text-sm font-body hover:bg-secondary/40 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Generating…" : "Export Symbolic Report"}
            </button>
          )}
        </div>
      </motion.div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="font-heading text-lg text-muted-foreground">Your field is empty</p>
          <p className="text-sm font-body text-muted-foreground/60 mt-1">Inscribe your first resonance record to begin</p>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Inscriptions", value: records.length },
              { label: "Total Echoes", value: stats.totalEchoes },
              { label: "Frequencies", value: stats.uniqueFreqs },
              { label: "Dominant", value: stats.topFreq || "—", color: FREQ_COLORS[stats.topFreq] },
            ].map(s => (
              <div key={s.label} className="bg-card/30 backdrop-blur-md border border-border/30 rounded-xl px-4 py-3 text-center">
                <div className="font-heading text-2xl" style={s.color ? { color: s.color } : {}}>{s.value}</div>
                <div className="text-[10px] font-body text-muted-foreground capitalize mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Calendar + Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <PersonalCalendar records={records} onSelectDay={setDayRecords} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <FrequencyTrends records={records} />
            </motion.div>
          </div>

          {/* Day detail drawer */}
          <AnimatePresence>
            {dayRecords && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="mb-6 bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading text-base">{dayRecords.length} inscriptions this day</h3>
                  <button onClick={() => setDayRecords(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dayRecords.map(r => (
                    <div key={r.id} className="px-3 py-2.5 rounded-xl bg-secondary/20 border border-border/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-body capitalize" style={{ color: FREQ_COLORS[r.frequency] || "#aaa" }}>{r.frequency}</span>
                        <span className="text-[10px] text-muted-foreground font-body capitalize">{r.emotion}</span>
                      </div>
                      <p className="text-sm font-body text-foreground/80 line-clamp-2">"{r.thought}"</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent records list */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5">
            <h3 className="font-heading text-base mb-3">All Inscriptions</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {records.map(r => (
                <div key={r.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-secondary/20 border border-border/20">
                  <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ background: FREQ_COLORS[r.frequency] || "#888" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-foreground/80 line-clamp-2">"{r.thought}"</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-body capitalize" style={{ color: FREQ_COLORS[r.frequency] || "#aaa" }}>{r.frequency}</span>
                      <span className="text-[10px] text-muted-foreground font-body capitalize">{r.emotion}</span>
                      {r.depth && <span className="text-[10px] text-muted-foreground/60 font-body">depth {r.depth}</span>}
                      {r.echoes > 0 && <span className="text-[10px] text-primary font-body">{r.echoes} echoes</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}