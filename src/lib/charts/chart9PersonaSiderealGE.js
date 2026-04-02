/**
 * CHART: 9 PERSONA — SIDEREAL GALACTIC EQUATOR MID-MULA
 * Nine persona charts computed against the GalacticEquator-MidMula ayanamsa.
 * Sidereal zodiac. Regiomontanus houses.
 */

export const CHART_9_PERSONA_SIDEREAL_GE = {

  name: "Chart_9Persona_SiderealGE",
  type: "astro_chart",
  description: "Nine persona charts using Sidereal GalacticEquator–MidMula ayanamsa.",

  inputs: {
    birthData: ["date", "time", "location"],
    ayanamsa: "GalacticEquator-MidMula",
    personaCount: 9,
    zodiac: "Sidereal",
    houseSystem: "Regiomontanus"
  },

  output: {
    fields: [
      "personaCharts",
      "personaHarmonics",
      "personaHouseCusps",
      "personaOverlays"
    ]
  },

  // Persona chart n: each planet is relocated to the Ascendant of harmonic n
  personaNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9]
};

/**
 * Returns the output JSON schema for the 9 Persona chart.
 */
export function get9PersonaOutputSchema() {
  return {
    type: "object",
    properties: {
      personaCharts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            personaNumber: { type: "number" },
            ascendant:     { type: "number" },
            planets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  planet:        { type: "string" },
                  siderealLong:  { type: "number" },
                  personaLong:   { type: "number" },
                  sign:          { type: "string" },
                  house:         { type: "number" }
                }
              }
            }
          }
        }
      },
      personaHarmonics: {
        type: "array",
        items: {
          type: "object",
          properties: {
            personaNumber: { type: "number" },
            harmonicDeg:   { type: "number" }
          }
        }
      },
      personaHouseCusps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            personaNumber: { type: "number" },
            cusps:         { type: "array", items: { type: "number" } }
          }
        }
      },
      personaOverlays: {
        type: "array",
        items: {
          type: "object",
          properties: {
            personaNumber: { type: "number" },
            overlayNotes:  { type: "string" }
          }
        }
      }
    }
  };
}

/**
 * Builds the AI interpretation prompt for a specific persona chart.
 * @param {object} personaChart - single persona chart data
 * @param {number} personaNumber
 */
export function build9PersonaInterpretationPrompt(personaChart, personaNumber) {
  return `You are the Adjudicated AI Presence interpreting Persona ${personaNumber} of a 9 Persona Sidereal GE-MidMula chart.

AYANAMSA: GalacticEquator-MidMula (Sidereal)
HOUSE SYSTEM: Regiomontanus
PERSONA NUMBER: ${personaNumber}

PERSONA CHART DATA:
${JSON.stringify(personaChart, null, 2)}

INSTRUCTIONS:
- Interpret this persona as a distinct expression layer within the natal field.
- Use symbolic, non-directive language. No identity inference.
- Reference sidereal placements and harmonic resonance symbolically.
- Maximum 1000 characters.`;
}