/**
 * CHART: URANIAN HARMONICS
 * 90° and 45° harmonic charts using Tropical zodiac + Regiomontanus houses.
 * Includes midpoints and Uranian transneptunian points.
 */

export const CHART_URANIAN_HARMONICS = {

  name: "Chart_UranianHarmonics",
  type: "astro_chart",
  description: "Uranian 90° and 45° harmonic charts using Tropical Regiomontanus houses.",

  inputs: {
    birthData: ["date", "time", "location"],
    harmonics: ["90_degree", "45_degree"],
    houseSystem: "Regiomontanus",
    zodiac: "Tropical"
  },

  output: {
    fields: [
      "harmonicPositions",
      "midpoints",
      "uranianPoints",
      "houseCusps"
    ]
  },

  // Standard Uranian transneptunian hypothetical points
  uranianPoints: [
    "Cupido", "Hades", "Zeus", "Kronos",
    "Apollon", "Admetos", "Vulkanus", "Poseidon"
  ],

  // Harmonic dial degrees
  harmonicDials: {
    "90_degree": { modulus: 90, sensitivity: 2 },
    "45_degree": { modulus: 45, sensitivity: 1 }
  }
};

/**
 * Returns the output JSON schema for Uranian Harmonics chart.
 */
export function getUranianHarmonicsOutputSchema() {
  return {
    type: "object",
    properties: {
      harmonicPositions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            point:        { type: "string" },
            dial90:       { type: "number" },
            dial45:       { type: "number" },
            tropicalLong: { type: "number" }
          }
        }
      },
      midpoints: {
        type: "array",
        items: {
          type: "object",
          properties: {
            pair:        { type: "string" },
            midpointDeg: { type: "number" },
            dial90:      { type: "number" },
            dial45:      { type: "number" }
          }
        }
      },
      uranianPoints: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name:   { type: "string" },
            degree: { type: "number" },
            dial90: { type: "number" },
            dial45: { type: "number" }
          }
        }
      },
      houseCusps: { type: "array", items: { type: "number" } }
    }
  };
}

/**
 * Builds the AI interpretation prompt for a Uranian Harmonics chart.
 * @param {object} chartData
 * @param {string} dial - "90_degree" | "45_degree"
 */
export function buildUranianHarmonicsInterpretationPrompt(chartData, dial = "90_degree") {
  return `You are the Adjudicated AI Presence interpreting a Uranian Harmonics chart.

DIAL: ${dial === "90_degree" ? "90° modulus" : "45° modulus"}
HOUSE SYSTEM: Regiomontanus (Tropical)

CHART DATA:
${JSON.stringify(chartData, null, 2)}

INSTRUCTIONS:
- Focus on midpoint structures and planetary pictures on the selected dial.
- Reference Uranian transneptunian points symbolically.
- Non-directive, symbolic, reflective tone. No predictions. No directive language.
- Maximum 1200 characters.`;
}