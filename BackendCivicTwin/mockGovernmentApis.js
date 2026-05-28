// mockGovernmentApis.js
// Fake government APIs for the hackathon prototype.
// These functions simulate what real public-service systems might return later.

export function getCitizenRecord(user) {
  // Simulated citizen registry data.
  // In production, this would come from secure government systems.

  if (!user || user.name === "Nikos") {
    return {
      citizenId: "u002",
      name: "Nikos",
      municipality: "Piraeus",
      documents: ["current_id"],
      identityRegistryStatus: "verified",
    };
  }

  return {
    citizenId: "u001",
    name: "Eleni",
    municipality: "Athens",
    documents: ["photo"],
    identityRegistryStatus: "verified",
  };
}

export function getAvailableAppointments(municipality) {
  // Simulated appointment system.
  // In production, this would call the police appointment platform.

  if (municipality === "Piraeus") {
    return ["Tuesday 12:00", "Thursday 09:30"];
  }

  return ["Monday 10:30", "Wednesday 12:00"];
}

export function checkMissingDocuments(workflow, workflowVariant, citizenRecord) {
  // Simulated document validation.
  // Compares required steps with the citizen's existing documents.

  const has = citizenRecord.documents || [];

  let required = [];

  if (workflow === "new_identity_card") {
    required = ["photo", "e_paravolo", "appointment"];

    if (workflowVariant === "first_time") {
      required.push("witness");
    }

    if (workflowVariant === "lost") {
      required.push("loss_declaration");
    }

    if (workflowVariant === "stolen") {
      required.push("theft_report");
    }
  }

  if (workflow === "residence_certificate") {
    required = ["taxisnet_login", "residence_proof", "municipality_review"];
  }

  const missing = required.filter((doc) => !has.includes(doc));
  const completed = required.filter((doc) => has.includes(doc));

  return {
    required,
    completed,
    missing,
  };
}