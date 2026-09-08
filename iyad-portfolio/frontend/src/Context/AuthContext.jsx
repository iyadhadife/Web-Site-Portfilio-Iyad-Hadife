import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifie si la session est active au chargement
    fetch('/api/check-auth', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setIsAdmin(data.isAdmin);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const login = async (password) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      credentials: 'include',
    });
    const data = await response.json();
    if (data.success) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);