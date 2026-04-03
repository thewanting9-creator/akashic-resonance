export const BINAURAL_DATA = {
  app_data_version: "1.1",
  summary_for_info_bubble: "Binaural Beats are an audiophile-grade brainwave entrainment tool. By playing two slightly different tones (one in each ear via headphones), your brain creates a third 'beat' frequency equal to the difference. This can gently guide your brainwaves into specific states. This module is tuned to Earth's Schumann Resonances — especially the 7.83 Hz 'heartbeat' for calm and the 8th harmonic (~62.64 Hz) for heightened thinking and gamma focus.",
  source_note: "Based on peer-reviewed brainwave entrainment studies, SR data, and audiophile best practices. Effects are subjective and vary by individual.",

  presets: [
    { name: "Earth Heartbeat",      beat: 7.83,  carrier: 200, band: "Theta / Alpha",       state: "Deep calm, creativity, meditation", duration: 15, color: "#34d399" },
    { name: "Focused Flow",         beat: 14.3,  carrier: 250, band: "Alpha / Low Beta",     state: "Relaxed alertness",                duration: 20, color: "#60a5fa" },
    { name: "Problem Solver",       beat: 20.8,  carrier: 300, band: "Beta",                 state: "Active thinking, problem solving", duration: 25, color: "#a78bfa" },
    { name: "Insight Burst",        beat: 33.8,  carrier: 350, band: "Low Gamma",            state: "Learning & perception",            duration: 15, color: "#fb923c" },
    { name: "Heightened Thinking",  beat: 62.64, carrier: 400, band: "High Gamma",           state: "Peak focus, insight, genius mode", duration: 10, color: "#fbbf24", note: "SR 8th harmonic ≈ 60 Hz power-grid" },
  ],

  params: {
    carrier:  { default: 250, min: 100, max: 1000, step: 10 },
    beat:     { default: 7.83, min: 0.5, max: 100, step: 0.01 },
    duration: { default: 15, min: 5, max: 60, step: 1 },
    volume:   { default: 65, min: 30, max: 85, step: 5 },
  },

  waveforms: ["sine", "triangle", "sawtooth"],
};