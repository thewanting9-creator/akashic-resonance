import { useMemo } from "react";
import { motion } from "framer-motion";

const EMOTION_SET = new Set([
  "love","wonder","peace","joy","gratitude",
  "clarity","longing","awe","compassion","transcendence"
]);
const FREQUENCY_SET = new Set([
  "unity","creation","transformation","healing",
  "awakening","remembrance","vision","connection"
]);

function tagsFor(record) {
  const tags = new Set();
  if (record.emotion)   tags.add(`emotion:${record.emotion}`);
  if (record.frequency) tags.add(`freq:${record.frequency}`);
  if (record.depth)     tags.add(`depth:${record.depth}`);
  if (record.intention) {
    record.intention.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 4)
      .forEach(w => tags.add(`intent:${w}`));
  }
  return tags;
}

function labelFor(tag) {
  const [type, val] = tag.split(":");
  if (type === "emotion")  return { label: val, color: "#f472b6", kind: "Emotion" };
  if (type === "freq")     return { label: val, color: "#a78bfa", kind: "Frequency" };
  if (type === "depth")    return { label: `depth ${val}`, color: "#34d399", kind: "Depth" };
  if (type === "intent")   return { label: val, color: "#60a5fa", kind: "Intention" };
  return { label: tag, color: "#888", kind: "" };
}

export default function ResonanceVenn({ recordA, recordB }) {
  const { onlyA, onlyB, shared } = useMemo(() => {
    if (!recordA || !recordB) return { onlyA: [], onlyB: [], shared: [] };
    const tagsA = tagsFor(recordA);
    const tagsB = tagsFor(recordB);
    const shared = [...tagsA].filter(t => tagsB.has(t));
    const onlyA  = [...tagsA].filter(t => !tagsB.has(t));
    const onlyB  = [...tagsB].filter(t => !tagsA.has(t));
    return { onlyA, onlyB, shared };
  }, [recordA, recordB]);

  if (!recordA || !recordB) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-body text-sm">
        Select two records to compare
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* SVG Venn */}
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 320 160" className="w-full max-w-sm">
          {/* Circle A */}
          <motion.ellipse
            cx="110" cy="80" rx="90" ry="65"
            fill="#a78bfa" fillOpacity="0.12"
            stroke="#a78bfa" strokeOpacity="0.5" strokeWidth="1.5"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{ transformOrigin: "110px 80px" }}
            transition={{ duration: 0.5 }}
          />
          {/* Circle B */}
          <motion.ellipse
            cx="210" cy="80" rx="90" ry="65"
            fill="#f472b6" fillOpacity="0.12"
            stroke="#f472b6" strokeOpacity="0.5" strokeWidth="1.5"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{ transformOrigin: "210px 80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
          {/* Labels */}
          <text x="72" y="22" textAnchor="middle" fontSize="9" fill="#a78bfa" fontFamily="var(--font-body)">Record A</text>
          <text x="248" y="22" textAnchor="middle" fontSize="9" fill="#f472b6" fontFamily="var(--font-body)">Record B</text>

          {/* Shared count bubble */}
          {shared.length > 0 && (
            <motion.text
              x="160" y="84"
              textAnchor="middle" fontSize="18"
              fill="white" fillOpacity="0.6"
              fontFamily="var(--font-heading)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {shared.length}
            </motion.text>
          )}
          {shared.length > 0 && (
            <text x="160" y="96" textAnchor="middle" fontSize="7.5" fill="white" fillOpacity="0.4" fontFamily="var(--font-body)">shared</text>
          )}

          {/* Left count */}
          <text x="85" y="84" textAnchor="middle" fontSize="16" fill="#a78bfa" fillOpacity="0.7" fontFamily="var(--font-heading)">{onlyA.length}</text>
          <text x="85" y="96" textAnchor="middle" fontSize="7.5" fill="#a78bfa" fillOpacity="0.5" fontFamily="var(--font-body)">unique</text>

          {/* Right count */}
          <text x="235" y="84" textAnchor="middle" fontSize="16" fill="#f472b6" fillOpacity="0.7" fontFamily="var(--font-heading)">{onlyB.length}</text>
          <text x="235" y="96" textAnchor="middle" fontSize="7.5" fill="#f472b6" fillOpacity="0.5" fontFamily="var(--font-body)">unique</text>
        </svg>
      </div>

      {/* Tag zones */}
      <div className="grid grid-cols-3 gap-3 text-xs font-body">
        <TagZone title="Only A" tags={onlyA} labelFn={labelFor} border="border-violet-500/20" />
        <TagZone title="Shared" tags={shared} labelFn={labelFor} border="border-primary/30" highlight />
        <TagZone title="Only B" tags={onlyB} labelFn={labelFor} border="border-pink-500/20" />
      </div>
    </div>
  );
}

function TagZone({ title, tags, labelFn, border, highlight }) {
  return (
    <div className={`rounded-xl border ${border} p-2 bg-card/20`}>
      <div className={`text-[10px] uppercase tracking-wide mb-1.5 ${highlight ? "text-primary" : "text-muted-foreground"}`}>
        {title}
      </div>
      {tags.length === 0 ? (
        <div className="text-muted-foreground/40 italic text-[10px]">none</div>
      ) : (
        <div className="flex flex-col gap-1">
          {tags.map((tag, i) => {
            const { label, color, kind } = labelFn(tag);
            return (
              <motion.div
                key={tag}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-1"
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="capitalize text-foreground/70 truncate">{label}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}