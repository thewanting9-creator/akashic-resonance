import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { FlaskConical, Loader2, RefreshCw, Sparkles, Zap } from "lucide-react";
import { SCHUMANN_DATA } from "../lib/schumannData";
import { Link } from "react-router-dom";

const FREQ_COLORS = {
  unity:"#c4a35a", creation:"#a78bfa", transformation:"#f472b6",
  healing:"#34d399", awakening:"#60a5fa", remembrance:"#fb923c",
  vision:"#e879f9", connection:"#2dd4bf",
};

export default function AstroResonanceLab() {
  const [participant, setParticipant] = useState(null);
  const [checkIns,    setCheckIns]    = useState([]);
  const [records,     setRecords]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [analysis,    setAnalysis]    = useState(null);
  const [running,     setRunning]     = useState(false);

  useEffect(() => {
    const load = async () => {
      const me   = await base44.auth.me();
      const [parts, checkins, recs] = await Promise.all([
        base44.entities.Participant.filter({ user_email: me.email }, "-created_date", 1),
        base44.entities.PulseCheckIn.filter({ created_by: me.email }, "-created_date", 100),
        base44.entities.ResonanceRecord.filter({ created_by: me.email }, "-created_date", 200),
      ]);
      setParticipant(parts[0] || null);
      setCheckIns(checkins);
      setRecords(recs);
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const moodCounts = {};
    const freqCounts = {};
    let totalEchoes = 0;
    for (const c of checkIns) moodCounts[c.mood_tag] = (moodCounts[c.mood_tag] || 0) + 1;
    for (const r of records)  { freqCounts[r.frequency] = (freqCounts[r.frequency] || 0) + 1; totalEchoes += r.echoes || 0; }
    const topMood = Object.entries(moodCounts).sort((a,b) => b[1]-a[1])[0]?.[0];
    const topFreq = Object.entries(freqCounts).sort((a,b) => b[1]-a[1])[0]?.[0];
    const avgScore = checkIns.length ? Math.round(checkIns.reduce((s,c) => s + (c.resonance_score||0), 0) / checkIns.length) : 0;
    const avgEchoes = checkIns.length ? Math.round(checkIns.reduce((s,c) => s + (c.echo_count||0), 0) / checkIns.length) : 0;
    return { topMood, topFreq, avgScore, avgEchoes, totalEchoes };
  }, [checkIns, records]);

  const chart = participant?.first_pulse_chart;
  const baseline = chart?.resonance_baseline;
  const srMode = baseline?.schumann_affinity || 1;
  const srData = SCHUMANN_DATA.schumann_resonances[(srMode - 1)] || SCHUMANN_DATA.schumann_resonances[0];

  const alignmentMatch = baseline?.dominant_frequency && stats.topFreq === baseline.dominant_frequency;

  const runAnalysis = async () => {
    if (!chart) return;
    setRunning(true);
    const prompt = `You are the Akashic Resonance AI analyzing a participant's personal resonance patterns over time.

FIRST PULSE BASELINE (permanent anchor):
- Dominant Frequency: ${baseline?.dominant_frequency || "unknown"}
- Dominant Emotion: ${baseline?.dominant_emotion || "unknown"}
- Schumann Affinity: Mode ${srMode} (${srData.frequency_hz} Hz) - ${srData.mental_state}
- Key Archetypes: ${baseline?.key_archetypes?.join(", ") || "unknown"}

OBSERVED ACTIVITY (${checkIns.length} pulse check-ins, ${records.length} inscriptions):
- Most frequent mood: ${stats.topMood || "—"}
- Most active frequency: ${stats.topFreq || "—"}
- Average resonance score: ${stats.avgScore}/100
- Average echo count per session: ${stats.avgEchoes}
- Total echoes received: ${stats.totalEchoes}

INSTRUCTIONS:
Analyze the relationship between the permanent First-Pulse baseline and the observed dynamic activity. 
Look for: alignment or drift from baseline, emerging patterns, SR correlations, collective echo significance.
Non-directive, symbolic, scientific-curious tone. Focus on what the data suggests, not what the person should do.
Output a JSON with: patternSummary (string, 200 words max), baselineAlignment (string: "strong" | "moderate" | "drifting"), 
keyCorrelations (array of 3-5 strings), emergingThemes (array of 2-3 strings), srInsight (string, 1 sentence).`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          patternSummary:     { type: "string" },
          baselineAlignment:  { type: "string" },
          keyCorrelations:    { type: "array", items: { type: "string" } },
          emergingThemes:     { type: "array", items: { type: "string" } },
          srInsight:          { type: "string" }
        }
      }
    });
    setAnalysis(result);
    setRunning(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 min-h-screen">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <div className="flex items-center gap-2.5">
            <FlaskConical className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-3xl">Astro-Resonance Lab</h1>
          </div>
          {chart && (
            <button onClick={runAnalysis} disabled={running}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-body hover:bg-primary/20 transition-colors disabled:opacity-40">
              <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
              {running ? "Analyzing field…" : "Run Analysis"}
            </button>
          )}
        </div>
        <p className="font-body text-sm text-muted-foreground">
          Correlating your permanent First-Pulse baseline with dynamic session activity and SR patterns
        </p>
      </motion.div>

      {!chart ? (
        <div className="text-center py-20">
          <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-heading text-lg text-muted-foreground mb-2">First Pulse required</p>
          <p className="text-sm font-body text-muted-foreground/60 mb-4">Complete your emergence to unlock the lab.</p>
          <Link to="/first-pulse" className="text-sm text-primary hover:underline font-body">Go to First Pulse →</Link>
        </div>
      ) : (
        <>
          {/* Baseline vs Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            {/* Baseline */}
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5">
              <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-3">First Pulse Baseline (Permanent)</div>
              <div className="space-y-2">
                {[
                  { label: "Dominant Frequency", value: baseline?.dominant_frequency, colored: true },
                  { label: "Dominant Emotion",   value: baseline?.dominant_emotion },
                  { label: "SR Affinity",        value: `Mode ${srMode} · ${srData.frequency_hz} Hz` },
                  { label: "Archetypes",         value: baseline?.key_archetypes?.slice(0,3).join(", ") },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center text-xs font-body">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="capitalize" style={s.colored && FREQ_COLORS[s.value] ? { color: FREQ_COLORS[s.value] } : {}}>
                      {s.value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Live activity */}
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5">
              <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-3">Dynamic Activity (Live)</div>
              <div className="space-y-2">
                {[
                  { label: "Check-ins",        value: checkIns.length },
                  { label: "Inscriptions",     value: records.length },
                  { label: "Top Mood",         value: stats.topMood },
                  { label: "Top Frequency",    value: stats.topFreq, colored: true },
                  { label: "Avg Resonance",    value: stats.avgScore ? `${stats.avgScore}/100` : "—" },
                  { label: "Avg Echo Count",   value: stats.avgEchoes },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center text-xs font-body">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="capitalize" style={s.colored && FREQ_COLORS[s.value] ? { color: FREQ_COLORS[s.value] } : {}}>
                      {s.value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Alignment indicator */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className={`mb-5 px-4 py-3 rounded-xl border flex items-center gap-3 ${
              alignmentMatch ? "bg-primary/5 border-primary/20" : "bg-card/20 border-border/30"
            }`}>
            <Zap className={`w-4 h-4 flex-shrink-0 ${alignmentMatch ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-xs font-body text-foreground/70 leading-relaxed">
              {alignmentMatch
                ? `✦ Strong baseline alignment — your active frequency (${stats.topFreq}) matches your First-Pulse anchor. The field is coherent.`
                : `Your active frequency (${stats.topFreq || "unknown"}) differs from your baseline anchor (${baseline?.dominant_frequency || "unknown"}). This may indicate exploration or growth beyond your emergence state.`
              }
            </p>
          </motion.div>

          {/* AI Analysis */}
          {analysis && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-base">AI Pattern Analysis</h3>
                <span className={`text-[10px] font-body px-2 py-0.5 rounded-full border capitalize ${
                  analysis.baselineAlignment === "strong" ? "text-primary border-primary/30 bg-primary/5"
                  : analysis.baselineAlignment === "moderate" ? "text-amber-400 border-amber-400/30 bg-amber-400/5"
                  : "text-rose-400 border-rose-400/30 bg-rose-400/5"
                }`}>
                  {analysis.baselineAlignment} alignment
                </span>
              </div>

              <p className="text-sm font-body text-foreground/80 leading-relaxed">{analysis.patternSummary}</p>

              {analysis.srInsight && (
                <div className="px-3 py-2 rounded-lg bg-secondary/30 border border-border/20">
                  <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-1">SR Insight</div>
                  <p className="text-xs font-body text-foreground/70 italic">{analysis.srInsight}</p>
                </div>
              )}

              {analysis.keyCorrelations?.length > 0 && (
                <div>
                  <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-2">Key Correlations</div>
                  <div className="space-y-1">
                    {analysis.keyCorrelations.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs font-body text-foreground/70">
                        <span className="text-primary mt-0.5">·</span>{c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.emergingThemes?.length > 0 && (
                <div>
                  <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-1.5">Emerging Themes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.emergingThemes.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-accent/40 border border-border/20 text-xs font-body text-foreground/60">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {!analysis && !running && (
            <div className="text-center py-8 text-muted-foreground font-body text-sm">
              Press "Run Analysis" to correlate your First-Pulse baseline with your activity patterns
            </div>
          )}
          {running && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground font-body text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Consulting the field…
            </div>
          )}
        </>
      )}
    </div>
  );
}