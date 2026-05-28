// Shapes returned by CivicTwinBackend. Keep aligned with:
//   - server.js  /ai/decide responseSchema
//   - commandBuilder.js enrichment
//   - eventRoutes.js  /api/event responses
//   - mapsRoutes.js   /api/maps/* responses

export interface User {
  name: string;
}

export interface CitizenRecord {
  citizenId: string;
  name: string;
  municipality: string;
  documents: string[];
  identityRegistryStatus: string;
}

export interface ConversationState {
  waitingForClarification?: boolean;
  lastUserMessage?: string;
  lastAssistantQuestion?: string;
  pendingBackendAction?: string;
}

export interface AiDecideRequest {
  message: string;
  user: User;
  conversationState: ConversationState;
  userLocation?: { lat: number; lng: number };
}

export interface AiDecideResponse {
  assistantMessage: string;
  workflow: string;
  workflowVariant: string;
  clarificationNeeded: boolean;
  clarificationQuestion: string;
  officeType: string;
  nextAction: string;
  acceptPendingAction: boolean;
  pendingActionDecision: string;
  relatedWorkflows: string[];
  mapResult?: NearestOfficeResult;

  // Enriched by commandBuilder when no clarification is needed.
  citizenRecord?: CitizenRecord;
  requiredSteps?: string[];
  completedSteps?: string[];
  missingSteps?: string[];
  availableAppointments?: string[];

  // Set when the AI invoked findNearestOffice as a tool during this turn.
  mapResult?: NearestOfficeResult;
}

export interface WorkflowState {
  completedSteps: string[];
  missingSteps: string[];
  currentStage: string;
}

export interface CivicState {
  userId: string;
  activeWorkflow: string | null;
  activeVariant: string | null;
  currentStage: string;
  pendingWorkflows: string[];
  appointmentStatus: "not_booked" | "reserved" | "confirmed";
  selectedAppointment: string | null;
  completedSteps: string[];
  missingSteps: string[];
  documents: string[];
  workflowStates: Record<string, WorkflowState>;
}

export type EventType =
  | "appointment_slot_selected"
  | "appointment_confirmed"
  | "e_paravolo_issued"
  | "document_uploaded"
  | "taxisnet_authenticated"
  | "residence_proof_uploaded"
  | "residence_certificate_requested"
  | "residence_certificate_issued"
  | "continue_pending_workflow";

export interface EventRequest<P = Record<string, unknown>> {
  eventType: EventType;
  user: User;
  payload: P;
}

export interface EventResponse {
  success: boolean;
  assistantMessage: string;
  civicState: CivicState;
  completedStep?: string;
  paymentCode?: string;
  amount?: string;
  paymentStatus?: string;
  nextAction: string;
  officeType?: string;
  currentStage?: string;
  nextRecommendedAction?: string;
}

export interface NearestOfficeRequest {
  officeType: string;
  location?: { lat: number; lng: number };
  typedLocation?: string;
}

export interface NearestOfficeResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  mapsUrl: string;
  // Optional because the backend omits these in MAPS_MOCK mode (no real Place ID).
  embedUrl?: string;
  // Only present when the caller supplied a real GPS origin in the request.
  directionsEmbedUrl?: string;
  directionsUrl?: string;
  queryUsed: string;
  searchCenter: { lat: number; lng: number };
  mock?: boolean;
}

export interface NearestOfficeResponse {
  success: boolean;
  assistantMessage: string;
  result: NearestOfficeResult;
}

export interface MapsConfigResponse {
  success: boolean;
  apiKey: string;
  defaultCenter: { lat: number; lng: number };
  mock?: boolean;
}

export interface DistanceRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  mode?: "walking" | "driving" | "transit";
}

export interface DistanceResult {
  distanceMeters: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
  mock?: boolean;
}

export interface DistanceResponse {
  success: boolean;
  result: DistanceResult;
}
