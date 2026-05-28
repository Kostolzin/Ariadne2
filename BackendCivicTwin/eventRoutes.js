// Handles backend workflow events sent by the web frontend.
//
// Backend owns workflow progression/state.

import express from "express";

import {
  getCivicState,
  reserveAppointment,
  confirmAppointment,
  completeStep,
  addPendingWorkflow,
  startNextPendingWorkflow,
  syncActiveWorkflowSteps,
} from "./mockCivicState.js";

export const eventRouter = express.Router();

/// <summary>
/// Handles backend civic events.
/// </summary>
eventRouter.post("/", async (req, res) => {
  try {
    const { eventType, user, payload } = req.body;

    console.log("Received event:", eventType);
    console.log("Event payload:", payload);

    let state = getCivicState(user);

    /// --------------------------------------------------------
    /// APPOINTMENT SLOT SELECTED
    /// --------------------------------------------------------
    if (eventType === "appointment_slot_selected") {
      state = reserveAppointment(user, payload.selectedAppointment);
      state = syncActiveWorkflowSteps(state);

      return res.json({
        success: true,

        assistantMessage:
          "I have temporarily reserved this appointment for you. Please confirm if you want to book it.",

        civicState: state,

        nextAction: "confirm_appointment",

        officeType: "police_station",

        currentStage: state.currentStage,

        nextRecommendedAction: "confirm_appointment",
      });
    }

    /// --------------------------------------------------------
    /// APPOINTMENT CONFIRMED
    /// --------------------------------------------------------
    if (eventType === "appointment_confirmed") {
      state = confirmAppointment(user);
      state = syncActiveWorkflowSteps(state);
      state = syncActiveWorkflowSteps(state);

      return res.json({
        success: true,

        assistantMessage:
          "Your appointment has been confirmed. The next digital step is the e-Paravolo payment.",

        civicState: state,

        completedStep: "appointment",

        nextAction: "go_to_e_paravolo",

        officeType: "kep",

        currentStage: state.currentStage,

        nextRecommendedAction: "go_to_e_paravolo",
      });
    }

    /// --------------------------------------------------------
    /// E-PARAVOLO ISSUED
    /// --------------------------------------------------------
    if (eventType === "e_paravolo_issued") {
      state = completeStep(user, "e_paravolo");

      let nextAction = "refresh_checklist";
      let assistantMessage = "Your e-Paravolo has been generated successfully.";
      let officeType = "none";
      let nextRecommendedAction = "ready_for_physical_visit";

      if (state.pendingWorkflows && state.pendingWorkflows.length > 0) {
        assistantMessage =
          "Your e-Paravolo has been generated successfully. " +
          "You also mentioned another civic need. Would you like to continue with the residence certificate workflow?";

        nextAction = "offer_pending_workflow";
        officeType = "kep";
        nextRecommendedAction = "continue_pending_workflow";
      }

      // Generate fake payment reference.
      const paymentCode =
        "RF4485-" + Math.floor(Math.random() * 1000000);

      state = syncActiveWorkflowSteps(state);

      return res.json({
        success: true,

        assistantMessage: assistantMessage,

        civicState: state,

        completedStep: "e_paravolo",

        paymentCode: paymentCode,

        amount: "10.00 EUR",

        paymentStatus: "pending_payment",

        nextAction: nextAction,

        officeType: officeType,

        currentStage: state.currentStage,

        nextRecommendedAction: nextRecommendedAction,
      });
    }

    /// --------------------------------------------------------
    /// GENERIC DOCUMENT UPLOAD
    /// --------------------------------------------------------
    if (eventType === "document_uploaded") {
      state = completeStep(user, payload.stepId);
      state = syncActiveWorkflowSteps(state);

      return res.json({
        success: true,

        assistantMessage:
          "The document has been added to your civic record.",

        civicState: state,

        completedStep: payload.stepId,

        nextAction: "refresh_checklist",

        officeType: "none",

        currentStage: state.currentStage,

        nextRecommendedAction: "continue_workflow",
      });
    }

    /// --------------------------------------------------------
    /// TAXISNET AUTHENTICATED
    /// --------------------------------------------------------
    if (eventType === "taxisnet_authenticated") {
      state = completeStep(user, "taxisnet_login");
      state.activeWorkflow = "residence_certificate";
      state.activeVariant = "standard";
      state.currentStage = "residence_proof_required";
      state = syncActiveWorkflowSteps(state);

      return res.json({
        success: true,

        assistantMessage:
          "You have authenticated successfully with Taxisnet. Next, upload or confirm your proof of residence.",

        civicState: state,

        completedStep: "taxisnet_login",

        nextAction: "upload_residence_proof",

        officeType: "kep",

        currentStage: state.currentStage,

        nextRecommendedAction: "upload_residence_proof",
      });
    }

    /// --------------------------------------------------------
    /// RESIDENCE PROOF UPLOADED
    /// --------------------------------------------------------
    if (eventType === "residence_proof_uploaded") {
      state = completeStep(user, "residence_proof");
      state.activeWorkflow = "residence_certificate";
      state.activeVariant = "standard";
      state.currentStage = "ready_to_request_certificate";
      state = syncActiveWorkflowSteps(state);

      return res.json({
        success: true,

        assistantMessage:
          "Your proof of residence has been added. You can now submit the residence certificate request.",

        civicState: state,

        completedStep: "residence_proof",

        nextAction: "request_residence_certificate",

        officeType: "kep",

        currentStage: state.currentStage,

        nextRecommendedAction: "request_residence_certificate",
      });
    }

    /// --------------------------------------------------------
    /// RESIDENCE CERTIFICATE REQUESTED
    /// --------------------------------------------------------
    if (eventType === "residence_certificate_requested") {
      state = completeStep(user, "municipality_review");
      state.activeWorkflow = "residence_certificate";
      state.activeVariant = "standard";
      state.currentStage = "municipality_review";
      state = syncActiveWorkflowSteps(state);

      return res.json({
        success: true,

        assistantMessage:
          "Your residence certificate request has been submitted to the municipality for review.",

        civicState: state,

        completedStep: "municipality_review",

        nextAction: "wait_for_certificate",

        officeType: "kep",

        currentStage: state.currentStage,

        nextRecommendedAction: "wait_for_certificate",
      });
    }

    /// --------------------------------------------------------
    /// RESIDENCE CERTIFICATE ISSUED
    /// --------------------------------------------------------
    if (eventType === "residence_certificate_issued") {
      state = completeStep(user, "gov_inbox_delivery");
      state.activeWorkflow = "residence_certificate";
      state.activeVariant = "standard";
      state.currentStage = "certificate_issued";
      state = syncActiveWorkflowSteps(state);

      return res.json({
        success: true,

        assistantMessage:
          "Your residence certificate has been issued and delivered to your gov.gr inbox.",

        civicState: state,

        completedStep: "gov_inbox_delivery",

        nextAction: "workflow_complete",

        officeType: "none",

        currentStage: state.currentStage,

        nextRecommendedAction: "workflow_complete",
      });
    }

    /// --------------------------------------------------------
    /// CONTINUE PENDING WORKFLOW
    /// --------------------------------------------------------
    if (eventType === "continue_pending_workflow") {
      state = startNextPendingWorkflow(user);
      state = syncActiveWorkflowSteps(state);

      return res.json({
        success: true,

        assistantMessage:
          "Great. I will now continue with the next related workflow.",

        civicState: state,

        nextAction: "start_pending_workflow",

        officeType: "kep",

        currentStage: state.currentStage,

        nextRecommendedAction: "authenticate_with_taxisnet",
      });
    }

    /// --------------------------------------------------------
    /// UNKNOWN EVENT
    /// --------------------------------------------------------
    return res.status(400).json({
      success: false,

      assistantMessage: "Unknown event type.",

      civicState: state,

      nextAction: "error",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,

      assistantMessage: "Backend event error.",

      nextAction: "error",
    });
  }
});
