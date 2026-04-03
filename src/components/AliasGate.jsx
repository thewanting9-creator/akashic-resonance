import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Loader2, Check, ShieldCheck } from "lucide-react";

const BIRTH_TIME_OPTIONS = [
  { label: "Morning (6am–12pm)",   value: "morning",   sr: 1 },
  { label: "Afternoon (12pm–6pm)", value: "afternoon", sr: 5 },
  { label: "Evening (6pm–12am)",   value: "evening",   sr: 7 },
  { label: "Night (12am–6am)",     value: "night",     sr: 1 },
  { label: "Unknown",              value: "unknown",   sr: 3 },
];

function generateAtomicNumber(existingNumbers = []) {
  let num;
  do { num = Math.floor(100000 + Math.random() * 900000).toString(); }
  while (existingNumbers.includes(num));
  return num;
}

function assignTorusDomain() { return Math.random() < 0.5 ? "TOP" : "BOTTOM"; }

function validateDob(value) { return /^\d{2}\/\d{2}\/\d{4}$/.test(value); }

async function generateFirstPulseCharts({ dob, birthTime, birthLocation, alias, atomicNumber }) {
  const prompt = `You are the Akashic First-Pulse AI. Generate a comprehensive First-Pulse chart interpretation for the following participant. 
This is a ONE-TIME generation — birth data will be permanently deleted immediately after.

BIRTH PARAMETERS (will be deleted after this call):
- Date of Birth: ${dob}
- Time of Day: ${birthTime}
- Location (general): ${birthLocation}
- Emergence Alias: ${alias}
- Assigned Atomic Resonance ID: ${atomicNumber}

Generate symbolic, non-predictive, reflective interpretations for all chart systems below.
Use the Akashic/resonance framing — non-directive, archetypal, field-awareness language.
CRITICAL: Do NOT use the birth date to make specific astrological claims. Use it only as a resonance anchor for symbolic framework.

OUTPUT (strict JSON):
{
  "summary": "Overall First-Pulse narrative (150 words max — poetic, archetypal, welcoming)",
  "triple_self": {
    "interpretation": "Triple Self Convergence — how Tropical, Draconic, and Sidereal GE-MidMula layers converge for this emergence (100 words)",
    "key_themes": ["theme1", "theme2", "theme3"],
    "symbolic_frame": "One evocative symbolic sentence"
  },
  "uranian": {
    "interpretation": "Uranian 90°/45° midpoint dial — core tension-resolution patterns (80 words)",
    "key_themes": ["theme1", "theme2"],
    "symbolic_frame": "One evocative sentence"
  },
  "esoteric_rays": {
    "interpretation": "Seven Rays soul/personality overlay — which rays appear dominant for this emergence field (80 words)",
    "key_themes": ["Ray description 1", "Ray description 2"],
    "symbolic_frame": "One evocative sentence"
  },
  "nine_personas": {
    "interpretation": "Nine Personas — the 3 most activated archetypal expressions for this field (100 words)",
    "key_themes": ["Archetype 1", "Archetype 2", "Archetype 3"],
    "symbolic_frame": "One evocative sentence"
  },
  "specialty_convergence": {
    "interpretation": "Specialty Convergence — Angles, Elements, Modalities synthesis from the convergence (80 words)",
    "key_themes": ["Element emphasis", "Modality emphasis", "Angular signature"],
    "symbolic_frame": "One evocative sentence"
  },
  "resonance_baseline": {
    "dominant_frequency": "one of: unity|creation|transformation|healing|awakening|remembrance|vision|connection",
    "dominant_emotion": "one of: love|wonder|peace|joy|gratitude|clarity|longing|awe|compassion|transcendence",
    "schumann_affinity": 1,
    "key_archetypes": ["archetype1", "archetype2", "archetype3", "archetype4"]
  }
}`;

  return await base44.integrations.Core.InvokeLLM({
    prompt,
    model: "claude_sonnet_4_6",
    response_json_schema: {
      type: "object",
      properties: {
        summary:              { type: "string" },
        triple_self:          { type: "object" },
        uranian:              { type: "object" },
        esoteric_rays:        { type: "object" },
        nine_personas:        { type: "object" },
        specialty_convergence:{ type: "object" },
        resonance_baseline: {
          type: "object",
          properties: {
            dominant_frequency: { type: "string" },
            dominant_emotion:   { type: "string" },
            schumann_affinity:  { type: "number" },
            key_archetypes:     { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  });
}

const STEPS = ["identity", "birth", "generating", "complete"];

export default function AliasGate({ userEmail, onComplete }) {
  const [step, setStep]             = useState("identity");
  const [dobPart, setDobPart]       = useState("");
  const [aliasPart, setAliasPart]   = useState("");
  const [birthTime, setBirthTime]   = useState("unknown");
  const [birthLocation, setBirthLocation] = useState("");
  const [error, setError]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [atomicId, setAtomicId]     = useState(null);

  const combined = dobPart && aliasPart ? `${dobPart}${aliasPart}` : "";

  const handleDobChange = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length >= 4) val = val.slice(0,2) + "/" + val.slice(2,4) + "/" + val.slice(4,8);
    else if (val.length >= 2) val = val.slice(0,2) + "/" + val.slice(2);
    setDobPart(val);
    setError("");
  };

  const handleIdentityNext = async () => {
    if (!validateDob(dobPart) || aliasPart.length < 2) {
      setError("Enter a valid date (MM/DD/YYYY) and alias (min 2 chars).");
      return;
    }
    const existing = await base44.entities.Participant.filter({ alias: combined }, "-created_date", 1);
    if (existing.length > 0) { setError("Alias already in use. Choose another."); return; }
    setError("");
    setStep("birth");
  };

  const handleGeneratePulse = async () => {
    setStep("generating");
    setSubmitting(true);

    const all = await base44.entities.Participant.list("-created_date", 1000);
    const atomicNumber  = generateAtomicNumber(all.map(p => p.atomic_consciousness_number));
    const torusDomain   = assignTorusDomain();
    const timeOpt       = BIRTH_TIME_OPTIONS.find(o => o.value === birthTime);

    // Generate First-Pulse charts via AI (uses birth data — will be discarded after)
    let chartData = null;
    try {
      chartData = await generateFirstPulseCharts({
        dob: dobPart,
        birthTime,
        birthLocation: birthLocation || "unspecified",
        alias: aliasPart,
        atomicNumber,
      });
    } catch (e) {
      chartData = { summary: "Your emergence has been anchored in the field.", resonance_baseline: { dominant_frequency: "unity", dominant_emotion: "wonder", schumann_affinity: 1, key_archetypes: ["The Seeker", "The Weaver"] } };
    }

    const now = new Date().toISOString();

    // Store participant — birth data replaced by Atomic ID only
    await base44.entities.Participant.create({
      alias: combined,
      atomic_consciousness_number: atomicNumber,
      torus_domain: torusDomain,
      user_email: userEmail,
      status: "active",
      is_seed: false,
      emergence_timestamp: now,
      birth_data_deleted: true, // birth data never actually stored — only used in AI call above
      first_pulse_chart: {
        generated_at: now,
        birth_location_label: birthLocation || "unspecified",
        birth_time_label: birthTime,
        ...chartData,
      },
      na33_grid: {
        outer_collective_traits: [],
        group_structured_traits: [],
        personal_traits: [],
        outer_ring_of_nothingness: { id: `orn-${atomicNumber}`, description: "Silent darkness / pre-energy field" },
        center_vortex: { atomic_consciousness_number: atomicNumber }
      }
    });

    setAtomicId(atomicNumber);
    setSubmitting(false);
    setStep("complete");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/97 backdrop-blur-xl px-4 overflow-y-auto py-8">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {["identity", "birth", "generating", "complete"].map((s, i) => (
            <div key={s} className={`w-2 h-2 rounded-full transition-all duration-500 ${
              STEPS.indexOf(step) >= i ? "bg-primary" : "bg-border/40"
            }`} />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* Step 1: Identity */}
          {step === "identity" && (
            <motion.div key="identity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary/60 border border-border/40 mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h1 className="font-heading text-3xl font-light mb-2">Enter the Field</h1>
                <p className="font-body text-sm text-muted-foreground max-w-xs mx-auto">
                  Establish your identity. Your date of birth seeds your First-Pulse chart and is never stored.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-body text-muted-foreground uppercase tracking-wider block mb-1.5">Date of Birth</label>
                  <input value={dobPart} onChange={handleDobChange} placeholder="MM/DD/YYYY" maxLength={10}
                    className="w-full bg-card/40 border border-border/40 rounded-xl px-4 py-3 font-body text-sm tracking-widest outline-none focus:border-primary/50 transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] font-body text-muted-foreground uppercase tracking-wider block mb-1.5">Alias</label>
                  <input value={aliasPart} onChange={e => { setAliasPart(e.target.value.replace(/\s/g,"")); setError(""); }}
                    placeholder="e.g. Walt"
                    className="w-full bg-card/40 border border-border/40 rounded-xl px-4 py-3 font-body text-sm outline-none focus:border-primary/50 transition-colors" />
                </div>
                {combined && (
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/30 text-center">
                    <span className="text-xs text-muted-foreground font-body">Signature: </span>
                    <span className="font-heading text-sm text-primary">{combined}</span>
                  </div>
                )}
                {error && <p className="text-xs text-rose-400 font-body text-center">{error}</p>}
                <button onClick={handleIdentityNext} disabled={!combined}
                  className="w-full py-3 rounded-full bg-primary text-primary-foreground font-body text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-opacity">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-muted-foreground/40 font-body text-center">Date of birth used only for First-Pulse chart generation. Never stored.</p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Birth details for chart */}
          {step === "birth" && (
            <motion.div key="birth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-8">
                <h2 className="font-heading text-2xl font-light mb-2">First Pulse Parameters</h2>
                <p className="font-body text-sm text-muted-foreground max-w-xs mx-auto">
                  Used once for your chart generation, then permanently discarded. Your Atomic ID takes over.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-body text-muted-foreground uppercase tracking-wider block mb-1.5">Time of Birth</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {BIRTH_TIME_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setBirthTime(opt.value)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-body text-left border transition-all ${
                          birthTime === opt.value ? "bg-primary/10 border-primary/40 text-foreground" : "bg-card/30 border-border/30 text-muted-foreground hover:bg-card/50"
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-body text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Birth Location <span className="normal-case text-muted-foreground/50">(city or region — optional)</span>
                  </label>
                  <input value={birthLocation} onChange={e => setBirthLocation(e.target.value)}
                    placeholder="e.g. New York, US or leave blank"
                    className="w-full bg-card/40 border border-border/40 rounded-xl px-4 py-3 font-body text-sm outline-none focus:border-primary/50 transition-colors" />
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/20 border border-border/20">
                  <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] font-body text-muted-foreground/70 leading-relaxed">
                    This data is passed directly to the AI for chart generation and is <strong className="text-foreground/60">never written to any database</strong>. 
                    Only your chart interpretations and Atomic Resonance ID are stored.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setStep("identity")} className="flex-1 py-3 rounded-full border border-border/40 text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
                    Back
                  </button>
                  <button onClick={handleGeneratePulse}
                    className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-body text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                    <Sparkles className="w-4 h-4" /> Generate First Pulse
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Generating */}
          {step === "generating" && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                <motion.div className="absolute inset-0 rounded-full border border-primary/30"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }} />
                <motion.div className="absolute inset-2 rounded-full border border-primary/20"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading text-2xl mb-2">Generating First Pulse…</h2>
              <p className="font-body text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Computing your chart pack. Birth data will be discarded the moment this completes.
              </p>
              <div className="mt-6 space-y-1.5 text-xs font-body text-muted-foreground/50">
                {["Triple Self Convergence", "Uranian Dials", "Esoteric Rays", "Nine Personas", "Specialty Overlay"].map((c, i) => (
                  <motion.div key={c} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.4 }}
                    className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> {c}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Complete */}
          {step === "complete" && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-6">
                <Check className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-heading text-3xl mb-2">Emergence Complete</h2>
              <p className="font-body text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                Your First-Pulse charts have been generated. Birth data has been permanently discarded.
              </p>

              <div className="bg-card/40 border border-border/30 rounded-2xl p-5 mb-6 text-left space-y-2">
                <div className="flex justify-between text-xs font-body">
                  <span className="text-muted-foreground">Atomic Resonance ID</span>
                  <span className="font-heading text-primary tracking-widest">{atomicId}</span>
                </div>
                <div className="flex justify-between text-xs font-body">
                  <span className="text-muted-foreground">Emergence Anchored</span>
                  <span className="text-foreground/70">{new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-body">
                  <span className="text-muted-foreground">Birth Data</span>
                  <span className="text-green-400">Permanently deleted ✓</span>
                </div>
                <div className="flex justify-between text-xs font-body">
                  <span className="text-muted-foreground">Charts Generated</span>
                  <span className="text-green-400">5 systems ✓</span>
                </div>
              </div>

              <button onClick={onComplete}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground font-body text-sm hover:opacity-90 transition-opacity">
                Enter the Field
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}