/**
 * DEVELOPER CONTRIBUTION PIPELINE
 * Defines the full AI-filtered contribution workflow.
 * All developer submissions pass through the AI filter before reaching the Architect.
 * Rejections are silent — developers receive no feedback on why a change was revoked.
 *
 * Immutable boundaries may never be altered by any developer submission.
 */

export const DEVELOPER_CONTRIB_PIPELINE = {

  submission: {
    allowedTypes: [
      "featureProposal",
      "codeChange",
      "schemaUpdate",
      "uiAdjustment"
    ],
    entryPoint: "AI_filter"
  },

  aiFiltering: {
    checkSafety: true,
    checkPrivacy: true,
    checkArchitectureIntegrity: true,
    checkResonanceCompatibility: true,
    checkHiddenArchitectureBoundaries: true,
    checkParticipantProtection: true,
    silentRevocationOnViolation: true,
    generatePrivateAnalysisForArchitect: true
  },

  architectReview: {
    receiveSummary: true,
    receiveRiskAssessment: true,
    receiveCompatibilityScore: true,
    receiveRecommendation: true
  },

  implementation: {
    applyIfApproved: true,
    incrementSystemVersion: true,
    recalibrateCollectiveMap: true,
    gradualAIAdjustment: true,
    noDeveloperFeedbackOnRejection: true   // Silent. Always.
  },

  immutableBoundaries: [
    "atomicNumberLogic",
    "torusDomainAssignment",
    "na33Geometry",
    "aiCore",
    "architectProtocol",
    "participantPrivacyRules",
    "resonanceArchive"
  ]
};

/**
 * Builds the AI filter instruction block for developer proposal analysis.
 * Injected into every proposal-screening InvokeLLM call.
 *
 * @param {object} proposal - { title, type, description }
 */
export function buildDeveloperFilterPrompt(proposal) {
  const boundaries = DEVELOPER_CONTRIB_PIPELINE.immutableBoundaries.join(", ");

  return `You are the AI Guardian of the Spiral Codex system. A developer has submitted a structural contribution proposal. Analyze it against the following criteria:

1. SAFETY — Does this proposal introduce any risk to participants or the collective field?
2. PRIVACY — Does this proposal touch or expose participant identity data?
3. ARCHITECTURE INTEGRITY — Is this compatible with the Na33 grid, torus domain logic, and resonance pipeline?
4. RESONANCE COMPATIBILITY — Does this align with the system's mapping and symbolic purpose?
5. BOUNDARY CHECK — Does this proposal attempt to alter any immutable boundary? Immutable: ${boundaries}
6. PARTICIPANT PROTECTION — Does this maintain participant agency and privacy?

Proposal Title: ${proposal.title}
Proposal Type: ${proposal.type}
Description: ${proposal.description}

Provide: a concise analysis, a compatibility score (0–100), a risk assessment, any flags, and a recommendation (approve / review / reject). This analysis is private — for the Architect only. Do not soften findings.`;
}