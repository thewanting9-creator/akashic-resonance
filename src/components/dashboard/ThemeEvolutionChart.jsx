import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO, startOfDay } from "date-fns";

const FREQUENCY_COLORS = {
  unity:          "#c4a35a",
  creation:       "#a78bfa",
  transformation: "#f472b6",
  healing:        "#34d399",
  awakening:      "#60a5fa",
  remembrance:    "#fb923c",
  vision:         "#e879f9",
  connection:     "#2dd4bf",
};

const FREQUENCIES = Object.keys(FREQUENCY_COLORS);

export default function ThemeEvolutionChart({ records = [] }) {
  const data = useMemo(() => {
    const byDay = {};
    for (const r of records) {
      const day = startOfDay(parseISO(r.created_date)).toISOString();
      if (!byDay[day]) byDay[day] = { date: day };
      byDay[day][r.frequency] = (byDay[day][r.frequency] || 0) + 1;
    }
    return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  if (data.length < 2) {
    return (
      <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-6">
        <h3 className="font-heading text-lg text-foreground/80 mb-4">Collective Theme Evolution</h3>
        <div className="h-48 flex items-center justify-center text-muted-foreground font-body text-sm">
          Insufficient data for time-series
        </div>
      </div>
    );
  }

  const activeFreqs = FREQUENCIES.filter(f => data.some(d => d[f] > 0));

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-6">
      <h3 className="font-heading text-lg text-foreground/80 mb-4">Collective Theme Evolution</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
          <XAxis
            dataKey="date"
            tickFormatter={v => format(parseISO(v), "MMM d")}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "var(--font-body)"
            }}
            labelFormatter={v => format(parseISO(v), "MMM d, yyyy")}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-body)", paddingTop: 8 }}
          />
          {activeFreqs.map(freq => (
            <Line
              key={freq}
              type="monotone"
              dataKey={freq}
              stroke={FREQUENCY_COLORS[freq]}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}