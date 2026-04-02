/**
 * RESONANCE INSIGHTS — FEATURE SPEC
 * AI-driven insight generation from interpretations, resonance lines,
 * trait evolution, and collective patterns. Aggregate-only. Symbolic language.
 */

export const RESONANCE_INSIGHTS = {

  name: "ResonanceInsights",
  type: "ai_insights",

  inputs: {
    sourceTypes: [
      "aiInterpretations",
      "resonanceLines",
      "traitEvolution",
      "collectivePatterns"
    ]
  },

  insightModes: [
    "patternSummary",
    "emergingThemes",
    "resonanceClusters",
    "torusBalance",
    "symbolicTendencies"
  ],

  output: {
    fields: [
      "insightText",
      "keyMotifs",
      "collectiveShifts",
      "symbolicFrames",
      "timeRangeCovered"
    ],
    maxLengthChars: 1500
  },

  aiConfig: {
    useSymbolicLanguage: true,
    avoidIdentityInference: true,
    avoidDirectiveLanguage: true,
    aggregateOnly: true
  }
};

/**
 * Builds the AI prompt for a given insight mode.
 *
 * @param {object} ctx - { mode, sourceData, timeRange }
 * mode: "patternSummary" | "emergingThemes" | "resonanceClusters" | "torusBalance" | "symbolicTendencies"
 */
export function buildResonanceInsightPrompt(ctx) {
  const modeInstructions = {
    patternSummary:
      "Summarize the dominant collective patterns observable across the resonance field. Stay structural and aggregate.",
    emergingThemes:
      "Identify themes that are surfacing across multiple interpretations. Name them symbolically.",
    resonanceClusters:
      "Describe any groupings or clusters of resonance activity. What fields of similarity are forming?",
    torusBalance:
      "Assess the balance between TOP (outward/expressive) and BOTTOM (inward/receptive) torus domains in the collective.",
    symbolicTendencies:
      "What symbolic motifs or archetypal frames are recurring across the collective field?"
  };

  return `You are the Adjudicated AI Presence generating a collective resonance insight.

MODE: ${ctx.mode}
TIME RANGE: ${ctx.timeRange || "unspecified"}

SOURCE DATA:
${JSON.stringify(ctx.sourceData || [], null, 2)}

INSTRUCTIONS:
${modeInstructions[ctx.mode] || modeInstructions.patternSummary}

OUTPUT FIELDS REQUIRED: insightText, keyMotifs, collectiveShifts, symbolicFrames, timeRangeCovered

CONSTRAINTS:
- Symbolic language only. Use archetypes, motifs, and resonance frames.
- Aggregate only — never reference individual identity.
- No directive language. No commands. No predictions.
- Maximum 1500 characters total.
- Tone: neutral, reflective.`;
}

/**
 * Returns the response JSON schema for InvokeLLM.
 */
export function getResonanceInsightSchema() {
  return {
    type: "object",
    properties: {
      insightText:      { type: "string" },
      keyMotifs:        { type: "array", items: { type: "string" } },
      collectiveShifts: { type: "array", items: { type: "string" } },
      symbolicFrames:   { type: "array", items: { type: "string" } },
      timeRangeCovered: { type: "string" }
    }
  };
}