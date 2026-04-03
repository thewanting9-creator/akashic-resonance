import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, User, Globe, Play, Pause, ChevronLeft, ChevronRight, Archive, Loader2, Sparkles } from "lucide-react";
import TemporalGlobe from "../components/globe/TemporalGlobe";

const FREQ_COLORS = {
  unity:"#c4a35a", creation:"#a78bfa", transformation:"#f472b6",
  healing:"#34d399", awakening:"#60a5fa", remembrance:"#fb923c",
  vision:"#e879f9", connection:"#2dd4bf",
};

const MOOD_COLORS = {
  calm:"#34d399", creative:"#a78bfa", focused:"#60a5fa", inspired:"#fbbf24",
  anxious:"#f87171", flow:"#2dd4bf", grateful:"#f472b6", insight:"#fb923c", heightened:"#e879f9",
};

function bucketDate(iso, granularity) {
  const d = new Date(iso);
  if (granularity === "day")   return d.toISOString().slice(0, 10);
  if (granularity === "week") {
    const day = d.getDay();
    const diff = d.getDate() - day;
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 7); // month
}

function buildBuckets(records, checkIns, granularity) {
  const map = {};
  const all = [
    ...records.map(r  => ({ ...r, _type: "record" })),
    ...checkIns.map(c => ({ ...c, _type: "checkin" })),
  ];
  for (const item of all) {
    const key = bucketDate(item.created_date, granularity);
    if (!map[key]) map[key] = { records: [], checkIns: [], freqCounts: {}, moodCounts: {}, emotionCounts: {}, total: 0 };
    if (item._type === "record") {
      map[key].records.push(item);
      if (item.frequency) map[key].freqCounts[item.frequency] = (map[key].freqCounts[item.frequency] || 0) + 1;
      if (item.emotion)   map[key].emotionCounts[item.emotion] = (map[key].emotionCounts[item.emotion] || 0) + 1;
    } else {
      map[key].checkIns.push(item);
      if (item.mood_tag)  map[key].moodCounts[item.mood_tag] = (map[key].moodCounts[item.mood_tag] || 0) + 1;
      if (item.frequency) map[key].freqCounts[item.frequency] = (map[key].freqCounts[item.frequency] || 0) + 1;
    }
    map[key].total++;
  }
  return map;
}

// Cumulative snapshot up to and including bucketIndex
function cumulativeSnapshot(sortedKeys, bucketMap, bucketIdx) {
  const freqCounts = {}, moodCounts = {}, emotionCounts = {};
  let total = 0, records = 0, checkIns = 0;
  for (let i = 0; i <= bucketIdx; i++) {
    const b = bucketMap[sortedKeys[i]];
    if (!b) continue;
    total    += b.total;
    records  += b.records.length;
    checkIns += b.checkIns.length;
    for (const [k, v] of Object.entries(b.freqCounts))   freqCounts[k]   = (freqCounts[k]   || 0) + v;
    for (const [k, v] of Object.entries(b.moodCounts))   moodCounts[k]   = (moodCounts[k]   || 0) + v;
    for (const [k, v] of Object.entries(b.emotionCounts)) emotionCounts[k] = (emotionCounts[k] || 0) + v;
  }
  return { freqCounts, moodCounts, emotionCounts, total, records, checkIns };
}

export default function Resonance4D() {
  const [loading,     setLoading]     = useState(true);
  const [allRecords,  setAllRecords]  = useState([]);
  const [allCheckIns, setAllCheckIns] = useState([]);
  const [myRecords,   setMyRecords]   = useState([]);
  const [myCheckIns,  setMyCheckIns]  = useState([]);
  const [participant, setParticipant] = useState(null);
  const [userMode,    setUserMode]    = useState(false); // false = all-time archive, true = user emergence
  const [bucketIdx,   setBucketIdx]   = useState(0);
  const [granularity, setGranularity] = useState("week");
  const [playing,     setPlaying]     = useState(false);
  const [archiveCount, setArchiveCount] = useState(null);
  const playRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      const [parts, records, checkins, archives] = await Promise.all([
        base44.entities.Participant.filter({ user_email: me.email }, "-created_date", 1),
        base44.entities.ResonanceRecord.list("-created_date", 2000),
        base44.entities.PulseCheckIn.list("-created_date", 2000),
        base44.entities.ResonanceArchive.list("-created_date", 1),
      ]);
      const part = parts[0] || null;
      setParticipant(part);
      setAllRecords(records);
      setAllCheckIns(checkins);
      setArchiveCount(archives.length);

      if (part) {
        const emergeTs = part.emergence_timestamp || part.created_date;
        setMyRecords(records.filter(r => r.created_by === me.email && r.created_date >= emergeTs));
        setMyCheckIns(checkins.filter(c => c.created_by === me.email && c.created_date >= emergeTs));
      }
      setLoading(false);
    };
    load();
  }, []);

  const activeRecords  = userMode ? myRecords   : allRecords;
  const activeCheckIns = userMode ? myCheckIns  : allCheckIns;

  const { bucketMap, sortedKeys } = useMemo(() => {
    const map  = buildBuckets(activeRecords, activeCheckIns, granularity);
    const keys = Object.keys(map).sort();
    return { bucketMap: map, sortedKeys: keys };
  }, [activeRecords, activeCheckIns, granularity]);

  const snapshot = useMemo(() => {
    if (!sortedKeys.length) return null;
    const idx = Math.min(bucketIdx, sortedKeys.length - 1);
    return cumulativeSnapshot(sortedKeys, bucketMap, idx);
  }, [sortedKeys, bucketMap, bucketIdx]);

  const currentKey = sortedKeys[Math.min(bucketIdx, sortedKeys.length - 1)];

  // Playback
  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => {
        setBucketIdx(i => {
          if (i >= sortedKeys.length - 1) { setPlaying(false); return i; }
          return i + 1;
        });
      }, 600);
    } else {
      clearInterval(playRef.current);
    }
    return () => clearInterval(playRef.current);
  }, [playing, sortedKeys.length]);

  // Reset idx when data changes
  useEffect(() => {
    setBucketIdx(sortedKeys.length > 0 ? sortedKeys.length - 1 : 0);
  }, [sortedKeys.length, userMode, granularity]);

  const topFreq  = snapshot ? Object.entries(snapshot.freqCounts).sort((a,b) => b[1]-a[1])[0] : null;
  const topMood  = snapshot ? Object.entries(snapshot.moodCounts).sort((a,b) => b[1]-a[1])[0] : null;

  const fmtKey = key => {
    if (!key) return "—";
    if (granularity === "month") return new Date(key + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return new Date(key + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 max-w-6xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-primary" />
              <h1 className="font-heading text-3xl">4D Resonance Archive</h1>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-card/30 border border-border/30 rounded-xl p-1">
              <button onClick={() => setUserMode(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body transition-all ${!userMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Archive className="w-3 h-3" /> All Archives
              </button>
              <button onClick={() => setUserMode(true)} disabled={!participant}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body transition-all disabled:opacity-40 ${userMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <User className="w-3 h-3" /> My Emergence
              </button>
            </div>
          </div>

          <p className="font-body text-sm text-muted-foreground">
            {userMode
              ? `Viewing from your emergence · ${myRecords.length + myCheckIns.length} personal events`
              : `Full collective archive · ${allRecords.length + allCheckIns.length} events · ${archiveCount ?? "—"} monitor snapshots`
            }
          </p>
        </motion.div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 pb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Globe */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl overflow-hidden relative"
          style={{ minHeight: 460 }}>
          <TemporalGlobe snapshot={snapshot} />

          {/* Current date overlay */}
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-border/30 text-xs font-body text-foreground/80 flex items-center gap-2">
            <Globe className="w-3 h-3 text-primary" />
            {fmtKey(currentKey)}
          </div>

          {/* Snapshot stats overlay */}
          {snapshot && (
            <div className="absolute bottom-4 left-4 right-4 flex gap-2 flex-wrap">
              {[
                { label: "Inscriptions", value: snapshot.records },
                { label: "Check-ins",   value: snapshot.checkIns },
                { label: "Cumulative",  value: snapshot.total },
              ].map(s => (
                <div key={s.label} className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-border/30 text-[10px] font-body text-foreground/70 flex items-center gap-1.5">
                  <span className="text-primary font-medium">{s.value}</span> {s.label}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Side panel */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="flex flex-col gap-3">

          {/* Granularity */}
          <div className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-4">
            <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-2">Time Granularity</div>
            <div className="flex gap-1.5">
              {["day", "week", "month"].map(g => (
                <button key={g} onClick={() => setGranularity(g)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-body capitalize border transition-all ${granularity === g ? "bg-primary text-primary-foreground border-primary" : "border-border/40 text-muted-foreground hover:text-foreground"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Dominant frequency at slice */}
          {snapshot && (
            <div className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-4">
              <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-3">Field State at {fmtKey(currentKey)}</div>
              <div className="space-y-2">
                {topFreq && (
                  <div className="flex justify-between items-center text-xs font-body">
                    <span className="text-muted-foreground">Dominant frequency</span>
                    <span className="capitalize" style={{ color: FREQ_COLORS[topFreq[0]] || "#aaa" }}>{topFreq[0]} ({topFreq[1]})</span>
                  </div>
                )}
                {topMood && (
                  <div className="flex justify-between items-center text-xs font-body">
                    <span className="text-muted-foreground">Top mood</span>
                    <span className="capitalize" style={{ color: MOOD_COLORS[topMood[0]] || "#aaa" }}>{topMood[0]} ({topMood[1]})</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs font-body">
                  <span className="text-muted-foreground">Active frequencies</span>
                  <span className="text-foreground/70">{Object.keys(snapshot.freqCounts).length}</span>
                </div>
              </div>

              {/* Frequency bars */}
              <div className="mt-3 space-y-1.5">
                {Object.entries(snapshot.freqCounts).sort((a,b) => b[1]-a[1]).slice(0, 6).map(([freq, count]) => (
                  <div key={freq}>
                    <div className="flex justify-between text-[10px] font-body mb-0.5">
                      <span className="capitalize text-foreground/60">{freq}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-border/20 overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ background: FREQ_COLORS[freq] || "#888" }}
                        animate={{ width: `${(count / Math.max(snapshot.total, 1)) * 100}%` }}
                        transition={{ duration: 0.4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User emergence marker */}
          {participant && userMode && (
            <div className="bg-card/20 border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-body text-primary">Emergence Anchor</span>
              </div>
              <div className="text-[10px] font-body text-muted-foreground">
                {participant.emergence_timestamp
                  ? new Date(participant.emergence_timestamp).toLocaleDateString("en-US", { dateStyle: "long" })
                  : "Not yet anchored"}
              </div>
              <div className="text-[10px] font-body text-muted-foreground/60 mt-1">
                ID: {participant.atomic_consciousness_number} · {participant.torus_domain} Torus
              </div>
            </div>
          )}

          {/* Archive monitor note */}
          <div className="bg-card/20 border border-border/20 rounded-2xl p-4">
            <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-2">Archive Layers</div>
            <div className="space-y-1 text-[10px] font-body text-muted-foreground/70">
              {["SR readings", "Pulse check-ins", "Inscriptions", "Binaural sessions", "Photic sessions", "ULF/ELF readings", "GCI/GCP snapshots", "Planetary SR", "nanoHz GW", "Intention circles", "Astro Lab runs", "Collective patterns"].map(l => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-primary/50" />{l}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Time scrubber */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="sticky bottom-0 z-20 bg-background/80 backdrop-blur-xl border-t border-border/30 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Play/pause */}
            <button onClick={() => { if (bucketIdx >= sortedKeys.length - 1) setBucketIdx(0); setPlaying(p => !p); }}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Prev */}
            <button onClick={() => setBucketIdx(i => Math.max(0, i - 1))}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrubber */}
            <div className="flex-1 flex flex-col gap-1">
              <input type="range" min={0} max={Math.max(sortedKeys.length - 1, 0)} value={bucketIdx}
                onChange={e => setBucketIdx(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
                style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${(bucketIdx / Math.max(sortedKeys.length - 1, 1)) * 100}%, hsl(var(--border)) 0%)` }}
              />
              <div className="flex justify-between text-[9px] font-body text-muted-foreground/60">
                <span>{fmtKey(sortedKeys[0])}</span>
                <span className="text-primary font-medium">{fmtKey(currentKey)}</span>
                <span>{fmtKey(sortedKeys[sortedKeys.length - 1])}</span>
              </div>
            </div>

            {/* Next */}
            <button onClick={() => setBucketIdx(i => Math.min(sortedKeys.length - 1, i + 1))}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Bucket counter */}
            <div className="flex-shrink-0 text-[10px] font-body text-muted-foreground whitespace-nowrap">
              {bucketIdx + 1} / {sortedKeys.length}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}