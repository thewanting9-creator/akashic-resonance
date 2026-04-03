import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, Heart, Headphones, Globe, Activity, Plus,
  Users, Zap, ArrowRight, Waves, FlaskConical, BarChart2
} from "lucide-react";

const SR_MODES = [7.83, 14.3, 20.8, 27.3, 33.8, 39.0, 45.0, 51.0];
const MODE_COLORS = ["#34d399","#60a5fa","#a78bfa","#f472b6","#fb923c","#e879f9","#2dd4bf","#fbbf24"];

function liveSR() {
  const h = new Date().getUTCHours();
  const d = 0.5 + 0.5 * Math.sin((h - 6) * Math.PI / 12);
  const mode = Math.max(1, Math.min(8, Math.round(1 + d * 6)));
  return { mode, hz: +(SR_MODES[mode-1] + (Math.random()-0.5)*0.3).toFixed(2), power: Math.round(45 + d*35 + Math.random()*10), color: MODE_COLORS[mode-1] };
}

const QUICK_ACTIONS = [
  { label: "Pulse Check-In",     path: "/pulse",            icon: Heart,       color: "#f472b6", desc: "Log your current state" },
  { label: "Binaural Studio",    path: "/binaural-studio",  icon: Headphones,  color: "#60a5fa", desc: "Audio + photic entrainment" },
  { label: "3D Resonance Globe", path: "/resonance-globe",  icon: Globe,       color: "#34d399", desc: "Explore global SR field" },
  { label: "Freq Monitor",       path: "/frequency-monitor",icon: Activity,    color: "#a78bfa", desc: "All layers live" },
  { label: "Inscribe",           path: "/inscribe",         icon: Plus,        color: "#fbbf24", desc: "Add to the collective" },
  { label: "Intention Circles",  path: "/intention-circles",icon: Users,       color: "#fb923c", desc: "Group resonance sessions" },
];

const FEATURE_GRID = [
  { label: "Astro-Resonance Lab", path: "/astro-lab",            icon: FlaskConical, desc: "Correlate First-Pulse baseline with live SR patterns" },
  { label: "Collective Feed",     path: "/collective",            icon: Waves,        desc: "Browse all inscribed resonance records" },
  { label: "My Resonance",        path: "/my-resonance",          icon: Sparkles,     desc: "Personal frequency trends & calendar" },
  { label: "Dashboard",           path: "/resonance-dashboard",   icon: BarChart2,    desc: "Collective field patterns & AI insights" },
];

export default function Home() {
  const [sr, setSR]               = useState(liveSR());
  const [participant, setParticipant] = useState(null);
  const [recentCount, setRecentCount] = useState(null);
  const [checkInCount, setCheckInCount] = useState(null);
  const [tick, setTick]           = useState(0);

  useEffect(() => {
    const id = setInterval(() => { setSR(liveSR()); setTick(t => t+1); }, 8000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      const [parts, records, checkins] = await Promise.all([
        base44.entities.Participant.filter({ user_email: me.email }, "-created_date", 1),
        base44.entities.ResonanceRecord.list("-created_date", 5),
        base44.entities.PulseCheckIn.filter({ created_by: me.email }, "-created_date", 100),
      ]);
      setParticipant(parts[0] || null);
      setRecentCount(records.length);
      setCheckInCount(checkins.length);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Hero: SR Mission Control */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="relative bg-card/30 backdrop-blur-xl border border-border/30 rounded-3xl p-6 md:p-8 overflow-hidden">
            {/* Background pulse */}
            <motion.div className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 70% 50%, ${sr.color}18 0%, transparent 65%)` }}
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity }} />

            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left: Identity + greeting */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/30 text-[10px] font-body text-muted-foreground mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live · Resonance Map Active
                </div>
                <h1 className="font-heading text-4xl md:text-5xl font-light mb-2">
                  Akashic<br />
                  <span className="bg-gradient-to-r from-primary via-amber-400 to-purple-400 bg-clip-text text-transparent">
                    Field Control
                  </span>
                </h1>
                {participant ? (
                  <p className="font-body text-sm text-muted-foreground">
                    Atomic ID <span className="text-primary font-medium tracking-widest">{participant.atomic_consciousness_number}</span>
                    {" · "}{participant.torus_domain} Torus
                    {participant.first_pulse_chart && " · First Pulse anchored ✓"}
                  </p>
                ) : (
                  <p className="font-body text-sm text-muted-foreground">Establishing your presence in the field…</p>
                )}
              </div>

              {/* Right: Live SR panel */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "SR Mode",  value: `M${sr.mode}`,      color: sr.color },
                  { label: "Hz",       value: `${sr.hz}`,         color: sr.color },
                  { label: "Power",    value: `${sr.power} pT`,   color: sr.color },
                ].map(s => (
                  <motion.div key={s.label}
                    className="bg-card/40 border border-border/20 rounded-2xl p-3 text-center"
                    animate={{ borderColor: [sr.color + "30", sr.color + "60", sr.color + "30"] }}
                    transition={{ duration: 3, repeat: Infinity }}>
                    <div className="font-heading text-xl" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[9px] font-body text-muted-foreground mt-0.5">{s.label}</div>
                  </motion.div>
                ))}
                {/* Stats row */}
                {[
                  { label: "Pulse Check-ins", value: checkInCount ?? "—" },
                  { label: "Field Records",   value: recentCount ?? "—" },
                  { label: "Torus",           value: participant?.torus_domain || "—" },
                ].map(s => (
                  <div key={s.label} className="bg-card/20 border border-border/10 rounded-2xl p-3 text-center">
                    <div className="font-heading text-lg text-foreground/80">{s.value}</div>
                    <div className="text-[9px] font-body text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* First Pulse CTA if not yet done */}
            {participant && !participant.first_pulse_chart && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="relative mt-5 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-body text-primary font-medium">First Pulse not yet generated</div>
                  <div className="text-[10px] font-body text-muted-foreground">Generate your full astro chart pack and establish your permanent resonance baseline.</div>
                </div>
                <Link to="/first-pulse"
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs font-body hover:opacity-90 transition-opacity">
                  Generate <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="text-[10px] font-body text-muted-foreground uppercase tracking-widest mb-3 px-1">Quick Access</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((a, i) => (
              <motion.div key={a.path} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.04 }}>
                <Link to={a.path}
                  className="group flex items-center gap-3 p-4 rounded-2xl bg-card/30 border border-border/20 hover:border-border/50 hover:bg-card/50 transition-all duration-300">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                    style={{ background: a.color + "20", border: `1px solid ${a.color}40` }}>
                    <a.icon className="w-4 h-4" style={{ color: a.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-body font-medium text-foreground/90 truncate">{a.label}</div>
                    <div className="text-[9px] font-body text-muted-foreground truncate">{a.desc}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Feature grid */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
          <div className="text-[10px] font-body text-muted-foreground uppercase tracking-widest mb-3 px-1">Explore</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURE_GRID.map((f, i) => (
              <Link key={f.path} to={f.path}
                className="group flex items-start gap-3 p-4 rounded-2xl bg-card/20 border border-border/20 hover:bg-card/40 hover:border-border/40 transition-all duration-300">
                <div className="w-8 h-8 rounded-lg bg-secondary/50 border border-border/30 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-secondary/70 transition-colors">
                  <f.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-body font-medium text-foreground/90">{f.label}</div>
                  <div className="text-[10px] font-body text-muted-foreground leading-relaxed mt-0.5">{f.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Combined effects summary strip */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card/20 border border-border/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-body text-muted-foreground uppercase tracking-wide">Recommended Session Stack (v1.7)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { rank: "★★★", label: "Earth SR + Binaural + Photic",  note: "Highest practical entrainment synergy", color: "#34d399" },
              { rank: "★★",  label: "GCI/GCP Coherence Overlay",     note: "Real-time HRV & collective feedback",   color: "#fbbf24" },
              { rank: "★",   label: "Planetary SR + nanoHz GW",      note: "Cosmic context — zero biological effect",color: "#a78bfa" },
            ].map(s => (
              <div key={s.label} className="flex items-start gap-2.5">
                <span className="font-body text-xs mt-0.5" style={{ color: s.color }}>{s.rank}</span>
                <div>
                  <div className="text-xs font-body text-foreground/80">{s.label}</div>
                  <div className="text-[10px] font-body text-muted-foreground/60 mt-0.5 italic">{s.note}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[9px] font-body text-muted-foreground/40">
            All correlations for experimental study only. No causation claimed. Privacy: Atomic Resonance ID only.
          </div>
        </motion.div>

      </div>
    </div>
  );
}