/**
 * ASTRO DEFAULTS
 * System-wide default object list used across all chart computations.
 * Includes planets, nodes, hypotheticals, fixed stars, and galactic points.
 */

export const ASTRO_DEFAULTS = {

  objects: [
    // Classical + modern planets
    "Sun",
    "Moon",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
    "Pluto",

    // Lunar nodes (true positions)
    "TrueRahu",
    "TrueKetu",

    // Lunar apogee/perigee bodies
    "BlackMoonLilith",
    "WhiteMoonSelena",

    // Sensitive points
    "Fortune",
    "Vertex",

    // Asteroids
    "Chiron",
    "Ceres",
    "Vesta",

    // Trans-Neptunian / hypothetical objects
    "Ion",
    "Ixion",
    "Pollus",

    // Galactic reference points
    "GalacticCenter",
    "NorthGalacticPole",
    "SouthGalacticPole",

    // Special point sets
    "LandreyPoints",
    "BohemianStars_30"
  ]
};

/**
 * Returns the default object list as a flat array.
 */
export function getDefaultAstroObjects() {
  return ASTRO_DEFAULTS.objects;
}

/**
 * Returns objects grouped by category.
 */
export function getAstroObjectsByCategory() {
  return {
    planets: [
      "Sun", "Moon", "Mercury", "Venus", "Mars",
      "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"
    ],
    nodes: ["TrueRahu", "TrueKetu"],
    lunarBodies: ["BlackMoonLilith", "WhiteMoonSelena"],
    sensitivePoints: ["Fortune", "Vertex"],
    asteroids: ["Chiron", "Ceres", "Vesta"],
    hypotheticals: ["Ion", "Ixion", "Pollus"],
    galacticPoints: ["GalacticCenter", "NorthGalacticPole", "SouthGalacticPole"],
    specialSets: ["LandreyPoints", "BohemianStars_30"]
  };
}