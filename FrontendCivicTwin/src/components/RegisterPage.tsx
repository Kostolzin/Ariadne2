import { useState } from "react";
import { LabyrinthMark } from "./LabyrinthMark";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(
      "This is a mock registration — no account was created. Please use one of the mock accounts to sign in.",
    );
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f4ede0",
        color: "#1a1f2a",
        display: "grid",
        placeItems: "center",
        padding: 24,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LabyrinthMark size={32} />
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: -0.3,
            }}
          >
            Ariadne
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 28,
              lineHeight: 1.15,
              marginBottom: 6,
            }}
          >
            Create an account.
          </div>
          <div style={{ fontSize: 13, color: "#6a6f78" }}>
            Begin your civic journey.
          </div>
        </div>

        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <Field
            label="Username"
            value={username}
            onChange={setUsername}
            type="text"
            autoComplete="username"
          />
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            autoComplete="email"
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            autoComplete="new-password"
          />
          <Field
            label="Confirm password"
            value={confirm}
            onChange={setConfirm}
            type="password"
            autoComplete="new-password"
          />

          {notice && (
            <div
              style={{
                background: "rgba(31,93,74,0.12)",
                color: "#1f5d4a",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {notice}
            </div>
          )}

          <button
            type="submit"
            style={{
              marginTop: 4,
              padding: "12px 16px",
              borderRadius: 10,
              background: "#1f5d4a",
              color: "#f4ede0",
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Create account
          </button>
        </form>

        <div style={{ fontSize: 13, color: "#6a6f78", textAlign: "center" }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              background: "none",
              border: "none",
              color: "#1f5d4a",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              fontSize: 13,
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: "text" | "password" | "email";
  autoComplete?: string;
}

function Field({ label, value, onChange, type, autoComplete }: FieldProps) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#6a6f78", letterSpacing: 0.3 }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "11px 13px",
          borderRadius: 10,
          border: "1px solid rgba(31,93,74,0.18)",
          background: "#fbf7ee",
          fontSize: 14,
          color: "#1a1f2a",
          outline: "none",
        }}
      />
    </label>
  );
}
