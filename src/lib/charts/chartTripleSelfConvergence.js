/**
 * CHART: TRIPLE SELF CONVERGENCE
 * Weighted merge of Tropical, Draconic, and Sidereal GE-MidMula layers.
 * Produces unified converged positions, aspects, harmonics, and house cusps.
 */

export const CHART_TRIPLE_SELF_CONVERGENCE = {

  name: "Chart_TripleSelfConvergence",
  type: "astro_chart",
  description: "Merged convergence of Tropical, Draconic, and Sidereal GE-MidMula charts.",

  inputs: {
    birthData: ["date", "time", "location"],
    mergeMethod: "weighted_convergence",
    zodiacLayers: ["Tropical", "Draconic", "Sidereal_GE_MidMula"],
    houseSystem: "Regiomontanus"
  },

  output: {
    fields: [
      "convergedPositions",
      "convergedAspects",
      "convergedHarmonics",
      "convergedHouseCusps"
    ]
  },

  // Default layer weights for weighted_convergence merge
  layerWeights: {
    Tropical:           0.33,
    Draconic:           0.33,
    Sidereal_GE_MidMula: 0.34
  },

  siderealAyanamsa: "GalacticEquator-MidMula"
};

/**
 * Returns the output JSON schema for the Triple Self Convergence chart.
 */
export function getTripleSelfConvergenceOutputSchema() {
  return {
    type: "object",
    properties: {
      convergedPositions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            planet:         { type: "string" },
            convergedDeg:   { type: "number" },
            convergedSign:  { type: "string" },
            convergedHouse: { type: "number" },
            weightedInputs: {
              type: "object",
              properties: {
                tropical:  { type: "number" },
                draconic:  { type: "number" },
                sidereal:  { type: "number" }
              }
            }
          }
        }
      },
      convergedAspects: {
        type: "array",
        items: {
          type: "object",
          properties: {
            pair:    { type: "string" },
            aspect:  { type: "string" },
            orb:     { type: "number" },
            exact:   { type: "boolean" }
          }
        }
      },
      convergedHarmonics: {
        type: "array",
        items: {
          type: "object",
          properties: {
            harmonic: { type: "number" },
            degree:   { type: "number" }
          }
        }
      },
      convergedHouseCusps: { type: "array", items: { type: "number" } }
    }
  };
}

/**
 * Builds the AI interpretation prompt for a Triple Self Convergence chart.
 * @param {object} chartData
 */
export function buildTripleSelfConvergenceInterpretationPrompt(chartData) {
  return `You are the Adjudicated AI Presence interpreting a Triple Self Convergence chart.

MERGE METHOD: Weighted convergence (Tropical 33% | Draconic 33% | Sidereal GE-MidMula 34%)
HOUSE SYSTEM: Regiomontanus

CONVERGENCE DATA:
${JSON.stringify(chartData, null, 2)}

INSTRUCTIONS:
- Interpret the converged positions as a unified, integrated self-field — neither purely Tropical, Draconic, nor Sidereal, but an emergent composite.
- Highlight exact or near-exact converged aspects as points of concentrated field intensity.
- Non-directive, symbolic, reflective tone. No predictions. No identity inference.
- Maximum 1200 characters.`;
}