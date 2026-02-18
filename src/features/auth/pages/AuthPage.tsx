import React, { useMemo, useState } from "react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useSessionStore } from "../../../store/session.store";
import { useToast } from "../../../hooks/useToast";
import { forgotPassword, resetPassword } from "../../../services/api/auth.api";

type Mode = "login" | "signup" | "forgot" | "reset";

export const AuthPage: React.FC = () => {
  const queryMode = useMemo(() => {
    if (typeof window === "undefined") return null;
    const raw = new URLSearchParams(window.location.search).get("mode");
    return raw === "forgot" ||
      raw === "reset" ||
      raw === "signup" ||
      raw === "login"
      ? raw
      : null;
  }, []);

  const queryToken = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") || "";
  }, []);

  const [mode, setMode] = useState<Mode>(
    (queryMode as Mode | null) || (queryToken ? "reset" : "login"),
  );
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState(queryToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [devResetHint, setDevResetHint] = useState<{
    token?: string;
    url?: string;
  } | null>(null);
  const login = useSessionStore((s) => s.login);
  const signup = useSessionStore((s) => s.signup);
  const toast = useToast((s) => s.show);

  const resetForm = () => {
    setError("");
    setInfo("");
    setDevResetHint(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    setLoading(true);

    try {
      if (mode === "login") {
        await login({ email, password });
        toast("Logged in", "success");
        return;
      }

      if (mode === "signup") {
        await signup({ email, password, username });
        toast("Account created", "success");
        return;
      }

      if (mode === "forgot") {
        const result = await forgotPassword({ email });
        setInfo(result.message || "Reset link request accepted");
        setDevResetHint({ token: result.resetToken, url: result.resetUrl });
        toast("Reset request submitted", "success");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      await resetPassword({ token: resetToken.trim(), password });
      setInfo("Password reset successful. You can now login.");
      setMode("login");
      setPassword("");
      setConfirmPassword("");
      setResetToken("");
      toast("Password reset successful", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(900px 500px at 15% 5%, rgba(16,185,129,0.2), transparent 60%), radial-gradient(800px 500px at 95% 95%, rgba(14,165,233,0.12), transparent 65%), var(--bg)",
        padding: "20px",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "var(--panel-gradient)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          boxShadow: "var(--shadow)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>
            {mode === "login" && "Welcome back"}
            {mode === "signup" && "Create account"}
            {mode === "forgot" && "Forgot password"}
            {mode === "reset" && "Reset password"}
          </h1>
          <button
            type="button"
            onClick={() => {
              if (mode === "login") setMode("signup");
              else if (mode === "signup") setMode("login");
              else if (mode === "forgot") setMode("login");
              else setMode("login");
              resetForm();
            }}
            style={{
              border: "none",
              background: "none",
              color: "var(--accent)",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {mode === "login" && "Create account"}
            {mode === "signup" && "Have an account?"}
            {(mode === "forgot" || mode === "reset") && "Back to login"}
          </button>
        </div>

        {(mode === "login" || mode === "signup" || mode === "forgot") && (
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        )}

        {mode === "signup" && (
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="johny_dep"
            required
          />
        )}

        {(mode === "login" || mode === "signup") && (
          <>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  resetForm();
                }}
                style={{
                  alignSelf: "flex-end",
                  border: "none",
                  background: "none",
                  color: "var(--muted)",
                  fontSize: "12px",
                }}
              >
                Forgot password?
              </button>
            )}
          </>
        )}

        {mode === "reset" && (
          <>
            <Input
              label="Reset Token"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              placeholder="Paste reset token"
              required
            />
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
            />
          </>
        )}

        {error && (
          <div
            style={{
              borderRadius: "10px",
              border: "1px solid rgba(239,68,68,0.35)",
              background: "rgba(239,68,68,0.1)",
              color: "#fca5a5",
              fontSize: "12px",
              padding: "8px 10px",
            }}
          >
            {error}
          </div>
        )}

        {info && (
          <div
            style={{
              borderRadius: "10px",
              border: "1px solid rgba(16,185,129,0.3)",
              background: "rgba(16,185,129,0.12)",
              color: "#86efac",
              fontSize: "12px",
              padding: "8px 10px",
            }}
          >
            {info}
          </div>
        )}

        {devResetHint?.token && (
          <div
            style={{
              borderRadius: "10px",
              border: "1px solid rgba(14,165,233,0.3)",
              background: "rgba(14,165,233,0.08)",
              color: "var(--text)",
              fontSize: "12px",
              padding: "10px 12px",
              display: "grid",
              gap: "4px",
            }}
          >
            <strong style={{ fontSize: "12px" }}>Dev reset token</strong>
            <span style={{ wordBreak: "break-all", color: "var(--muted)" }}>
              {devResetHint.token}
            </span>
            {devResetHint.url && (
              <span style={{ wordBreak: "break-all", color: "var(--muted)" }}>
                {devResetHint.url}
              </span>
            )}
          </div>
        )}

        <Button type="submit" variant="green" disabled={loading}>
          {loading
            ? "Please wait..."
            : mode === "login"
              ? "Login"
              : mode === "signup"
                ? "Create account"
                : mode === "forgot"
                  ? "Send reset link"
                  : "Reset password"}
        </Button>

        <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
          {mode !== "reset" && (
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                resetForm();
              }}
              style={{
                border: "none",
                background: "none",
                color: "var(--muted)",
                fontSize: "12px",
              }}
            >
              Have a reset token?
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
