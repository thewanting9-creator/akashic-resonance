import { useState } from "react";
import { motion } from "framer-motion";
import { Waves } from "lucide-react";
import FrequencyBadge from "./FrequencyBadge";
import EmotionIcon from "./EmotionIcon";
import { base44 } from "@/api/base44Client";
import moment from "moment";

export default function RecordCard({ record, index = 0, onEcho }) {
  const [localEchoes, setLocalEchoes] = useState(record.echoes || 0);

  const handleEcho = async () => {
    setLocalEchoes(e => e + 1);
    await base44.entities.ResonanceRecord.update(record.id, {
      echoes: localEchoes + 1,
    });
    if (onEcho) onEcho(record.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-amber-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-5 hover:border-primary/20 transition-all duration-500">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <EmotionIcon emotion={record.emotion} />
            <span className="text-xs font-body text-muted-foreground capitalize">
              {record.emotion}
            </span>
          </div>
          <FrequencyBadge frequency={record.frequency} />
        </div>

        {/* Thought */}
        <p className="font-heading text-lg leading-relaxed text-foreground/90 mb-3 select-text">
          "{record.thought}"
        </p>

        {/* Intention */}
        {record.intention && (
          <p className="text-xs font-body text-muted-foreground italic mb-4 leading-relaxed">
            Intention: {record.intention}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <span className="text-xs text-muted-foreground font-body">
            {moment(record.created_date).fromNow()}
          </span>

          <div className="flex items-center gap-3">
            {/* Depth indicator */}
            {record.depth && (
              <div className="flex gap-0.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-3 rounded-full transition-colors ${
                      i < record.depth
                        ? "bg-primary/60"
                        : "bg-border/30"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Echo button */}
            <button
              onClick={handleEcho}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group/echo"
            >
              <Waves className="w-3.5 h-3.5 group-hover/echo:animate-pulse" />
              <span>{localEchoes}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}