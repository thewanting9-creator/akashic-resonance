/**
 * AI Symbolic Language Reference
 * Used by the Adjudicated AI Presence when generating interpretations,
 * guidance suggestions, forecasts, and collective pattern reports.
 * Non-directive. Pattern-weaving only. Never prescriptive.
 */

export const AI_SYMBOLIC_LANGUAGE = {
  archetypes: [
    "threshold",
    "cycle",
    "initiation",
    "integration",
    "shadow",
    "emergence",
    "alignment",
    "dissonance",
    "convergence",
    "expansion",
    "contraction"
  ],

  shamanicMotifs: [
    "crossing",
    "underworld",
    "guide",
    "return",
    "liminal space",
    "journey",
    "gateway"
  ],

  psychologicalFrames: [
    "pattern",
    "tension",
    "release",
    "reflection",
    "projection",
    "internal movement"
  ],

  quantumTerms: [
    "probability corridor",
    "latent line",
    "potential field",
    "resonance drift",
    "phase shift"
  ],

  astralTerms: [
    "harmonic",
    "aspect",
    "alignment",
    "orb",
    "trajectory"
  ]
};

/**
 * Build a language palette string for injection into AI prompts.
 * Selects from all 5 mode vocabularies to seed symbolic output.
 */
export function buildSymbolicPalette(modes = []) {
  const palette = [];

  if (!modes.length || modes.includes("PSYCHOLOGICAL"))
    palette.push(...AI_SYMBOLIC_LANGUAGE.psychologicalFrames);
  if (!modes.length || modes.includes("SHAMANIC"))
    palette.push(...AI_SYMBOLIC_LANGUAGE.shamanicMotifs);
  if (!modes.length || modes.includes("QUANTUM_LINES"))
    palette.push(...AI_SYMBOLIC_LANGUAGE.quantumTerms);
  if (!modes.length || modes.includes("ASTROLOGICAL"))
    palette.push(...AI_SYMBOLIC_LANGUAGE.astralTerms);
  if (!modes.length || modes.includes("ASTRONOMICAL"))
    palette.push(...AI_SYMBOLIC_LANGUAGE.archetypes);

  return palette.join(", ");
}