import { useState } from "react";
import { LabyrinthMark } from "./LabyrinthMark";
import { findMockUser } from "../data/mockUsers";

interface LoginPageProps {
  onLogin: (username: string) => void;
  onSwitchToRegister: () => void;
}

export function LoginPage({ onLogin, onSwitchToRegister }: LoginPageProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please enter your username/email and password.");
      return;
    }
    const user = findMockUser(identifier, password);
    if (!user) {
      setError("Invalid credentials. Try one of the mock accounts.");
      return;
    }
    setError(null);
    onLogin(user.username);
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
            Welcome back.
          </div>
          <div style={{ fontSize: 13, color: "#6a6f78" }}>
            Sign in to follow the thread.
          </div>
        </div>

        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <Field
            label="Username or email"
            value={identifier}
            onChange={setIdentifier}
            type="text"
            autoComplete="username"
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            autoComplete="current-password"
          />

          {error && (
            <div
              style={{
                background: "#c87a6a",
                color: "#fbf7ee",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              {error}
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
            Sign in
          </button>
        </form>

        <div style={{ fontSize: 13, color: "#6a6f78", textAlign: "center" }}>
          New here?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
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
            Create an account
          </button>
        </div>

        <details
          style={{
            fontSize: 12,
            color: "#6a6f78",
            background: "rgba(31,93,74,0.06)",
            padding: "10px 12px",
            borderRadius: 8,
          }}
        >
          <summary style={{ cursor: "pointer" }}>Mock accounts</summary>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.6 }}>
            <li>eleni@example.com / ariadne123</li>
            <li>yannis@example.com / labyrinth42</li>
            <li>maria@example.com / athens2026</li>
            <li>kostas@example.com / piraeus2026</li>
            <li>sofia@example.com / thread999</li>
          </ul>
        </details>
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
