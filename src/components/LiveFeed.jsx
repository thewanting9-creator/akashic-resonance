import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";

const FREQ_COLORS = {
  unity:"#c4a35a", creation:"#a78bfa", transformation:"#f472b6",
  healing:"#34d399", awakening:"#60a5fa", remembrance:"#fb923c",
  vision:"#e879f9", connection:"#2dd4bf",
};
const EMOTION_ICONS = {
  love:"♥", wonder:"✦", peace:"◎", joy:"☀", gratitude:"✿",
  clarity:"◈", longing:"☽", awe:"✸", compassion:"❋", transcendence:"∞"
};

const POLL_INTERVAL = 8000; // 8s pseudo-realtime

export default function LiveFeed() {
  const [records, setRecords] = useState([]);
  const [pulse, setPulse]     = useState(false);
  const [online, setOnline]   = useState(true);
  const prevIdsRef = useRef(new Set());
  const newIdsRef  = useRef(new Set());

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await base44.entities.ResonanceRecord.list("-created_date", 10);
        const prevIds = prevIdsRef.current;
        const incoming = new Set(data.map(r => r.id));
        const fresh = data.filter(r => !prevIds.has(r.id));

        if (fresh.length > 0) {
          newIdsRef.current = new Set(fresh.map(r => r.id));
          setPulse(true);
          setTimeout(() => setPulse(false), 1200);
          setTimeout(() => { newIdsRef.current = new Set(); }, 3000);
        }

        prevIdsRef.current = incoming;
        setRecords(data);
        setOnline(true);
      } catch {
        setOnline(false);
      }
    };

    fetch();
    const id = setInterval(fetch, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary" />
          <h3 className="font-heading text-base">Live Feed</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Heartbeat pulse ring */}
          <div className="relative w-5 h-5 flex items-center justify-center">
            {pulse && (
              <motion.div
                className="absolute inset-0 rounded-full border border-primary"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            )}
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${online ? "bg-primary" : "bg-muted-foreground"}`} />
          </div>
          <span className="text-[10px] font-body text-muted-foreground">
            {online ? "collective heartbeat" : "reconnecting…"}
          </span>
        </div>
      </div>

      {/* Records list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {records.map((r) => {
            const isNew = newIdsRef.current.has(r.id);
            const color = FREQ_COLORS[r.frequency] || "#888";
            const icon  = EMOTION_ICONS[r.emotion]  || "·";
            return (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: -12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className={`relative flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-colors duration-700 ${
                  isNew ? "bg-primary/5 border-primary/20" : "bg-secondary/20 border-border/20"
                }`}
              >
                {/* Frequency color strip */}
                <div className="w-0.5 self-stretch rounded-full flex-shrink-0 mt-0.5" style={{ background: color }} />

                {/* Emotion icon */}
                <div className="text-sm mt-0.5 flex-shrink-0 leading-none" style={{ color }}>
                  {icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-foreground/80 line-clamp-2 leading-snug">
                    "{r.thought}"
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-body capitalize" style={{ color }}>{r.frequency}</span>
                    <span className="text-[10px] text-muted-foreground font-body capitalize">{r.emotion}</span>
                    {r.echoes > 0 && (
                      <span className="text-[10px] text-primary font-body">{r.echoes} echoes</span>
                    )}
                  </div>
                </div>

                {isNew && (
                  <motion.div
                    className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {records.length === 0 && (
          <div className="text-center py-8 text-muted-foreground font-body text-sm">
            Awaiting inscriptions…
          </div>
        )}
      </div>
    </div>
  );
}