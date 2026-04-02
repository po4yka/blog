import { useState, useCallback } from "react";
import { login as apiLogin, logout as apiLogout, isTokenPresent, ApiError } from "@/admin/api";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(isTokenPresent);

  const login = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiLogin(password);
      setIsAuthenticated(true);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof ApiError ? e.message : "Login failed" };
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}
