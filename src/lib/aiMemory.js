/**
 * AI Long-Term Memory Policy
 * Governs what the Adjudicated AI is permitted to retain across sessions.
 * Identity data is never stored. Aggregates and resonance patterns only.
 * Visibility: AI_ONLY — never surfaced to participants or developers.
 */

export const AI_MEMORY_POLICY = {
  memoryTypes: [
    "collectivePattern",
    "resonanceShift",
    "traitEvolution",
    "torusBalance",
    "systemMilestone"
  ],

  storageRules: {
    storeIdentityData: false,       // HARD BLOCK — never store names, aliases, atomic numbers in memory
    storeResonanceData: true,       // Resonance field states are retained
    storeAggregatesOnly: true       // Only aggregate-level patterns, never individual records
  },

  retention: "permanent",
  visibility: "AI_ONLY"
};

/**
 * Returns true if the given memory type is permitted under policy.
 */
export function isMemoryTypeAllowed(type) {
  return AI_MEMORY_POLICY.memoryTypes.includes(type);
}

/**
 * Builds the memory policy injection note for AI prompts.
 * Ensures AI is reminded of its memory boundaries before generating output.
 */
export function buildMemoryPolicyNote() {
  return `You may reference collective patterns, resonance shifts, trait evolution trends, torus balance states, and system milestones observed over time. You must never store, reference, or infer individual identity data, aliases, atomic numbers, or personal identifiers. All retained knowledge is aggregate-level only.`;
}