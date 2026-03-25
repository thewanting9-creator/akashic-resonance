import { motion } from "framer-motion";

const ORB_COLORS = [
  "from-violet-500/30 to-purple-600/20",
  "from-amber-400/25 to-orange-500/15",
  "from-sky-400/25 to-cyan-500/15",
  "from-rose-400/25 to-pink-500/15",
  "from-emerald-400/25 to-teal-500/15",
  "from-fuchsia-400/25 to-purple-500/15",
  "from-indigo-400/25 to-blue-500/15",
];

export default function ResonanceOrb({ record, index, onClick }) {
  const colorClass = ORB_COLORS[index % ORB_COLORS.length];
  const size = 60 + (record.echoes || 0) * 5;
  const clampedSize = Math.min(size, 140);

  return (
    <motion.button
      onClick={() => onClick && onClick(record)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.15 }}
      className="relative group cursor-pointer"
      style={{
        animation: `float ${4 + (index % 3)}s ease-in-out infinite`,
        animationDelay: `${index * 0.5}s`,
      }}
    >
      <div
        className={`rounded-full bg-gradient-to-br ${colorClass} backdrop-blur-sm border border-white/5 flex items-center justify-center`}
        style={{ width: clampedSize, height: clampedSize }}
      >
        <span className="font-heading text-xs text-foreground/70 text-center px-2 leading-tight line-clamp-2">
          {record.thought?.substring(0, 30)}
        </span>
      </div>

      {/* Glow effect on hover */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${colorClass} blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500`}
        style={{ width: clampedSize, height: clampedSize }}
      />
    </motion.button>
  );
}