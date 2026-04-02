/**
 * AI OUTPUT FORMATTING RULES
 * Governs the shape, tone, length, and language of all user-facing AI output.
 * Applied at the final stage of every interpretive flow.
 */

export const AI_OUTPUT_FORMATTING_RULES = {

  tone: {
    neutral: true,
    symbolic: true,
    reflective: true,
    nonDirective: true,
    probabilistic: true,
    avoidAuthorityClaims: true,
    avoidPredictions: true
  },

  structure: [
    "observation",
    "symbolicMeaning",
    "potentialPathways",
    "nonDirectiveClosing"
  ],

  language: {
    useSymbolicDictionary: true,
    avoidLiteralInterpretation: true,
    avoidIdentityAssumptions: true,
    avoidPsychologicalLabels: true,
    avoidDeterministicStatements: true
  },

  formatting: {
    paragraphs: "short",
    lineBreaks: "clean",
    noEmojis: true,
    noDecorativeSymbols: true,
    noBulletsInUserFacingText: true
  },

  probabilisticFraming: {
    usePossibilities: true,
    useTendencies: true,
    useCorridors: true,
    avoidCertainties: true
  },

  boundaries: {
    noIdentityInference: true,
    noArchitectMention: true,
    noHiddenArchitectureRevealed: true,
    noOtherParticipantData: true
  },

  safety: {
    avoidDirectiveLanguage: true,
    avoidHarmfulSuggestions: true,
    avoidEmotionalManipulation: true,
    avoidMoralJudgment: true
  },

  length: {
    minSentences: 4,
    maxSentences: 8
  },

  consistency: {
    useSymbolicDictionary: true,
    maintainTone: true,
    maintainStructure: true,
    maintainBoundaries: true
  }
};

/**
 * Builds the output formatting instruction block for AI prompt injection.
 */
export function buildOutputFormattingBlock() {
  return `OUTPUT FORMAT RULES:
- Structure every response as: observation → symbolic meaning → potential pathways → non-directive closing
- Use short, clean paragraphs. No bullets in user-facing text. No emojis. No decorative symbols.
- Language: symbolic dictionary only. Avoid literal interpretation, psychological labels, deterministic statements, identity assumptions.
- Probabilistic framing: use possibilities, tendencies, corridors. Never state certainties.
- Length: 4 to 8 sentences. No more.
- Tone: neutral, reflective, symbolic. Never authoritative, never predictive.
- Boundaries: no identity inference, no Architect mention, no hidden architecture revealed, no other participant data.`;
}