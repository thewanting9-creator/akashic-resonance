/**
 * AUTOMATED STAGE TRANSITIONS — FEATURE SPEC
 * Workflow engine governing lifecycle stage movement.
 * Triggers are condition-based. All transitions are logged with full history.
 *
 * Stages: onboarding → orientation → activeUse ↔ deepEngagement / dormant
 */

export const AUTOMATED_STAGE_TRANSITIONS = {

  name: "AutomatedStageTransitions",
  type: "workflow_engine",

  stages: [
    "onboarding",
    "orientation",
    "activeUse",
    "deepEngagement",
    "dormant"
  ],

  triggers: {
    onboarding_to_orientation: {
      condition: "completedOnboardingChecklist == true"
    },
    orientation_to_activeUse: {
      condition: "firstSessionCompleted == true"
    },
    activeUse_to_deepEngagement: {
      condition: "sessionsLast30Days >= 5"
    },
    activeUse_to_dormant: {
      condition: "daysSinceLastSession >= 21"
    },
    dormant_to_activeUse: {
      condition: "newSessionStarted == true"
    }
  },

  actions: {
    onStageChange: [
      "logEvent",
      "updateUserStageField",
      "optionallyTriggerNotification"
    ]
  },

  logging: {
    storeTransitionHistory: true,
    fields: [
      "userId",
      "fromStage",
      "toStage",
      "timestamp",
      "triggerReason"
    ]
  }
};

/**
 * Evaluates whether a stage transition should fire given a participant's state.
 *
 * @param {string} currentStage
 * @param {object} state - { completedOnboardingChecklist, firstSessionCompleted,
 *                           sessionsLast30Days, daysSinceLastSession, newSessionStarted }
 * @returns {{ shouldTransition: boolean, toStage: string|null, triggerKey: string|null }}
 */
export function evaluateTransition(currentStage, state) {
  const checks = [
    {
      key: "onboarding_to_orientation",
      from: "onboarding",
      to: "orientation",
      test: () => state.completedOnboardingChecklist === true
    },
    {
      key: "orientation_to_activeUse",
      from: "orientation",
      to: "activeUse",
      test: () => state.firstSessionCompleted === true
    },
    {
      key: "activeUse_to_deepEngagement",
      from: "activeUse",
      to: "deepEngagement",
      test: () => (state.sessionsLast30Days || 0) >= 5
    },
    {
      key: "activeUse_to_dormant",
      from: "activeUse",
      to: "dormant",
      test: () => (state.daysSinceLastSession || 0) >= 21
    },
    {
      key: "dormant_to_activeUse",
      from: "dormant",
      to: "activeUse",
      test: () => state.newSessionStarted === true
    }
  ];

  for (const check of checks) {
    if (check.from === currentStage && check.test()) {
      return { shouldTransition: true, toStage: check.to, triggerKey: check.key };
    }
  }

  return { shouldTransition: false, toStage: null, triggerKey: null };
}

/**
 * Builds a transition log record.
 *
 * @param {string} userId
 * @param {string} fromStage
 * @param {string} toStage
 * @param {string} triggerReason
 */
export function buildTransitionLog(userId, fromStage, toStage, triggerReason) {
  return {
    userId,
    fromStage,
    toStage,
    timestamp: new Date().toISOString(),
    triggerReason
  };
}