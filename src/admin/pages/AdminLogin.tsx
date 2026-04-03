import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Lock, ArrowRight, AlertCircle, Fingerprint } from "lucide-react";
import { useAuthContext } from "@/admin/contexts/AuthContext";
import { getPasskeyStatus } from "@/admin/api";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [allowPassword, setAllowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const { login, loginWithPasskey, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    getPasskeyStatus()
      .then((status) => {
        setHasPasskey(status.hasPasskey);
        setAllowPassword(status.allowPassword);
        if (!status.hasPasskey) setShowPassword(true);
      })
      .catch(() => {
        setShowPassword(true);
        setAllowPassword(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePasskeyLogin = async () => {
    setError(null);
    const result = await loginWithPasskey();
    if (result.success) {
      navigate("/admin");
    } else {
      setError(result.error ?? "Passkey authentication failed");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = await login(password);
    if (result.success) {
      navigate("/admin");
    } else {
      setError("Invalid password");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  if (loading) return null;

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center px-6"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <motion.div
        className="w-full max-w-[340px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Brand */}
        <div className="mb-10">
          <a
            href="/"
            className="font-mono text-foreground/70 hover:text-accent transition-colors duration-300"
            style={{ fontSize: "0.75rem", letterSpacing: "0.02em" }}
          >
            po4yka.dev
          </a>
        </div>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-7 h-7 border border-border/60 flex items-center justify-center" style={{ borderRadius: "3px" }}>
            <Lock size={13} className="text-muted-foreground/50" />
          </div>
          <div>
            <h1 className="text-foreground" style={{ fontSize: "1.125rem", fontWeight: 600, lineHeight: 1.2 }}>
              Admin
            </h1>
            <p className="font-mono text-muted-foreground/40" style={{ fontSize: "0.625rem", letterSpacing: "0.05em" }}>
              Authenticate to continue
            </p>
          </div>
        </div>

        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {/* Passkey button (primary when available) */}
          {hasPasskey && (
            <button
              type="button"
              onClick={handlePasskeyLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-background hover:bg-accent/90 transition-colors duration-200 cursor-pointer"
              style={{ fontSize: "0.8125rem", fontWeight: 500, borderRadius: "8px" }}
            >
              <Fingerprint size={16} />
              Sign in with passkey
            </button>
          )}

          {/* Password form */}
          {showPassword && allowPassword && (
            <form onSubmit={handlePasswordSubmit} className={hasPasskey ? "mt-4" : ""}>
              {hasPasskey && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="font-mono text-muted-foreground/30" style={{ fontSize: "0.625rem" }}>or</span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
              )}
              <label
                htmlFor="password-input"
                className="block font-mono text-muted-foreground/60 mb-2"
                style={{ fontSize: "0.6875rem", letterSpacing: "0.02em" }}
              >
                Password
              </label>
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Enter admin password"
                aria-describedby={error ? "login-error" : undefined}
                className={`w-full px-3.5 py-2.5 bg-card border transition-colors duration-200 text-foreground placeholder:text-muted-foreground/30 outline-none ${
                  error ? "border-destructive/50" : "border-border/60 focus:border-accent/40"
                }`}
                style={{ fontSize: "0.875rem", borderRadius: "8px", fontWeight: 400, lineHeight: 1.5 }}
                autoFocus={!hasPasskey}
              />
              <button
                type="submit"
                className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 transition-colors duration-200 cursor-pointer ${
                  hasPasskey
                    ? "border border-border/60 text-foreground/70 hover:bg-card"
                    : "bg-accent text-background hover:bg-accent/90"
                }`}
                style={{ fontSize: "0.8125rem", fontWeight: 500, borderRadius: "8px" }}
              >
                Sign in with password
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          {/* Toggle password form */}
          {hasPasskey && allowPassword && !showPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(true)}
              className="w-full mt-3 font-mono text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
              style={{ fontSize: "0.625rem" }}
            >
              Use password instead
            </button>
          )}

          {/* No passkey registered message */}
          {!hasPasskey && !allowPassword && (
            <p className="font-mono text-muted-foreground/50 text-center" style={{ fontSize: "0.6875rem" }}>
              No passkey registered. Run <code className="text-foreground/60">npm run setup:passkey</code> to get started.
            </p>
          )}
        </motion.div>

        {/* Error display */}
        {error && (
          <motion.div
            id="login-error"
            aria-live="polite"
            className="mt-3 flex items-center gap-1.5 text-destructive/70"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AlertCircle size={12} />
            <span className="font-mono" style={{ fontSize: "0.6875rem" }}>
              {error}
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
