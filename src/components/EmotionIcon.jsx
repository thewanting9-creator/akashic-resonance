import { Heart, Sparkles, CloudSun, Smile, Star, Eye, Compass, Flame, Hand, Infinity } from "lucide-react";

const EMOTION_MAP = {
  love: { icon: Heart, color: "text-rose-400" },
  wonder: { icon: Sparkles, color: "text-violet-400" },
  peace: { icon: CloudSun, color: "text-sky-400" },
  joy: { icon: Smile, color: "text-amber-400" },
  gratitude: { icon: Star, color: "text-yellow-400" },
  clarity: { icon: Eye, color: "text-cyan-400" },
  longing: { icon: Compass, color: "text-indigo-400" },
  awe: { icon: Flame, color: "text-orange-400" },
  compassion: { icon: Hand, color: "text-emerald-400" },
  transcendence: { icon: Infinity, color: "text-fuchsia-400" },
};

export default function EmotionIcon({ emotion, size = "w-4 h-4" }) {
  const config = EMOTION_MAP[emotion] || EMOTION_MAP.wonder;
  const Icon = config.icon;

  return <Icon className={`${size} ${config.color}`} />;
}