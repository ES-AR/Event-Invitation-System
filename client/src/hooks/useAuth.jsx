import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { loginAdmin, fetchProfile } from "../services/auth.service";

const STORAGE_KEY = "organizer_token";
const AuthContext = createContext(null);

function FullScreenLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
    </div>
  );
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!token) {
        setAdmin(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const profile = await fetchProfile(token);
        if (active) {
          setAdmin(profile);
          setError(null);
        }
      } catch (err) {
        console.warn("Failed to fetch organizer profile", err);
        if (active) {
          setAdmin(null);
          setToken(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [token]);

  const handleLogin = async (credentials) => {
    setLoading(true);
    try {
      const { token: nextToken, admin: adminProfile } = await loginAdmin(credentials);
      localStorage.setItem(STORAGE_KEY, nextToken);
      setToken(nextToken);
      setAdmin(adminProfile);
      setError(null);
      return adminProfile;
    } catch (err) {
      setError(err.message || "Unable to sign in");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ admin, token, loading, error, login: handleLogin, logout }),
    [admin, token, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function RequireAdmin({ children }) {
  const { admin, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
