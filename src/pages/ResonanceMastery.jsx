import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Loader2, Zap, TrendingUp, Calendar, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import MasteryBadge, { TIERS, FREQ_META, computeUnlockedBadges, getNextBadge, getBadgeId } from "../components/mastery/MasteryBadge";

const CHANNELS = ["unity","creation","transformation","healing","awakening","remembrance","vision","connection"];

// Derive channel minutes from all session data
function deriveChannelMinutes(records, checkIns, soundscapes, binauralJournals) {
  const mins = {};
  CHANNELS.forEach(c => mins[c] = 0);

  // ResonanceRecord — count as 5 min engagement per inscription per channel
  for (const r of records) {
    if (r.frequency && mins[r.frequency] !== undefined) mins[r.frequency] += 5;
  }
  // PulseCheckIn — count as 2 min per check-in
  for (const c of checkIns) {
    if (c.frequency && mins[c.frequency] !== undefined) mins[c.frequency] += 2;
  }
  // FieldSoundscape — use actual duration_seconds
  for (const s of soundscapes) {
    if (s.frequency_channel && mins[s.frequency_channel] !== undefined) {
      mins[s.frequency_channel] += Math.round((s.duration_seconds || 0) / 60);
    }
  }
  // ResonanceJournal (binaural) — use duration_minutes
  for (const j of binauralJournals) {
    const ch = j.session_type === "binaural" ? "healing" : null; // default to healing for binaural
    if (ch) mins[ch] += j.duration_minutes || 0;
  }
  return mins;
}

function deriveStreak(records, checkIns, soundscapes) {
  const allDates = new Set([
    ...records.map(r => r.created_date?.slice(0, 10)),
    ...checkIns.map(c => c.created_date?.slice(0, 10)),
    ...soundscapes.map(s => s.created_date?.slice(0, 10)),
  ].filter(Boolean));
  const sorted = [...allDates].sort().reverse();
  if (!sorted.length) return 0;
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (const d of sorted) {
    const day = new Date(d + "T12:00:00Z");
    const diff = Math.round((cursor - day) / 86400000);
    if (diff <= 1) { streak++; cursor = day; }
    else break;
  }
  return streak;
}

function deriveCoherenceHistory(checkIns) {
  const byDay = {};
  for (const c of checkIns) {
    const day = c.created_date?.slice(0, 10);
    if (!day) continue;
    if (!byDay[day]) byDay[day] = { sum: 0, count: 0 };
    byDay[day].sum += c.resonance_score || 0;
    byDay[day].count++;
  }
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, { sum, count }]) => ({
      date: new Date(date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: Math.round(sum / count),
    }));
}

export default function ResonanceMastery() {
  const [loading,      setLoading]      = useState(true);
  const [records,      setRecords]      = useState([]);
  const [checkIns,     setCheckIns]     = useState([]);
  const [soundscapes,  setSoundscapes]  = useState([]);
  const [journals,     setJournals]     = useState([]);
  const [participant,  setParticipant]  = useState(null);
  const [selectedCh,   setSelectedCh]  = useState(null); // channel detail view
  const [newBadges,    setNewBadges]    = useState([]); // for toast notification

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      const [parts, recs, cins, sounds, jours] = await Promise.all([
        base44.entities.Participant.filter({ user_email: me.email }, "-created_date", 1),
        base44.entities.ResonanceRecord.filter({ created_by: me.email }, "-created_date", 2000),
        base44.entities.PulseCheckIn.filter({ created_by: me.email }, "-created_date", 2000),
        base44.entities.FieldSoundscape.filter({ created_by: me.email }, "-created_date", 500),
        base44.entities.ResonanceJournal.filter({ created_by: me.email }, "-created_date", 500),
      ]);
      setParticipant(parts[0] || null);
      setRecords(recs);
      setCheckIns(cins);
      setSoundscapes(sounds);
      setJournals(jours);
      setLoading(false);
    };
    load();
  }, []);

  const channelMinutes  = useMemo(() => deriveChannelMinutes(records, checkIns, soundscapes, journals), [records, checkIns, soundscapes, journals]);
  const unlockedBadges  = useMemo(() => computeUnlockedBadges(channelMinutes), [channelMinutes]);
  const streak          = useMemo(() => deriveStreak(records, checkIns, soundscapes), [records, checkIns, soundscapes]);
  const coherenceHistory = useMemo(() => deriveCoherenceHistory(checkIns), [checkIns]);
  const avgCoherence    = useMemo(() => {
    if (!coherenceHistory.length) return 0;
    return Math.round(coherenceHistory.reduce((s, d) => s + d.score, 0) / coherenceHistory.length);
  }, [coherenceHistory]);
  const totalMinutes    = useMemo(() => Object.values(channelMinutes).reduce((s, v) => s + v, 0), [channelMinutes]);
  const topChannel      = useMemo(() => Object.entries(channelMinutes).sort((a, b) => b[1] - a[1])[0], [channelMinutes]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );

  const selectedMeta  = selectedCh ? FREQ_META[selectedCh] : null;
  const selectedMins  = selectedCh ? channelMinutes[selectedCh] : 0;
  const nextBadge     = selectedCh ? getNextBadge(selectedCh, selectedMins) : null;
  const channelBadges = selectedCh ? TIERS.map(t => ({
    tier: t, unlocked: unlockedBadges.includes(getBadgeId(selectedCh, t))
  })) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Award className="w-5 h-5 text-primary" />
          <h1 className="font-heading text-3xl">Resonance Mastery</h1>
        </div>
        <p className="font-body text-sm text-muted-foreground">
          Your coherence journey · frequency mastery · unlockable badges across all session types
        </p>
      </motion.div>

      {/* Stat row */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Session Time", value: `${totalMinutes}m`, icon: Zap,         color: "#c4a35a" },
          { label: "Avg Coherence",      value: `${avgCoherence}%`, icon: TrendingUp,  color: "#34d399" },
          { label: "Active Streak",      value: `${streak}d`,       icon: Calendar,    color: "#60a5fa" },
          { label: "Badges Earned",      value: unlockedBadges.length, icon: Award,    color: "#f472b6" },
        ].map(s => (
          <div key={s.label} className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-4 text-center">
            <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
            <div className="font-heading text-2xl" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] font-body text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Channel mastery wheel */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5">
          <h3 className="font-heading text-base mb-4">Frequency Channel Mastery</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {CHANNELS.map(ch => {
              const meta   = FREQ_META[ch];
              const mins   = channelMinutes[ch] || 0;
              const tier   = [...TIERS].reverse().find(t => mins >= t.minutes);
              const next   = getNextBadge(ch, mins);
              const pct    = next ? Math.min((mins / next.tier.minutes) * 100, 100) : 100;
              const active = selectedCh === ch;

              return (
                <button key={ch} onClick={() => setSelectedCh(active ? null : ch)}
                  className={`rounded-2xl border p-3 text-center transition-all duration-300 hover:border-opacity-70 ${
                    active ? "border-opacity-80 bg-card/60" : "border-border/20 bg-card/20 hover:bg-card/40"
                  }`}
                  style={active ? { borderColor: meta.color + "60", boxShadow: `0 0 16px ${meta.color}15` } : {}}>
                  <div className="text-lg font-heading mb-1" style={{ color: meta.color }}>{meta.glyph}</div>
                  <div className="text-[10px] font-body text-foreground/80 capitalize mb-1">{ch}</div>
                  <div className="text-[9px] font-body text-muted-foreground mb-1.5">{mins}m · {tier?.label || "New"}</div>
                  {/* Progress bar */}
                  <div className="h-1 rounded-full bg-border/20 overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ background: meta.color }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }} />
                  </div>
                  {/* Compact badge row */}
                  <div className="flex justify-center gap-0.5 mt-2">
                    {TIERS.map(t => {
                      const has = unlockedBadges.includes(getBadgeId(ch, t));
                      return (
                        <div key={t.id}
                          className={`w-3 h-3 rounded-full border text-[6px] flex items-center justify-center transition-all ${
                            has ? "border-transparent" : "border-border/20 opacity-30"
                          }`}
                          style={has ? { background: meta.color + "60", borderColor: meta.color } : {}}
                        />
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Channel detail panel */}
          <AnimatePresence>
            {selectedCh && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="mt-2 rounded-2xl border p-4"
                style={{ borderColor: selectedMeta.color + "40", background: selectedMeta.color + "08" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" style={{ color: selectedMeta.color }}>{selectedMeta.glyph}</span>
                    <span className="font-heading text-base capitalize">{selectedCh}</span>
                    <span className="text-[10px] font-body text-muted-foreground">{selectedMins}m logged</span>
                  </div>
                  {nextBadge && (
                    <div className="text-[10px] font-body text-muted-foreground">
                      Next: <span style={{ color: selectedMeta.color }}>{nextBadge.tier.label}</span> in {nextBadge.remaining}m
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {channelBadges.map(({ tier, unlocked }) => (
                    <MasteryBadge key={tier.id} channel={selectedCh} tier={tier} unlocked={unlocked} minutes={selectedMins} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right: Coherence chart + top channel */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="flex flex-col gap-4">

          {/* Top channel */}
          {topChannel && topChannel[1] > 0 && (
            <div className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-4">
              <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-2">Dominant Channel</div>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-heading" style={{ color: FREQ_META[topChannel[0]]?.color }}>
                  {FREQ_META[topChannel[0]]?.glyph}
                </div>
                <div>
                  <div className="text-sm font-body capitalize text-foreground/90">{topChannel[0]}</div>
                  <div className="text-[10px] font-body text-muted-foreground">{topChannel[1]}m · your resonance anchor</div>
                </div>
              </div>
            </div>
          )}

          {/* Coherence chart */}
          <div className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-body text-foreground/80">Coherence (30d)</span>
            </div>
            {coherenceHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={coherenceHistory} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 8 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 10 }}
                    formatter={v => [`${v}%`, "Coherence"]} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={1.5}
                    dot={false} activeDot={{ r: 3, fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-24 flex items-center justify-center text-xs font-body text-muted-foreground">
                Complete pulse check-ins to see trends
              </div>
            )}
          </div>

          {/* All unlocked badges summary */}
          <div className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-4">
            <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-2">All Earned Badges ({unlockedBadges.length})</div>
            {unlockedBadges.length === 0 ? (
              <p className="text-[10px] font-body text-muted-foreground/60 italic">Start sessions to unlock your first badge</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {CHANNELS.flatMap(ch =>
                  TIERS.filter(t => unlockedBadges.includes(getBadgeId(ch, t))).map(t => (
                    <div key={getBadgeId(ch, t)} title={`${ch} · ${t.label}`}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-heading border"
                      style={{ background: FREQ_META[ch].color + "25", borderColor: FREQ_META[ch].color + "60", color: FREQ_META[ch].color }}>
                      {t.symbol}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Full badge grid */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="mt-4 bg-card/20 border border-border/20 rounded-2xl p-5">
        <h3 className="font-heading text-base mb-4">Full Badge Registry</h3>
        <div className="space-y-4">
          {CHANNELS.map(ch => (
            <div key={ch}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm" style={{ color: FREQ_META[ch].color }}>{FREQ_META[ch].glyph}</span>
                <span className="text-xs font-body capitalize text-foreground/70">{ch}</span>
                <span className="text-[10px] font-body text-muted-foreground">{channelMinutes[ch] || 0}m</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {TIERS.map(t => (
                  <MasteryBadge key={t.id} channel={ch} tier={t}
                    unlocked={unlockedBadges.includes(getBadgeId(ch, t))}
                    minutes={channelMinutes[ch] || 0} compact />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-[9px] font-body text-muted-foreground/40">
          Time is derived from: inscriptions (5m ea) · pulse check-ins (2m ea) · soundscape recordings (actual duration) · binaural journal sessions
        </div>
      </motion.div>
    </div>
  );
}