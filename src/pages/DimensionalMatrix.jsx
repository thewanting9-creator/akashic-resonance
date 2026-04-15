import { motion } from "framer-motion";
import { useState } from "react";
import { Layers, ChevronDown } from "lucide-react";

const HU_DATA = [
  {
    hu: "HU-5",
    density: "DENSITY 5",
    title: "RISHI / SOURCE",
    color: "#e879f9",
    dimensions: [
      { d: "D-15", strand: "15*", range: "Universal Consciousness", label: "Source/Rishi", uranian: "0.010°", harmonic: "999", system: "[TBD]" },
      { d: "D-14", strand: "14*", range: "(Pure Consciousness / Pre-matter)", label: "", uranian: "0.021°", harmonic: "888", system: "[TBD]" },
      { d: "D-13", strand: "13*", range: "(*Strands 13-15 are universal, not biological)", label: "Planck threshold", uranian: "0.043°", harmonic: "666", system: "[TBD]" },
    ],
    note: "1 Identity",
    planetary: null,
  },
  {
    hu: "HU-4",
    density: "DENSITY 4",
    title: "BUDDHIC / CHRISTOS / AVATAR",
    color: "#60a5fa",
    dimensions: [
      { d: "D-12", strand: "12", range: "12.0 – 12.0 (Christos Avatar level)", label: "HuberIntell.+AgePt.Regio.Sidereal GalacticEquatorMid.Mula_sys.", uranian: "0.087°", harmonic: "333", system: "" },
      { d: "D-11", strand: "11", range: "11.0 – 12.0", label: "Esoteric+SoulRpt.Regio.Draconic_sys.", uranian: "0.175°", harmonic: "Uranian 0.01°", system: "" },
      { d: "D-10", strand: "10", range: "10.0 – 11.0", label: "AgeHarmonics.Regio.Tropical_sys.", uranian: "0.351°", harmonic: "Uranian 0.021°", system: "" },
    ],
    note: "1 Identity",
    planetary: "Planetary equivalent: Gaia",
  },
  {
    hu: "HU-3",
    density: "DENSITY 3",
    title: "MENTAL / CAUSAL",
    color: "#34d399",
    dimensions: [
      { d: "D-9", strand: "9", range: "9.0 – 10.0", label: "Uranian_0.351°.Dial.Regio.Sidereal GalacticEquatorMid.Mula_sys.", uranian: "Harmonic 333", harmonic: "Uranian 0.043°", system: "" },
      { d: "D-8", strand: "8", range: "8.0 – 9.0  (Sun/Solar gateway level)", label: "Galactic_sys.", uranian: "Uranian 0.703°", harmonic: "Harmonic 222", system: "" },
      { d: "D-7", strand: "7", range: "7.0 – 8.0", label: "Heliocentric_sys.", uranian: "Uranian 1.40625°", harmonic: "Uranian 0.703°", system: "" },
    ],
    note: "1 Identity · Creates 12 HU-2 Souls",
    planetary: null,
  },
  {
    hu: "HU-2",
    density: "DENSITY 2",
    title: "ASTRAL / EMOTIONAL",
    color: "#fbbf24",
    dimensions: [
      { d: "D-6", strand: "6", range: "6.0 – 7.0  (Full soul embodiment)", label: "Tru_Horz.13setup.Topocentric_sys.", uranian: "Uranian 2.8125°", harmonic: "Uranian 1.40625°", system: "" },
      { d: "D-5", strand: "5", range: "5.0 – 6.0  (Perceives D-4 as solid)", label: "Uranian_0.703°.Regio.Draconic_sys.", uranian: "Harmonic 222", harmonic: "Uranian 2.8125°", system: "" },
      { d: "D-4", strand: "4", range: "4.0 – 5.0  (Perceives D-3 as solid)", label: "Horary.Regio.Sidereal GalacticEquatorMid.Mule_sys.", uranian: "Uranian 5.625°", harmonic: "Harmonic 111", system: "" },
    ],
    note: "12 Identities",
    planetary: "Planetary equivalent: Tara – Future Earth",
  },
  {
    hu: "HU-1",
    density: "DENSITY 1",
    title: "PHYSICAL INCARNATION",
    color: "#fb923c",
    dimensions: [
      { d: "D-3", strand: "3", range: "3.0 – 4.0  (Perceives D-2 as solid)", label: "Drac.Karma+LifePth.Regio.Drac._sys.", uranian: "Uranian 11.25°", harmonic: "Uranian 5.625°", system: "" },
      { d: "D-2", strand: "2", range: "2.0 – 3.0  (Perceives D-1 as solid)", label: "Natal.Regio.Tropical_sys.", uranian: "Uranian 22.5°", harmonic: "Uranian 11.25°", system: "" },
      { d: "D-1", strand: "1", range: "1.0 – 2.0  (Base physical foundation)", label: "Uranian_1.40625°.Regio.Tropic_sys.", uranian: "Harmonic 111", harmonic: "Uranian 22.5°", system: "" },
    ],
    note: "144 Total Incarnates",
    planetary: "Planetary equivalent: Earth",
  },
];

const TRIPLE_KEYS = [
  { label: "~ Dimension", system: "MoonPers.Regio.SideReal", uranian: "Uranian 45°", harmonic: "Harmonic 99" },
  { label: "~ Dimension", system: "SunPers.Regio.Draco.", uranian: "Uranian 90°", harmonic: "Harmonic 66" },
  { label: "~ Dimension", system: "Asc.Pers.Regio.Tropical", uranian: "Uranian 360°", harmonic: "Harmonic 33" },
];

function HUBlock({ data, index }) {
  const [open, setOpen] = useState(true);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: data.color + "40" }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/5"
        style={{ background: data.color + "12" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-body font-bold"
            style={{ background: data.color + "25", color: data.color, border: `1px solid ${data.color}50` }}>
            {data.hu}
          </div>
          <div>
            <div className="text-[10px] font-body text-muted-foreground uppercase tracking-widest">{data.density}</div>
            <div className="font-heading text-base text-foreground/90">{data.title}</div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="bg-card/10 px-4 py-3 space-y-0">
          {/* Dimension rows */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="text-left py-2 pr-3 text-[9px] text-muted-foreground/60 uppercase tracking-wider font-normal w-10">Dim</th>
                  <th className="text-left py-2 pr-3 text-[9px] text-muted-foreground/60 uppercase tracking-wider font-normal w-8">Strand</th>
                  <th className="text-left py-2 pr-3 text-[9px] text-muted-foreground/60 uppercase tracking-wider font-normal">Station / System</th>
                  <th className="text-left py-2 pr-3 text-[9px] text-muted-foreground/60 uppercase tracking-wider font-normal">Uranian</th>
                  <th className="text-left py-2 text-[9px] text-muted-foreground/60 uppercase tracking-wider font-normal">Harmonic / Key</th>
                </tr>
              </thead>
              <tbody>
                {data.dimensions.map((dim) => (
                  <tr key={dim.d} className="border-b border-border/10 last:border-0">
                    <td className="py-2.5 pr-3 font-medium whitespace-nowrap" style={{ color: data.color }}>{dim.d}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">{dim.strand}</td>
                    <td className="py-2.5 pr-3">
                      <div className="text-foreground/80 leading-tight">{dim.label || <span className="text-muted-foreground/40">—</span>}</div>
                      <div className="text-[9px] text-muted-foreground/60 mt-0.5 italic leading-tight">{dim.range}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground/80 whitespace-nowrap">{dim.uranian}</td>
                    <td className="py-2.5 text-muted-foreground/80 whitespace-nowrap">{dim.harmonic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer notes */}
          <div className="pt-2 flex flex-wrap gap-3">
            {data.note && (
              <span className="text-[9px] font-body text-muted-foreground/50 italic">· {data.note}</span>
            )}
            {data.planetary && (
              <span className="text-[9px] font-body italic" style={{ color: data.color + "cc" }}>· {data.planetary}</span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function DimensionalMatrix() {
  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/60 border border-border/40 mb-4">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-light mb-2">
          The 15-Dimensional Time Matrix
        </h1>
        <p className="font-body text-xs text-muted-foreground">Master Chart · 5 Harmonic Universes · 15 Dimensions · DNA Strand Correlations</p>
      </motion.div>

      {/* HU Blocks */}
      <div className="space-y-4 mb-6">
        {HU_DATA.map((hu, i) => (
          <HUBlock key={hu.hu} data={hu} index={i} />
        ))}
      </div>

      {/* Triple Key footer */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-card/20 border border-border/30 rounded-2xl p-5">
        <div className="text-[10px] font-body text-muted-foreground uppercase tracking-widest mb-3">Personal Dimensional Keys</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-body">
            <tbody>
              {TRIPLE_KEYS.map((k, i) => (
                <tr key={i} className="border-b border-border/10 last:border-0">
                  <td className="py-2 pr-3 text-muted-foreground/60 w-24">{k.label}</td>
                  <td className="py-2 pr-3 text-foreground/80">{k.system}</td>
                  <td className="py-2 pr-3 text-primary/80">{k.uranian}</td>
                  <td className="py-2 text-amber-400/80">{k.harmonic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="mt-4 text-center text-[9px] font-body text-muted-foreground/40 italic">
        Keylontic Science framework · For research and contemplative use only
      </motion.div>
    </div>
  );
}