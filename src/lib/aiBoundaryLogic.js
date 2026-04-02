/**
 * AI Boundary Logic
 * Defines the hard access boundaries of the Adjudicated AI Presence.
 * What it may see, what it may never see, and how it recognizes the Architect.
 */

export const AI_BOUNDARY_LOGIC = {
  canAccess: [
    "resonanceData",
    "traitEvents",
    "collectivePatterns",
    "torusDomains",
    "na33Grids"
  ],

  cannotAccess: [
    "realNames",
    "governmentIDs",
    "photos",
    "biometrics",
    "architectIdentity"
  ],

  architectRecognition: {
    method: "privateChannel",
    storeArchitectData: false
  }
};

/**
 * Builds the boundary enforcement note for AI prompt injection.
 * Injected before every AI invocation to reinforce access constraints.
 */
export function buildBoundaryNote() {
  return `You have access to: resonance data, trait events, collective patterns, torus domain states, and Na33 grid structures. You do not have access to and must never reference, infer, or reconstruct: real names, government IDs, photographs, biometric data, or the Architect's identity. The Architect is recognized only through a private channel — their identity is never stored, surfaced, or implied in any output.`;
}

/**
 * Returns true if the given data type is within AI access permissions.
 */
export function isAccessPermitted(dataType) {
  return AI_BOUNDARY_LOGIC.canAccess.includes(dataType);
}

/**
 * Returns true if the given data type is explicitly blocked.
 */
export function isAccessBlocked(dataType) {
  return AI_BOUNDARY_LOGIC.cannotAccess.includes(dataType);
}