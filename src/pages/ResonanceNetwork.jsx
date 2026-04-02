import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Loader2, X, Users } from "lucide-react";
import ResonanceNetworkGraph from "../components/dashboard/ResonanceNetwork";

const FREQ_COLORS = {
  unity:"#c4a35a", creation:"#a78bfa", transformation:"#f472b6",
  healing:"#34d399", awakening:"#60a5fa", remembrance:"#fb923c",
  vision:"#e879f9", connection:"#2dd4bf",
};

export default function ResonanceNetwork() {
  const [participants, setParticipants] = useState([]);
  const [records, setRecords]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Participant.list("-created_date", 200),
      base44.entities.ResonanceRecord.list("-created_date", 500),
    ]).then(([parts, recs]) => {
      setParticipants(parts);
      setRecords(recs);
      setLoading(false);
    });
  }, []);

  const handleSelectNode = (node) => {
    setSelected(node);
    const recs = records.filter(r => r.created_by === node.id);
    setSelectedRecords(recs);
  };

  // Cluster stats: frequency → participant count
  const clusterStats = {};
  for (const r of records) {
    if (r.frequency && r.created_by) {
      if (!clusterStats[r.frequency]) clusterStats[r.frequency] = new Set();
      clusterStats[r.frequency].add(r.created_by);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5 mb-1">
          <Network className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-3xl">Resonance Network</h1>
        </div>
        <p className="font-body text-sm text-muted-foreground">
          {participants.length} participants · {records.length} records · drag to rotate · scroll to zoom · click a node to explore
        </p>
      </div>

      {/* Main layout */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 pb-10 grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ minHeight: 560 }}>

        {/* Graph */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="lg:col-span-3 bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden"
          style={{ minHeight: 500 }}
        >
          {participants.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground font-body text-sm">
              No participants found
            </div>
          ) : (
            <ResonanceNetworkGraph
              participants={participants}
              records={records}
              onSelectNode={handleSelectNode}
            />
          )}
        </motion.div>

        {/* Side panel */}
        <div className="flex flex-col gap-4">

          {/* Cluster overview */}
          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-heading text-base">Frequency Clusters</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(clusterStats)
                .sort((a, b) => b[1].size - a[1].size)
                .map(([freq, pids]) => (
                  <div key={freq}>
                    <div className="flex justify-between text-[11px] font-body mb-0.5">
                      <span className="capitalize" style={{ color: FREQ_COLORS[freq] || "#aaa" }}>{freq}</span>
                      <span className="text-muted-foreground">{pids.size} nodes</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border/20 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: FREQ_COLORS[freq] || "#888" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(pids.size / participants.length) * 100}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>

          {/* Selected node detail */}
          <AnimatePresence>
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-heading text-base text-foreground/90">{selected.label}</div>
                    {selected.dominant && (
                      <div className="text-xs font-body capitalize mt-0.5" style={{ color: FREQ_COLORS[selected.dominant] || "#aaa" }}>
                        {selected.dominant} · {selected.recordCount} records
                      </div>
                    )}
                  </div>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedRecords.length > 0 && (
                  <div>
                    <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-1.5">
                      Their Records
                    </div>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {selectedRecords.map(r => (
                        <div key={r.id} className="px-2.5 py-1.5 rounded-lg bg-secondary/30">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-body capitalize" style={{ color: FREQ_COLORS[r.frequency] || "#aaa" }}>{r.frequency}</span>
                            <span className="text-[10px] text-muted-foreground font-body">· {r.emotion}</span>
                          </div>
                          <div className="text-xs font-body text-foreground/70 line-clamp-2">"{r.thought}"</div>
                        </div>
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