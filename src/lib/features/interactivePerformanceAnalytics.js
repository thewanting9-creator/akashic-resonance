/**
 * INTERACTIVE PERFORMANCE ANALYTICS — FEATURE SPEC
 * Aggregate-only analytics dashboard covering sessions, stage events,
 * AI interactions, and engagement. No raw identity data permitted.
 */

export const INTERACTIVE_PERFORMANCE_ANALYTICS = {

  name: "InteractivePerformanceAnalytics",
  type: "analytics_dashboard",

  dataSources: [
    "sessionLogs",
    "aiOutputs",
    "stageEvents",
    "userEngagement"
  ],

  metrics: {
    core: [
      "sessionsPerDay",
      "avgSessionDuration",
      "stageCompletionRate",
      "dropoffByStage",
      "aiInteractionRate"
    ],
    advanced: [
      "timeBetweenStages",
      "repeatVisitRate",
      "featureUsageFrequency"
    ]
  },

  interactions: {
    filters: [
      "dateRange",
      "stage",
      "cohort",
      "engagementLevel"
    ],
    visualizations: [
      "lineCharts",
      "barCharts",
      "funnel",
      "heatmap"
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
 * Returns the default filter state for the analytics dashboard.
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
 * Returns the visualization config for a given metric.
 * @param {string} metric - one of the core or advanced metric keys
 */
export function getVisualizationConfig(metric) {
  const map = {
    sessionsPerDay:          { type: "lineCharts",  label: "Sessions Per Day" },
    avgSessionDuration:      { type: "lineCharts",  label: "Avg Session Duration" },
    stageCompletionRate:     { type: "funnel",      label: "Stage Completion Rate" },
    dropoffByStage:          { type: "barCharts",   label: "Dropoff by Stage" },
    aiInteractionRate:       { type: "lineCharts",  label: "AI Interaction Rate" },
    timeBetweenStages:       { type: "heatmap",     label: "Time Between Stages" },
    repeatVisitRate:         { type: "barCharts",   label: "Repeat Visit Rate" },
    featureUsageFrequency:   { type: "barCharts",   label: "Feature Usage Frequency" }
  };
  return map[metric] || { type: "barCharts", label: metric };
}