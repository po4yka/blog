import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Fingerprint, CheckCircle, AlertCircle } from "lucide-react";
import { getPasskeyRegisterOptions, verifyPasskeyRegister } from "@/admin/api";
import { startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";

type SetupState = "ready" | "registering" | "success" | "error";

export function AdminSetup() {
  const [searchParams] = useSearchParams();
  const setupToken = searchParams.get("token");
  const [state, setState] = useState<SetupState>("ready");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!setupToken) {
    return (
      <SetupShell>
        <p className="font-mono text-muted-foreground/60" style={{ fontSize: "0.75rem" }}>
          Missing setup token. Run <code className="text-foreground/60">npm run setup:passkey</code> to generate one.
        </p>
      </SetupShell>
    );
  }

  const handleRegister = async () => {
    setState("registering");
    setError(null);

    try {
      const options = await getPasskeyRegisterOptions(setupToken) as PublicKeyCredentialCreationOptionsJSON;
      const credential = await startRegistration({ optionsJSON: options });
      await verifyPasskeyRegister(setupToken, credential);
      setState("success");
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Registration failed");
    }
  };

  return (
    <SetupShell>
      {state === "ready" && (
        <>
          <p className="font-mono text-muted-foreground/60 mb-6" style={{ fontSize: "0.75rem", lineHeight: 1.7 }}>
            Register a passkey to secure admin access. This replaces password-based login with biometric or security key authentication.
          </p>
          <button
            type="button"
            onClick={handleRegister}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200 cursor-pointer"
            style={{ fontSize: "0.8125rem", fontWeight: 500, borderRadius: "2px" }}
          >
            <Fingerprint size={16} />
            Register passkey
          </button>
        </>
      )}

      {state === "registering" && (
        <p className="font-mono text-muted-foreground/60 text-center" style={{ fontSize: "0.75rem" }}>
          Follow the browser prompt to register your passkey...
        </p>
      )}

      {state === "success" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <CheckCircle size={32} className="text-green-500/70 mx-auto mb-3" />
          <p className="font-mono text-foreground/80 mb-1" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
            Passkey registered
          </p>
          <p className="font-mono text-muted-foreground/50 mb-6" style={{ fontSize: "0.6875rem" }}>
            You can now sign in with your passkey.
          </p>
          <button
            type="button"
            onClick={() => navigate("/admin/login")}
            className="px-6 py-2 border border-border/60 text-foreground/70 hover:bg-card transition-colors cursor-pointer font-mono"
            style={{ fontSize: "0.75rem", borderRadius: "2px" }}
          >
            Go to login
          </button>
        </motion.div>
      )}

      {state === "error" && (
        <div className="text-center">
          <AlertCircle size={24} className="text-destructive/60 mx-auto mb-3" />
          <p className="font-mono text-destructive/70 mb-4" style={{ fontSize: "0.75rem" }}>
            {error}
          </p>
          <button
            type="button"
            onClick={() => setState("ready")}
            className="px-6 py-2 border border-border/60 text-foreground/70 hover:bg-card transition-colors cursor-pointer font-mono"
            style={{ fontSize: "0.75rem", borderRadius: "2px" }}
          >
            Try again
          </button>
        </div>
      )}
    </SetupShell>
  );
}

function SetupShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center px-6"
    >
      <motion.div
        className="w-full max-w-[340px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="mb-10">
          <a
            href="/"
            className="font-mono text-foreground/80 hover:text-foreground transition-colors duration-200"
            style={{ fontSize: "0.75rem", letterSpacing: "0.02em" }}
          >
            po4yka.dev
          </a>
        </div>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-7 h-7 border border-border/60 flex items-center justify-center" style={{ borderRadius: "3px" }}>
            <Fingerprint size={13} className="text-muted-foreground/50" />
          </div>
          <div>
            <h1 className="text-foreground" style={{ fontSize: "1.125rem", fontWeight: 600, lineHeight: 1.2 }}>
              Setup
            </h1>
            <p className="font-mono text-muted-foreground/40" style={{ fontSize: "0.625rem", letterSpacing: "0.05em" }}>
              Register admin passkey
            </p>
          </div>
        </div>

        {children}
      </motion.div>
    </div>
  );
}
