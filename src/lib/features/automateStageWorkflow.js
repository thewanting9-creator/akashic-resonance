/**
 * AUTOMATE STAGE WORKFLOW — FEATURE SPEC
 * Delegates to handleStageTransition with notify: true.
 * Stores full transition history with reason logging.
 *
 * Entry function: handleStageTransition (see lib/features/handleStageTransition.js)
 */

export const AUTOMATE_STAGE_WORKFLOW = {

  name: "AutomateStageWorkflow",
  type: "workflow_engine",
  description: "Handles stage transitions using code-based conditions and delegated sub-handlers.",

  entryFunction: "handleStageTransition",

  functionArgs: {
    notify: true
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
 * Builds a transition log entry ready for persistence.
 *
 * @param {string} userId
 * @param {string} fromStage
 * @param {string} toStage
 * @param {string} triggerReason
 */
export function buildWorkflowTransitionLog(userId, fromStage, toStage, triggerReason) {
  return {
    userId,
    fromStage,
    toStage,
    timestamp: new Date().toISOString(),
    triggerReason
  };
}