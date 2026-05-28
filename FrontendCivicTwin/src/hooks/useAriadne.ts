import { useCallback, useState } from "react";
import { decide, findNearestOffice, sendEvent } from "../api/client";
import {
  GeolocationError,
  requestUserLocation,
  type UserLocation,
} from "../api/geolocation";
import type {
  AiDecideResponse,
  ConversationState,
  EventRequest,
  EventType,
  NearestOfficeResult,
  User,
} from "../types/api";

export interface ChatMessage {
  id: string;
  from: "ariadne" | "user";
  text: string;
}

interface AriadneState {
  user: User;
  messages: ChatMessage[];
  conversationState: ConversationState;
  lastDecision: AiDecideResponse | null;
  nearestOffice: NearestOfficeResult | null;
  userLocation: UserLocation | null;
  locationError: string | null;
  isLocating: boolean;
  selectedAppointment: string | null;
  reservedAppointment: string | null;
  appointmentStatus: "not_booked" | "reserved" | "confirmed";
  activeServicePanel: "checklist" | "appointment" | "e_paravolo" | null;
  eParavoloPayment: {
    paymentCode: string;
    amount: string;
    paymentStatus: string;
  } | null;
  pendingError: string | null;
  isThinking: boolean;
}

const DEFAULT_GREETING: ChatMessage = {
  id: "greeting",
  from: "ariadne",
  text:
    "Γεια σου, I'm Ariadne. Tell me what's happened and I'll guide you through every step.",
};

function municipalityToLocation(municipality: string | undefined): string {
  // The backend's mock citizen record returns "Athens" or "Piraeus".
  // Both work as free-text Geocoding queries.
  return municipality && municipality.length > 0 ? municipality : "Athens";
}

export function useAriadne(initialUser: User = { name: "Eleni" }) {
  const [state, setState] = useState<AriadneState>(() => ({
    user: initialUser,
    messages: [DEFAULT_GREETING],
    conversationState: {},
    lastDecision: null,
    nearestOffice: null,
    userLocation: null,
    locationError: null,
    isLocating: false,
    selectedAppointment: null,
    reservedAppointment: null,
    appointmentStatus: "not_booked",
    activeServicePanel: null,
    eParavoloPayment: null,
    pendingError: null,
    isThinking: false,
  }));

  const lookupNearest = useCallback(
    async (
      decision: AiDecideResponse,
      userLocation: UserLocation | null,
    ): Promise<NearestOfficeResult | null> => {
      if (decision.mapResult) return decision.mapResult;

      const officeType = decision.officeType;
      if (!officeType) return null;
      if (officeType === "none") return null;

      const typedLocation = municipalityToLocation(
        decision.citizenRecord?.municipality,
      );

      try {
        const response = await findNearestOffice({
          officeType,
          location: userLocation ?? undefined,
          typedLocation,
        });
        return response.result;
      } catch (error) {
        // Map lookups are non-critical — surface the failure but don't block chat.
        console.warn("Nearest-office lookup failed:", error);
        return null;
      }
    },
    [],
  );

  const fetchNearestForDecision = useCallback(
    async (decision: AiDecideResponse) => {
      const result = await lookupNearest(decision, state.userLocation);
      if (result) setState((prev) => ({ ...prev, nearestOffice: result }));
    },
    [lookupNearest, state.userLocation],
  );

  const shareLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, isLocating: true, locationError: null }));
    try {
      const userLocation = await requestUserLocation();
      // Refresh the nearest office using the new origin so the iframe
      // can switch to a walking-directions view.
      let nextNearest: NearestOfficeResult | null = state.nearestOffice;
      if (state.lastDecision) {
        nextNearest =
          (await lookupNearest(state.lastDecision, userLocation)) ??
          state.nearestOffice;
      }
      setState((prev) => ({
        ...prev,
        userLocation,
        nearestOffice: nextNearest,
        isLocating: false,
      }));
    } catch (error) {
      const message =
        error instanceof GeolocationError
          ? error.message
          : "Could not access your location.";
      setState((prev) => ({
        ...prev,
        isLocating: false,
        locationError: message,
      }));
    }
  }, [lookupNearest, state.lastDecision, state.nearestOffice]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMessage: ChatMessage = {
        id: `u-${Date.now()}`,
        from: "user",
        text: trimmed,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isThinking: true,
        pendingError: null,
      }));

      try {
        const decision = await decide({
          message: trimmed,
          user: state.user,
          conversationState: state.conversationState,
        });

        const ariadneMessage: ChatMessage = {
          id: `a-${Date.now()}`,
          from: "ariadne",
          text: decision.assistantMessage,
        };

        const nextConversationState: ConversationState = decision.clarificationNeeded
          ? {
              waitingForClarification: true,
              lastUserMessage: trimmed,
              lastAssistantQuestion: decision.clarificationQuestion,
            }
          : {};

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, ariadneMessage],
          conversationState: nextConversationState,
          lastDecision: decision,
          isThinking: false,
        }));

        if (!decision.clarificationNeeded) {
          void fetchNearestForDecision(decision);
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          pendingError:
            error instanceof Error ? error.message : "Backend error",
          isThinking: false,
        }));
      }
    },
    [state.user, state.conversationState, fetchNearestForDecision],
  );

  const emitEvent = useCallback(
    async <P extends Record<string, unknown>>(
      eventType: EventType,
      payload: P,
    ) => {
      const request: EventRequest<P> = {
        eventType,
        user: state.user,
        payload,
      };

      try {
        const response = await sendEvent(request);
        const ariadneMessage: ChatMessage = {
          id: `e-${Date.now()}`,
          from: "ariadne",
          text: response.assistantMessage,
        };

        setState((prev) => {
          const merged: Partial<AiDecideResponse> = prev.lastDecision
            ? {
                ...prev.lastDecision,
                completedSteps: response.civicState.completedSteps,
                missingSteps: response.civicState.missingSteps,
              }
            : {};

          const shouldOpenEParavolo =
            response.nextAction === "go_to_e_paravolo" ||
            response.nextRecommendedAction === "go_to_e_paravolo" ||
            response.completedStep === "e_paravolo";

          const eParavoloPayment =
            response.completedStep === "e_paravolo"
              ? {
                  paymentCode: response.paymentCode ?? "",
                  amount: response.amount ?? "",
                  paymentStatus: response.paymentStatus ?? "",
                }
              : prev.eParavoloPayment;

          return {
            ...prev,
            messages: [...prev.messages, ariadneMessage],
            lastDecision: prev.lastDecision
              ? ({ ...prev.lastDecision, ...merged } as AiDecideResponse)
              : prev.lastDecision,
            appointmentStatus: response.civicState.appointmentStatus,
            reservedAppointment:
              response.civicState.appointmentStatus === "reserved" ||
              response.civicState.appointmentStatus === "confirmed"
                ? response.civicState.selectedAppointment
                : prev.reservedAppointment,
            activeServicePanel: shouldOpenEParavolo
              ? "e_paravolo"
              : prev.activeServicePanel,
            eParavoloPayment,
          };
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          pendingError:
            error instanceof Error ? error.message : "Event error",
        }));
      }
    },
    [state.user],
  );

  const selectAppointment = useCallback(
    (slot: string) => {
      setState((prev) => ({ ...prev, selectedAppointment: slot }));
      void emitEvent("appointment_slot_selected", { selectedAppointment: slot });
    },
    [emitEvent],
  );

  const confirmAppointment = useCallback(() => {
    void emitEvent("appointment_confirmed", {});
  }, [emitEvent]);

  const issueEParavolo = useCallback(() => {
    void emitEvent("e_paravolo_issued", {});
  }, [emitEvent]);

  return {
    state,
    sendMessage,
    selectAppointment,
    confirmAppointment,
    issueEParavolo,
    emitEvent,
    shareLocation,
  };
}
