import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth } from "date-fns";

const FREQ_COLORS = {
  unity:"#c4a35a", creation:"#a78bfa", transformation:"#f472b6",
  healing:"#34d399", awakening:"#60a5fa", remembrance:"#fb923c",
  vision:"#e879f9", connection:"#2dd4bf",
};

export default function PersonalCalendar({ records = [], onSelectDay }) {
  const [current, setCurrent] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(current);
    const end   = endOfMonth(current);
    return eachDayOfInterval({ start, end });
  }, [current]);

  const recordsByDay = useMemo(() => {
    const map = {};
    for (const r of records) {
      const d = r.created_date?.slice(0, 10);
      if (!d) continue;
      if (!map[d]) map[d] = [];
      map[d].push(r);
    }
    return map;
  }, [records]);

  const startPad = getDay(days[0]);

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-5">
      {/* Nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-heading text-base">{format(current, "MMMM yyyy")}</h3>
        <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="text-muted-foreground hover:text-foreground">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-center text-[10px] font-body text-muted-foreground/50 py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const key   = format(day, "yyyy-MM-dd");
          const recs  = recordsByDay[key] || [];
          const hasRec = recs.length > 0;
          const dominantFreq = hasRec
            ? recs.reduce((acc, r) => {
                acc[r.frequency] = (acc[r.frequency] || 0) + 1;
                return acc;
              }, {})
            : null;
          const topFreq = dominantFreq
            ? Object.entries(dominantFreq).sort((a,b) => b[1]-a[1])[0]?.[0]
            : null;

          return (
            <motion.button
              key={key}
              whileHover={{ scale: 1.1 }}
              onClick={() => hasRec && onSelectDay && onSelectDay(recs)}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-body transition-colors ${
                hasRec ? "hover:bg-secondary/40 cursor-pointer" : "cursor-default"
              }`}
            >
              <span className={`text-[11px] ${hasRec ? "text-foreground/90" : "text-muted-foreground/40"}`}>
                {format(day, "d")}
              </span>
              {hasRec && topFreq && (
                <div className="flex gap-px mt-0.5">
                  {recs.slice(0, 3).map((r, i) => (
                    <div key={i} className="w-1 h-1 rounded-full" style={{ background: FREQ_COLORS[r.frequency] || "#888" }} />
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}