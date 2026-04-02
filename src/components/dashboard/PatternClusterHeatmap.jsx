import { motion } from "framer-motion";

const EMOTION_ORDER = [
  "love", "wonder", "peace", "joy", "gratitude",
  "clarity", "longing", "awe", "compassion", "transcendence"
];

const FREQUENCY_ORDER = [
  "unity", "creation", "transformation", "healing",
  "awakening", "remembrance", "vision", "connection"
];

function getIntensity(count, max) {
  if (!count) return 0;
  return Math.ceil((count / max) * 5);
}

const intensityClasses = [
  "bg-transparent",
  "bg-primary/10",
  "bg-primary/25",
  "bg-primary/45",
  "bg-primary/65",
  "bg-primary/85",
];

export default function PatternClusterHeatmap({ records = [] }) {
  // Build emotion × frequency matrix
  const matrix = {};
  let max = 0;
  for (const r of records) {
    const e = r.emotion;
    const f = r.frequency;
    if (!e || !f) continue;
    if (!matrix[e]) matrix[e] = {};
    matrix[e][f] = (matrix[e][f] || 0) + 1;
    if (matrix[e][f] > max) max = matrix[e][f];
  }

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-6">
      <h3 className="font-heading text-lg text-foreground/80 mb-4">Pattern Cluster Heatmap</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-body">
          <thead>
            <tr>
              <td className="w-20 pr-2 text-right text-muted-foreground/50 pb-1">emotion ↓ / freq →</td>
              {FREQUENCY_ORDER.map(f => (
                <td key={f} className="text-center text-muted-foreground/60 pb-1 px-0.5 capitalize min-w-[36px]">
                  {f.slice(0, 4)}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {EMOTION_ORDER.map((emotion, ei) => (
              <tr key={emotion}>
                <td className="text-right pr-2 text-muted-foreground/60 capitalize py-0.5">{emotion}</td>
                {FREQUENCY_ORDER.map((freq, fi) => {
                  const count = matrix[emotion]?.[freq] || 0;
                  const level = getIntensity(count, max);
                  return (
                    <td key={freq} className="px-0.5 py-0.5">
                      <motion.div
                        className={`w-7 h-7 rounded-sm mx-auto border border-border/10 ${intensityClasses[level]} relative group cursor-default`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (ei * 8 + fi) * 0.008 }}
                        title={`${emotion} × ${freq}: ${count}`}
                      >
                        {count > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] text-foreground/60 opacity-0 group-hover:opacity-100">
                            {count}
                          </span>
                        )}
                      </motion.div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-muted-foreground font-body">density:</span>
        {intensityClasses.slice(1).map((cls, i) => (
          <div key={i} className={`w-4 h-4 rounded-sm border border-border/10 ${cls}`} />
        ))}
        <span className="text-[10px] text-muted-foreground font-body ml-1">high</span>
      </div>
    </div>
  );
}