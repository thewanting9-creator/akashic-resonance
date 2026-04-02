/**
 * CHART: SPECIALTY ANGLES, MODALITIES & ELEMENTS
 * Overlay drawing from Uranian Harmonics + Triple Self Convergence data.
 * Focuses on angular structures, modality distributions, and elemental balance.
 */

export const CHART_SPECIALTY_ANGLES_MODALITIES_ELEMENTS = {

  name: "Chart_SpecialtyAnglesModalitiesElements",
  type: "astro_chart",
  description: "Specialty overlay chart focusing on angles, modalities, and elements using Uranian and Triple Self Convergence data.",

  inputs: {
    birthData: ["date", "time", "location"],
    sourceCharts: ["UranianHarmonics", "TripleSelfConvergence"],
    focus: ["angles", "modalities", "elements"]
  },

  output: {
    fields: [
      "angleOverlay",
      "modalityDistribution",
      "elementDistribution",
      "specialtyComposite"
    ]
  },

  // Cardinal angles tracked in the overlay
  angles: ["ASC", "DSC", "MC", "IC", "EP", "WP"],

  modalities: {
    Cardinal: ["Aries", "Cancer", "Libra", "Capricorn"],
    Fixed:    ["Taurus", "Leo", "Scorpio", "Aquarius"],
    Mutable:  ["Gemini", "Virgo", "Sagittarius", "Pisces"]
  },

  elements: {
    Fire:  ["Aries", "Leo", "Sagittarius"],
    Earth: ["Taurus", "Virgo", "Capricorn"],
    Air:   ["Gemini", "Libra", "Aquarius"],
    Water: ["Cancer", "Scorpio", "Pisces"]
  }
};

/**
 * Returns the output JSON schema for Specialty Angles / Modalities / Elements chart.
 */
export function getSpecialtyAnglesOutputSchema() {
  return {
    type: "object",
    properties: {
      angleOverlay: {
        type: "array",
        items: {
          type: "object",
          properties: {
            angle:         { type: "string" },
            degree:        { type: "number" },
            sign:          { type: "string" },
            uranianInput:  { type: "number" },
            convergedInput:{ type: "number" },
            delta:         { type: "number" }
          }
        }
      },
      modalityDistribution: {
        type: "object",
        properties: {
          Cardinal: { type: "number" },
          Fixed:    { type: "number" },
          Mutable:  { type: "number" }
        }
      },
      elementDistribution: {
        type: "object",
        properties: {
          Fire:  { type: "number" },
          Earth: { type: "number" },
          Air:   { type: "number" },
          Water: { type: "number" }
        }
      },
      specialtyComposite: {
        type: "object",
        properties: {
          dominantModality: { type: "string" },
          dominantElement:  { type: "string" },
          angularStrength:  { type: "string" },
          compositeNotes:   { type: "string" }
        }
      }
    }
  };
}

/**
 * Builds the AI interpretation prompt for the Specialty Angles chart.
 * @param {object} chartData
 */
export function buildSpecialtyAnglesInterpretationPrompt(chartData) {
  return `You are the Adjudicated AI Presence interpreting a Specialty Angles, Modalities, and Elements overlay chart.

SOURCE CHARTS: Uranian Harmonics + Triple Self Convergence
FOCUS: Angles (ASC/DSC/MC/IC/EP/WP) | Modalities (Cardinal/Fixed/Mutable) | Elements (Fire/Earth/Air/Water)

CHART DATA:
${JSON.stringify(chartData, null, 2)}

INSTRUCTIONS:
- Describe the dominant elemental and modal tone of the field as observed in this composite.
- Interpret angular concentrations symbolically — where is the field most activated?
- Note any significant delta between Uranian and Convergence angle inputs.
- Non-directive, symbolic, reflective tone. No identity inference. No predictions.
- Maximum 1200 characters.`;
}