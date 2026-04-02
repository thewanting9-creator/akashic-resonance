import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO, startOfWeek, addWeeks, isBefore } from "date-fns";
import { motion } from "framer-motion";

const FREQ_COLORS = {
  unity:"#c4a35a", creation:"#a78bfa", transformation:"#f472b6",
  healing:"#34d399", awakening:"#60a5fa", remembrance:"#fb923c",
  vision:"#e879f9", connection:"#2dd4bf",
};

export default function FrequencyTrends({ records = [] }) {
  const { weeklyData, activeFreqs, topFreq, totalEchoes } = useMemo(() => {
    if (!records.length) return { weeklyData: [], activeFreqs: [], topFreq: null, totalEchoes: 0 };

    const sorted = [...records].sort((a, b) => a.created_date?.localeCompare(b.created_date));
    const start  = startOfWeek(parseISO(sorted[0].created_date));
    const end    = startOfWeek(new Date());

    const weeks = [];
    let cur = start;
    while (!isBefore(end, cur)) {
      weeks.push(format(cur, "yyyy-MM-dd"));
      cur = addWeeks(cur, 1);
    }

    const byWeek = {};
    for (const r of records) {
      const w = format(startOfWeek(parseISO(r.created_date)), "yyyy-MM-dd");
      if (!byWeek[w]) byWeek[w] = {};
      byWeek[w][r.frequency] = (byWeek[w][r.frequency] || 0) + 1;
    }

    const weeklyData = weeks.map(w => ({ week: w, ...byWeek[w] }));

    const freqTotals = {};
    for (const r of records) freqTotals[r.frequency] = (freqTotals[r.frequency] || 0) + 1;
    const activeFreqs = Object.keys(freqTotals).sort((a, b) => freqTotals[b] - freqTotals[a]);
    const topFreq = activeFreqs[0] || null;
    const totalEchoes = records.reduce((s, r) => s + (r.echoes || 0), 0);

    return { weeklyData, activeFreqs, topFreq, totalEchoes };
  }, [records]);

  if (weeklyData.length < 2) {
    return (
      <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-5">
        <h3 className="font-heading text-base mb-3">Frequency Trends</h3>
        <div className="h-32 flex items-center justify-center text-muted-foreground font-body text-sm">
          Inscribe more records to surface trends
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base">Frequency Trends</h3>
        {topFreq && (
          <span className="text-xs font-body capitalize px-2 py-0.5 rounded-full border" style={{ color: FREQ_COLORS[topFreq], borderColor: FREQ_COLORS[topFreq] + "44" }}>
            dominant · {topFreq}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <XAxis dataKey="week" tickFormatter={v => format(parseISO(v), "MMM d")} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
            labelFormatter={v => format(parseISO(v), "MMM d, yyyy")}
          />
          {activeFreqs.map((freq, i) => (
            <Area
              key={freq} type="monotone" dataKey={freq}
              stroke={FREQ_COLORS[freq] || "#888"}
              fill={FREQ_COLORS[freq] || "#888"}
              fillOpacity={0.08 + (i === 0 ? 0.06 : 0)}
              strokeWidth={1.5} dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Freq bars */}
      <div className="mt-4 space-y-1.5">
        {activeFreqs.map(freq => {
          const count = records.filter(r => r.frequency === freq).length;
          return (
            <div key={freq}>
              <div className="flex justify-between text-[10px] font-body mb-0.5">
                <span className="capitalize text-foreground/70">{freq}</span>
                <span className="text-muted-foreground">{count}</span>
              </div>
              <div className="h-1 rounded-full bg-border/20 overflow-hidden">
                <motion.div className="h-full rounded-full"
                  style={{ background: FREQ_COLORS[freq] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / records.length) * 100}%` }}
                  transition={{ duration: 0.7 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}