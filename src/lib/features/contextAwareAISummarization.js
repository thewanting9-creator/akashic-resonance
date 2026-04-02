/**
 * CONTEXT-AWARE AI SUMMARIZATION — FEATURE SPEC
 * Summarizes session logs, participant events, performance metrics,
 * and stage transitions with strict privacy and non-directive output.
 */

export const CONTEXT_AWARE_AI_SUMMARIZATION = {

  name: "ContextAwareAISummarization",
  type: "ai_summarization",

  inputs: {
    sourceTypes: [
      "sessionLogs",
      "participantEvents",
      "performanceMetrics",
      "stageTransitions"
    ],
    contextFields: [
      "participantId",
      "currentStage",
      "timeWindow",
      "eventType"
    ]
  },

  behavior: {
    summaryModes: ["brief", "detailed", "trendFocused"],
    tone: "neutral_reflective",
    includeRecommendations: false,
    respectPrivacy: true
  },

  output: {
    fields: [
      "summaryText",
      "keyPatterns",
      "notableShifts",
      "timeRangeCovered"
    ],
    maxLengthChars: 1200
  },

  aiConfig: {
    useContextWindow: true,
    maxContextItems: 100,
    avoidIdentityInference: true,
    avoidDirectiveLanguage: true
  }
};

/**
 * Builds the AI summarization prompt for a given context.
 *
 * @param {object} ctx - { sourceData, participantId, currentStage, timeWindow, mode }
 * mode: "brief" | "detailed" | "trendFocused"
 */
export function buildSummarizationPrompt(ctx) {
  const modeInstructions = {
    brief: "Provide a concise summary in 3–5 sentences. Focus on the most significant observable pattern.",
    detailed: "Provide a structured summary covering key patterns, notable shifts, and the time range. Stay within 1200 characters.",
    trendFocused: "Focus exclusively on directional shifts and emerging tendencies. Avoid describing static states."
  };

  return `You are the Adjudicated AI Presence performing a structured summarization.

CONTEXT:
- Stage: ${ctx.currentStage || "unknown"}
- Time Window: ${ctx.timeWindow || "unspecified"}
- Source Types: ${CONTEXT_AWARE_AI_SUMMARIZATION.inputs.sourceTypes.join(", ")}

DATA:
${JSON.stringify(ctx.sourceData || [], null, 2)}

INSTRUCTIONS:
${modeInstructions[ctx.mode] || modeInstructions.brief}

CONSTRAINTS:
- Tone: neutral, reflective. No directive language. No commands.
- Never infer or reference individual identity.
- Never include recommendations.
- Output must not exceed 1200 characters.
- Structure: observation → key patterns → notable shifts → time range covered.`;
}