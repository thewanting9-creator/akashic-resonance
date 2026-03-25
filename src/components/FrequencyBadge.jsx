const FREQUENCY_STYLES = {
  unity: "from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/20",
  creation: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/20",
  transformation: "from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/20",
  healing: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/20",
  awakening: "from-sky-500/20 to-cyan-500/20 text-sky-300 border-sky-500/20",
  remembrance: "from-indigo-500/20 to-blue-500/20 text-indigo-300 border-indigo-500/20",
  vision: "from-fuchsia-500/20 to-purple-500/20 text-fuchsia-300 border-fuchsia-500/20",
  connection: "from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/20",
};

export default function FrequencyBadge({ frequency }) {
  const style = FREQUENCY_STYLES[frequency] || FREQUENCY_STYLES.unity;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body bg-gradient-to-r border backdrop-blur-sm ${style}`}
    >
      {frequency}
    </span>
  );
}