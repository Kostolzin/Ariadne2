// workflows.js
// This file stores the civic workflow rules for the prototype.
// In a real product, this would eventually live in a database.

export const workflows = {
  new_identity_card: {
    title: "New Identity Card",
    serviceType: "hybrid",
    mainBuilding: "PoliceServices",
    description:
      "Preparation for issuing a new Greek identity card. Some steps are digital, but physical presence at the police authority is required.",
    steps: [
      {
        id: "photo",
        label: "Digital photo",
        type: "digital",
        required: true,
      },
      {
        id: "e_paravolo",
        label: "e-Paravolo 10,00€ + Police stamp 0,50€",
        type: "digital",
        required: true,
      },
      {
        id: "appointment",
        label: "Police appointment",
        type: "digital",
        required: true,
      },
      {
        id: "physical_presence",
        label: "Physical presence at police authority",
        type: "physical",
        required: true,
      },
    ],
  },

  residence_certificate: {
    title: "Permanent Residence Certificate",
    serviceType: "digital_municipal",
    mainBuilding: "DigitalServicesHub",
    description:
      "Request for a permanent residence certificate through digital government services and the competent municipality.",
    steps: [
      {
        id: "taxisnet_login",
        label: "Authenticate with Taxisnet",
        type: "digital",
        required: true,
      },
      {
        id: "residence_proof",
        label: "Attach proof of residence",
        type: "digital",
        required: true,
      },
      {
        id: "municipality_review",
        label: "Municipality reviews request",
        type: "municipal",
        required: true,
      },
      {
        id: "gov_inbox_delivery",
        label: "Certificate delivered to gov.gr inbox",
        type: "digital",
        required: true,
      },
    ],
  },
};