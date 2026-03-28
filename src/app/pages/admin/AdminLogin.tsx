import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useAdmin } from "../../components/admin/adminStore";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const { login, isAuthenticated } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate("/admin");
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <motion.div
            animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <label
              className="block font-mono text-muted-foreground/60 mb-2"
              style={{ fontSize: "0.6875rem", letterSpacing: "0.02em" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="Enter admin password"
              className={`w-full px-3.5 py-2.5 bg-card border transition-colors duration-200 text-foreground placeholder:text-muted-foreground/30 outline-none ${
                error ? "border-destructive/50" : "border-border/60 focus:border-accent/40"
              }`}
              style={{ fontSize: "0.875rem", borderRadius: "8px", fontWeight: 400, lineHeight: 1.5 }}
              autoFocus
            />
          </motion.div>

          {error && (
            <motion.div
              className="mt-2.5 flex items-center gap-1.5 text-destructive/70"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle size={12} />
              <span className="font-mono" style={{ fontSize: "0.6875rem" }}>
                Invalid password
              </span>
            </motion.div>
          )}

          <button
            type="submit"
            className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-background hover:bg-accent/90 transition-colors duration-200 cursor-pointer"
            style={{ fontSize: "0.8125rem", fontWeight: 500, borderRadius: "8px" }}
          >
            Sign in
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Hint */}
        <p
          className="mt-8 font-mono text-muted-foreground/25 text-center"
          style={{ fontSize: "0.5625rem", letterSpacing: "0.05em" }}
        >
          Default: po4yka2026
        </p>
      </motion.div>
    </div>
  );
}