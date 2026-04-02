/**
 * INTERACTIVE PERFORMANCE DASHBOARD — FEATURE SPEC
 * Full analytics dashboard with core + advanced metrics, 5 visualization types,
 * drill-down up to depth 3, and strict aggregate-only privacy.
 */

export const INTERACTIVE_PERFORMANCE_DASHBOARD = {

  name: "InteractivePerformanceDashboard",
  type: "analytics_dashboard",

  dataSources: [
    "sessionLogs",
    "stageEvents",
    "aiOutputs",
    "userEngagement"
  ],

  metrics: {
    core: [
      "sessionsPerDay",
      "avgSessionDuration",
      "stageCompletionRate",
      "dropoffByStage",
      "returnRate"
    ],
    advanced: [
      "timeBetweenStages",
      "repeatVisitRate",
      "featureUsageFrequency",
      "engagementDepthScore"
    ]
  },

  visualizations: [
    "lineChart",
    "barChart",
    "funnel",
    "heatmap",
    "cohortCurve"
  ],

  interactions: {
    filters: [
      "dateRange",
      "stage",
      "cohort",
      "engagementLevel"
    ],
    drillDown: {
      enabled: true,
      maxDepth: 3
    }
  },

  privacy: {
    aggregateOnly: true,
    noRawIdentityData: true
  }
};

/**
 * Returns the default filter state.
 */
export function getDefaultFilters() {
  return {
    dateRange: { start: null, end: null },
    stage: null,
    cohort: null,
    engagementLevel: null
  };
}

/**
 * Returns the recommended visualization type for a given metric.
 * @param {string} metric
 */
export function getVisualizationForMetric(metric) {
  const map = {
    sessionsPerDay:          "lineChart",
    avgSessionDuration:      "lineChart",
    stageCompletionRate:     "funnel",
    dropoffByStage:          "barChart",
    returnRate:              "cohortCurve",
    timeBetweenStages:       "heatmap",
    repeatVisitRate:         "cohortCurve",
    featureUsageFrequency:   "barChart",
    engagementDepthScore:    "lineChart"
  };
  return map[metric] || "barChart";
}