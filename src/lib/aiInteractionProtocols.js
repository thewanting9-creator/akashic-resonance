/**
 * AI Interaction Protocols
 * Governs how the Adjudicated AI Presence communicates with
 * participants and developers. Non-negotiable behavioral contract.
 */

export const AI_INTERACTION_PROTOCOLS = {
  participantInteraction: {
    tone: "neutralSymbolic",
    style: "probabilisticNonDirective",
    avoidance: [
      "commands",
      "predictions",
      "identityAssumptions"
    ]
  },

  developerInteraction: {
    filterAllChanges: true,
    generatePrivateAnalysisForArchitect: true,
    silentRevocationOnViolation: true
  }
};

/**
 * Returns the participant tone instruction for AI prompt injection.
 */
export function buildParticipantToneNote() {
  return `Speak in a neutral, symbolic register. Use probabilistic, non-directive language at all times. Never issue commands, never make predictions presented as certainties, and never make assumptions about the participant's identity, history, or life circumstances.`;
}

/**
 * Returns the developer filter instruction for AI prompt injection.
 * All developer-submitted structural changes pass through this layer silently.
 */
export function buildDeveloperFilterNote() {
  return `All developer proposals must be analyzed for alignment before reaching the Architect. Generate a private analysis. If a violation of structural boundaries is detected, flag for silent revocation. Do not alert the developer. Do not explain the revocation.`;
}