// Human labels and timing hints for workflow step IDs returned by the backend.
// Step IDs come from CivicTwinBackend/workflows.js and the variant logic in
// CivicTwinBackend/mockGovernmentApis.js (checkMissingDocuments).

export interface StepMeta {
  title: string;
  hint: string;
  time: string;
}

export const STEP_CATALOG: Record<string, StepMeta> = {
  photo: {
    title: "Digital photo",
    hint: "Required for the new ID — photo booth at any KEP",
    time: "~5 min",
  },
  e_paravolo: {
    title: "e-Paravolo 10,00€ + Police stamp 0,50€",
    hint: "I can generate the payment code for you",
    time: "~3 min",
  },
  appointment: {
    title: "Police appointment",
    hint: "Pick a slot and I'll reserve it",
    time: "varies",
  },
  physical_presence: {
    title: "Physical presence at police authority",
    hint: "Bring everything from this list",
    time: "~25 min",
  },
  witness: {
    title: "Witness for first-time ID",
    hint: "An adult who can confirm your identity",
    time: "in person",
  },
  loss_declaration: {
    title: "Loss declaration",
    hint: "Drafted from your case — I'll prepare it",
    time: "~5 min",
  },
  theft_report: {
    title: "Theft report",
    hint: "File at the nearest police station",
    time: "~15 min",
  },
  taxisnet_login: {
    title: "Authenticate with Taxisnet",
    hint: "Use your TaxisNet credentials at gov.gr",
    time: "~2 min",
  },
  residence_proof: {
    title: "Attach proof of residence",
    hint: "Utility bill, lease, or rental contract",
    time: "~5 min",
  },
  municipality_review: {
    title: "Municipality reviews request",
    hint: "Submitted automatically once your proof is in",
    time: "1-3 days",
  },
  gov_inbox_delivery: {
    title: "Certificate delivered to gov.gr inbox",
    hint: "You'll get a notification when it's ready",
    time: "instant",
  },
};

export function describeStep(stepId: string): StepMeta {
  return (
    STEP_CATALOG[stepId] ?? {
      title: stepId.replace(/_/g, " "),
      hint: "",
      time: "",
    }
  );
}

// Maps the abstract building name the AI returns to a Places-search officeType
// understood by /api/maps/nearest (see CivicTwinBackend/mapsService.js).
export const BUILDING_TO_OFFICE_TYPE: Record<string, string> = {
  PoliceServices: "police_station",
  DigitalServicesHub: "kep",
  None: "",
};
