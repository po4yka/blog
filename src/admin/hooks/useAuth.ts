import { useState, useCallback, useEffect } from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  logoutEverywhere as apiLogoutEverywhere,
  isAuthenticated as checkAuth,
  onUnauthorized,
  ApiError,
  getPasskeyAuthOptions,
  verifyPasskeyAuth,
} from "@/admin/api";
import { startAuthentication } from "@simplewebauthn/browser";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth);

  // An expired session answers 401; without this the pages stayed up and showed the raw error.
  useEffect(() => onUnauthorized(() => setIsAuthenticated(false)), []);

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
      const options = await getPasskeyAuthOptions();
      const assertion = await startAuthentication({ optionsJSON: options });
      await verifyPasskeyAuth(assertion);
      setIsAuthenticated(true);
      return { success: true };
    } catch (e) {
      // The browser reports a closed or timed-out prompt as NotAllowedError with a long generic message.
      const message =
        e instanceof Error
          ? e.name === "NotAllowedError" ? "Passkey prompt closed or timed out" : e.message
          : "Passkey authentication failed";
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setIsAuthenticated(false);
  }, []);

  const logoutEverywhere = useCallback(async () => {
    await apiLogoutEverywhere();
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, loginWithPasskey, logout, logoutEverywhere };
}
