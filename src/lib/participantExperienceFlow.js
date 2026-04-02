/**
 * PARTICIPANT EXPERIENCE FLOW
 * Defines the complete lifecycle of a participant in Spiral Codex —
 * from entry and identity initialization through ongoing AI interaction.
 *
 * Identity policy: NO real names, NO government IDs, NO photos, NO biometrics.
 * Sign-in format: MM/DD/YYYY + Alias  (e.g. 02111983Walt)
 * Torus assignment: TOP or BOTTOM — immutable after initialization.
 */

export const PARTICIPANT_EXPERIENCE_FLOW = {

  entry: {
    welcomeScreen: "minimalist_symbolic",
    prompt: "Enter your presence to generate your resonance signature."
  },

  signIn: {
    format: "MM/DD/YYYY+Alias",
    identityRequirements: {
      realNames: false,
      governmentIDs: false,
      photos: false,
      biometrics: false
    }
  },

  initialization: {
    atomicNumber: "unique_non_repeating",
    na33Grid: "generated",
    torusDomain: "TOP_or_BOTTOM",       // assigned randomly, immutable
    traitEngineSeed: true
  },

  tripleSelfChart: {
    generateOnJoin: true,
    personaCount: 24
  },

  firstInterpretation: {
    createInterpretationRecord: true,
    createGuidanceSuggestion: "optional"
  },

  collectiveMap: {
    view: "3D_or_4D",
    seeOwnPosition: true,
    seeOthersData: false,               // HARD RULE — no participant sees another's data
    seeFinalMappingOnly: true
  },

  dashboard: {
    elements: [
      "na33Grid",
      "tripleSelfChart",
      "resonanceTimeline",
      "collectiveMap",
      "interpretationHistory",
      "guidanceSuggestions",
      "traitEvolutionLog"
    ]
  },

  ongoingExperience: {
    aiOutputs: [
      "InterpretationRecord",
      "GuidanceSuggestion",
      "ResonanceForecast",
      "CollectivePatternReport"
    ]
  },

  removalPolicy: {
    silentDeactivationOnViolation: true,  // No warning. No explanation.
    retainResonanceArchive: true,          // Resonance data is permanent
    retainAtomicNumber: true               // Atomic number is never recycled
  }
};

/**
 * Returns the identity format description for display in the entry UI.
 */
export function getIdentityFormatNote() {
  return `Your presence is identified only by your date of birth and a chosen alias.\nFormat: MM/DD/YYYY + Alias\nExample: 02/11/1983 + Walt → 02111983Walt\nNo real name. No ID. No image.`;
}

/**
 * Returns the torus assignment description for display after initialization.
 */
export function getTorusDomainDescription(domain) {
  if (domain === "TOP") {
    return "TOP TORUS — Outward flow. Expression. Emission into the field.";
  }
  return "BOTTOM TORUS — Inward flow. Reception. Drawing from the field.";
}