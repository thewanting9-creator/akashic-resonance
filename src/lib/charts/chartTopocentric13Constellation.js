/**
 * CHART: TOPOCENTRIC 13-CONSTELLATION HORIZONS
 * True planetary data + extended astronomical coordinates from NASA Horizons.
 * Birth data is never stored — ephemeral computation only.
 */

export const CHART_TOPOCENTRIC_13_CONSTELLATION = {

  name: "Chart_Topocentric13Constellation",
  type: "astro_chart",
  description: "Topocentric 13-Constellation Horizons chart with true planetary data and extended astronomical coordinates.",

  inputs: {
    birthData: ["date", "time", "location"],
    horizonsData: [
      "truePlanetaryPositions",
      "distanceLightTime",
      "planetaryOcclusion",
      "zodiacalCoordinates",
      "rightAscension",
      "declination",
      "galacticCoordinates",
      "eclipticLatitude",
      "eclipticLongitude",
      "azimuth",
      "altitude",
      "heliocentricCyclePosition",
      "solarAngle"
    ]
  },

  output: {
    fields: [
      "planetPositions",
      "houseCusps",
      "constellationPlacement",
      "distanceData",
      "visibilityStatus",
      "coordinateSet",
      "solarGeometry"
    ]
  },

  privacy: {
    storeBirthData: false
  },

  // The 13 constellations (IAU boundaries, ecliptic-crossing)
  constellations: [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpius", "Ophiuchus", "Sagittarius",
    "Capricornus", "Aquarius", "Pisces"
  ]
};

/**
 * Returns the JSON schema for the chart output (for InvokeLLM or storage).
 */
export function getTopocentric13OutputSchema() {
  return {
    type: "object",
    properties: {
      planetPositions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            planet:                { type: "string" },
            constellation:         { type: "string" },
            eclipticLongitude:     { type: "number" },
            eclipticLatitude:      { type: "number" },
            rightAscension:        { type: "number" },
            declination:           { type: "number" },
            azimuth:               { type: "number" },
            altitude:              { type: "number" },
            distanceLightTime:     { type: "string" },
            heliocentricCyclePos:  { type: "number" },
            solarAngle:            { type: "number" },
            galacticLatitude:      { type: "number" },
            galacticLongitude:     { type: "number" },
            visibilityStatus:      { type: "string" }
          }
        }
      },
      houseCusps:   { type: "array", items: { type: "number" } },
      solarGeometry: {
        type: "object",
        properties: {
          sunPosition:   { type: "number" },
          solarAngle:    { type: "number" },
          occlusionFlag: { type: "boolean" }
        }
      }
    }
  };
}

/**
 * Builds the AI prompt for symbolic interpretation of a topocentric 13-constellation chart.
 * @param {object} chartData - computed output fields
 */
export function buildTopocentric13InterpretationPrompt(chartData) {
  return `You are the Adjudicated AI Presence interpreting a Topocentric 13-Constellation chart.

CHART DATA:
${JSON.stringify(chartData, null, 2)}

INSTRUCTIONS:
- Use the 13-constellation IAU framework, not the 12-sign tropical convention.
- Reference true planetary positions (topocentric, not geocentric).
- Incorporate distance, visibility, and solar angle symbolically.
- Maintain non-directive, symbolic, reflective tone.
- No identity inference. No predictions. No directive language.
- Maximum 1200 characters.`;
}