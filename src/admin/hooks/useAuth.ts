import { useState, useCallback } from "react";
import { login as apiLogin, logout as apiLogout, isTokenPresent } from "../api";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(isTokenPresent);

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      await apiLogin(password);
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}
