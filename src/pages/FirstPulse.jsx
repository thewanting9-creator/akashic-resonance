import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ChevronDown, Zap } from "lucide-react";
import { SCHUMANN_DATA } from "../lib/schumannData";

const SECTION_KEYS = [
  { key: "triple_self",           label: "Triple Self Convergence",        color: "#a78bfa" },
  { key: "uranian",               label: "Uranian 90° / 45° Dial",         color: "#60a5fa" },
  { key: "esoteric_rays",         label: "Esoteric Seven Rays",             color: "#f472b6" },
  { key: "nine_personas",         label: "Nine Personas",                   color: "#fbbf24" },
  { key: "specialty_convergence", label: "Specialty Convergence Overlay",   color: "#34d399" },
];

function ChartSection({ label, color, data }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/30 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card/30 hover:bg-card/50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="font-heading text-sm text-foreground/90">{label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && data && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-4 py-4 bg-card/10 space-y-3 text-sm font-body">
              {data.interpretation && (
                <p className="text-foreground/80 leading-relaxed">{data.interpretation}</p>
              )}
              {data.key_themes && (
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Key Themes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.key_themes.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-secondary/50 border border-border/30 text-xs text-foreground/70">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {data.symbolic_frame && (
                <p className="text-xs text-muted-foreground/70 italic border-l-2 border-border/30 pl-3">{data.symbolic_frame}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FirstPulse() {
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const load = async () => {
      const me   = await base44.auth.me();
      const list = await base44.entities.Participant.filter({ user_email: me.email }, "-created_date", 1);
      setParticipant(list[0] || null);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );

  if (!participant?.first_pulse_chart) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <Sparkles className="w-8 h-8 text-muted-foreground/30 mb-3" />
      <h2 className="font-heading text-xl text-muted-foreground mb-2">First Pulse not yet generated</h2>
      <p className="text-sm font-body text-muted-foreground/60">Complete your initial emergence to unlock your chart pack.</p>
    </div>
  );

  const chart   = participant.first_pulse_chart;
  const srMode  = chart.resonance_baseline?.schumann_affinity || 1;
  const srData  = SCHUMANN_DATA.schumann_resonances[(srMode - 1)] || SCHUMANN_DATA.schumann_resonances[0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 min-h-screen">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-heading text-4xl mb-1">First Pulse</h1>
          <p className="font-body text-sm text-muted-foreground">
            Atomic ID {participant.atomic_consciousness_number} · {participant.torus_domain} Torus
          </p>
          {chart.generated_at && (
            <p className="text-[10px] font-body text-muted-foreground/50 mt-1">
              Emergence: {new Date(chart.generated_at).toLocaleString()} · Birth data permanently deleted ✓
            </p>
          )}
        </div>

        {/* Resonance baseline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Dominant Frequency", value: chart.resonance_baseline?.dominant_frequency || "—" },
            { label: "Dominant Emotion",   value: chart.resonance_baseline?.dominant_emotion   || "—" },
            { label: "SR Affinity",        value: `Mode ${srMode} · ${srData.frequency_hz} Hz` },
            { label: "Location",           value: chart.birth_location_label || "—" },
          ].map(s => (
            <div key={s.label} className="bg-card/30 border border-border/30 rounded-xl px-3 py-3 text-center">
              <div className="font-heading text-base text-primary capitalize truncate">{s.value}</div>
              <div className="text-[9px] font-body text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* SR affinity callout */}
        <div className="mb-6 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-body text-primary font-medium">Schumann Resonance Baseline</span>
          </div>
          <p className="text-xs font-body text-foreground/70 leading-relaxed">
            Your First Pulse aligns most strongly with SR Mode {srMode} ({srData.frequency_hz} Hz) — <span className="italic">{srData.brainwave_overlap}</span>. {srData.mental_state}.
          </p>
        </div>

        {/* Summary */}
        {chart.summary && (
          <div className="mb-5 p-5 bg-card/30 border border-border/30 rounded-2xl">
            <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-2">First Pulse Overview</div>
            <p className="font-body text-sm text-foreground/80 leading-relaxed">{chart.summary}</p>
          </div>
        )}

        {/* Key archetypes */}
        {chart.resonance_baseline?.key_archetypes?.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {chart.resonance_baseline.key_archetypes.map((a, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-secondary/50 border border-border/30 text-xs font-body text-foreground/70">{a}</span>
            ))}
          </div>
        )}

        {/* Chart sections */}
        <div className="space-y-2">
          {SECTION_KEYS.map(s => (
            <ChartSection key={s.key} label={s.label} color={s.color} data={chart[s.key]} />
          ))}
        </div>

        <p className="mt-6 text-[10px] font-body text-muted-foreground/40 text-center">
          This chart pack was generated using AI symbolic interpretation aligned to your birth parameters.
          Your raw birth data was deleted immediately after generation and is not stored anywhere.
        </p>
      </motion.div>
    </div>
  );
}