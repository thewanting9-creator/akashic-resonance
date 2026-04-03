export const SCHUMANN_DATA = {
  app_data_version: "1.0",
  title: "Earth's Schumann Resonances & Human Mind Frequencies",
  summary_for_info_bubble: "Schumann Resonances (SR) are the Earth's natural electromagnetic 'heartbeat' — global standing waves created by lightning in the atmosphere. The main frequencies (7.83 Hz and its harmonics) perfectly overlap with human brainwave bands. The fundamental ~8 Hz promotes calm, creative states (theta/alpha). Higher harmonics, especially the 8th (~62.64 Hz, very close to the 60 Hz power-grid frequency), align with gamma brainwaves linked to heightened thinking, peak focus, insight, and cognitive performance.",
  last_updated: "2026-04-02",
  source_note: "Based on peer-reviewed bioelectromagnetics data. Frequencies are average measured values and can vary slightly with solar activity.",

  schumann_resonances: [
    { mode: 1, frequency_hz: 7.83,  harmonic_of_fundamental: 1, brainwave_overlap: "Theta / lower Alpha", mental_state: "Deep relaxation, creativity, intuition, meditation" },
    { mode: 2, frequency_hz: 14.3,  harmonic_of_fundamental: 2, brainwave_overlap: "Alpha / low Beta",    mental_state: "Relaxed alertness, light focus" },
    { mode: 3, frequency_hz: 20.8,  harmonic_of_fundamental: 3, brainwave_overlap: "Beta",                mental_state: "Active thinking, problem solving" },
    { mode: 4, frequency_hz: 27.3,  harmonic_of_fundamental: 4, brainwave_overlap: "Beta",                mental_state: "Concentration and analysis" },
    { mode: 5, frequency_hz: 33.8,  harmonic_of_fundamental: 5, brainwave_overlap: "Low Gamma",           mental_state: "Insight, perception, learning" },
    { mode: 6, frequency_hz: 46.98, harmonic_of_fundamental: 6, brainwave_overlap: "Gamma",               mental_state: "High-level cognition, flow states" },
    { mode: 7, frequency_hz: 54.81, harmonic_of_fundamental: 7, brainwave_overlap: "Gamma",               mental_state: "Enhanced memory & mental clarity" },
    { mode: 8, frequency_hz: 62.64, harmonic_of_fundamental: 8, brainwave_overlap: "High Gamma / Hyper-Gamma", mental_state: "Heightened thinking, peak insight, 'genius' focus", note: "Very close to 60 Hz AC power frequency" },
  ],

  brainwave_reference: [
    { band: "Delta", range_hz: "0.5–4",  state: "Deep sleep, healing" },
    { band: "Theta", range_hz: "4–8",    state: "Creativity, meditation" },
    { band: "Alpha", range_hz: "8–13",   state: "Relaxed focus" },
    { band: "Beta",  range_hz: "13–30",  state: "Active thinking" },
    { band: "Gamma", range_hz: "30–100+",state: "Heightened perception, insight, peak cognition" },
  ],

  eighth_harmonic_special: {
    frequency_hz: 62.64,
    approx_60_hz: true,
    difference_from_60hz: "2.64 Hz",
    key_effect: "Associated with heightened cognitive performance and gamma brainwave activity",
    practical_note: "Many biohacking tools and PEMF devices target 55–65 Hz for focus and neuroplasticity",
  },
};

// Map our app's depth (1-7) → nearest Schumann mode
export function depthToSchumannMode(depth) {
  const d = Math.max(1, Math.min(7, Math.round(depth)));
  return SCHUMANN_DATA.schumann_resonances[d - 1];
}

// Map our app's frequency label → closest Schumann brainwave band
const FREQ_TO_BRAINWAVE = {
  unity:          { band: "Theta / Alpha", mode: 1 },
  healing:        { band: "Theta / Alpha", mode: 1 },
  creation:       { band: "Alpha / Beta",  mode: 2 },
  connection:     { band: "Alpha / Beta",  mode: 2 },
  remembrance:    { band: "Beta",          mode: 3 },
  transformation: { band: "Low Gamma",     mode: 5 },
  vision:         { band: "Gamma",         mode: 6 },
  awakening:      { band: "High Gamma",    mode: 8 },
};

export function freqLabelToSchumann(freqLabel) {
  const mapping = FREQ_TO_BRAINWAVE[freqLabel];
  if (!mapping) return null;
  return SCHUMANN_DATA.schumann_resonances[mapping.mode - 1];
}