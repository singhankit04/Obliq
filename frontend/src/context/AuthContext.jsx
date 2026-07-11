import { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('obliq_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate session on mount
    const checkSession = async () => {
      if (user) {
        try {
          // If we can fetch workspaces, our session is valid
          await api.getWorkspaces();
        } catch (err) {
          // Session is invalid or expired
          handleLogoutState();
        }
      }
      setLoading(false);
    };

    checkSession();

    // Listen to global logout event triggered by API interceptor
    const handleGlobalLogout = () => {
      handleLogoutState();
    };

    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => window.removeEventListener('auth-logout', handleGlobalLogout);
  }, []);

  const handleLogoutState = () => {
    setUser(null);
    localStorage.removeItem('obliq_user');
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    // Backend returns { message: "...", user: { name: "...", email: "..." } }
    const loggedUser = data.user;
    setUser(loggedUser);
    localStorage.setItem('obliq_user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  const signup = async (name, email, password) => {
    const data = await api.signup(name, email, password);
    const loggedUser = data.user;
    setUser(loggedUser);
    localStorage.setItem('obliq_user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  const googleLogin = async (credential) => {
    const data = await api.googleLogin(credential);
    const loggedUser = data.user;
    setUser(loggedUser);
    localStorage.setItem('obliq_user', JSON.stringify(loggedUser));
    return loggedUser;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      handleLogoutState();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, googleLogin, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
