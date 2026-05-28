import { Icon } from "./Icon";
import { MapCard } from "./MapCard";
import { SectionLabel } from "./SectionLabel";
import { describeStep } from "../data/stepCatalog";
import type { AiDecideResponse, NearestOfficeResult } from "../types/api";
import type { UserLocation } from "../api/geolocation";

interface ItineraryColumnProps {
  mobile: boolean;
  decision: AiDecideResponse | null;
  nearestOffice: NearestOfficeResult | null;
  userLocation: UserLocation | null;
  selectedAppointment: string | null;
  reservedAppointment: string | null;
  isLocating: boolean;
  locationError: string | null;
  onSelectAppointment: (slot: string) => void;
  onConfirmAppointment: () => void;
  onShareLocation: () => void;
}

export function ItineraryColumn({
  mobile,
  decision,
  nearestOffice,
  userLocation,
  selectedAppointment,
  reservedAppointment,
  isLocating,
  locationError,
  onSelectAppointment,
  onConfirmAppointment,
  onShareLocation,
}: ItineraryColumnProps) {
  const requiredSteps = decision?.requiredSteps ?? [];
  const completed = new Set(decision?.completedSteps ?? []);
  const appointments = decision?.availableAppointments ?? [];

  return (
    <section
      style={{
        background: "#fbf7ee",
        padding: mobile ? "24px 18px" : "36px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        overflow: "auto",
        minHeight: 0,
      }}
    >
      <MapCard
        nearestOffice={nearestOffice}
        userLocation={userLocation}
        isLocating={isLocating}
        locationError={locationError}
        onShareLocation={onShareLocation}
      />

      <PathTimeline
        steps={requiredSteps}
        completed={completed}
        emptyState={decision ? null : "Tell Ariadne what's happened to see your path."}
      />

      {requiredSteps.length > 0 && (
        <Documents steps={requiredSteps} completed={completed} />
      )}

      <AppointmentCard
        appointments={appointments}
        selected={selectedAppointment}
        reserved={reservedAppointment}
        onSelect={onSelectAppointment}
        onConfirm={onConfirmAppointment}
      />
    </section>
  );
}

interface PathTimelineProps {
  steps: string[];
  completed: Set<string>;
  emptyState: string | null;
}

function PathTimeline({ steps, completed, emptyState }: PathTimelineProps) {
  return (
    <div>
      <SectionLabel>Your path</SectionLabel>
      {steps.length === 0 ? (
        <div style={{ marginTop: 14, fontSize: 13, color: "#6a6f78" }}>
          {emptyState}
        </div>
      ) : (
        <div style={{ position: "relative", marginTop: 14 }}>
          <div
            style={{
              position: "absolute",
              left: 11,
              top: 8,
              bottom: 8,
              width: 1.5,
              backgroundImage:
                "linear-gradient(rgba(31,93,74,0.4) 50%, transparent 0)",
              backgroundSize: "1.5px 6px",
            }}
          />
          {steps.map((stepId, i) => {
            const meta = describeStep(stepId);
            const done = completed.has(stepId);
            return (
              <div
                key={stepId}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "8px 0",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 99,
                    background: done ? "#1f5d4a" : "#fbf7ee",
                    border: "1.5px solid #1f5d4a",
                    color: done ? "#fbf7ee" : "#1f5d4a",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                    zIndex: 1,
                  }}
                >
                  {done ? <Icon name="check" size={12} stroke={2.4} /> : i + 1}
                </div>
                <div style={{ flex: 1, paddingTop: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.1 }}>
                    {meta.title}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#6a6f78", marginTop: 2 }}>
                    {meta.hint} <span style={{ color: "#9aa0a8" }}>·</span> {meta.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface DocumentsProps {
  steps: string[];
  completed: Set<string>;
}

function Documents({ steps, completed }: DocumentsProps) {
  return (
    <div>
      <SectionLabel>Bring with you</SectionLabel>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((stepId) => {
          const meta = describeStep(stepId);
          const done = completed.has(stepId);
          return (
            <div
              key={stepId}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                background: "#fff",
                border: "1px solid rgba(31,93,74,0.15)",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: done ? "#1f5d4a" : "#fff",
                  border: "1.5px solid #1f5d4a",
                  color: "#fbf7ee",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {done && <Icon name="check" size={12} stroke={2.4} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{meta.title}</div>
                <div style={{ fontSize: 11.5, color: "#6a6f78", marginTop: 1 }}>
                  {meta.hint}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AppointmentCardProps {
  appointments: string[];
  selected: string | null;
  reserved: string | null;
  onSelect: (slot: string) => void;
  onConfirm: () => void;
}

function AppointmentCard({
  appointments,
  selected,
  reserved,
  onSelect,
  onConfirm,
}: AppointmentCardProps) {
  if (appointments.length === 0 && !reserved) return null;

  if (reserved) {
    return (
      <div
        style={{
          background: "#1f5d4a",
          color: "#fbf7ee",
          borderRadius: 14,
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "rgba(255,255,255,0.12)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="cal" size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              opacity: 0.7,
              fontWeight: 600,
            }}
          >
            Appointment reserved
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, marginTop: 2 }}>
            {reserved}
          </div>
          <button
            onClick={onConfirm}
            style={{
              marginTop: 8,
              background: "#fbf7ee",
              color: "#1f5d4a",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Confirm booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(31,93,74,0.2)",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <SectionLabel small>Available slots</SectionLabel>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {appointments.map((slot) => {
          const isSelected = slot === selected;
          return (
            <button
              key={slot}
              onClick={() => onSelect(slot)}
              style={{
                background: isSelected ? "#1f5d4a" : "transparent",
                color: isSelected ? "#fbf7ee" : "#1f5d4a",
                border: "1px solid #1f5d4a",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}
