import { useState, useCallback } from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  isAuthenticated as checkAuth,
  ApiError,
  getPasskeyAuthOptions,
  verifyPasskeyAuth,
} from "@/admin/api";
import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth);

  const login = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiLogin(password);
      setIsAuthenticated(true);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof ApiError ? e.message : "Login failed" };
    }
  }, []);

  const loginWithPasskey = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const options = await getPasskeyAuthOptions() as PublicKeyCredentialRequestOptionsJSON;
      const assertion = await startAuthentication({ optionsJSON: options });
      await verifyPasskeyAuth(assertion);
      setIsAuthenticated(true);
      return { success: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Passkey authentication failed";
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, loginWithPasskey, logout };
}
