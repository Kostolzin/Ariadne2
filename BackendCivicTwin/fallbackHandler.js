// fallbackHandler.js
// Keeps the app responsive if Gemini is overloaded,
// rate-limited, or temporarily unavailable.

export function handleAIError(error, res) {
  console.error(error);

  if (
    error.status === 429 ||
    error.status === 503 ||
    error.message === "fetch failed" ||
    error.cause?.code === "UND_ERR_CONNECT_TIMEOUT"
  ) {
    return res.status(200).json({
      assistantMessage:
        "The AI service is temporarily unavailable, so I am using a safe fallback. " +
        "Based on your message, this looks like a lost ID case.",

      workflow: "new_identity_card",
      workflowVariant: "lost",
      clarificationNeeded: false,
      clarificationQuestion: "",
      officeType: "police_station",
      nextAction: "start_lost_id_workflow",

      requiredSteps: ["photo", "e_paravolo", "appointment", "loss_declaration"],
      completedSteps: ["photo"],
      missingSteps: ["e_paravolo", "appointment", "loss_declaration"],
      availableAppointments: ["Monday 10:30", "Wednesday 12:00"],
    });
  }

  return res.status(500).json({
    assistantMessage: "Gemini backend error.",
    workflow: "none",
    workflowVariant: "unknown",
    clarificationNeeded: false,
    clarificationQuestion: "",
    officeType: "none",
    nextAction: "error",
  });
}
