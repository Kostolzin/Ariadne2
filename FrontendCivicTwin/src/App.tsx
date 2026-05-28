import { useState } from "react";
import { LabyrinthMark } from "./components/LabyrinthMark";
import { ChatColumn } from "./components/ChatColumn";
import { ItineraryColumn } from "./components/ItineraryColumn";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { useAriadne } from "./hooks/useAriadne";
import { useMediaQuery } from "./hooks/useMediaQuery";

const DEFAULT_SUGGESTIONS = [
  "I lost my wallet",
  "I need to renew my ID",
  "Where's the nearest KEP?",
];

function deriveHeadline(workflow: string | undefined): {
  caseTitle: string;
  caseSubtitle: string;
} {
  switch (workflow) {
    case "new_identity_card":
      return {
        caseTitle: "Case · Identity card",
        caseSubtitle: "Let's untangle this,\nstep by step.",
      };
    case "residence_certificate":
      return {
        caseTitle: "Case · Residence certificate",
        caseSubtitle: "Following the thread\nto your certificate.",
      };
    default:
      return {
        caseTitle: "Ariadne",
        caseSubtitle: "Tell me what's happened\nand I'll guide you.",
      };
  }
}

type AuthView = "login" | "register";

export function App() {
  const mobile = useMediaQuery("(max-width: 820px)");
  const [authedUser, setAuthedUser] = useState<string | null>(null);
  const [authView, setAuthView] = useState<AuthView>("login");

  if (!authedUser) {
    if (authView === "register") {
      return <RegisterPage onSwitchToLogin={() => setAuthView("login")} />;
    }
    return (
      <LoginPage
        onLogin={(username) => setAuthedUser(username)}
        onSwitchToRegister={() => setAuthView("register")}
      />
    );
  }

  return (
    <AuthedApp
      mobile={mobile}
      username={authedUser}
      onSignOut={() => {
        setAuthedUser(null);
        setAuthView("login");
      }}
    />
  );
}

interface AuthedAppProps {
  mobile: boolean;
  username: string;
  onSignOut: () => void;
}

function AuthedApp({ mobile, username, onSignOut }: AuthedAppProps) {
  const ariadne = useAriadne({ name: username });

  const { caseTitle, caseSubtitle } = deriveHeadline(
    ariadne.state.lastDecision?.workflow,
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f4ede0",
        color: "#1a1f2a",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <TopBar
        mobile={mobile}
        userName={ariadne.state.user.name}
        onSignOut={onSignOut}
      />

      {ariadne.state.pendingError && (
        <div
          style={{
            background: "#c87a6a",
            color: "#fbf7ee",
            padding: "8px 16px",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          {ariadne.state.pendingError}
        </div>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: mobile ? "1fr" : "1.1fr 1fr",
          gridTemplateRows: mobile ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr",
          gap: 1,
          background: "rgba(31,93,74,0.12)",
          overflow: "hidden",
        }}
      >
        <ChatColumn
          mobile={mobile}
          caseTitle={caseTitle}
          caseSubtitle={caseSubtitle}
          messages={ariadne.state.messages}
          isThinking={ariadne.state.isThinking}
          suggestions={DEFAULT_SUGGESTIONS}
          onSend={ariadne.sendMessage}
        />
        <ItineraryColumn
          mobile={mobile}
          decision={ariadne.state.lastDecision}
          nearestOffice={ariadne.state.nearestOffice}
          userLocation={ariadne.state.userLocation}
          selectedAppointment={ariadne.state.selectedAppointment}
          reservedAppointment={ariadne.state.reservedAppointment}
          appointmentStatus={ariadne.state.appointmentStatus}
          activeServicePanel={ariadne.state.activeServicePanel}
          eParavoloPayment={ariadne.state.eParavoloPayment}
          isLocating={ariadne.state.isLocating}
          locationError={ariadne.state.locationError}
          onIssueEParavolo={ariadne.issueEParavolo}
          onAuthenticateWithTaxisnet={ariadne.authenticateWithTaxisnet}
          onUploadResidenceProof={ariadne.uploadResidenceProof}
          onRequestResidenceCertificate={ariadne.requestResidenceCertificate}
          onIssueResidenceCertificate={ariadne.issueResidenceCertificate}
          onSelectAppointment={ariadne.selectAppointment}
          onConfirmAppointment={ariadne.confirmAppointment}
          onShareLocation={ariadne.shareLocation}
        />
      </div>
    </div>
  );
}

interface TopBarProps {
  mobile: boolean;
  userName: string;
  onSignOut: () => void;
}

function TopBar({ mobile, userName, onSignOut }: TopBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: mobile ? "16px 18px" : "22px 36px",
        borderBottom: "1px solid rgba(31,93,74,0.12)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LabyrinthMark size={26} />
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: -0.3,
          }}
        >
          Ariadne
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: mobile ? 8 : 18 }}>
        <span style={{ fontSize: 12, color: "#6a6f78", letterSpacing: 0.3 }}>
          Signed in as {userName}
        </span>
        <button
          onClick={onSignOut}
          style={{
            padding: "6px 12px",
            borderRadius: 99,
            background: "transparent",
            color: "#1f5d4a",
            border: "1px solid rgba(31,93,74,0.3)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
        <button
          style={{
            width: 34,
            height: 34,
            borderRadius: 99,
            background: "#1f5d4a",
            color: "#f4ede0",
            border: "none",
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
          aria-label="Switch to Greek"
        >
          ΕΛ
        </button>
      </div>
    </div>
  );
}
