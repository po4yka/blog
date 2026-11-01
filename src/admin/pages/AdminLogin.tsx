import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowRight, AlertCircle, Eye, EyeOff, Fingerprint } from "lucide-react";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { useAuthContext } from "@/admin/contexts/AuthContext";
import { getPasskeyStatus } from "@/admin/api";
import { AuthShell } from "@/admin/components/AuthShell";
import { InfoTable } from "@/components/Terminal/primitives";

type Status = { hasPasskey: boolean; allowPassword: boolean };
type Busy = "passkey" | "password" | null;

const primaryButton =
  "w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background hover:opacity-90 active:opacity-70 disabled:opacity-50 disabled:cursor-wait transition-opacity duration-100 cursor-pointer";
const secondaryButton =
  "w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-foreground/80 hover:bg-muted active:opacity-70 disabled:opacity-50 disabled:cursor-wait transition-colors duration-100 cursor-pointer";
const buttonStyle = { fontSize: "0.8125rem", fontWeight: 500, borderRadius: "2px" } as const;
const metaStyle = { fontSize: "max(11px, 0.6875rem)", letterSpacing: "0.02em" } as const;

/** Only return to an admin path, so `state.from` cannot send the user off-site. */
function returnPath(state: unknown): string {
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === "string" && from.startsWith("/admin") && !from.startsWith("/admin/login") ? from : "/admin";
}

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalidCount, setInvalidCount] = useState(0);
  const [status, setStatus] = useState<Status | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [revealPassword, setRevealPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const { login, loginWithPasskey, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const target = returnPath(location.state);
  const webAuthn = browserSupportsWebAuthn();

  useEffect(() => {
    if (isAuthenticated) navigate(target, { replace: true });
  }, [isAuthenticated, navigate, target]);

  useEffect(() => {
    getPasskeyStatus()
      .then((s) => {
        setStatus(s);
        if (!s.hasPasskey || !webAuthn) setShowPasswordForm(true);
      })
      .catch(() => {
        // Status unknown: offer the password form; the server still decides.
        setStatus({ hasPasskey: false, allowPassword: true });
        setShowPasswordForm(true);
      });
  }, [webAuthn]);

  const run = async (kind: Exclude<Busy, null>, attempt: () => Promise<{ success: boolean; error?: string }>) => {
    setError(null);
    setBusy(kind);
    const result = await attempt();
    setBusy(null);
    if (result.success) {
      navigate(target, { replace: true });
    } else {
      setError(result.error ?? "Sign-in failed");
      setInvalidCount((c) => c + 1);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void run("password", () => login(password));
  };

  const passkeyReady = !!status?.hasPasskey && webAuthn;
  const passwordForm = showPasswordForm && !!status?.allowPassword;

  const statusLine = !status
    ? "AUTH · CHECKING"
    : busy === "passkey"
      ? "AUTH · WAITING FOR PASSKEY"
      : busy === "password"
        ? "AUTH · VERIFYING"
        : invalidCount > 0
          ? `AUTH · REFUSED × ${invalidCount}`
          : "AUTH · READY";

  return (
    <AuthShell label="SIGN IN" status={statusLine}>
      <InfoTable
        fieldCodes
        rows={[
          { label: "Passkey", value: status ? (status.hasPasskey ? "registered" : "none registered") : "…" },
          { label: "WebAuthn", value: webAuthn ? "supported" : "not supported here" },
          { label: "Password", value: status ? (status.allowPassword ? "fallback on" : "off") : "…" },
        ]}
      />

      {status && (
        <div
          key={invalidCount}
          className={`mt-6 ${invalidCount > 0 ? "form-flash" : ""}`}
          style={{ outline: "1px solid transparent", outlineOffset: "4px", borderRadius: 2 }}
          aria-busy={busy !== null}
        >
          {passkeyReady && (
            <button
              type="button"
              onClick={() => void run("passkey", loginWithPasskey)}
              disabled={busy !== null}
              className={primaryButton}
              style={buttonStyle}
              autoFocus
            >
              <Fingerprint size={16} aria-hidden="true" />
              {busy === "passkey" ? "Waiting for passkey…" : "Sign in with passkey"}
            </button>
          )}

          {passwordForm && (
            <form onSubmit={handlePasswordSubmit}>
              {passkeyReady && (
                <div className="flex items-center gap-3 my-4" aria-hidden="true">
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-mono text-muted-foreground-dim" style={metaStyle}>or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <div className="flex items-baseline justify-between mb-2">
                <label htmlFor="password-input" className="font-mono text-muted-foreground" style={metaStyle}>
                  Password
                </label>
                {capsLock && (
                  <span id="caps-lock" className="font-mono text-foreground" style={metaStyle} role="status">
                    Caps Lock is on
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="password-input"
                  type={revealPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  onKeyDown={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  onBlur={() => setCapsLock(false)}
                  placeholder="Enter admin password"
                  aria-describedby={[error && "login-error", capsLock && "caps-lock"].filter(Boolean).join(" ") || undefined}
                  aria-invalid={error ? "true" : undefined}
                  autoComplete="current-password"
                  spellCheck={false}
                  required
                  disabled={busy !== null}
                  className="admin-input w-full pl-3.5 pr-11 py-2.5 bg-card border border-border focus-visible:outline-2 focus-visible:outline-emphasis focus-visible:outline-offset-2 outline-none transition-colors duration-200 text-foreground placeholder:text-muted-foreground-dim"
                  style={{ fontSize: "0.875rem", borderRadius: "2px", lineHeight: 1.5 }}
                  // The form mounts either alone or after "Use password instead", so focus always belongs here.
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setRevealPassword((v) => !v)}
                  aria-label={revealPassword ? "Hide password" : "Show password"}
                  aria-pressed={revealPassword}
                  className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-opacity duration-100 cursor-pointer"
                >
                  {revealPassword ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={busy !== null || password.length === 0}
                className={`mt-3 ${passkeyReady ? secondaryButton : primaryButton}`}
                style={buttonStyle}
              >
                {busy === "password" ? "Verifying…" : "Sign in with password"}
                {busy !== "password" && <ArrowRight size={14} aria-hidden="true" />}
              </button>
            </form>
          )}

          {passkeyReady && status.allowPassword && !showPasswordForm && (
            <button
              type="button"
              onClick={() => setShowPasswordForm(true)}
              className="w-full mt-3 py-2 font-mono text-muted-foreground hover:text-foreground transition-opacity duration-100 cursor-pointer"
              style={metaStyle}
            >
              Use password instead
            </button>
          )}

          {!passkeyReady && !status.allowPassword && (
            <p className="font-mono text-muted-foreground" style={{ ...metaStyle, lineHeight: 1.7 }}>
              {status.hasPasskey
                ? "This browser cannot use passkeys and password login is off. Open the admin in a browser with WebAuthn."
                : <>No passkey registered and password login is off. Run <code className="text-foreground">npm run setup:passkey</code> to register one.</>}
            </p>
          )}
        </div>
      )}

      <div id="login-error" aria-live="polite">
        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-destructive font-mono" style={metaStyle}>
            <AlertCircle size={12} aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </AuthShell>
  );
}
