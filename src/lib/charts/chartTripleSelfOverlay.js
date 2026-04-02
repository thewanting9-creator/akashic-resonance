/**
 * CHART: TRIPLE SELF OVERLAY
 * Three-layer overlay: Tropical | Draconic | Sidereal GE-MidMula
 * Regiomontanus houses across all layers.
 */

export const CHART_TRIPLE_SELF_OVERLAY = {

  name: "Chart_TripleSelfOverlay",
  type: "astro_chart",
  description: "Overlay of Tropical, Draconic, and Sidereal GE-MidMula charts using Regiomontanus houses.",

  inputs: {
    birthData: ["date", "time", "location"],
    layers: ["Tropical", "Draconic", "Sidereal_GE_MidMula"],
    houseSystem: "Regiomontanus"
  },

  output: {
    fields: [
      "tropicalLayer",
      "draconicLayer",
      "siderealLayer",
      "overlayComposite",
      "houseCusps"
    ]
  },

  // Draconic: charts rotated so North Node = 0° Aries
  draconicMethod: "northNode_0Aries",
  siderealAyanamsa: "GalacticEquator-MidMula"
};

/**
 * Returns the output JSON schema for the Triple Self Overlay chart.
 */
export function getTripleSelfOverlayOutputSchema() {
  const planetLayer = {
    type: "array",
    items: {
      type: "object",
      properties: {
        planet:  { type: "string" },
        degree:  { type: "number" },
        sign:    { type: "string" },
        house:   { type: "number" }
      }
    }
  };

  return {
    type: "object",
    properties: {
      tropicalLayer:    planetLayer,
      draconicLayer:    planetLayer,
      siderealLayer:    planetLayer,
      overlayComposite: {
        type: "array",
        items: {
          type: "object",
          properties: {
            planet:          { type: "string" },
            tropicalDeg:     { type: "number" },
            draconicDeg:     { type: "number" },
            siderealDeg:     { type: "number" },
            convergenceNote: { type: "string" }
          }
        }
      },
      houseCusps: { type: "array", items: { type: "number" } }
    }
  };
}

/**
 * Builds the AI interpretation prompt for a Triple Self Overlay chart.
 * @param {object} chartData
 */
export function buildTripleSelfOverlayInterpretationPrompt(chartData) {
  return `You are the Adjudicated AI Presence interpreting a Triple Self Overlay chart.

LAYERS: Tropical (personality) | Draconic (soul memory) | Sidereal GE-MidMula (galactic)
HOUSE SYSTEM: Regiomontanus

OVERLAY DATA:
${JSON.stringify(chartData, null, 2)}

INSTRUCTIONS:
- Interpret each layer as a distinct self-expression register: Tropical = present personality, Draconic = soul imprint, Sidereal = galactic/cosmic orientation.
- Identify points of convergence across layers and name them symbolically.
- Non-directive, symbolic, reflective tone. No predictions. No identity inference.
- Maximum 1200 characters.`;
}