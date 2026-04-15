import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Layers, Dna, Zap, Globe } from "lucide-react";

const HU_CONFIG = [
  {
    hu: "HU-5", density: "Density 5", title: "RISHI / SOURCE",
    color: "#e879f9", glow: "#e879f920",
    note: "1 Identity · Universal strands — not biological",
    planetary: null,
    dims: [
      { d: 15, strand: "15*", range: "Universal Consciousness", system: "[TBD]", uranian: "0.010°", harmonic: "999", label: "Source / Rishi", note: "Pure emanation — beyond all form" },
      { d: 14, strand: "14*", range: "Pure Consciousness / Pre-matter", system: "[TBD]", uranian: "0.021°", harmonic: "888", label: "Founder Level", note: "Pre-atomic substrate" },
      { d: 13, strand: "13*", range: "Planck threshold", system: "[TBD]", uranian: "0.043°", harmonic: "666", label: "Founder Interface", note: "Bridge between manifest and unmanifest" },
    ],
  },
  {
    hu: "HU-4", density: "Density 4", title: "BUDDHIC / CHRISTOS / AVATAR",
    color: "#60a5fa", glow: "#60a5fa20",
    note: "1 Identity · Planetary equivalent: Gaia",
    planetary: "Gaia",
    dims: [
      { d: 12, strand: "12", range: "12.0 – 12.0 (Christos Avatar level)", system: "HuberIntell.+AgePt.Regio.Sidereal GalacticEquatorMid.Mula_sys.", uranian: "0.087°", harmonic: "333", label: "Christos Avatar", note: "Full monadic embodiment in light-body" },
      { d: 11, strand: "11", range: "11.0 – 12.0", system: "Esoteric+SoulRpt.Regio.Draconic_sys.", uranian: "0.175°", harmonic: "Uranian 0.01°", label: "Avatar Higher Mind", note: "Trans-dimensional causal layer" },
      { d: 10, strand: "10", range: "10.0 – 11.0", system: "AgeHarmonics.Regio.Tropical_sys.", uranian: "0.351°", harmonic: "Uranian 0.021°", label: "Avatar Lower Mind", note: "Monadic mental field interface" },
    ],
  },
  {
    hu: "HU-3", density: "Density 3", title: "OVERSOUL / MENTAL / CAUSAL",
    color: "#34d399", glow: "#34d39920",
    note: "1 Identity · Creates 12 HU-2 Souls",
    planetary: null,
    dims: [
      { d: 9, strand: "9", range: "9.0 – 10.0", system: "Uranian_0.351°.Dial.Regio.Sidereal GalacticEquatorMid.Mula_sys.", uranian: "Harmonic 333", harmonic: "Uranian 0.043°", label: "Oversoul Upper", note: "Solar gateway — Sun/Sol junction" },
      { d: 8, strand: "8", range: "8.0 – 9.0 (Sun/Solar gateway level)", system: "Galactic_sys.", uranian: "Uranian 0.703°", harmonic: "Harmonic 222", label: "Oversoul Core", note: "Galactic system resonance bridge" },
      { d: 7, strand: "7", range: "7.0 – 8.0", system: "Heliocentric_sys.", uranian: "Uranian 1.40625°", harmonic: "Uranian 0.703°", label: "Oversoul Base", note: "Heliocentric causal grounding" },
    ],
  },
  {
    hu: "HU-2", density: "Density 2", title: "SOUL MATRIX / ASTRAL",
    color: "#fbbf24", glow: "#fbbf2420",
    note: "12 Identities · Planetary equivalent: Tara – Future Earth",
    planetary: "Tara",
    dims: [
      { d: 6, strand: "6", range: "6.0 – 7.0 (Full soul embodiment)", system: "Tru_Horz.13setup.Topocentric_sys.", uranian: "Uranian 2.8125°", harmonic: "Uranian 1.40625°", label: "Soul Upper", note: "Full astral-soul merger layer" },
      { d: 5, strand: "5", range: "5.0 – 6.0 (Perceives D-4 as solid)", system: "Uranian_0.703°.Regio.Draconic_sys.", uranian: "Harmonic 222", harmonic: "Uranian 2.8125°", label: "Soul Mid", note: "Draconic emotional patterning" },
      { d: 4, strand: "4", range: "4.0 – 5.0 (Perceives D-3 as solid)", system: "Horary.Regio.Sidereal GalacticEquatorMid.Mule_sys.", uranian: "Uranian 5.625°", harmonic: "Harmonic 111", label: "Soul Base", note: "Astral-physical interface" },
    ],
  },
  {
    hu: "HU-1", density: "Density 1", title: "INCARNATE / PHYSICAL",
    color: "#fb923c", glow: "#fb923c20",
    note: "144 Total Incarnates · Planetary equivalent: Earth",
    planetary: "Earth",
    dims: [
      { d: 3, strand: "3", range: "3.0 – 4.0 (Perceives D-2 as solid)", system: "Drac.Karma+LifePth.Regio.Drac._sys.", uranian: "Uranian 11.25°", harmonic: "Uranian 5.625°", label: "Mental Body", note: "Draconic karmic-mental interface" },
      { d: 2, strand: "2", range: "2.0 – 3.0 (Perceives D-1 as solid)", system: "Natal.Regio.Tropical_sys.", uranian: "Uranian 22.5°", harmonic: "Uranian 11.25°", label: "Emotional Body", note: "Natal emotional-etheric layer" },
      { d: 1, strand: "1", range: "1.0 – 2.0 (Base physical foundation)", system: "Uranian_1.40625°.Regio.Tropic_sys.", uranian: "Harmonic 111", harmonic: "Uranian 22.5°", label: "Physical Body", note: "Base matter — incarnate anchor" },
    ],
  },
];

const PERSONAL_KEYS = [
  { system: "MoonPers.Regio.SideReal", uranian: "Uranian 45°", harmonic: "Harmonic 99" },
  { system: "SunPers.Regio.Draco.", uranian: "Uranian 90°", harmonic: "Harmonic 66" },
  { system: "Asc.Pers.Regio.Tropical", uranian: "Uranian 360°", harmonic: "Harmonic 33" },
];

function DimNode({ dim, color, glow, huIndex, dimIndex, onClick, isSelected }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: huIndex * 0.08 + dimIndex * 0.04, type: "spring", stiffness: 260, damping: 20 }}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition-all duration-200 text-left"
      style={{
        borderColor: isSelected ? color : color + "35",
        background: isSelected ? color + "22" : glow,
        boxShadow: isSelected ? `0 0 18px ${color}45` : "none",
      }}
    >
      {/* Dimension badge */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-heading font-semibold border"
        style={{ borderColor: color + "60", color, background: color + "18" }}
      >
        D{dim.d}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-body font-medium truncate" style={{ color: isSelected ? color : "hsl(var(--foreground)/0.85)" }}>
          {dim.label}
        </div>
        <div className="text-[9px] font-body text-muted-foreground truncate">
          Strand {dim.strand} · {dim.harmonic}
        </div>
      </div>
      {/* Pulse dot */}
      {isSelected && (
        <motion.div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: color }}
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}

function DetailPanel({ dim, hu, onClose }) {
  if (!dim) return null;
  return (
    <motion.div
      key={dim.d}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="rounded-2xl border p-5 relative overflow-hidden"
      style={{ borderColor: hu.color + "50", background: hu.color + "0e" }}
    >
      {/* Glow blob */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none"
        style={{ background: hu.color + "30" }} />

      <button onClick={onClose}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10">
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          className="w-12 h-12 rounded-2xl flex items-center justify-center font-heading text-lg font-semibold border"
          style={{ borderColor: hu.color + "60", color: hu.color, background: hu.color + "20" }}
          animate={{ boxShadow: [`0 0 0px ${hu.color}00`, `0 0 20px ${hu.color}60`, `0 0 0px ${hu.color}00`] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          D{dim.d}
        </motion.div>
        <div>
          <div className="text-[10px] font-body text-muted-foreground uppercase tracking-widest">{hu.hu} · {hu.density}</div>
          <div className="font-heading text-lg leading-tight" style={{ color: hu.color }}>{dim.label}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { icon: Dna, label: "DNA Strand", value: `Strand ${dim.strand}` },
          { icon: Zap, label: "Harmonic", value: dim.harmonic },
          { icon: Layers, label: "Accretion", value: dim.range },
          { icon: Globe, label: "Uranian", value: dim.uranian },
        ].map(s => (
          <div key={s.label} className="bg-card/30 border border-border/20 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className="w-3 h-3" style={{ color: hu.color }} />
              <span className="text-[9px] font-body text-muted-foreground uppercase tracking-wide">{s.label}</span>
            </div>
            <div className="text-xs font-body text-foreground/80 leading-tight">{s.value}</div>
          </div>
        ))}
      </div>

      {/* System */}
      {dim.system && (
        <div className="bg-card/20 border border-border/15 rounded-xl px-3 py-2.5 mb-3">
          <div className="text-[9px] font-body text-muted-foreground uppercase tracking-wide mb-1">Astrological System</div>
          <div className="text-xs font-body text-foreground/70 leading-snug">{dim.system}</div>
        </div>
      )}

      {/* Note */}
      <div className="text-xs font-body italic leading-relaxed" style={{ color: hu.color + "bb" }}>
        "{dim.note}"
      </div>
    </motion.div>
  );
}

export default function TimeMatrix() {
  const [selected, setSelected] = useState(null); // { dim, hu }

  const handleSelect = (dim, hu) => {
    if (selected?.dim.d === dim.d) setSelected(null);
    else setSelected({ dim, hu });
  };

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/60 border border-border/40 mb-4">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-light mb-1">
          15-Dimensional Time Matrix
        </h1>
        <p className="font-body text-xs text-muted-foreground">
          Tap any dimension to explore its identity level, DNA strand & accretion station
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Left: HU column stack */}
        <div className="lg:col-span-3 space-y-3">
          {HU_CONFIG.map((hu, huIndex) => (
            <motion.div
              key={hu.hu}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: huIndex * 0.08 }}
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: hu.color + "35" }}
            >
              {/* HU Header */}
              <div className="flex items-center gap-3 px-4 py-3"
                style={{ background: `linear-gradient(90deg, ${hu.color}18 0%, transparent 100%)` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-body font-bold border flex-shrink-0"
                  style={{ borderColor: hu.color + "60", color: hu.color, background: hu.color + "20" }}>
                  {hu.hu}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-body text-muted-foreground uppercase tracking-widest">{hu.density}</div>
                  <div className="font-heading text-sm truncate" style={{ color: hu.color }}>{hu.title}</div>
                </div>
                {hu.planetary && (
                  <div className="text-[9px] font-body italic text-muted-foreground/50 flex-shrink-0">
                    {hu.planetary}
                  </div>
                )}
              </div>

              {/* Dimension nodes */}
              <div className="px-3 pb-3 pt-1 space-y-1.5">
                {hu.dims.map((dim, dimIndex) => (
                  <DimNode
                    key={dim.d}
                    dim={dim}
                    color={hu.color}
                    glow={hu.glow}
                    huIndex={huIndex}
                    dimIndex={dimIndex}
                    isSelected={selected?.dim.d === dim.d}
                    onClick={() => handleSelect(dim, hu)}
                  />
                ))}
                <div className="text-[9px] font-body text-muted-foreground/40 italic px-1 pt-0.5">· {hu.note}</div>
              </div>
            </motion.div>
          ))}

          {/* Personal Keys strip */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-card/20 border border-border/25 rounded-2xl p-4">
            <div className="text-[10px] font-body text-muted-foreground uppercase tracking-widest mb-2">Personal Dimensional Keys</div>
            <div className="space-y-1.5">
              {PERSONAL_KEYS.map((k, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-body flex-wrap">
                  <span className="text-muted-foreground/50">~</span>
                  <span className="text-foreground/70">{k.system}</span>
                  <span className="text-primary/70">{k.uranian}</span>
                  <span className="text-amber-400/70">{k.harmonic}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Detail panel */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20 space-y-4">
            <AnimatePresence mode="wait">
              {selected ? (
                <DetailPanel
                  key={selected.dim.d}
                  dim={selected.dim}
                  hu={selected.hu}
                  onClose={() => setSelected(null)}
                />
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-border/20 bg-card/10 p-8 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary/40 border border-border/30 flex items-center justify-center mx-auto mb-3">
                    <Layers className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <p className="font-body text-sm text-muted-foreground/60">
                    Tap a dimension to explore its resonance signature
                  </p>
                  <div className="mt-4 space-y-1.5">
                    {HU_CONFIG.map(hu => (
                      <div key={hu.hu} className="flex items-center gap-2 justify-center">
                        <div className="w-2 h-2 rounded-full" style={{ background: hu.color }} />
                        <span className="text-[10px] font-body text-muted-foreground/50">{hu.hu} — {hu.title}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* HU vertical legend */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="bg-card/10 border border-border/15 rounded-2xl p-4">
              <div className="text-[10px] font-body text-muted-foreground uppercase tracking-widest mb-3">Harmonic Spectrum</div>
              <div className="space-y-2">
                {[...HU_CONFIG].reverse().map((hu, i) => (
                  <div key={hu.hu} className="flex items-center gap-2.5">
                    <motion.div
                      className="w-1.5 rounded-full flex-shrink-0"
                      style={{ background: hu.color, height: `${12 + i * 4}px` }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.2 }}
                    />
                    <div className="flex-1">
                      <span className="text-[10px] font-body font-medium" style={{ color: hu.color }}>{hu.hu}</span>
                      <span className="text-[9px] font-body text-muted-foreground/60 ml-1.5">{hu.density} · D{hu.dims[2].d}–D{hu.dims[0].d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-[9px] font-body text-muted-foreground/35 italic">
        Keylontic Science framework · For research and contemplative study only
      </div>
    </div>
  );
}