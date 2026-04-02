/**
 * COLLECTIVE MAP BEHAVIOR
 * Defines the full structural and visual behavior of the 3D/4D collective resonance map.
 * Dual-torus architecture: TOP (cool spectrum) and BOTTOM (warm spectrum).
 * Participants see their own node only. Other participants' data is never surfaced.
 */

export const COLLECTIVE_MAP_BEHAVIOR = {

  structure: {
    dualTorus: ["TOP", "BOTTOM"],
    nodeProperties: ["color", "pulse", "position", "orbit"]
  },

  nodeBehavior: {
    colorRules: {
      topTorus: "cool_spectrum",      // blues, indigos, violets
      bottomTorus: "warm_spectrum"    // ambers, reds, golds
    },
    pulseRules: {
      frequency: "resonanceActivity",
      brightness: "traitEvolutionIntensity"
    },
    orbitRules: "traitEvolutionDrift"
  },

  navigation: {
    rotation: {
      horizontal: "360",
      vertical: "180",
      easing: "smooth"
    },
    zoom: {
      min: "fullTorusView",
      max: "personalNodeFocus"
    },
    torusSwitching: "smoothMorph",
    timelineScrubbing: "past_present_future"
  },

  overlays: {
    resonanceLines: ["active", "latent", "probabilityCorridors"],
    harmonicFields: ["tension", "release", "convergence"],
    traitEvolutionHeatmap: true,
    collectivePatternLayer: true
  },

  timelineBehavior: {
    past: "dim_faded",
    present: "full_brightness",
    future: "translucent_probabilistic"
  },

  nodeInteraction: {
    tapOwnNode: [
      "na33Grid",
      "tripleSelfChart",
      "resonanceTimeline",
      "traitEvolution",
      "interpretations",
      "guidanceSuggestions"
    ],
    seeOthersData: false    // HARD RULE — enforced at every layer
  },

  collectiveUpdates: {
    triggeredBy: [
      "collectivePatterns",
      "torusBalance",
      "resonanceClusters",
      "systemMilestones"
    ],
    updateStyle: "smooth_symbolic"
  }
};

// ─── NODE COLOR UTILITIES ─────────────────────────────────────────────────────

/**
 * Returns a CSS color value for a node based on torus domain and resonance intensity.
 * @param {"TOP"|"BOTTOM"} torusDomain
 * @param {number} intensity - 0.0 to 1.0
 */
export function getNodeColor(torusDomain, intensity = 0.5) {
  if (torusDomain === "TOP") {
    // Cool spectrum — violet to indigo to sky
    const hue = Math.round(220 + intensity * 60); // 220 (blue) → 280 (violet)
    return `hsl(${hue}, 70%, ${30 + intensity * 40}%)`;
  } else {
    // Warm spectrum — amber to red to gold
    const hue = Math.round(30 - intensity * 30); // 30 (amber) → 0 (red)
    return `hsl(${hue}, 80%, ${30 + intensity * 35}%)`;
  }
}

/**
 * Returns pulse animation duration (ms) based on resonance activity level.
 * Higher activity = faster pulse.
 * @param {number} activity - 0.0 to 1.0
 */
export function getPulseDuration(activity = 0.5) {
  return Math.round(4000 - activity * 2500); // 4000ms (dormant) → 1500ms (active)
}

/**
 * Returns node opacity for timeline rendering.
 * @param {"past"|"present"|"future"} timeState
 */
export function getTimelineOpacity(timeState) {
  const opacityMap = {
    past: 0.35,
    present: 1.0,
    future: 0.55
  };
  return opacityMap[timeState] ?? 1.0;
}