import { useState, useCallback } from "react";
import { login as apiLogin, setToken, isTokenPresent } from "../api";

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

  const logout = useCallback(() => {
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}
