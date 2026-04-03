import { motion } from "framer-motion";

const TIERS = [
  { id: "initiate",  label: "Initiate",  minutes: 10,   symbol: "◌" },
  { id: "attuned",   label: "Attuned",   minutes: 60,   symbol: "◎" },
  { id: "resonant",  label: "Resonant",  minutes: 300,  symbol: "✦" },
  { id: "coherent",  label: "Coherent",  minutes: 900,  symbol: "✸" },
  { id: "sovereign", label: "Sovereign", minutes: 2700, symbol: "∞" },
];

const FREQ_META = {
  unity:          { color: "#c4a35a", glyph: "⊕" },
  creation:       { color: "#a78bfa", glyph: "✺" },
  transformation: { color: "#f472b6", glyph: "⟳" },
  healing:        { color: "#34d399", glyph: "♡" },
  awakening:      { color: "#60a5fa", glyph: "△" },
  remembrance:    { color: "#fb923c", glyph: "☽" },
  vision:         { color: "#e879f9", glyph: "◈" },
  connection:     { color: "#2dd4bf", glyph: "∞" },
};

export function getBadgeId(channel, tier) {
  return `${channel}_${tier.id}`;
}

export function computeUnlockedBadges(channelMinutes) {
  const unlocked = [];
  for (const [channel, minutes] of Object.entries(channelMinutes || {})) {
    for (const tier of TIERS) {
      if (minutes >= tier.minutes) unlocked.push(getBadgeId(channel, tier));
    }
  }
  return unlocked;
}

export function getNextBadge(channel, minutes) {
  for (const tier of TIERS) {
    if (minutes < tier.minutes) return { tier, remaining: tier.minutes - minutes };
  }
  return null; // all unlocked
}

export default function MasteryBadge({ channel, tier, unlocked, minutes, compact = false }) {
  const meta = FREQ_META[channel] || { color: "#888", glyph: "·" };

  if (compact) {
    return (
      <motion.div
        title={`${channel} · ${tier.label}`}
        whileHover={{ scale: 1.15 }}
        className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-heading transition-all ${
          unlocked
            ? "border-transparent shadow-lg"
            : "border-border/20 opacity-30 grayscale"
        }`}
        style={unlocked ? { background: meta.color + "30", borderColor: meta.color + "60", color: meta.color } : {}}
      >
        {tier.symbol}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-2xl border p-4 flex flex-col items-center gap-2 text-center transition-all ${
        unlocked
          ? "bg-card/50 border-border/40"
          : "bg-card/20 border-border/10 opacity-40 grayscale"
      }`}
      style={unlocked ? { boxShadow: `0 0 20px ${meta.color}20` } : {}}
    >
      {/* Glow */}
      {unlocked && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 30%, ${meta.color}18 0%, transparent 70%)` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {/* Badge icon */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-heading border-2 relative z-10"
        style={unlocked
          ? { background: meta.color + "25", borderColor: meta.color + "70", color: meta.color }
          : { borderColor: "#444" }
        }
      >
        {meta.glyph}
      </div>

      <div className="relative z-10">
        <div className="text-xs font-body font-medium capitalize text-foreground/90">{channel}</div>
        <div className="text-[10px] font-body text-muted-foreground">{tier.label}</div>
        <div className="text-[9px] font-body mt-0.5" style={unlocked ? { color: meta.color } : { color: "#666" }}>
          {tier.symbol} {tier.minutes}m
        </div>
      </div>
    </motion.div>
  );
}

export { TIERS, FREQ_META };