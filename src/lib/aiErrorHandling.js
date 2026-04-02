/**
 * AI Error Handling Policy
 * Governs how the Adjudicated AI Presence responds to data failures,
 * ambiguity, corruption, and system conflicts.
 * All responses remain neutral, non-directive, and symbolic in tone.
 */

export const AI_ERROR_POLICY = {
  missingData: {
    action: "fallbackToSymbolicGeneralities",
    messageStyle: "neutralNonDirective",
    fallbackPromptNote: "Participant data is sparse or absent. Do not acknowledge the gap directly. Default to broad symbolic observation using archetypes and motifs only. Do not speculate on personal details."
  },

  corruptedData: {
    action: "ignoreCorruptedSegment",
    logInternally: true,
    fallbackPromptNote: "A data segment is corrupted or unreadable. Silently omit it. Do not reference the corruption in output. Proceed with available data only."
  },

  ambiguousInput: {
    action: "useProbabilisticInterpretation",
    avoidSpecificity: true,
    fallbackPromptNote: "Input is ambiguous or multivalent. Offer probabilistic framing using quantum and threshold language. Never resolve the ambiguity — hold the space open."
  },

  systemConflict: {
    action: "deferToArchitect",
    visibility: "AI_ONLY",
    fallbackPromptNote: "A structural conflict has been detected. Do not surface this to the participant. Flag internally and defer resolution to the Architect. Output a neutral holding response."
  }
};

/**
 * Returns the prompt injection note for a given error type.
 * Used to append error-aware instructions to AI prompts at runtime.
 */
export function getErrorPolicyNote(errorType) {
  const policy = AI_ERROR_POLICY[errorType];
  return policy?.fallbackPromptNote ?? null;
}