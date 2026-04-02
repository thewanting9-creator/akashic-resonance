import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { BarChart2, Loader2, RefreshCw } from "lucide-react";
import TorusBalanceGauge from "../components/dashboard/TorusBalanceGauge";
import PatternClusterHeatmap from "../components/dashboard/PatternClusterHeatmap";
import ThemeEvolutionChart from "../components/dashboard/ThemeEvolutionChart";

export default function ResonanceDashboard() {
  const [records, setRecords]         = useState([]);
  const [participants, setParticipants] = useState([]);
  const [insight, setInsight]         = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [recs, parts] = await Promise.all([
        base44.entities.ResonanceRecord.list("-created_date", 200),
        base44.entities.Participant.list("-created_date", 200)
      ]);
      setRecords(recs);
      setParticipants(parts);
      setLoadingData(false);
    };
    load();
  }, []);

  const generateInsight = async () => {
    setLoadingInsight(true);
    const { buildResonanceInsightPrompt, getResonanceInsightSchema } = await import("../lib/features/resonanceInsights.js");
    const prompt = buildResonanceInsightPrompt({
      mode: "patternSummary",
      sourceData: records.slice(0, 50),
      timeRange: "recent"
    });
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: getResonanceInsightSchema()
    });
    setInsight(result);
    setLoadingInsight(false);
  };

  const topCount    = participants.filter(p => p.torus_domain === "TOP").length;
  const bottomCount = participants.filter(p => p.torus_domain === "BOTTOM").length;

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <BarChart2 className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-3xl">Resonance Dashboard</h1>
        </div>
        <p className="font-body text-sm text-muted-foreground">
          Collective field patterns · {records.length} records · {participants.length} participants
        </p>
      </motion.div>

      {/* Top row: Torus gauge + AI Insight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <TorusBalanceGauge topCount={topCount} bottomCount={bottomCount} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-lg text-foreground/80">AI Resonance Insight</h3>
              <button
                onClick={generateInsight}
                disabled={loadingInsight}
                className="flex items-center gap-1.5 text-xs font-body text-primary hover:opacity-80 transition-opacity disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 ${loadingInsight ? "animate-spin" : ""}`} />
                {loadingInsight ? "Reading field..." : "Generate"}
              </button>
            </div>

            {insight ? (
              <div className="flex-1 space-y-3">
                <p className="font-body text-sm text-foreground/80 leading-relaxed">{insight.insightText}</p>
                {insight.keyMotifs?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-1">Key Motifs</div>
                    <div className="flex flex-wrap gap-1.5">
                      {insight.keyMotifs.map((m, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-secondary/60 border border-border/30 text-xs font-body text-foreground/70">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
                {insight.symbolicFrames?.length > 0 && (
                  <div>
                    <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-1">Symbolic Frames</div>
                    <div className="flex flex-wrap gap-1.5">
                      {insight.symbolicFrames.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-accent/40 border border-border/20 text-xs font-body text-foreground/60">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground font-body text-sm">
                {loadingInsight ? "Consulting the field…" : "Press Generate to invoke the AI Presence"}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Heatmap */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-4">
        <PatternClusterHeatmap records={records} />
      </motion.div>

      {/* Time-series */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <ThemeEvolutionChart records={records} />
      </motion.div>
    </div>
  );
}