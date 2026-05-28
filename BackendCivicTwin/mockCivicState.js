// mockCivicState.js
// This file stores temporary mock civic state for the demo.
//
// IMPORTANT:
// This is NOT a real database.
// It only stores data while the backend server is running.
// If you stop/restart the backend, this state resets.
//
// In a real system, this would be stored in a secure database.

const civicStateByUser = {
  Eleni: {
    userId: "u001",
    activeWorkflow: null,
    activeVariant: null,

    currentStage: "initial",
    pendingWorkflows: [],

    appointmentStatus: "not_booked",
    selectedAppointment: null,

    completedSteps: ["photo"],
    missingSteps: [],

    documents: ["photo"],

    workflowStates: {
      new_identity_card: {
        completedSteps: ["photo"],
        missingSteps: [],
        currentStage: "initial",
      },

      residence_certificate: {
        completedSteps: [],
        missingSteps: [],
        currentStage: "initial",
      },
    },
  },

  Nikos: {
    userId: "u002",
    activeWorkflow: null,
    activeVariant: null,

    currentStage: "initial",
    pendingWorkflows: [],

    appointmentStatus: "not_booked",
    selectedAppointment: null,

    completedSteps: [],
    missingSteps: [],

    documents: [],

    workflowStates: {
      new_identity_card: {
        completedSteps: [],
        missingSteps: [],
        currentStage: "initial",
      },

      residence_certificate: {
        completedSteps: [],
        missingSteps: [],
        currentStage: "initial",
      },
    },
  },
};

/// <summary>
/// Gets civic state for a user.
/// If the user does not exist yet, it creates a new mock state.
/// </summary>
export function getCivicState(user) {
  const userName = user?.name || "Guest";

  if (!civicStateByUser[userName]) {
    civicStateByUser[userName] = {
      userId: "guest",
      activeWorkflow: null,
      activeVariant: null,

      currentStage: "initial",

      pendingWorkflows: [],

      appointmentStatus: "not_booked",
      selectedAppointment: null,

      completedSteps: [],
      missingSteps: [],

      documents: [],

      workflowStates: {
        new_identity_card: {
          completedSteps: [],
          missingSteps: [],
          currentStage: "initial",
        },

        residence_certificate: {
          completedSteps: [],
          missingSteps: [],
          currentStage: "initial",
        },
      },
    };
  }

  return civicStateByUser[userName];
}

/// <summary>
/// Starts or updates the active workflow for a user.
/// </summary>
export function setActiveWorkflow(user, workflow, variant) {
  const state = getCivicState(user);

  state.activeWorkflow = workflow;
  state.activeVariant = variant;
  state.currentStage = "workflow_started";

  return state;
}

/// <summary>
/// Temporarily reserves an appointment slot.
/// This simulates the real gov.gr behavior where the appointment is held
/// before the user finally confirms it.
/// </summary>
export function reserveAppointment(user, appointmentSlot) {
  const state = getCivicState(user);

  state.appointmentStatus = "reserved";
  state.selectedAppointment = appointmentSlot;
  state.currentStage = "appointment_reserved";

  return state;
}

/// <summary>
/// Confirms the previously reserved appointment.
/// This marks the appointment step as completed.
/// </summary>
export function confirmAppointment(user) {
  const state = getCivicState(user);

  state.appointmentStatus = "confirmed";

  if (!state.activeWorkflow) {
    state.activeWorkflow = "new_identity_card";
    state.activeVariant = state.activeVariant || "standard";
  }

  const workflowId = state.activeWorkflow;

  if (
    workflowId &&
    state.workflowStates?.[workflowId]
  ) {
    const workflowState = state.workflowStates[workflowId];

    if (!workflowState.completedSteps.includes("appointment")) {
      workflowState.completedSteps.push("appointment");
    }

    workflowState.currentStage = "appointment_confirmed";

    state.currentStage = workflowState.currentStage;
  }

  if (!state.documents.includes("appointment")) {
    state.documents.push("appointment");
  }

  return state;
}

/// <summary>
/// Marks a step as completed in the mock civic state.
/// Example: e_paravolo, loss_declaration, residence_proof.
/// </summary>
export function completeStep(user, stepId) {
  const state = getCivicState(user);

  if (
    !state.activeWorkflow &&
    ["appointment", "e_paravolo", "loss_declaration", "theft_report"].includes(stepId)
  ) {
    state.activeWorkflow = "new_identity_card";
    state.activeVariant = state.activeVariant || "standard";
  }

  const workflowId = state.activeWorkflow;

  // Fallback if workflow missing.
  if (!workflowId || !state.workflowStates?.[workflowId]) {
    return state;
  }

  const workflowState = state.workflowStates[workflowId];

  // Store completion ONLY inside active workflow.
  if (!workflowState.completedSteps.includes(stepId)) {
    workflowState.completedSteps.push(stepId);
  }

  workflowState.missingSteps = (workflowState.missingSteps || []).filter(
    (missingStep) => missingStep !== stepId
  );

  // Store as available document globally if relevant.
  if (!state.documents.includes(stepId)) {
    state.documents.push(stepId);
  }

  // Workflow-specific stages.
  if (stepId === "appointment") {
    workflowState.currentStage = "appointment_confirmed";
  }

  if (stepId === "e_paravolo") {
    workflowState.currentStage = "e_paravolo_generated";
  }

  if (stepId === "taxisnet_login") {
    workflowState.currentStage = "residence_proof_required";
  }

  if (stepId === "residence_proof") {
    workflowState.currentStage = "ready_to_request_certificate";
  }

  if (stepId === "municipality_review") {
    workflowState.currentStage = "municipality_review";
  }

  if (stepId === "gov_inbox_delivery") {
    workflowState.currentStage = "certificate_issued";
  }

  // Sync currently active stage.
  state.currentStage = workflowState.currentStage;

  return state;
}

export function addPendingWorkflow(user, workflowId) {
  const state = getCivicState(user);

  if (!state.pendingWorkflows) {
    state.pendingWorkflows = [];
  }

  if (!state.pendingWorkflows.includes(workflowId)) {
    state.pendingWorkflows.push(workflowId);
  }

  return state;
}

export function addRelatedWorkflowsToPending(user, relatedWorkflows) {
  const state = getCivicState(user);

  if (!state.pendingWorkflows) {
    state.pendingWorkflows = [];
  }

  if (!relatedWorkflows || relatedWorkflows.length === 0) {
    return state;
  }

  for (let i = 0; i < relatedWorkflows.length; i++) {
    const workflowId = relatedWorkflows[i];

    if (
      workflowId &&
      workflowId !== state.activeWorkflow &&
      !state.pendingWorkflows.includes(workflowId)
    ) {
      state.pendingWorkflows.push(workflowId);
    }
  }

  return state;
}
export function startNextPendingWorkflow(user) {
  const state = getCivicState(user);

  if (!state.pendingWorkflows || state.pendingWorkflows.length === 0) {
    return state;
  }

  const nextWorkflow = state.pendingWorkflows.shift();

  state.activeWorkflow = nextWorkflow;
  state.activeVariant = "standard";

  if (nextWorkflow === "residence_certificate") {
    state.currentStage = "taxisnet_auth_required";

    if (state.workflowStates?.residence_certificate) {
      state.workflowStates.residence_certificate.currentStage =
        "taxisnet_auth_required";
    }
  }

  return state;
}

export function syncActiveWorkflowSteps(state) {
  if (!state.activeWorkflow)
    return state;

  const workflowState =
    state.workflowStates?.[state.activeWorkflow];

  if (!workflowState)
    return state;

  state.completedSteps = workflowState.completedSteps || [];
  state.missingSteps = workflowState.missingSteps || [];

  state.currentStage = workflowState.currentStage || "initial";

  return state;
}
