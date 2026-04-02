/**
 * CHART: ESOTERIC RAYS
 * Seven Ray assignments mapped to planets, signs, and houses.
 * Tropical zodiac + Regiomontanus house system.
 */

export const CHART_ESOTERIC_RAYS = {

  name: "Chart_EsotericRays",
  type: "astro_chart",
  description: "Esoteric Rays chart using Tropical zodiac and Regiomontanus houses.",

  inputs: {
    birthData: ["date", "time", "location"],
    zodiac: "Tropical",
    houseSystem: "Regiomontanus"
  },

  output: {
    fields: [
      "rayAssignments",
      "planetaryRayMapping",
      "houseRayMapping",
      "esotericInterpretiveSet"
    ]
  },

  // Alice Bailey / Tibetan teacher framework — 7 rays
  rays: {
    1: { name: "Will / Power",           color: "Red",          planet: "Vulcan / Pluto" },
    2: { name: "Love / Wisdom",           color: "Indigo Blue",  planet: "Sun / Jupiter" },
    3: { name: "Active Intelligence",     color: "Green",        planet: "Saturn / Earth" },
    4: { name: "Harmony through Conflict",color: "Yellow",       planet: "Mercury / Moon" },
    5: { name: "Concrete Knowledge",      color: "Orange",       planet: "Venus" },
    6: { name: "Devotion / Idealism",     color: "Rose Red",     planet: "Mars / Neptune" },
    7: { name: "Ceremonial Order",        color: "Violet",       planet: "Uranus" }
  },

  // Esoteric planetary rulers by sign (Bailey system)
  esotericRulers: {
    Aries:       { exoteric: "Mars",    esoteric: "Mercury" },
    Taurus:      { exoteric: "Venus",   esoteric: "Vulcan" },
    Gemini:      { exoteric: "Mercury", esoteric: "Venus" },
    Cancer:      { exoteric: "Moon",    esoteric: "Neptune" },
    Leo:         { exoteric: "Sun",     esoteric: "Sun" },
    Virgo:       { exoteric: "Mercury", esoteric: "Moon" },
    Libra:       { exoteric: "Venus",   esoteric: "Uranus" },
    Scorpio:     { exoteric: "Mars",    esoteric: "Mars" },
    Sagittarius: { exoteric: "Jupiter", esoteric: "Earth" },
    Capricorn:   { exoteric: "Saturn",  esoteric: "Saturn" },
    Aquarius:    { exoteric: "Uranus",  esoteric: "Jupiter" },
    Pisces:      { exoteric: "Neptune", esoteric: "Pluto" }
  }
};

/**
 * Returns the output JSON schema for Esoteric Rays chart.
 */
export function getEsotericRaysOutputSchema() {
  return {
    type: "object",
    properties: {
      rayAssignments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            ray:       { type: "number" },
            rayName:   { type: "string" },
            strength:  { type: "string", enum: ["dominant", "secondary", "latent"] }
          }
        }
      },
      planetaryRayMapping: {
        type: "array",
        items: {
          type: "object",
          properties: {
            planet:        { type: "string" },
            ray:           { type: "number" },
            sign:          { type: "string" },
            esotericRuler: { type: "string" }
          }
        }
      },
      houseRayMapping: {
        type: "array",
        items: {
          type: "object",
          properties: {
            house:    { type: "number" },
            sign:     { type: "string" },
            ray:      { type: "number" }
          }
        }
      },
      esotericInterpretiveSet: {
        type: "object",
        properties: {
          soulRay:        { type: "number" },
          personalityRay: { type: "number" },
          mindRay:        { type: "number" },
          summary:        { type: "string" }
        }
      }
    }
  };
}

/**
 * Builds the AI interpretation prompt for an Esoteric Rays chart.
 * @param {object} chartData
 */
export function buildEsotericRaysInterpretationPrompt(chartData) {
  return `You are the Adjudicated AI Presence interpreting an Esoteric Rays chart using the Bailey / Tibetan framework.

CHART DATA:
${JSON.stringify(chartData, null, 2)}

INSTRUCTIONS:
- Reference the Seven Rays symbolically. Identify soul ray, personality ray, and mental ray tendencies.
- Use esoteric planetary rulers (not exoteric) for sign-based interpretations.
- Non-directive, symbolic, reflective tone. No predictions. No directive language. No identity inference.
- Maximum 1200 characters.`;
}