import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Zap, Users, ArrowRight, Loader2 } from "lucide-react";
import { SCHUMANN_DATA, freqLabelToSchumann } from "../lib/schumannData";
import { Link } from "react-router-dom";

const MOOD_TAGS = [
  { tag: "calm",      icon: "◎", color: "#34d399" },
  { tag: "creative",  icon: "✦", color: "#a78bfa" },
  { tag: "focused",   icon: "◈", color: "#60a5fa" },
  { tag: "inspired",  icon: "✸", color: "#fbbf24" },
  { tag: "grateful",  icon: "✿", color: "#f472b6" },
  { tag: "flow",      icon: "∿", color: "#2dd4bf" },
  { tag: "insight",   icon: "◉", color: "#fb923c" },
  { tag: "heightened",icon: "∞", color: "#e879f9" },
  { tag: "anxious",   icon: "~", color: "#94a3b8" },
];

const FREQ_OPTIONS = ["unity","creation","transformation","healing","awakening","remembrance","vision","connection"];

// Simulate SR mode based on time-of-day + some variance
function estimateSchumannMode() {
  const hour = new Date().getHours();
  const base = hour >= 6 && hour <= 10 ? 5
             : hour >= 14 && hour <= 16 ? 7
             : hour >= 20 || hour <= 4  ? 1
             : 3;
  return base;
}

export default function PulseCheckIn() {
  const [step, setStep]           = useState("select"); // select | frequency | result
  const [selectedMood, setMood]   = useState(null);
  const [selectedFreq, setFreq]   = useState(null);
  const [thought, setThought]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]       = useState(null);
  const [recentRecords, setRecent] = useState([]);

  useEffect(() => {
    base44.entities.ResonanceRecord.list("-created_date", 100).then(setRecent);
  }, []);

  const srMode  = estimateSchumannMode();
  const srData  = SCHUMANN_DATA.schumann_resonances[srMode - 1];

  const handleSubmit = async () => {
    setSubmitting(true);

    // Count echo matches from recent records
    const moodMap = { calm:"peace", creative:"wonder", focused:"clarity", inspired:"awe",
                      grateful:"gratitude", flow:"transcendence", insight:"clarity",
                      heightened:"transcendence", anxious:"longing" };
    const matchEmotion = moodMap[selectedMood] || selectedMood;
    const echoMatches  = recentRecords.filter(r =>
      r.emotion === matchEmotion ||
      (selectedFreq && r.frequency === selectedFreq)
    ).length;

    const resonanceScore = Math.min(100, Math.round(
      (echoMatches / Math.max(recentRecords.length, 1)) * 60 +
      (selectedFreq ? 30 : 0) +
      (thought ? 10 : 0)
    ));

    const checkIn = await base44.entities.PulseCheckIn.create({
      mood_tag: selectedMood,
      thought_fragment: thought || undefined,
      frequency: selectedFreq || undefined,
      schumann_mode_estimate: srMode,
      resonance_score: resonanceScore,
      echo_count: echoMatches,
      session_type: "solo",
    });

    // Save echo snapshot
    await base44.entities.EchoMatch.create({
      matched_mood: selectedMood,
      matched_frequency: selectedFreq || null,
      echo_count: echoMatches,
      schumann_mode: srMode,
      schumann_hz: srData.frequency_hz,
      collective_alignment_pct: resonanceScore,
      snapshot_timestamp: new Date().toISOString(),
      pulse_checkin_id: checkIn.id,
    });

    setResult({ echoMatches, resonanceScore, srData, checkIn });
    setSubmitting(false);
    setStep("result");
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Heart className="w-5 h-5 text-primary" />
        </div>
        <h1 className="font-heading text-3xl mb-1">Pulse Check-In</h1>
        <p className="font-body text-sm text-muted-foreground">10 seconds · see your echo in the collective field</p>

        {/* Live SR badge */}
        <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-card/40 border border-border/30 text-xs font-body">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-muted-foreground">Earth SR Mode {srMode} active · {srData.frequency_hz} Hz</span>
          <span className="text-primary capitalize">{srData.brainwave_overlap}</span>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* Step 1: Mood */}
        {step === "select" && (
          <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-6">
              <h3 className="font-heading text-base mb-4 text-center">How are you right now?</h3>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {MOOD_TAGS.map(({ tag, icon, color }) => (
                  <button key={tag} onClick={() => setMood(tag)}
                    className={`py-3 rounded-xl border text-center transition-all ${
                      selectedMood === tag ? "border-primary/50 bg-primary/10" : "border-border/30 bg-secondary/20 hover:bg-secondary/40"
                    }`}
                  >
                    <div className="text-lg mb-0.5" style={{ color }}>{icon}</div>
                    <div className="text-[10px] font-body capitalize text-foreground/70">{tag}</div>
                  </button>
                ))}
              </div>

              <textarea
                value={thought}
                onChange={e => setThought(e.target.value.slice(0, 140))}
                placeholder="A word or thought… (optional)"
                rows={2}
                className="w-full bg-transparent border border-border/30 rounded-xl px-3 py-2 text-sm font-body text-foreground/80 placeholder:text-muted-foreground/50 outline-none resize-none mb-4"
              />

              <button
                disabled={!selectedMood}
                onClick={() => setStep("frequency")}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground font-body text-sm flex items-center justify-center gap-2 disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Frequency */}
        {step === "frequency" && (
          <motion.div key="frequency" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-6">
              <h3 className="font-heading text-base mb-1 text-center">Which frequency calls to you?</h3>
              <p className="text-xs font-body text-muted-foreground text-center mb-4">Optional — skip to see your echo</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {FREQ_OPTIONS.map(f => (
                  <button key={f} onClick={() => setFreq(freq => freq === f ? null : f)}
                    className={`py-2.5 rounded-xl border text-sm font-body capitalize transition-all ${
                      selectedFreq === f ? "border-primary/50 bg-primary/10 text-foreground" : "border-border/30 bg-secondary/20 text-muted-foreground hover:bg-secondary/40"
                    }`}
                  >{f}</button>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep("select")} className="flex-1 py-3 rounded-full border border-border/40 text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-body text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> Send Pulse</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Result / Echo */}
        {step === "result" && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-6 text-center">
              {/* Score ring */}
              <div className="relative inline-flex items-center justify-center w-28 h-28 mb-4">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                  <motion.circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - result.resonanceScore / 100) }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </svg>
                <div>
                  <div className="font-heading text-3xl text-primary">{result.resonanceScore}</div>
                  <div className="text-[9px] font-body text-muted-foreground">resonance</div>
                </div>
              </div>

              <h3 className="font-heading text-xl mb-1">Your Pulse is Sent</h3>
              <p className="text-xs font-body text-muted-foreground mb-5">
                Earth SR Mode {result.srData.mode} · {result.srData.frequency_hz} Hz · {result.srData.brainwave_overlap}
              </p>

              {/* Echo count */}
              <div className="flex items-center justify-center gap-2 mb-5 px-4 py-3 rounded-xl bg-secondary/30 border border-border/20">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-body text-sm text-foreground/80">
                  <span className="font-heading text-xl text-primary mr-1">{result.echoMatches}</span>
                  others resonating in a similar state right now
                </span>
              </div>

              <p className="text-xs font-body text-muted-foreground/70 italic mb-5">
                "{result.srData.mental_state}"
              </p>

              <div className="flex gap-2">
                <button onClick={() => { setStep("select"); setMood(null); setFreq(null); setThought(""); setResult(null); }}
                  className="flex-1 py-2.5 rounded-full border border-border/40 text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
                  New Pulse
                </button>
                <Link to="/inscribe" className="flex-1 py-2.5 rounded-full bg-primary/20 border border-primary/30 text-sm font-body text-primary text-center hover:bg-primary/30 transition-colors">
                  Deep Inscribe →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}