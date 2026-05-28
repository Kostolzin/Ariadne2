// commandBuilder.js
// Adds mock government API results to the AI command.
// This makes the response personalized to the citizen.

import {
  getCitizenRecord,
  getAvailableAppointments,
  checkMissingDocuments,
} from "./mockGovernmentApis.js";

import {
  addPendingWorkflow,
  addRelatedWorkflowsToPending,
  setActiveWorkflow,
  syncActiveWorkflowSteps,
} from "./mockCivicState.js";

export function enrichCommandWithGovernmentData(result, user) {
  // If clarification is needed, do not check documents yet.
  if (result.clarificationNeeded || result.workflow === "unknown") {

  // If the AI detected additional workflows,
// store them in backend pendingWorkflows.
// Example:
// primary workflow: new_identity_card
// relatedWorkflows: ["residence_certificate"]
if (result.relatedWorkflows && result.relatedWorkflows.length > 0) {
  addRelatedWorkflowsToPending(user, result.relatedWorkflows);
}
    return result;
  }

  const citizenRecord = getCitizenRecord(user);

  const documentCheck = checkMissingDocuments(
    result.workflow,
    result.workflowVariant,
    citizenRecord
  );

  const state = setActiveWorkflow(user, result.workflow, result.workflowVariant);
  const workflowState = state.workflowStates?.[result.workflow];

  if (workflowState) {
    workflowState.completedSteps = [...documentCheck.completed];
    workflowState.missingSteps = [...documentCheck.missing];
    workflowState.currentStage = "workflow_started";
    syncActiveWorkflowSteps(state);
  }

  // MVP multi-workflow support.
// If the AI selected ID as the primary workflow,
// but the assistant message indicates residence certificate was also mentioned,
// queue residence_certificate as the next workflow.
if (
  result.workflow === "new_identity_card" &&
  result.assistantMessage &&
  result.assistantMessage.toLowerCase().includes("residence")
) {
  addPendingWorkflow(user, "residence_certificate");
}

  const appointments = getAvailableAppointments(citizenRecord.municipality);

  result.citizenRecord = citizenRecord;
  result.requiredSteps = documentCheck.required;
  result.completedSteps = documentCheck.completed;
  result.missingSteps = documentCheck.missing;
  result.availableAppointments = appointments;

  const completedText =
    documentCheck.completed.length > 0
      ? documentCheck.completed.join(", ")
      : "none";

  const missingText =
    documentCheck.missing.length > 0
      ? documentCheck.missing.join(", ")
      : "none";

  result.assistantMessage =
    result.assistantMessage +
    "\n\nI checked your mock civic record." +
    "\nCompleted steps: " +
    completedText +
    "." +
    "\nMissing steps: " +
    missingText +
    ".";

  return result;
}
