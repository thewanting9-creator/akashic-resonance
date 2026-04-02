import { motion } from "framer-motion";

export default function TorusBalanceGauge({ topCount = 0, bottomCount = 0 }) {
  const total = topCount + bottomCount || 1;
  const topPct = Math.round((topCount / total) * 100);
  const bottomPct = 100 - topPct;
  const balanced = Math.abs(topPct - 50) < 10;

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-6">
      <h3 className="font-heading text-lg text-foreground/80 mb-4">Torus Balance</h3>

      <div className="flex items-center gap-4 mb-4">
        {/* TOP arc */}
        <div className="flex-1 text-center">
          <div className="text-xs font-body text-muted-foreground mb-1">TOP ↑ Outward</div>
          <motion.div
            className="text-3xl font-heading text-amber-400"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {topPct}%
          </motion.div>
          <div className="text-xs text-muted-foreground mt-0.5">{topCount} records</div>
        </div>

        {/* Visual gauge */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative w-16 h-32 flex flex-col rounded-full overflow-hidden border border-border/30">
            <motion.div
              className="w-full bg-gradient-to-b from-amber-500/60 to-amber-700/40"
              initial={{ height: 0 }}
              animate={{ height: `${topPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <motion.div
              className="w-full bg-gradient-to-b from-violet-700/40 to-violet-500/60 flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
          </div>
          {balanced && (
            <span className="text-[10px] text-primary font-body">balanced</span>
          )}
        </div>

        {/* BOTTOM arc */}
        <div className="flex-1 text-center">
          <div className="text-xs font-body text-muted-foreground mb-1">BOTTOM ↓ Inward</div>
          <motion.div
            className="text-3xl font-heading text-violet-400"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {bottomPct}%
          </motion.div>
          <div className="text-xs text-muted-foreground mt-0.5">{bottomCount} records</div>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-border/20 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500/70 via-primary/40 to-violet-500/70"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>
    </div>
  );
}