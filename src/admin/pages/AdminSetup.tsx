import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { m } from "motion/react";
import { Fingerprint, CheckCircle, AlertCircle } from "lucide-react";
import { getPasskeyRegisterOptions, verifyPasskeyRegister } from "@/admin/api";
import { startRegistration } from "@simplewebauthn/browser";
import { AuthShell } from "@/admin/components/AuthShell";

type SetupState = "ready" | "registering" | "success" | "error";

export function AdminSetup() {
  const [searchParams] = useSearchParams();
  const setupToken = searchParams.get("token");
  const [state, setState] = useState<SetupState>("ready");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!setupToken) {
    return (
      <AuthShell label="PASSKEY SETUP" status="SETUP · NO TOKEN">
        <p className="font-mono text-muted-foreground" style={{ fontSize: "0.75rem" }}>
          Missing setup token. Run <code className="text-foreground/60">npm run setup:passkey</code> to generate one.
        </p>
      </AuthShell>
    );
  }

  const handleRegister = async () => {
    setState("registering");
    setError(null);

    try {
      const options = await getPasskeyRegisterOptions(setupToken);
      const credential = await startRegistration({ optionsJSON: options });
      await verifyPasskeyRegister(setupToken, credential);
      setState("success");
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Registration failed");
    }
  };

  return (
    <AuthShell label="PASSKEY SETUP" status={`SETUP · ${state.toUpperCase()}`}>
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
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <CheckCircle size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-mono text-foreground/80 mb-1" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
            Passkey registered
          </p>
          <p className="font-mono text-muted-foreground/50 mb-6" style={{ fontSize: "max(11px, 0.6875rem)" }}>
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
        </m.div>
      )}

      {state === "error" && (
        <div className="text-center">
          <AlertCircle size={24} className="text-destructive mx-auto mb-3" />
          <p className="font-mono text-destructive mb-4" style={{ fontSize: "0.75rem" }}>
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
    </AuthShell>
  );
}
