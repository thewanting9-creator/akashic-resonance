/**
 * HANDLE STAGE TRANSITION — BACKEND HANDLER SPEC
 * Wired as a Base44 entity event automation on the Participant entity.
 * function_args: { notify: true }
 *
 * Usage in function.jsonc:
 * {
 *   "name": "handleStageTransition",
 *   "entry": "entry.ts",
 *   "automations": [{
 *     "type": "entity",
 *     "name": "on_participant_stage_change",
 *     "entity_name": "Participant",
 *     "event_types": ["update"],
 *     "function_args": { "notify": true },
 *     "is_active": true
 *   }]
 * }
 */

export const HANDLE_STAGE_TRANSITION_CONFIG = {
  function_name: "handleStageTransition",
  function_args: { notify: true }
};

/**
 * Main transition router.
 * Call this from your Base44 backend entry.ts with the event payload.
 *
 * @param {object} params - { event, db, log, notify }
 * event: { userId, oldStage, newStage }
 */
export async function handleStageTransition({ event, db, log, notify }) {
  const { userId, oldStage, newStage } = event;

  if (oldStage === "onboarding"  && newStage === "orientation")    return onboardingToOrientation({ userId, db, log, notify });
  if (oldStage === "orientation" && newStage === "activeUse")      return orientationToActiveUse({ userId, db, log, notify });
  if (oldStage === "activeUse"   && newStage === "deepEngagement") return activeUseToDeepEngagement({ userId, db, log, notify });
  if (oldStage === "activeUse"   && newStage === "dormant")        return activeUseToDormant({ userId, db, log, notify });
  if (oldStage === "dormant"     && newStage === "activeUse")      return dormantToActiveUse({ userId, db, log, notify });

  log(`No transition handler for ${oldStage} → ${newStage}`);
  return { ok: true };
}

// --- SUB-HANDLERS ---

async function onboardingToOrientation({ userId, db, log, notify }) {
  await db.users.update(userId, { stage: "orientation" });
  log(`User ${userId} moved onboarding → orientation`);
  if (notify) notify(userId, "Welcome to Orientation");
  return { ok: true };
}

async function orientationToActiveUse({ userId, db, log, notify }) {
  await db.users.update(userId, { stage: "activeUse" });
  log(`User ${userId} moved orientation → activeUse`);
  if (notify) notify(userId, "You are now active");
  return { ok: true };
}

async function activeUseToDeepEngagement({ userId, db, log, notify }) {
  await db.users.update(userId, { stage: "deepEngagement" });
  log(`User ${userId} moved activeUse → deepEngagement`);
  if (notify) notify(userId, "Deep engagement unlocked");
  return { ok: true };
}

async function activeUseToDormant({ userId, db, log, notify }) {
  await db.users.update(userId, { stage: "dormant" });
  log(`User ${userId} moved activeUse → dormant`);
  if (notify) notify(userId, "We miss you — come back anytime");
  return { ok: true };
}

async function dormantToActiveUse({ userId, db, log, notify }) {
  await db.users.update(userId, { stage: "activeUse" });
  log(`User ${userId} moved dormant → activeUse`);
  if (notify) notify(userId, "Welcome back");
  return { ok: true };
}